import React, { useState } from 'react';
import { PATHS } from './config.jsx';
import { DBS_API } from './dbsApi.js';
import { Icon } from './components.jsx';

export function BetQuery() {
    const [orderId, setOrderId] = useState('5294113078041976');
    const [queryStatus, setQueryStatus] = useState('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [ticketData, setTicketData] = useState(null);
    const [ticketListRaw, setTicketListRaw] = useState(null);
    const [debugMode, setDebugMode] = useState(false);

    const formatDate = (date) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const safeFmt = (num) => {
        if (num === null || num === undefined || Number.isNaN(num)) return '0';
        return Number(num).toLocaleString();
    };

    const handleQuery = async () => {
        if (!orderId) return setStatusMsg('请输入注单号');
        setQueryStatus('loading');
        setStatusMsg('正在连接系统...');
        setTicketData(null);

        try {
            const token = await DBS_API.getToken();
            if (!token) {
                setQueryStatus('error');
                setStatusMsg('系统连接失败');
                return;
            }

            const now = new Date();
            const payload = {
                filter: '1',
                orderNo: orderId,
                databaseSwitch: 1,
                userIdList: [],
                startTime: formatDate(new Date(now.getTime() - 90 * 86400000)),
                endTime: formatDate(now),
                pageNum: 1,
                pageSize: 10,
            };

            const res = await fetch(`https://api.dbsportxxxwo8.com/yewu17/admin/userReport/queryTicketList?rnd=${Date.now()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                    'user-id': '1261540827428163584',
                },
                body: JSON.stringify(payload),
            });

            if (res.status === 401) {
                localStorage.removeItem('dbs_token_cache');
                setQueryStatus('error');
                setStatusMsg('密钥过期，请重试');
                return;
            }

            if (!res.ok) {
                setQueryStatus('error');
                setStatusMsg(`HTTP Error: ${res.status}`);
                return;
            }

            const json = await res.json();
            setTicketListRaw(json);

            if (!json.data?.list?.length) {
                setQueryStatus('empty');
                setStatusMsg('未查询到该注单数据');
                return;
            }

            const item = json.data.list[0];
            let ticketStatus = 'pending';
            let statusText = '未结算';

            if (item.outcome === 4 || item.outcome === 5) {
                ticketStatus = 'win';
                statusText = '赢';
            } else if (item.outcome === 3 || item.outcome === 6) {
                ticketStatus = 'loss';
                statusText = '输';
            } else if (item.outcome === 2) {
                ticketStatus = 'draw';
                statusText = '走水';
            } else if (item.remark && item.remark.includes('取消')) {
                ticketStatus = 'cancelled';
                statusText = '注单取消';
            } else if (item.remark && (item.remark.includes('拒单') || item.remark.includes('失败'))) {
                ticketStatus = 'cancelled';
                statusText = '投注失败';
            }

            const profit = item.localProfitAmount || 0;
            const profitStr = profit > 0 ? `+${safeFmt(profit)}` : safeFmt(profit);
            let displayRemark = item.remark || '';

            if (['赛事秒接', '用户下注'].includes(displayRemark)) displayRemark = '';

            setTicketData({
                raw: item,
                details: item.orderDetailList || [],
                status: ticketStatus,
                statusText,
                profitStr,
                seriesText: item.seriesValue || '单关',
                betCount: item.betCount || 1,
                displayRemark,
            });
            setQueryStatus('success');
            setStatusMsg('');
        } catch (e) {
            setQueryStatus('error');
            setStatusMsg(`网络错误: ${e.message}`);
        }
    };

    const getLegStatus = (res, remark) => {
        if (res === 4) return <span className="leg-result leg-win">全赢</span>;
        if (res === 5) return <span className="leg-result leg-win">赢半</span>;
        if (res === 3) return <span className="leg-result leg-loss">输</span>;
        if (res === 6) return <span className="leg-result leg-loss">输半</span>;
        if (res === 2) return <span className="leg-result leg-draw">走水</span>;
        return <span className="leg-result bg-slate-100 text-slate-500">{remark || '未结算'}</span>;
    };

    return (
        <div className="absolute inset-0 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <div className="dbs-query-widget">
                <section className="studio-toolbar">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <span className="shell-overview__eyebrow">Order Intelligence</span>
                            <h2 className="m-0 mt-2 text-3xl text-slate-900">注单查询与排查台</h2>
                            <p className="mt-2 text-sm text-slate-500">快速查看订单状态、串关明细、赛事比分与输赢结果。</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="shell-overview__badge">实时拉取业务后台</span>
                            <span className="shell-overview__badge">支持 90 天范围检索</span>
                        </div>
                    </div>
                </section>

                <div className="widget-box flex flex-col gap-4 rounded-[28px] p-5 md:p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">DB Query</span>
                            <h3 className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-800">
                                <Icon d={PATHS.Search} className="h-5 w-5 text-orange-500" /> 业务后台注单查询
                            </h3>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">System Online</span>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row">
                        <input value={orderId} onChange={(e) => setOrderId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuery()} className="main-input flex-1" placeholder="输入注单号 (Enter 查询)" />
                        <button onClick={handleQuery} disabled={queryStatus === 'loading'} className="btn-primary min-w-[140px] whitespace-nowrap">
                            {queryStatus === 'loading' ? '查询中...' : '开始查询'}
                        </button>
                    </div>

                    {statusMsg && (
                        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${queryStatus === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                            {statusMsg}
                        </div>
                    )}
                </div>

                {ticketData && (
                    <div className={`ticket-card is-${ticketData.status} rounded-[30px] p-5 md:p-6`}>
                        <div className="ticket-status-bar">
                            <div className="flex flex-wrap items-center gap-2">
                                <span>{ticketData.statusText}</span>
                                {ticketData.displayRemark && <span className="rounded-full bg-black/10 px-3 py-1 text-[11px] font-bold">{ticketData.displayRemark}</span>}
                                <span className="series-tag">{ticketData.seriesText}</span>
                            </div>
                            <span>{ticketData.statusText}</span>
                        </div>

                        <div className="ticket-content">
                            {ticketData.details.map((detail, idx) => (
                                <div key={idx} className="match-item">
                                    <div className="match-seq">MATCH {idx + 1}</div>
                                    <div className="league-row">
                                        <span className="flex flex-wrap items-center gap-2">
                                            {detail.sportName} / {detail.tournamentName}
                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-500">ID: {detail.matchId}</span>
                                        </span>
                                        <span>{detail.beginTimeStr.substring(5, 16)}</span>
                                    </div>
                                    <div className="teams-row">
                                        <span className="flex-1 pr-2">{detail.matchInfo}</span>
                                        <div className="flex flex-col items-end">
                                            {detail.settleScore ? <span className="live-score">{detail.settleScore.replace('全场比分 ', '')}</span> : <span className="text-xs text-slate-400">进行中</span>}
                                            {detail.scoreBenchmark && (
                                                <div className="mt-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
                                                    下注时: <strong>{detail.scoreBenchmark}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bet-info-row">
                                        <div className="bet-left">
                                            <span className="bet-name">{detail.playName} {detail.marketType ? `[${detail.marketType}]` : ''}</span>
                                            <span className="bet-pick">{detail.playOptionName}</span>
                                        </div>
                                        <div className="bet-right">
                                            <span className="bet-odds">@{detail.oddFinally}</span>
                                            {getLegStatus(detail.betResult, detail.remark)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="summary-section">
                            <div className="money-row"><span>注单编号</span><span className="money-val text-xs select-all">{ticketData.raw.orderNo}</span></div>
                            <div className="money-row"><span>投注详情</span><span className="money-val"><span className="mr-2 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">{ticketData.seriesText}</span>共 {ticketData.betCount} 注</span></div>
                            <div className="money-row"><span>总本金</span><span className="money-val">{safeFmt(ticketData.raw.localBetAmount)}</span></div>
                            <div className="money-row"><span>返还/输赢</span><span className="money-val profit-val">{ticketData.profitStr}</span></div>
                            <div className="ticket-footer-meta"><span>{ticketData.raw.merchantName} / {ticketData.raw.userName}</span><span>{ticketData.raw.createTimeStr}</span></div>
                        </div>
                    </div>
                )}

                <div className="text-center">
                    <button onClick={() => setDebugMode(!debugMode)} className="text-[11px] font-semibold text-slate-400 hover:text-slate-600">
                        {debugMode ? '隐藏' : '查看'} DEBUG JSON
                    </button>
                    {debugMode && ticketListRaw && (
                        <pre className="mt-3 max-h-60 overflow-auto rounded-[24px] bg-[#08111b] p-4 text-left text-[11px] text-[#8ef2e0] shadow-2xl custom-scrollbar">
                            {JSON.stringify(ticketListRaw, null, 2)}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
}

export function TrackerModal({ isOpen, onClose, tickets, onDelete, isRefreshing, trackerMsg }) {
    if (!isOpen) return null;

    return (
        <div className="modal-shell fade-in" onClick={onClose}>
            <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal-card__head">
                    <div>
                        <span className="modal-card__eyebrow">Ticket Watch</span>
                        <h3>注单实时监控</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{tickets.length}</span>
                        <button onClick={onClose} className="modal-card__close"><Icon d={PATHS.Close} className="h-5 w-5" /></button>
                    </div>
                </div>

                <div className="mt-5 max-h-[60vh] overflow-y-auto rounded-[24px] border border-white/10 bg-white/5 p-4 custom-scrollbar">
                    {tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-center text-slate-300">
                            <Icon d={PATHS.Eye} className="mb-3 h-12 w-12 opacity-30" />
                            <p className="text-base font-bold">暂无监控记录</p>
                            <p className="mt-2 text-sm text-slate-400">在对话中发送注单号后，系统会自动加入监控列表。</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {tickets.map((t) => (
                                <div key={t.orderId} className="tracker-modal-item rounded-[22px] border border-white/10 bg-white/5 p-4">
                                    <div className="mb-2 flex items-start justify-between gap-3">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-sm font-bold text-white select-all">{t.orderId}</span>
                                            <span className="mt-1 text-[11px] text-slate-400">{t.addTime.split(' ')[0]}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${t.status === 'win' ? 'bg-emerald-100 text-emerald-700' : t.status === 'loss' ? 'bg-rose-100 text-rose-700' : t.status === 'draw' ? 'bg-sky-100 text-sky-700' : t.status === 'cancelled' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {t.resultStr}
                                            </span>
                                            <button onClick={() => onDelete(t.orderId)} className="text-slate-300 hover:text-rose-400">
                                                <Icon d={PATHS.Trash} className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-black/20 px-3 py-2 text-sm text-slate-100">{t.matchInfo}</div>
                                    <div className="mt-3 flex justify-between text-[11px] text-slate-400">
                                        <span>User: {t.user}</span>
                                        <span>更新于: {t.updateTime.split(' ')[1]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-card__actions mt-5 items-center justify-between">
                    <div className="text-xs text-slate-400">
                        {isRefreshing ? '后台同步中...' : '系统每 10 分钟自动刷新'}
                    </div>
                    {trackerMsg && <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{trackerMsg}</div>}
                </div>
            </div>
        </div>
    );
}
