import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import { businessService, type PaymentMethod, type BusinessSubType } from "../../services/business.service";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
  input: "var(--surface-2)",
  inputBorder: "var(--border-strong)",
};
const inputCss: React.CSSProperties = {
  width: "100%", background: C.input, border: `1px solid ${C.inputBorder}`,
  borderRadius: "12px", padding: "10px 14px", color: "var(--text-primary)",
  fontSize: "14px", outline: "none",
};

const BUSINESS_SUB_TYPES = [
  { value: "retail_shop", label: "Retail Shop" },
  { value: "restaurant", label: "Restaurant" },
  { value: "online_shop", label: "Online Shop" },
  { value: "service_business", label: "Service Business" },
  { value: "freelancer", label: "Freelancer" },
  { value: "wholesale", label: "Wholesale" },
  { value: "other", label: "Other" },
];

const ALL_PAYMENT_METHODS: PaymentMethod[] = ["cash", "bank", "bkash", "nagad", "other"];
const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "INR"];

const BusinessSettingsPage = () => {
  const navigate = useNavigate();
  const { activeBusiness, setActiveBusiness } = useBusinessStore();

  const [name, setName] = useState(activeBusiness?.name ?? "");
  const [businessType, setBusinessType] = useState<string>(activeBusiness?.businessType ?? "retail_shop");
  const [phone, setPhone] = useState(activeBusiness?.phone ?? "");
  const [address, setAddress] = useState(activeBusiness?.address ?? "");
  const [logoUrl, setLogoUrl] = useState(activeBusiness?.logoUrl ?? "");
  const [currency, setCurrency] = useState(activeBusiness?.currency ?? "BDT");
  const [invoicePrefix, setInvoicePrefix] = useState(activeBusiness?.invoiceSettings?.prefix ?? "INV");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(activeBusiness?.paymentMethods ?? ["cash", "bank"]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeBusiness) return;
    setName(activeBusiness.name);
    setBusinessType(activeBusiness.businessType ?? "retail_shop");
    setPhone(activeBusiness.phone ?? "");
    setAddress(activeBusiness.address ?? "");
    setLogoUrl(activeBusiness.logoUrl ?? "");
    setCurrency(activeBusiness.currency ?? "BDT");
    setInvoicePrefix(activeBusiness.invoiceSettings?.prefix ?? "INV");
    setPaymentMethods(activeBusiness.paymentMethods ?? ["cash", "bank"]);
  }, [activeBusiness?._id]);

  const toggleMethod = (m: PaymentMethod) => {
    setPaymentMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const handleSave = async () => {
    if (!activeBusiness) return;
    if (!name.trim()) { toast.error("Business name is required"); return; }
    if (paymentMethods.length === 0) { toast.error("Enable at least one payment method"); return; }

    setSaving(true);
    try {
      const updated = await businessService.updateBusiness(activeBusiness._id, {
        name: name.trim(),
        businessType: businessType as BusinessSubType,
        phone: phone || undefined,
        address: address || undefined,
        logoUrl: logoUrl || undefined,
        currency,
        invoiceSettings: { prefix: invoicePrefix || "INV", nextNumber: activeBusiness.invoiceSettings?.nextNumber ?? 1 },
        paymentMethods,
      });
      setActiveBusiness(updated);
      toast.success("Business settings updated");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Failed to update settings";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!activeBusiness) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-5">
        <button onClick={() => navigate("/settings")} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
          <ArrowLeft size={13} /> Back to Settings
        </button>

        <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
          Business Settings
        </h1>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Business name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputCss} />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Business type</label>
            <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} style={inputCss}>
              {BUSINESS_SUB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputCss} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputCss}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputCss} />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Logo URL (optional)</label>
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." style={inputCss} />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Invoice number prefix</label>
            <input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="INV" style={inputCss} />
            <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
              Next invoice will be {invoicePrefix || "INV"}-{activeBusiness.invoiceSettings?.nextNumber ?? 1}
            </p>
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Accepted payment methods</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PAYMENT_METHODS.map((m) => {
                const active = paymentMethods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMethod(m)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                    style={{
                      background: active ? "rgba(16,185,129,0.1)" : "var(--surface-2)",
                      borderColor: active ? "rgba(16,185,129,0.4)" : C.border,
                      color: active ? "#10b981" : "var(--text-secondary)",
                    }}
                  >
                    {active && <Check size={11} />}
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettingsPage;
