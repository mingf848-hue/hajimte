import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildKnowledgeUnitsForDocument,
    hasMeaningfulCorrectionMatch,
    tokenizeSearchQuery,
} from '../src/server/services/knowledgeRagService.js';

test('rejected assistant answer is excluded from correction knowledge', () => {
    const [unit] = buildKnowledgeUnitsForDocument('training_data', {
        _id: 'correction-1',
        type: 'bad',
        question: '会员要求复核结果',
        answer: '请再次联系在线客服并提交资料',
        correction: '直接说明结果已经确认，不再引导提交资料',
    });

    assert.equal(unit.category, 'operator_correction');
    assert.match(unit.content, /结果已经确认/);
    assert.doesNotMatch(unit.content, /再次联系在线客服/);
});

test('bad feedback without a correction is not indexed', () => {
    const units = buildKnowledgeUnitsForDocument('training_data', {
        _id: 'bad-without-standard',
        type: 'bad',
        question: '问题',
        answer: '错误答案',
    });
    assert.deepEqual(units, []);
});

test('Chinese retrieval queries are split into useful domain terms', () => {
    const tokens = tokenizeSearchQuery('当前素材：会员询问赛事中断后注单为什么还未结算');
    assert.ok(tokens.includes('赛事中断'));
    assert.ok(tokens.includes('注单'));
    assert.ok(tokens.includes('结算'));
});

test('operator corrections require a meaningful topic match', () => {
    const [unrelated] = buildKnowledgeUnitsForDocument('training_data', {
        _id: 'generic-correction',
        type: 'bad',
        question: '会员抱怨处理结果',
        correction: '语气要简洁一些',
    });
    const [relevant] = buildKnowledgeUnitsForDocument('training_data', {
        _id: 'settlement-correction',
        type: 'bad',
        question: '赛事中断后的注单结算',
        correction: '优先说明赛事中断规则',
    });
    const query = '会员询问赛事中断后注单为什么还未结算';

    assert.equal(hasMeaningfulCorrectionMatch(unrelated, query), false);
    assert.equal(hasMeaningfulCorrectionMatch(relevant, query), true);
});
