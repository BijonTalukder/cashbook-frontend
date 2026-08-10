import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { productService, type IProduct } from "../../services/product.service";
import { purchaseService } from "../../services/purchase.service";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
  input: "var(--surface-2)",
  inputBorder: "var(--border-strong)",
};
const inputCss: React.CSSProperties = {
  width: "100%", background: C.input, border: `1px solid ${C.inputBorder}`,
  borderRadius: "10px", padding: "8px 10px", color: "var(--text-primary)",
  fontSize: "13px", outline: "none",
};

interface Row {
  productId: string;
  quantity: string;
  unitPrice: string;
}

const emptyRow: Row = { productId: "", quantity: "1", unitPrice: "" };

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

const NewPurchasePage = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const currencySymbol = (activeBusiness?.currency || "BDT") === "BDT" ? "৳" : `${activeBusiness?.currency} `;
  const paymentMethods = activeBusiness?.paymentMethods?.length ? activeBusiness.paymentMethods : ["cash", "bank"];

  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paidTouched, setPaidTouched] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] ?? "cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeBusiness) return;
    supplierService.getAll(activeBusiness._id).then(setSuppliers).catch(() => toast.error("Failed to load suppliers"));
    productService.getAll(activeBusiness._id).then(setProducts).catch(() => toast.error("Failed to load products"));
  }, [activeBusiness?._id]);

  const productMap = new Map(products.map((p) => [p._id, p]));

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = productMap.get(productId);
    updateRow(index, { productId, unitPrice: product ? String(product.purchasePrice) : "" });
  };

  const addRow = () => setRows((prev) => [...prev, { ...emptyRow }]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const lineTotals = rows.map((r) => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.unitPrice) || 0;
    return qty * price;
  });
  const subtotal = lineTotals.reduce((a, b) => a + b, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const effectivePaid = paidTouched ? Number(paidAmount) || 0 : total;
  const due = Math.max(0, total - effectivePaid);

  const handleSubmit = async () => {
    if (!activeBusiness) return;
    const items = rows
      .filter((r) => r.productId && Number(r.quantity) > 0)
      .map((r) => ({
        product: r.productId,
        quantity: Number(r.quantity),
        unitPrice: r.unitPrice ? Number(r.unitPrice) : undefined,
      }));

    if (items.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    if (due > 0 && !supplierId) {
      toast.error("Select a supplier to record a due purchase");
      return;
    }

    setSubmitting(true);
    try {
      const purchase = await purchaseService.create({
        businessId: activeBusiness._id,
        supplierId: supplierId || undefined,
        items,
        discount: Number(discount) || 0,
        paidAmount: effectivePaid,
        paymentMethod,
        note: note || undefined,
      });
      toast.success(`Purchase ${purchase.referenceNumber} recorded`);
      navigate("/purchases");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Failed to record purchase";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-5">
        <button onClick={() => navigate("/purchases")} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
          <ArrowLeft size={13} /> Back to Purchases
        </button>

        <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
          New Purchase
        </h1>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Supplier (optional)</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={inputCss}>
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}{s.phone ? ` — ${s.phone}` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Products</label>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={row.productId}
                    onChange={(e) => handleProductSelect(i, e.target.value)}
                    style={{ ...inputCss, flex: 3 }}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.stock} {p.unit} in stock)</option>
                    ))}
                  </select>
                  <input
                    type="number" min="0.01" step="0.01" placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => updateRow(i, { quantity: e.target.value })}
                    style={{ ...inputCss, flex: 1 }}
                  />
                  <input
                    type="number" min="0" step="0.01" placeholder="Price"
                    value={row.unitPrice}
                    onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
                    style={{ ...inputCss, flex: 1 }}
                  />
                  <span className="text-xs w-16 text-right flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {currencySymbol}{fmt(lineTotals[i] || 0)}
                  </span>
                  <button
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 disabled:opacity-30"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addRow}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium"
              style={{ color: "#10b981" }}
            >
              <Plus size={13} /> Add product
            </button>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Discount</label>
            <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} style={inputCss} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Payment method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputCss}>
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Paid amount</label>
              <input
                type="number" min="0" step="0.01"
                value={paidTouched ? paidAmount : total.toFixed(2)}
                onChange={(e) => { setPaidTouched(true); setPaidAmount(e.target.value); }}
                style={inputCss}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={inputCss} />
          </div>

          <div className="rounded-xl p-4 space-y-1.5" style={{ background: "var(--surface-2)" }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
              <span style={{ color: "var(--text-primary)" }}>{currencySymbol}{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1.5" style={{ borderTop: `1px solid ${C.border}` }}>
              <span style={{ color: "var(--text-primary)" }}>Total</span>
              <span style={{ color: "var(--text-primary)" }}>{currencySymbol}{fmt(total)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--text-muted)" }}>Paid</span>
              <span style={{ color: "#10b981" }}>{currencySymbol}{fmt(effectivePaid)}</span>
            </div>
            {due > 0 && (
              <div className="flex justify-between text-xs font-semibold">
                <span style={{ color: "#ef4444" }}>Payable</span>
                <span style={{ color: "#ef4444" }}>{currencySymbol}{fmt(due)}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Record Purchase
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPurchasePage;
