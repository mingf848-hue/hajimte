import React, { useRef, useState } from 'react';
import { PATHS } from './config.jsx';

export function Icon({ d, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d={d} />
        </svg>
    );
}

export function LoginScreen({ onLogin }) {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        if (!code.trim()) {
            setStatus('error');
            setErrorMessage('请输入账号或动态码');
            return;
        }

        setStatus('checking');
        setErrorMessage('');

        try {
            const result = await window.fbOps.verifyLogin(code.trim());
            if (result.success) {
                onLogin(result.username, result.role);
                return;
            }
            setStatus('error');
            setErrorMessage('验证失败，请检查输入');
        } catch (error) {
            console.error('Login failed:', error);
            setStatus('error');
            setErrorMessage(error?.message || '登录服务暂时不可用，请稍后重试');
        }
    };

    return (
        <div className="login-stage">
            <div className="login-stage__mesh" />
            <div className="login-stage__panel">
                <section className="login-stage__story">
                    <div className="login-story__badge">Hajimi Studio Control Room</div>
                    <h1>为客服、公告和规则训练而重构的内部工作台。</h1>
                    <p>把脚本库、图片资产、公告模板、业务规则和注单监控收束到一个更稳定、更清晰的操作界面里。</p>
                    <div className="login-story__grid">
                        <div className="login-story__card">
                            <span>脚本协作</span>
                            <strong>语义检索 + 智能对话</strong>
                        </div>
                        <div className="login-story__card">
                            <span>公告输出</span>
                            <strong>模板、生成、纠错一体化</strong>
                        </div>
                        <div className="login-story__card">
                            <span>规则中台</span>
                            <strong>训练记录与业务逻辑联动</strong>
                        </div>
                    </div>
                </section>

                <section className="login-card-v2 fade-in">
                    <div className="login-card-v2__brand">
                        <div className="login-card-v2__logo">
                            <img src="https://lh3.googleusercontent.com/d/1Rri7vVK9YyhQEdqzvgmjQ4kzNZdbQuxV" alt="Hajimi" className="h-full w-full object-contain rounded-2xl" onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=Cat'; }} />
                        </div>
                        <div>
                            <span className="login-card-v2__eyebrow">欢迎回来</span>
                            <h2>登录哈基米助手</h2>
                        </div>
                    </div>

                    <p className="login-card-v2__text">继续处理客服问答、公告输出、素材整理与系统配置。</p>

                    <label className="login-card-v2__label">账号 / 动态码</label>
                    <div className={`login-card-v2__field ${status === 'error' ? 'is-error' : ''}`}>
                        <Icon d={PATHS.Lock} className="h-4 w-4" />
                        <input
                            type="text"
                            placeholder="输入账号或 6 位动态码"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value);
                                if (status === 'error') {
                                    setStatus('idle');
                                    setErrorMessage('');
                                }
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                    </div>

                    {status === 'error' && <p className="login-card-v2__error">{errorMessage || '验证失败，请检查输入'}</p>}

                    <button onClick={handleLogin} disabled={status === 'checking'} className="login-card-v2__submit">
                        {status === 'checking' ? '验证中...' : '进入控制台'}
                    </button>

                    <div className="login-card-v2__footer">
                        <span>内部工作台</span>
                        <span>支持 OTP / 用户名登录</span>
                    </div>
                </section>
            </div>
        </div>
    );
}

export function StatusBar({ usage, cacheMeta, onCleanup }) {
    const [cleaning, setCleaning] = useState(false);
    const cached = usage && usage.cachedContentTokenCount > 0;
    const action = cacheMeta?.action;

    const handleClick = async () => {
        if (!onCleanup || cleaning) return;
        setCleaning(true);
        await onCleanup();
        setCleaning(false);
    };

    let label = '待机';
    let tone = 'idle';

    if (cached || action === 'hit') {
        label = cleaning ? '清理中...' : '缓存已命中';
        tone = 'hit';
    } else if (action === 'created') {
        label = cleaning ? '清理中...' : '缓存已建立';
        tone = 'created';
    } else if (action === 'failed') {
        label = '未命中缓存';
        tone = 'failed';
    } else if (action === 'skipped') {
        label = '短 prompt';
        tone = 'skipped';
    }

    return (
        <div className="status-bar-v2">
            <button type="button" className={`status-bar-v2__badge status-bar-v2__badge--${tone}`} onClick={handleClick} disabled={!onCleanup}>
                <span className="status-bar-v2__dot" />
                <span>{label}</span>
            </button>

            {cacheMeta?.model && (
                <div className="status-bar-v2__pill">
                    {cacheMeta.model.replace('gemini-', 'g-')} · {cacheMeta.thinkingLevel || '-'}
                </div>
            )}

            {usage && (
                <div className="status-bar-v2__metrics">
                    <span>In {usage.promptTokenCount || 0}</span>
                    <span>Cache {usage.cachedContentTokenCount || 0}</span>
                    <span>Out {usage.candidatesTokenCount || 0}</span>
                    <span>Total {usage.totalTokenCount || 0}</span>
                </div>
            )}
        </div>
    );
}

export function NotificationModal({ title, message, type = 'success', onClose }) {
    return (
        <div className="modal-shell fade-in" onClick={onClose}>
            <div className="modal-card modal-card--compact" onClick={(e) => e.stopPropagation()}>
                <div className={`modal-card__icon ${type === 'success' ? 'is-success' : 'is-error'}`}>
                    <Icon d={type === 'success' ? PATHS.Check : PATHS.Close} className="h-6 w-6" />
                </div>
                <div className="modal-card__copy">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>
                <button onClick={onClose} className="modal-card__primary">知道了</button>
            </div>
        </div>
    );
}

export function DebugModal({ data, onClose }) {
    const jsonStr = window.safeStringify ? window.safeStringify(data, 2) : JSON.stringify(data, null, 2);
    return (
        <div className="modal-shell fade-in" onClick={onClose}>
            <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal-card__head">
                    <div>
                        <span className="modal-card__eyebrow">Diagnostics</span>
                        <h3>最近一次请求调试信息</h3>
                    </div>
                    <button onClick={onClose} className="modal-card__close">
                        <Icon d={PATHS.Close} className="h-5 w-5" />
                    </button>
                </div>
                <div className="modal-card__console">
                    <pre>{jsonStr}</pre>
                </div>
                <div className="modal-card__actions">
                    <button onClick={() => navigator.clipboard.writeText(jsonStr)} className="modal-card__secondary">
                        <Icon d={PATHS.Copy} className="h-4 w-4" /> 复制 JSON
                    </button>
                </div>
            </div>
        </div>
    );
}

export function HighlightedTextarea({ value, onChange, placeholder, className, onFocus, inputRef }) {
    const backdropRef = useRef(null);

    const handleScroll = (e) => {
        if (!backdropRef.current) return;
        backdropRef.current.scrollTop = e.target.scrollTop;
        backdropRef.current.scrollLeft = e.target.scrollLeft;
    };

    const getHighlightedText = (text) => {
        if (!text) return '';
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return escaped.replace(/(\{\{.*?\}\})/g, '<span class="text-sky-300 font-semibold bg-white/10 rounded px-1">$1</span>');
    };

    const displayText = getHighlightedText(value) + (value.endsWith('\n') ? '<br> ' : '');

    return (
        <div className={`relative group ${className} !bg-transparent !text-transparent`}>
            <div ref={backdropRef} className="absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-[20px] border border-white/10 bg-[#091521] p-4 font-mono text-sm leading-6 text-slate-100 pointer-events-none" dangerouslySetInnerHTML={{ __html: displayText }} />
            <textarea
                ref={inputRef}
                value={value}
                onChange={onChange}
                onScroll={handleScroll}
                onFocus={onFocus}
                placeholder={placeholder}
                className="absolute inset-0 h-full w-full resize-none rounded-[20px] border border-white/10 bg-transparent p-4 font-mono text-sm leading-6 text-transparent outline-none caret-white"
                style={{ color: 'transparent', caretColor: '#f8fafc', fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace' }}
            />
        </div>
    );
}

export function SaveConfirmModal({ type, onClose, onConfirm }) {
    return (
        <div className="modal-shell fade-in" onClick={onClose}>
            <div className="modal-card modal-card--compact" onClick={(e) => e.stopPropagation()}>
                <div className="modal-card__icon is-neutral">
                    <Icon d={type === 'ann' ? PATHS.Brain : PATHS.Chat} className="h-6 w-6" />
                </div>
                <div className="modal-card__copy">
                    <h3>确认保存设定？</h3>
                    <p>这会更新云端数据库里的{type === 'ann' ? '公告' : '客服'} AI 规则。</p>
                </div>
                <div className="modal-card__actions modal-card__actions--split">
                    <button onClick={onClose} className="modal-card__ghost">取消</button>
                    <button onClick={onConfirm} className="modal-card__primary">确认保存</button>
                </div>
            </div>
        </div>
    );
}

export function GeneralInputModal({ title, placeholder, value, onChange, onConfirm, onCancel }) {
    return (
        <div className="modal-shell fade-in" onClick={onCancel}>
            <div className="modal-card modal-card--compact" onClick={(e) => e.stopPropagation()}>
                <div className="modal-card__head">
                    <h3>{title}</h3>
                    <button onClick={onCancel} className="modal-card__close">
                        <Icon d={PATHS.Close} className="h-5 w-5" />
                    </button>
                </div>
                <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onConfirm()} className="modal-card__input" placeholder={placeholder} />
                <div className="modal-card__actions modal-card__actions--split">
                    <button onClick={onCancel} className="modal-card__ghost">取消</button>
                    <button onClick={onConfirm} className="modal-card__primary">确定</button>
                </div>
            </div>
        </div>
    );
}

export function GeneralConfirmModal({ title, message, onConfirm, onCancel, confirmText = '确认', cancelText = '取消', type = 'danger' }) {
    return (
        <div className="modal-shell fade-in" onClick={onCancel}>
            <div className="modal-card modal-card--compact" onClick={(e) => e.stopPropagation()}>
                <div className={`modal-card__icon ${type === 'danger' ? 'is-error' : 'is-neutral'}`}>
                    <Icon d={type === 'danger' ? PATHS.Trash : PATHS.Check} className="h-6 w-6" />
                </div>
                <div className="modal-card__copy">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>
                <div className="modal-card__actions modal-card__actions--split">
                    <button onClick={onCancel} className="modal-card__ghost">{cancelText}</button>
                    <button onClick={onConfirm} className={type === 'danger' ? 'modal-card__danger' : 'modal-card__primary'}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}

const INTENT_META = {
    ACCOUNT_SECURITY: { cls: 'intent-account-security', label: '账号安全' },
    ACCOUNT_LOCK: { cls: 'intent-account-lock', label: '风控封号' },
    DEPOSIT_ISSUE: { cls: 'intent-deposit-issue', label: '充值未到' },
    PROMO_CLAIM: { cls: 'intent-promo-claim', label: '活动彩金' },
    GAME_RESULT: { cls: 'intent-game-result', label: '注单结算' },
    SPORT_RULE: { cls: 'intent-sport-rule', label: '盘口规则' },
    CASINO_RULE: { cls: 'intent-casino-rule', label: '场馆规则' },
    COMPLAINT_AGENT: { cls: 'intent-complaint-agent', label: '代理投诉' },
    COMPLAINT_HARASS: { cls: 'intent-complaint-harass', label: '闹事/骚扰' },
    IMAGE_ANALYSIS: { cls: 'intent-image-analysis', label: '图像分析' },
    OTHER: { cls: 'intent-other', label: '其他咨询' },
};

export const ChatMessage = React.memo(({ msg, idx, activeMsgIndex, feedbackState, correctionText, setCorrectionText, submitCorrectionMsg, setActiveMsgIndex, setFeedbackState, handleLikeMsg, handleDislikeMsg, openSmartOptModal, handleCopy }) => {
    const intentCode = msg.role === 'assistant' && msg.triageData && msg.triageData.core_intent;
    const intentInfo = intentCode ? (INTENT_META[intentCode] || INTENT_META.OTHER) : null;
    const matchedVenue = msg.triageData && msg.triageData.matched_venue;

    return (
        <div className={`chat-message ${msg.role === 'user' ? 'is-user' : 'is-assistant'} fade-in`}>
            {intentInfo && (
                <div className={`intent-badge ${intentInfo.cls}`}>
                    <span className="intent-dot" />
                    <span>意图：{intentInfo.label}</span>
                    {matchedVenue && <span className="opacity-80">· {matchedVenue}</span>}
                </div>
            )}

            <div className={`chat-message__bubble ${msg.role === 'user' ? 'chat-message__bubble--user' : 'chat-message__bubble--assistant'}`}>
                {msg.displayImages && msg.displayImages.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {msg.displayImages.map((img, i) => (
                            <img key={i} src={img.previewUrl} className="max-h-40 rounded-2xl border border-white/10 shadow-lg" alt="Pasted" />
                        ))}
                    </div>
                )}

                <div className="chat-message__content">{msg.displayContent || msg.content}</div>

                {msg.role === 'assistant' && (
                    <div className="chat-message__actions">
                        <button onClick={() => handleLikeMsg(idx)} title="完美"><Icon d={PATHS.ThumbUp} className="h-3.5 w-3.5" />完美</button>
                        <button onClick={() => handleDislikeMsg(idx)} title="人工纠错"><Icon d={PATHS.ThumbDown} className="h-3.5 w-3.5" />纠错</button>
                        <button onClick={() => openSmartOptModal(idx)} title="调教 AI 规则"><Icon d={PATHS.Sparkles} className="h-3.5 w-3.5" />调教</button>
                        <button onClick={() => handleCopy(msg.displayContent || msg.content)} title="复制话术"><Icon d={PATHS.Copy} className="h-3.5 w-3.5" />复制</button>
                    </div>
                )}

                {activeMsgIndex === idx && feedbackState === 'rating_bad' && (
                    <div className="chat-message__feedback fade-in">
                        <input value={correctionText} onChange={(e) => setCorrectionText(e.target.value)} placeholder="输入正确的话术标准..." />
                        <button onClick={submitCorrectionMsg}>提交学习</button>
                        <button
                            onClick={() => {
                                setActiveMsgIndex(-1);
                                setFeedbackState('none');
                            }}
                            className="chat-message__feedback-close"
                        >
                            <Icon d={PATHS.Close} className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});
