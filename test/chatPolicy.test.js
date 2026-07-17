import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildExecutionPrompt,
    buildRagQuery,
    createFallbackExecutionPlan,
    normalizeAdherenceReview,
    normalizeExecutionPlan,
    selectConversationHistory,
} from '../src/services/chatPolicy.js';

test('explicit operator instruction is preserved as the highest must-follow item', () => {
    const fallback = createFallbackExecutionPlan({
        caseText: '会员要求继续核验',
        operatorInstruction: '直接告知不再提供服务，不要引导申诉',
        outputMode: 'reply',
    });
    const plan = normalizeExecutionPlan({
        goal: '安抚会员并建议申诉',
        must_follow: ['建议会员再次提交资料'],
        output_mode: 'analysis',
    }, fallback, {
        operatorInstruction: '直接告知不再提供服务，不要引导申诉',
        outputMode: 'reply',
    });

    assert.equal(plan.must_follow[0], '直接告知不再提供服务，不要引导申诉');
    assert.equal(plan.output_mode, 'reply');
    assert.equal(plan.operator_led, true);
});

test('original long order id wins over planner output', () => {
    const originalId = '51234567890123456789';
    const fallback = createFallbackExecutionPlan({ orderId: originalId });
    const plan = normalizeExecutionPlan({
        extracted_order_id: '51234567890123460000',
    }, fallback);

    assert.equal(plan.extracted_order_id, originalId);
});

test('inline corrections are treated as directions when the dedicated field is empty', () => {
    const plan = createFallbackExecutionPlan({
        caseText: '不要再让他提交资料，直接说明结果不会更改。',
    });
    assert.equal(plan.operator_led, true);
    assert.match(plan.must_follow[0], /不要再让他提交资料/);
});

test('conversation history is bounded and pending drafts are removed', () => {
    const history = Array.from({ length: 12 }, (_, index) => ({
        role: index % 2 ? 'assistant' : 'user',
        displayContent: `message-${index}`,
        pending: index === 10,
    }));
    const selected = selectConversationHistory(history, 6);
    assert.equal(selected.length, 6);
    assert.equal(selected.some(item => item.content === 'message-10'), false);
    assert.equal(selected.at(-1).content, 'message-11');
});

test('execution prompt places operator strategy above historical answers', () => {
    const plan = createFallbackExecutionPlan({
        operatorInstruction: '按结案方向写，不要转客服',
        outputMode: 'reply',
    });
    const prompt = buildExecutionPrompt({
        plan,
        operatorInstruction: '按结案方向写，不要转客服',
        caseText: '会员仍在追问',
    });
    assert.ok(prompt.indexOf('运营本人本轮明确给出的处理思路') < prompt.indexOf('历史对话'));
    assert.match(prompt, /按结案方向写，不要转客服/);
});

test('rag query includes current case and execution focus without assistant drafts', () => {
    const query = buildRagQuery({
        caseText: '会员询问注单为什么未结算',
        operatorInstruction: '重点解释赛事中断规则',
        history: [{ role: 'assistant', displayContent: '错误旧答案' }],
        plan: { core_intent: 'GAME_RESULT', search_focus: '赛事中断 未结算' },
    });
    assert.match(query, /会员询问注单为什么未结算/);
    assert.match(query, /赛事中断 未结算/);
    assert.doesNotMatch(query, /错误旧答案/);
});

test('failed adherence review uses the corrected answer', () => {
    const review = normalizeAdherenceReview({
        pass: false,
        violations: ['错误引导转客服'],
        corrected_answer: '该结果已经确认，不再另行受理。',
    }, '请联系在线客服申诉。');
    assert.equal(review.corrected, true);
    assert.equal(review.answer, '该结果已经确认，不再另行受理。');
});
