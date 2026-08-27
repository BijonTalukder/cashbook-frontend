import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, MapPin, Pencil, Trash2,
  Clock, ArrowLeftRight, StickyNote, ArrowDownCircle,
} from "lucide-react";
import { toast } from "sonner";
import { customerService, type ICustomer } from "../../services/customer.service";
import type { ITransaction } from "../../services/transaction.service";
import CustomerModal from "../../components/shared/CustomerModal";
import PaymentModal from "../../components/shared/PaymentModal";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { confirmAction } from "../../components/ui/confirm";
import { useRefreshHandler } from "../../native/refresh";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { money, date: fmtDate } = useFormat();

  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await customerService.getOne(id);
      setCustomer(data.customer);
      setTransactions(data.transactions);
    } catch {
      toast.error(t("customer.loadOneFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Pull down on this screen to re-fetch it.
  useRefreshHandler(load);


  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!customer) return;
    const ok = await confirmAction({
      title: t("customer.confirmRemove", { name: customer.name }),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    try {
      await customerService.remove(customer._id);
      toast.success(t("customer.removed"));
      navigate("/customers");
    } catch {
      toast.error(t("customer.removeFailed"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>{t("customer.notFoundOne")}</p>
      </div>
    );
  }

  const stats = [
    { key: "sales", label: t("customer.totalSales"), value: customer.totalSales, color: "#10b981" },
    { key: "paid", label: t("customer.totalPaid"), value: customer.totalPaid, color: "#3b82f6" },
    { key: "due", label: t("customer.totalDueLabel"), value: customer.totalDue, color: customer.totalDue > 0 ? "#ef4444" : "var(--text-faint)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-5">
        <button
          onClick={() => navigate("/customers")}
          className="hidden lg:flex items-center gap-1.5 text-xs press"
          style={{ color: "var(--text-faint)" }}
        >
          <ArrowLeft size={13} /> {t("customer.backToCustomers")}
        </button>

        {/* Header */}
        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-semibold flex-shrink-0"
                style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
              >
                {customer.name[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
                  {customer.name}
                </h1>
                <div className="flex flex-col gap-0.5 mt-1">
                  {customer.phone && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}>
                      <Phone size={11} /> {customer.phone}
                    </p>
                  )}
                  {customer.email && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}>
                      <Mail size={11} /> {customer.email}
                    </p>
                  )}
                  {customer.address && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}>
                      <MapPin size={11} /> {customer.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={handleDelete}
                className="w-9 h-9 flex items-center justify-center rounded-xl"
                style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {customer.notes && (
            <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: "var(--surface-2)" }}>
              <StickyNote size={13} style={{ color: "var(--text-faint)" }} className="mt-0.5 flex-shrink-0" />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{customer.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            {stats.map(({ key, label, value, color }) => (
              <div key={key} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                <p className="text-[10px] mb-1" style={{ color: "var(--text-faint)" }}>{label}</p>
                <p className="text-sm font-bold" style={{ color, fontFamily: "'DM Serif Display', serif" }}>
                  {money(value)}
                </p>
              </div>
            ))}
          </div>

          {customer.totalDue > 0 && (
            <button
              onClick={() => setPayOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold press"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
            >
              <ArrowDownCircle size={15} /> {t("payment.receive")}
            </button>
          )}
        </div>

        {/* Transaction history */}
        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.border}` }}>
            <Clock size={13} style={{ color: "var(--text-faint)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>
              {t("customer.history")}
            </span>
          </div>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <ArrowLeftRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("customer.noHistory")}</p>
            </div>
          ) : (
            transactions.map((txn) => (
              <div
                key={txn._id}
                className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: "1px solid var(--border-light)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {txn.category?.name ?? t("product.uncategorized")}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{fmtDate(txn.date)}</p>
                </div>
                <p
                  className="text-sm font-semibold flex-shrink-0"
                  style={{ color: txn.type === "income" ? "#10b981" : "#ef4444" }}
                >
                  {money(txn.type === "income" ? txn.amount : -txn.amount, { signed: true })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <CustomerModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editing={customer}
        onSuccess={(c) => setCustomer(c)}
      />
      <PaymentModal
        open={payOpen}
        mode="receive"
        presetParty={customer ? { id: customer._id, name: customer.name, due: customer.totalDue } : null}
        onClose={() => setPayOpen(false)}
        onSuccess={load}
      />
    </div>
  );
};

export default CustomerDetailPage;
