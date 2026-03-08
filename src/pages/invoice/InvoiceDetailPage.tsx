import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  TrendingUp,
  TrendingDown,
  Loader2,
  Utensils,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  invoiceService,
  monthName,
  type IInvoice,
} from "../../services/Invoice.service";

const C = {
  bg: "#0a0f1e",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
};
const fmt = (n: number) =>
  "৳" + n.toLocaleString("en-BD", { maximumFractionDigits: 0 });
const fmt2 = (n: number) =>
  "৳" +
  n.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const InvoiceDetailPage = () => {
  const { businessId, invoiceId } = useParams<{
    businessId: string;
    invoiceId: string;
  }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId || !invoiceId) return;
    invoiceService
      .get(businessId, invoiceId)
      .then(setInvoice)
      .catch(() => {
        toast.error("Invoice not found");
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [businessId, invoiceId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: C.bg }}
      >
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "#10b981" }}
        />
      </div>
    );
  }

  if (!invoice) return null;

  const incomeRows = invoice.transactions.filter((t) => t.type === "income");
  const expenseRows = invoice.transactions.filter((t) => t.type === "expense");
  const transferRows = invoice.transactions.filter(
    (t) => t.type === "transfer",
  );

  return (
    <>
      {/* ══════════════════════════════════════════════
          PRINT STYLES
          - hide everything except #invoice-print-root
          - white background, black text, no margins
      ══════════════════════════════════════════════ */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm 12mm;
          }

          /* Hide entire page, then reveal only invoice root */
          body {
            visibility: hidden !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #invoice-print-root {
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
          }

          #invoice-print-root * {
            visibility: visible !important;
          }

          .no-print { display: none !important; }

          .p-card {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }

          tr { page-break-inside: avoid; }

          .p-white  { color: #0f172a !important; }
          .p-muted  { color: #64748b !important; }
          .p-border { border-color: #e2e8f0 !important; }

          .p-section-header {
            background: #f8fafc !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }

          thead tr { background: #f8fafc !important; }
          th, td    { color: #1e293b !important; border-color: #e2e8f0 !important; }
        }
      `}</style>

      {/* ── Screen nav bar (hidden in print) ── */}
      <div className="no-print p-4 md:p-6" style={{ background: C.bg }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              color: "#64748b",
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PRINT ROOT — this is what gets printed
      ══════════════════════════════════════════════ */}
      <div
        id="invoice-print-root"
        ref={printRef}
        className="p-4 md:p-6"
        style={{ background: C.bg }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {/* ── Invoice Header ── */}
          <div
            className="p-card rounded-2xl p-6"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            {/* Top row: brand + period */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#10b981" }}
                >
                  <span
                    className="text-xl font-bold"
                    style={{ color: "#022c22" }}
                  >
                    H
                  </span>
                </div>
                <div>
                  <p
                    className="p-white text-lg font-bold text-white"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {invoice.businessName}
                  </p>
                  <p
                    className="p-muted text-xs capitalize"
                    style={{ color: "#475569" }}
                  >
                    {invoice.businessType === "mass"
                      ? "Mess"
                      : invoice.businessType}{" "}
                    Account
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className="p-muted text-xs mb-1"
                  style={{ color: "#475569" }}
                >
                  Invoice Period
                </p>
                <p
                  className="p-white text-2xl font-bold text-white"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {monthName(invoice.month)} {invoice.year}
                </p>
                <p
                  className="p-muted text-xs mt-1"
                  style={{ color: "#64748b" }}
                >
                  Generated{" "}
                  {new Date(invoice.generatedAt).toLocaleDateString("en-BD", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div
              style={{ borderTop: `1px solid ${C.border}` }}
              className="p-border pt-5"
            >
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: "Total Income",
                    value: invoice.totalIncome,
                    color: "#10b981",
                    Icon: TrendingUp,
                  },
                  {
                    label: "Total Expense",
                    value: invoice.totalExpense,
                    color: "#ef4444",
                    Icon: TrendingDown,
                  },
                  {
                    label: "Net Balance",
                    value: invoice.netBalance,
                    color: invoice.netBalance >= 0 ? "#10b981" : "#ef4444",
                    Icon:
                      invoice.netBalance >= 0 ? ArrowUpRight : ArrowDownRight,
                  },
                ].map(({ label, value, color, Icon }) => (
                  <div key={label} className="text-center py-2">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: `${color}18` }}
                      >
                        <Icon size={13} style={{ color }} />
                      </div>
                      <span
                        className="p-muted text-xs"
                        style={{ color: "#64748b" }}
                      >
                        {label}
                      </span>
                    </div>
                    <p
                      className="text-2xl font-bold p-white"
                      style={{ color, fontFamily: "'DM Serif Display', serif" }}
                    >
                      {fmt(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MESS: Member Summary ── */}
          {invoice.isMess && invoice.members && invoice.members.length > 0 && (
            <div
              className="p-card rounded-2xl overflow-hidden"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              {/* Section header */}
              <div
                className="p-section-header px-5 py-3 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                <div className="flex items-center gap-2">
                  <Utensils size={14} style={{ color: "#8b5cf6" }} />
                  <span className="p-white text-sm font-bold text-white">
                    Mess Member Summary
                  </span>
                </div>
                <div
                  className="flex items-center gap-4 text-xs"
                  style={{ color: "#64748b" }}
                >
                  <span>
                    Meal Category:{" "}
                    <strong style={{ color: "#8b5cf6" }}>
                      {invoice.mealCategoryName}
                    </strong>
                  </span>
                  <span>
                    Total Meals:{" "}
                    <strong style={{ color: "#94a3b8" }}>
                      {invoice.totalMeals}
                    </strong>
                  </span>
                  <span>
                    Meal Rate:{" "}
                    <strong style={{ color: "#8b5cf6" }}>
                      {fmt2(invoice.mealRate ?? 0)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Member table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {[
                        "Member",
                        "Deposit",
                        "Meals",
                        "Meal Cost",
                        "Other Exp.",
                        "Total Cost",
                        "Balance",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-xs font-semibold text-left p-muted"
                          style={{ color: "#475569" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.members.map((m) => (
                      <tr
                        key={m.userId}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                background:
                                  "linear-gradient(135deg,#8b5cf6,#6d28d9)",
                              }}
                            >
                              <span className="text-xs font-bold text-white">
                                {m.name[0]}
                              </span>
                            </div>
                            <span className="p-white text-sm font-medium text-white">
                              {m.name}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-semibold"
                          style={{ color: "#10b981" }}
                        >
                          {fmt(m.totalDeposit)}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "#94a3b8" }}
                        >
                          {m.totalMeals}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "#8b5cf6" }}
                        >
                          {fmt(m.mealCost)}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "#ef4444" }}
                        >
                          {m.otherExpense > 0 ? fmt(m.otherExpense) : "—"}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-medium"
                          style={{ color: "#f87171" }}
                        >
                          {fmt(m.totalCost)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-sm font-bold px-2.5 py-1 rounded-lg"
                            style={{
                              color: m.balance >= 0 ? "#10b981" : "#ef4444",
                              background:
                                m.balance >= 0
                                  ? "rgba(16,185,129,0.12)"
                                  : "rgba(239,68,68,0.12)",
                            }}
                          >
                            {m.balance >= 0 ? "+" : ""}
                            {fmt(m.balance)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ borderTop: `2px solid ${C.border}` }}>
                    <tr>
                      <td className="px-4 py-3 text-xs font-bold p-white text-white">
                        Total
                      </td>
                      <td
                        className="px-4 py-3 text-sm font-bold"
                        style={{ color: "#10b981" }}
                      >
                        {fmt(
                          invoice.members.reduce(
                            (s, m) => s + m.totalDeposit,
                            0,
                          ),
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-sm font-bold"
                        style={{ color: "#94a3b8" }}
                      >
                        {invoice.totalMeals}
                      </td>
                      <td
                        className="px-4 py-3 text-sm font-bold"
                        style={{ color: "#8b5cf6" }}
                      >
                        {fmt(invoice.totalMealCost ?? 0)}
                      </td>
                      <td
                        className="px-4 py-3 text-sm font-bold"
                        style={{ color: "#ef4444" }}
                      >
                        {fmt(
                          invoice.members.reduce(
                            (s, m) => s + m.otherExpense,
                            0,
                          ),
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-sm font-bold"
                        style={{ color: "#f87171" }}
                      >
                        {fmt(
                          invoice.members.reduce((s, m) => s + m.totalCost, 0),
                        )}
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Formula */}
              <div
                className="mx-5 mb-4 mt-3 p-3 rounded-xl text-xs"
                style={{
                  background: "rgba(139,92,246,0.06)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  color: "#8b5cf6",
                }}
              >
                <strong>Formula:</strong> Total {invoice.mealCategoryName}{" "}
                Expense ({fmt(invoice.totalMealCost ?? 0)}) ÷ Total Meals (
                {invoice.totalMeals}) = Meal Rate ({fmt2(invoice.mealRate ?? 0)}
                ) · Balance = Deposit − (Meals × Rate) − Other Expenses
              </div>
            </div>
          )}

          {/* ── Transaction Sections ── */}
          {[
            {
              label: "Income Transactions",
              rows: incomeRows,
              color: "#10b981",
            },
            {
              label: "Expense Transactions",
              rows: expenseRows,
              color: "#ef4444",
            },
            ...(transferRows.length > 0
              ? [{ label: "Transfers", rows: transferRows, color: "#f59e0b" }]
              : []),
          ].map(
            ({ label, rows, color }) =>
              rows.length > 0 && (
                <div
                  key={label}
                  className="p-card rounded-2xl overflow-hidden"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    className="p-section-header px-5 py-3 flex items-center justify-between"
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    <span className="text-sm font-bold" style={{ color }}>
                      {label}
                    </span>
                    <span className="text-sm font-bold" style={{ color }}>
                      {fmt(rows.reduce((s, r) => s + r.amount, 0))}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          {["Date", "Category", "Note", "Member", "Amount"].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-4 py-2.5 text-left text-xs font-semibold p-muted"
                                style={{ color: "#475569" }}
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((tx) => (
                          <tr
                            key={tx._id}
                            style={{
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                            }}
                          >
                            <td
                              className="px-4 py-2.5 text-xs p-muted"
                              style={{ color: "#64748b" }}
                            >
                              {new Date(tx.date).toLocaleDateString("en-BD", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </td>
                            <td
                              className="px-4 py-2.5 text-xs"
                              style={{ color: "#94a3b8" }}
                            >
                              {tx.categoryName}
                            </td>
                            <td
                              className="px-4 py-2.5 text-xs max-w-[160px] truncate"
                              style={{ color: "#64748b" }}
                            >
                              {tx.note ?? "—"}
                            </td>
                            <td
                              className="px-4 py-2.5 text-xs"
                              style={{ color: "#64748b" }}
                            >
                              {tx.memberName}
                            </td>
                            <td
                              className="px-4 py-2.5 text-sm font-semibold"
                              style={{ color }}
                            >
                              {fmt(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ),
          )}

          {/* ── Professional Footer ── */}
          <div
            className="p-card rounded-2xl p-4"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "#10b981" }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#022c22" }}
                  >
                    H
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold p-white text-white">
                    HisabBoi
                  </p>
                  <p
                    className="text-[10px] p-muted"
                    style={{ color: "#475569" }}
                  >
                    Smart Financial Tracking
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] p-muted" style={{ color: "#475569" }}>
                  This is a system-generated invoice.
                </p>
                <p className="text-[10px] p-muted" style={{ color: "#334155" }}>
                  Generated:{" "}
                  {new Date(invoice.generatedAt).toLocaleString("en-BD")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceDetailPage;
