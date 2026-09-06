import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import { businessService, type PaymentMethod, type BusinessSubType } from "../../services/business.service";
import { useTranslation } from "../../i18n/useTranslation";
import { enumLabel, paymentMethodLabel } from "../../i18n/labels";
import { CURRENCIES, toCurrency } from "../../utils/currency";

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

const BUSINESS_SUB_TYPES: BusinessSubType[] = [
  "retail_shop", "restaurant", "online_shop", "service_business", "freelancer", "wholesale", "other",
];

const ALL_PAYMENT_METHODS: PaymentMethod[] = ["cash", "bank", "bkash", "nagad", "other"];

const BusinessSettingsPage = () => {
  const navigate = useNavigate();
  const { activeBusiness, setActiveBusiness } = useBusinessStore();
  const { t } = useTranslation();

  const [name, setName] = useState(activeBusiness?.name ?? "");
  const [businessType, setBusinessType] = useState<string>(activeBusiness?.businessType ?? "retail_shop");
  const [phone, setPhone] = useState(activeBusiness?.phone ?? "");
  const [address, setAddress] = useState(activeBusiness?.address ?? "");
  const [logoUrl, setLogoUrl] = useState(activeBusiness?.logoUrl ?? "");
  const [currency, setCurrency] = useState(toCurrency(activeBusiness?.currency));
  const [invoicePrefix, setInvoicePrefix] = useState(activeBusiness?.invoiceSettings?.prefix ?? "INV");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(activeBusiness?.paymentMethods ?? ["cash", "bank"]);
  const [openingBalance, setOpeningBalance] = useState(String(activeBusiness?.openingBalance ?? ""));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeBusiness) return;
    setName(activeBusiness.name);
    setBusinessType(activeBusiness.businessType ?? "retail_shop");
    setPhone(activeBusiness.phone ?? "");
    setAddress(activeBusiness.address ?? "");
    setLogoUrl(activeBusiness.logoUrl ?? "");
    setCurrency(toCurrency(activeBusiness.currency));
    setInvoicePrefix(activeBusiness.invoiceSettings?.prefix ?? "INV");
    setPaymentMethods(activeBusiness.paymentMethods ?? ["cash", "bank"]);
    setOpeningBalance(String(activeBusiness.openingBalance ?? ""));
  }, [activeBusiness?._id]);

  const toggleMethod = (m: PaymentMethod) => {
    setPaymentMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const openingBalanceNum = activeBusiness?.openingBalance ?? 0;
  const cashBalanceNum = activeBusiness?.cashBalance ?? 0;
  const canEditOpeningBalance = Math.abs(cashBalanceNum - openingBalanceNum) < 0.01;

  const handleSave = async () => {
    if (!activeBusiness) return;
    if (!name.trim()) { toast.error(t("businessSettings.nameRequired")); return; }
    if (paymentMethods.length === 0) { toast.error(t("businessSettings.methodRequired")); return; }

    const parsedOpeningBalance = Number(openingBalance) || 0;

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
        openingBalance: canEditOpeningBalance && parsedOpeningBalance !== openingBalanceNum ? parsedOpeningBalance : undefined,
      });
      setActiveBusiness(updated);
      toast.success(t("businessSettings.updated"));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? t("businessSettings.updateFailed");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!activeBusiness) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-5">
        <button onClick={() => navigate("/settings")} className="hidden lg:flex items-center gap-1.5 text-xs press" style={{ color: "var(--text-faint)" }}>
          <ArrowLeft size={13} /> {t("businessSettings.backToSettings")}
        </button>

        <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
          {t("businessSettings.title")}
        </h1>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("businessSettings.businessName")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputCss} />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("businessSettings.businessTypeLabel")}</label>
            <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} style={inputCss}>
              {BUSINESS_SUB_TYPES.map((sub) => (
                <option key={sub} value={sub}>{enumLabel(t, "businessSubType", sub)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("businessSettings.openingBalance")}</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={openingBalance}
              disabled={!canEditOpeningBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              style={{ ...inputCss, opacity: canEditOpeningBalance ? 1 : 0.6 }}
            />
            {!canEditOpeningBalance ? (
              <p className="mt-1 text-[11px]" style={{ color: "#f59e0b" }}>
                {t("businessSettings.openingBalanceLocked")}
              </p>
            ) : (
              <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
                {t("businessSettings.openingBalanceHint")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("common.phone")}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputCss} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("settings.currency")}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(toCurrency(e.target.value))}
                style={inputCss}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {t("businessSettings.currencyOption", { code: c, name: t(`currency.${c}`) })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("common.address")}</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputCss} />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("businessSettings.logoUrl")}</label>
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder={t("product.urlPlaceholder")} style={inputCss} />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("businessSettings.invoicePrefix")}</label>
            <input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="INV" style={inputCss} />
            <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
              {t("businessSettings.nextInvoiceHint", {
                number: `${invoicePrefix || "INV"}-${activeBusiness.invoiceSettings?.nextNumber ?? 1}`,
              })}
            </p>
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>{t("businessSettings.acceptedMethods")}</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PAYMENT_METHODS.map((m) => {
                const active = paymentMethods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMethod(m)}
                    className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-medium border flex-shrink-0 whitespace-nowrap press"
                    style={{
                      background: active ? "rgba(16,185,129,0.1)" : "var(--surface-2)",
                      borderColor: active ? "rgba(16,185,129,0.4)" : C.border,
                      color: active ? "#10b981" : "var(--text-secondary)",
                    }}
                  >
                    {active && <Check size={11} />}
                    {paymentMethodLabel(t, m)}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold press disabled:opacity-60"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {t("common.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettingsPage;
