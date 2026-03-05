import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  TrendingUp,
  TrendingDown,
  Loader2,
  Users,
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
      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-root { background: white !important; padding: 0 !important; }
          .print-card {
            background: white !important; border: 1px solid #e2e8f0 !important;
            box-shadow: none !important; break-inside: avoid;
          }
          .print-text-dark { color: #1e293b !important; }
          .print-text-muted { color: #64748b !important; }
          th, td { color: #1e293b !important; border-color: #e2e8f0 !important; }
          .print-header-bg { background: #f8fafc !important; }
        }
      `}</style>

      <div
        className="print-root min-h-screen p-4 md:p-6"
        style={{ background: C.bg }}
      >
        <div className="max-w-4xl mx-auto" ref={printRef}>
          {/* ── Nav bar (no-print) ── */}
          <div className="no-print flex items-center justify-between mb-6">
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

          {/* ── Invoice Header ── */}
          <div
            className="print-card rounded-2xl p-6 mb-4"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "#10b981" }}
                  >
                    <span
                      className="text-lg font-bold"
                      style={{ color: "#022c22" }}
                    >
                      H
                    </span>
                  </div>
                  <div>
                    <p
                      className="text-lg font-bold text-white print-text-dark"
                      style={{ fontFamily: "'DM Serif Display', serif" }}
                    >
                      {invoice.businessName}
                    </p>
                    <p
                      className="text-xs capitalize"
                      style={{ color: "#475569" }}
                    >
                      {invoice.businessType === "mass"
                        ? "Mess"
                        : invoice.businessType}{" "}
                      Account
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "#475569" }}>
                  Invoice Period
                </p>
                <p
                  className="text-xl font-bold text-white print-text-dark mt-1"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {monthName(invoice.month)} {invoice.year}
                </p>
                <p className="text-xs mt-1" style={{ color: "#334155" }}>
                  Generated{" "}
                  {new Date(invoice.generatedAt).toLocaleDateString("en-BD")}
                </p>
              </div>
            </div>

            {/* Summary row */}
            <div
              className="grid grid-cols-3 gap-3 mt-5 pt-5"
              style={{ borderTop: `1px solid ${C.border}` }}
            >
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
                  Icon: invoice.netBalance >= 0 ? ArrowUpRight : ArrowDownRight,
                },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Icon size={12} style={{ color }} />
                    <span
                      className="text-xs print-text-muted"
                      style={{ color: "#475569" }}
                    >
                      {label}
                    </span>
                  </div>
                  <p
                    className="text-xl font-bold"
                    style={{ color, fontFamily: "'DM Serif Display', serif" }}
                  >
                    {fmt(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── MESS: Member Summary ── */}
          {invoice.isMess && invoice.members && invoice.members.length > 0 && (
            <div
              className="print-card rounded-2xl p-5 mb-4"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              {/* Meal rate info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Utensils size={15} style={{ color: "#8b5cf6" }} />
                  <span className="text-sm font-semibold text-white print-text-dark">
                    Mess Summary
                  </span>
                </div>
                <div
                  className="flex items-center gap-4 text-xs"
                  style={{ color: "#475569" }}
                >
                  <span>
                    Meal Category:{" "}
                    <strong style={{ color: "#94a3b8" }}>
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
                    <tr
                      className="print-header-bg"
                      style={{ borderBottom: `1px solid ${C.border}` }}
                    >
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
                          className="px-3 py-2.5 text-xs font-semibold text-left print-text-muted"
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
                        <td className="px-3 py-3">
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
                            <span className="text-sm text-white print-text-dark font-medium">
                              {m.name}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-3 py-3 text-sm font-medium"
                          style={{ color: "#10b981" }}
                        >
                          {fmt(m.totalDeposit)}
                        </td>
                        <td
                          className="px-3 py-3 text-sm"
                          style={{ color: "#94a3b8" }}
                        >
                          {m.totalMeals}
                        </td>
                        <td
                          className="px-3 py-3 text-sm"
                          style={{ color: "#8b5cf6" }}
                        >
                          {fmt(m.mealCost)}
                        </td>
                        <td
                          className="px-3 py-3 text-sm"
                          style={{ color: "#ef4444" }}
                        >
                          {m.otherExpense > 0 ? fmt(m.otherExpense) : "—"}
                        </td>
                        <td
                          className="px-3 py-3 text-sm font-medium"
                          style={{ color: "#f87171" }}
                        >
                          {fmt(m.totalCost)}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`text-sm font-bold px-2 py-0.5 rounded-lg`}
                            style={{
                              color: m.balance >= 0 ? "#10b981" : "#ef4444",
                              background:
                                m.balance >= 0
                                  ? "rgba(16,185,129,0.1)"
                                  : "rgba(239,68,68,0.1)",
                            }}
                          >
                            {m.balance >= 0 ? "+" : ""}
                            {fmt(m.balance)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="px-3 py-3 text-xs font-bold text-white print-text-dark">
                        Total
                      </td>
                      <td
                        className="px-3 py-3 text-sm font-bold"
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
                        className="px-3 py-3 text-sm font-bold"
                        style={{ color: "#94a3b8" }}
                      >
                        {invoice.totalMeals}
                      </td>
                      <td
                        className="px-3 py-3 text-sm font-bold"
                        style={{ color: "#8b5cf6" }}
                      >
                        {fmt(invoice.totalMealCost ?? 0)}
                      </td>
                      <td
                        className="px-3 py-3 text-sm font-bold"
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
                        className="px-3 py-3 text-sm font-bold"
                        style={{ color: "#f87171" }}
                      >
                        {fmt(
                          invoice.members.reduce((s, m) => s + m.totalCost, 0),
                        )}
                      </td>
                      <td className="px-3 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mess formula explanation */}
              <div
                className="mt-4 p-3 rounded-xl text-xs"
                style={{
                  background: "rgba(139,92,246,0.06)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  color: "#8b5cf6",
                }}
              >
                Meal Cost Formula: Total {invoice.mealCategoryName} Expense (
                {fmt(invoice.totalMealCost ?? 0)}) ÷ Total Meals (
                {invoice.totalMeals}) = Meal Rate ({fmt2(invoice.mealRate ?? 0)}
                ) per meal · Balance = Deposit − (Meals × Meal Rate) − Other
                Expenses
              </div>
            </div>
          )}

          {/* ── Transaction sections ── */}
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
                  className="print-card rounded-2xl mb-4 overflow-hidden"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    className="px-5 py-3 flex items-center justify-between"
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    <span className="text-sm font-semibold" style={{ color }}>
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
                                className="px-4 py-2.5 text-left text-xs font-medium print-text-muted"
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
                              className="px-4 py-2.5 text-xs print-text-muted"
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

          {/* Footer */}
          <div className="text-center py-4">
            <p className="text-xs" style={{ color: "#1e293b" }}>
              HisabBoi · Generated on{" "}
              {new Date(invoice.generatedAt).toLocaleString("en-BD")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceDetailPage;
