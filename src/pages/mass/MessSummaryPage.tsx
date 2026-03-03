import { useState, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, TrendingDown, TrendingUp,
    Users, ArrowRight, Loader2, RefreshCw,
    CheckCircle2, AlertCircle, Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBusinessStore } from '../../store/businessStore';
import api from '../../services/api';

/* ── Tokens ─────────────────────────────────────── */
const C = { bg: '#0a0f1e', card: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' };

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const fmt = (n: number) => new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmt0 = (n: number) => new Intl.NumberFormat('en-BD', { minimumFractionDigits: 0 }).format(n);

/* ── Types ──────────────────────────────────────── */
interface MessMember {
    memberId: string;
    name: string;
    email: string;
    totalPaid: number;
    totalDeposited: number;
    share: number;
    balance: number;
    expenses: { category: string; amount: number; date: string; note?: string }[];
}

interface Settlement {
    from: string; fromId: string;
    to: string; toId: string;
    amount: number;
}

interface MessData {
    period: { year: number; month: number };
    memberCount: number;
    totalExpense: number;
    totalIncome: number;
    perPersonShare: number;
    members: MessMember[];
    settlements: Settlement[];
}

/* ── Member Balance Card ────────────────────────── */
const MemberCard = ({ m, currency }: { m: MessMember; currency: string }) => {
    const [open, setOpen] = useState(false);
    const isCredit = m.balance > 0;
    const isEven = Math.abs(m.balance) < 0.01;
    const color = isEven ? '#64748b' : isCredit ? '#10b981' : '#ef4444';
    const Icon = isEven ? Minus : isCredit ? TrendingUp : TrendingDown;

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
            <button
                onClick={() => setOpen(p => !p)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
                {/* Avatar */}
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                >
                    {m.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                    <p className="text-[11px]" style={{ color: '#475569' }}>
                        Paid: {currency}{fmt0(m.totalPaid)} · Share: {currency}{fmt0(m.share)}
                    </p>
                </div>

                {/* Balance */}
                <div className="text-right flex-shrink-0">
                    <div className="flex items-center justify-end gap-1.5 mb-0.5">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center"
                            style={{ background: `${color}18`, color }}>
                            <Icon size={11} />
                        </div>
                        <p className="text-sm font-bold" style={{ color }}>
                            {isEven ? 'Even' : (isCredit ? '+' : '-')}{currency}{fmt0(Math.abs(m.balance))}
                        </p>
                    </div>
                    <p className="text-[10px]" style={{ color: '#334155' }}>
                        {isEven ? 'settled' : isCredit ? 'to receive' : 'to pay'}
                    </p>
                </div>
            </button>

            {/* Expense breakdown */}
            {open && m.expenses.length > 0 && (
                <div className="px-4 pb-4" style={{ borderTop: `1px solid ${C.border}` }}>
                    <p className="text-[10px] uppercase tracking-wider mt-3 mb-2" style={{ color: '#334155' }}>
                        Expense breakdown
                    </p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {m.expenses.map((e, i) => (
                            <div key={i} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg"
                                style={{ background: 'rgba(239,68,68,0.05)' }}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <span style={{ color: '#475569' }}>{e.date.slice(5)}</span>
                                    <span className="truncate" style={{ color: '#94a3b8' }}>{e.category}</span>
                                    {e.note && <span className="truncate" style={{ color: '#475569' }}>· {e.note}</span>}
                                </div>
                                <span className="font-semibold ml-2 flex-shrink-0" style={{ color: '#ef4444' }}>
                                    {currency}{fmt0(e.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {open && m.expenses.length === 0 && (
                <div className="px-4 pb-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                    <p className="text-xs" style={{ color: '#334155' }}>No expenses recorded</p>
                </div>
            )}
        </div>
    );
};

/* ── Main Page ──────────────────────────────────── */
const MessSummaryPage = () => {
    const { activeBusiness } = useBusinessStore();

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [data, setData] = useState<MessData | null>(null);
    const [loading, setLoading] = useState(false);

    const currency = activeBusiness?.currency ?? '৳';

    const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); setData(null); };
    const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); setData(null); };

    const load = useCallback(async () => {
        if (!activeBusiness) return;
        setLoading(true);
        try {
            const res = await api.get('/mess/summary', {
                params: { businessId: activeBusiness._id, year, month },
            });
            setData(res.data.data);
        } catch {
            toast.error('Failed to load mess summary');
        } finally {
            setLoading(false);
        }
    }, [activeBusiness, year, month]);

    // Auto-load on mount and when month changes
    useState(() => { load(); });

    if (!activeBusiness || activeBusiness.type !== 'mass') {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
                <p className="text-sm" style={{ color: '#475569' }}>Mess type business select করুন</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: C.bg }}>
            <div className="max-w-2xl mx-auto px-4 py-6 lg:px-6 lg:py-8 space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
                            Mess Summary
                        </h1>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{activeBusiness.name}</p>
                    </div>
                    <button onClick={load}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                        style={{ background: C.card, border: `1px solid ${C.border}`, color: '#64748b' }}>
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Month picker */}
                <div className="flex items-center justify-between rounded-2xl px-5 py-3"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl"
                        style={{ color: '#64748b' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <p className="text-base font-semibold text-white">
                        {MONTHS[month]} {year}
                    </p>
                    <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl"
                        style={{ color: '#64748b' }}>
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={22} className="animate-spin" style={{ color: '#8b5cf6' }} />
                    </div>
                )}

                {/* Data */}
                {!loading && data && (
                    <>
                        {/* Summary cards */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Total Expense', value: `${currency}${fmt0(data.totalExpense)}`, color: '#ef4444', sub: `${data.memberCount} members` },
                                { label: 'Per Person', value: `${currency}${fmt0(data.perPersonShare)}`, color: '#8b5cf6', sub: 'equal share' },
                                { label: 'Members', value: String(data.memberCount), color: '#3b82f6', sub: 'active' },
                            ].map(({ label, value, color, sub }) => (
                                <div key={label} className="rounded-2xl p-4"
                                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                                    <p className="text-[11px] mb-2" style={{ color: '#475569' }}>{label}</p>
                                    <p className="text-lg font-bold text-white leading-none"
                                        style={{ fontFamily: "'DM Serif Display', serif", color }}>{value}</p>
                                    <p className="text-[10px] mt-1" style={{ color: '#334155' }}>{sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* How it's calculated */}
                        <div className="rounded-2xl p-4"
                            style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                            <p className="text-xs font-semibold mb-3" style={{ color: '#8b5cf6' }}>How it's calculated</p>
                            <div className="space-y-1.5 text-xs" style={{ color: '#64748b' }}>
                                <div className="flex justify-between">
                                    <span>Total expenses this month</span>
                                    <span className="font-semibold text-white">{currency}{fmt(data.totalExpense)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>÷ {data.memberCount} members</span>
                                    <span className="font-semibold" style={{ color: '#8b5cf6' }}>
                                        = {currency}{fmt(data.perPersonShare)} / person
                                    </span>
                                </div>
                                <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span style={{ color: '#475569' }}>
                                        Each member's balance = what they paid − their share
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Member breakdown */}
                        <div>
                            <p className="text-xs uppercase tracking-wider mb-3 flex items-center gap-2"
                                style={{ color: '#475569' }}>
                                <Users size={12} /> Member Breakdown
                            </p>
                            <div className="space-y-3">
                                {data.members.map(m => (
                                    <MemberCard key={m.memberId} m={m} currency={currency} />
                                ))}
                            </div>
                        </div>

                        {/* Settlement suggestions */}
                        {data.settlements.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-wider mb-3 flex items-center gap-2"
                                    style={{ color: '#475569' }}>
                                    <AlertCircle size={12} /> To Settle Up
                                </p>
                                <div className="space-y-2">
                                    {data.settlements.map((s, i) => (
                                        <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                                            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                                {s.from.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium">
                                                    <span style={{ color: '#fca5a5' }}>{s.from}</span>
                                                    <span className="mx-2" style={{ color: '#334155' }}>pays</span>
                                                    <span style={{ color: '#86efac' }}>{s.to}</span>
                                                </p>
                                            </div>
                                            <p className="text-sm font-bold flex-shrink-0" style={{ color: '#10b981' }}>
                                                {currency}{fmt(s.amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.settlements.length === 0 && (
                            <div className="flex items-center gap-3 rounded-2xl px-4 py-4"
                                style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: '#10b981' }}>All settled!</p>
                                    <p className="text-xs" style={{ color: '#475569' }}>
                                        Everyone has paid their fair share this month.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!loading && !data && (
                    <div className="rounded-2xl p-12 text-center"
                        style={{ background: C.card, border: `1px dashed ${C.border}` }}>
                        <Users size={22} className="mx-auto mb-3" style={{ color: '#334155' }} />
                        <p className="text-white text-sm font-medium mb-1">No data yet</p>
                        <p className="text-xs mb-4" style={{ color: '#475569' }}>
                            Add expense transactions to see the mess summary
                        </p>
                        <button onClick={load}
                            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-semibold"
                            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' }}>
                            Load Summary <ArrowRight size={12} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessSummaryPage;