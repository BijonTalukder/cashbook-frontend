import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TrendingUp,
  User,
  Building2,
  Home,
  Store,
  ArrowRight,
  ArrowLeft,
  Plus,
  Check,
  Tag,
  Loader2,
  ShoppingBag,
  UtensilsCrossed,
  Globe,
  Briefcase,
  Laptop,
  Package,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { TFunction } from "../../i18n/useTranslation";
import LanguageToggle from "../../components/shared/LanguageToggle";
import { enumLabel } from "../../i18n/labels";
import { CURRENCIES, toCurrency } from "../../utils/currency";
import {
  businessService,
  type IBusinessCategory,
  type BusinessSubType,
} from "../../services/business.service";

/* ─── Types ───────────────────────────────────────────── */
const buildBusinessSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(2, t("newBusiness.nameMin")).max(60),
    type: z.enum(["personal", "company", "mass", "business"]),
  });
type BusinessForm = z.infer<ReturnType<typeof buildBusinessSchema>>;

const ONBOARDING_KEY = "onboarding_draft";

interface BusinessDetails {
  businessType: BusinessSubType | null;
  phone: string;
  address: string;
  currency: string;
  openingBalance: string;
}

interface OnboardingDraft {
  business: BusinessForm;
  selectedCategoryId: string | null;
  customCategory: IBusinessCategory | null;
  businessDetails: BusinessDetails;
}

/* ─── localStorage helpers ────────────────────────────── */
const saveDraft = (draft: Partial<OnboardingDraft>) => {
  const existing = getDraft();
  localStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({ ...existing, ...draft }),
  );
};

const getDraft = (): Partial<OnboardingDraft> => {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const clearDraft = () => localStorage.removeItem(ONBOARDING_KEY);

/* ─── Constants ───────────────────────────────────────── */
const BUSINESS_TYPES = [
  {
    value: "personal" as const,
    labelKey: "businessType.personal",
    subKey: "newBusiness.types.personalSub",
    icon: User,
    accent: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.35)",
  },
  {
    value: "business" as const,
    labelKey: "businessType.business",
    subKey: "newBusiness.types.businessSub",
    icon: Store,
    accent: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.35)",
  },
  {
    value: "company" as const,
    labelKey: "businessType.company",
    subKey: "newBusiness.types.companySub",
    icon: Building2,
    accent: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.35)",
  },
  {
    value: "mass" as const,
    labelKey: "onboarding.householdLabel",
    subKey: "onboarding.householdSub",
    icon: Home,
    accent: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.35)",
  },
];

const BUSINESS_SUB_TYPES: { value: BusinessSubType; icon: any }[] = [
  { value: "retail_shop", icon: ShoppingBag },
  { value: "restaurant", icon: UtensilsCrossed },
  { value: "online_shop", icon: Globe },
  { value: "service_business", icon: Briefcase },
  { value: "freelancer", icon: Laptop },
  { value: "wholesale", icon: Package },
  { value: "other", icon: MoreHorizontal },
];


const STEP_KEYS_DEFAULT = ["newBusiness.steps.business", "newBusiness.steps.category", "newBusiness.steps.done"];
const STEP_KEYS_BUSINESS = ["newBusiness.steps.business", "newBusiness.steps.details", "newBusiness.steps.done"];

const DEFAULT_BUSINESS_DETAILS: BusinessDetails = {
  businessType: null,
  phone: "",
  address: "",
  currency: "BDT",
  openingBalance: "",
};

/* ─── Component ───────────────────────────────────────── */
const OnboardingPage = () => {
  const { t } = useTranslation();
  const businessSchema = useMemo(() => buildBusinessSchema(t), [t]);
  const navigate = useNavigate();

  // ✅ Fix: primitive selector — object reference পরিবর্তন হলেও loop হবে না
  const defaultBusiness = useAuthStore((s) => s.user?.defaultBusiness);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setActiveBusiness = useBusinessStore((s) => s.setActiveBusiness);

  // ✅ Fix: শুধু defaultBusiness (string | undefined) dependency — object নয়
  useEffect(() => {
    if (defaultBusiness) {
      navigate("/dashboard", { replace: true });
    }
  }, [defaultBusiness]); // ✅ navigate বাদ — stable reference, lint warning suppress করো

  const draft = getDraft();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [globalCats, setGlobalCats] = useState<IBusinessCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [customCat, setCustomCat] = useState<IBusinessCategory | null>(
    draft.customCategory ?? null,
  );
  const [selectedCatId, setSelectedCatId] = useState<string | null>(
    draft.selectedCategoryId ?? null,
  );
  const [bizDetails, setBizDetails] = useState<BusinessDetails>(
    draft.businessDetails ?? DEFAULT_BUSINESS_DETAILS,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    defaultValues: draft.business ?? { type: "personal" },
  });

  const selectedType = watch("type");

  const handleTypeChange = (type: BusinessForm["type"]) => {
    setValue("type", type);
    saveDraft({ business: { ...getDraft().business, type } as BusinessForm });
  };

  /* ─── Step 1 → Step 2 ──────────────────────────────── */
  const onStep1Submit = async (data: BusinessForm) => {
    saveDraft({ business: data });
    if (data.type === "business") {
      setStep(2);
      return;
    }
    setLoadingCats(true);
    try {
      const cats = await businessService.getCategories();
      setGlobalCats(
        cats.filter(
          (c: IBusinessCategory & { isGlobal?: boolean }) => c.isGlobal,
        ),
      );
    } catch {
      toast.error(t("newBusiness.loadCategoriesFailed"));
    } finally {
      setLoadingCats(false);
    }
    setStep(2);
  };

  /* ─── Business details (Business Mode) ─────────────── */
  const updateBizDetails = (patch: Partial<BusinessDetails>) => {
    const next = { ...bizDetails, ...patch };
    setBizDetails(next);
    saveDraft({ businessDetails: next });
  };

  /* ─── Category select ──────────────────────────────── */
  const handleSelectCat = (id: string) => {
    const next = selectedCatId === id ? null : id;
    setSelectedCatId(next);
    saveDraft({ selectedCategoryId: next });
  };

  /* ─── Add custom category ──────────────────────────── */
  const handleAddCustomCat = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      const cat = await businessService.createCategory(name);
      setCustomCat(cat);
      setSelectedCatId(cat._id);
      saveDraft({ customCategory: cat, selectedCategoryId: cat._id });
      setNewCatName("");
      toast.success(t("newBusiness.catCreated", { name }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("newBusiness.createCategoryFailed");
      toast.error(message);
    } finally {
      setAddingCat(false);
    }
  };

  /* ─── Finish ───────────────────────────────────────── */
  const handleFinish = async () => {
    const savedDraft = getDraft();
    if (!savedDraft.business) {
      toast.error(t("onboarding.businessInfoMissing"));
      setStep(1);
      return;
    }
    const isBusinessMode = savedDraft.business.type === "business";
    if (isBusinessMode && !bizDetails.businessType) {
      toast.error(t("newBusiness.chooseType"));
      return;
    }

    setSubmitting(true);
    try {
      const business = await businessService.createBusiness({
        name: savedDraft.business.name,
        type: savedDraft.business.type,
        category: savedDraft.selectedCategoryId ?? undefined,
        businessType: isBusinessMode ? bizDetails.businessType! : undefined,
        phone: isBusinessMode ? bizDetails.phone.trim() || undefined : undefined,
        address: isBusinessMode ? bizDetails.address.trim() || undefined : undefined,
        currency: isBusinessMode ? bizDetails.currency : undefined,
        openingBalance: isBusinessMode ? Number(bizDetails.openingBalance) || 0 : undefined,
      });
      await businessService.completeOnboarding();
      if (user && token) {
        setAuth({ ...user, defaultBusiness: business._id, onboardingCompleted: true }, token);
      }
      // Select the freshly created business straight away so the first page the
      // user lands on (dashboard or a deep-link) never renders without one.
      setActiveBusiness(business);

      clearDraft();
      setStep(3);

      setTimeout(() => navigate("/dashboard", { replace: true }), 1600);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("onboarding.setupFailed");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const allCats = customCat
    ? [...globalCats.filter((c) => c._id !== customCat._id), customCat]
    : globalCats;

  const STEP_KEYS = selectedType === "business" ? STEP_KEYS_BUSINESS : STEP_KEYS_DEFAULT;

  /* ─── Render ───────────────────────────────────────── */
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: "var(--bg)",
        // Rendered outside AppLayout, so it carries its own edge-to-edge insets.
        paddingTop: "calc(1.5rem + var(--safe-top))",
        paddingBottom: "calc(1.5rem + var(--safe-bottom))",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-400 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-950" />
            </div>
            <span
              className="font-bold text-xl"
              style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
            >
              {t("app.name")}
            </span>
          </div>
          <LanguageToggle variant="segmented" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEP_KEYS.map((labelKey, i) => {
            const idx = i + 1;
            const done = step > idx;
            const active = step === idx;
            return (
              <div key={labelKey} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                      ${done
                        ? "bg-emerald-500 text-emerald-950"
                        : active
                          ? "bg-emerald-500/20 border border-emerald-500/60 text-emerald-400"
                          : ""
                      }`}
                    style={!done && !active ? { background: "var(--surface-3)", border: "1px solid var(--border-strong)", color: "var(--text-faint)" } : undefined}
                  >
                    {done ? <Check size={13} /> : idx}
                  </div>
                  <span
                    className={`text-sm transition-colors ${done && !active ? "text-emerald-400" : ""}`}
                    style={active ? { color: "var(--text-primary)" } : !done ? { color: "var(--text-faint)" } : undefined}
                  >
                    {t(labelKey)}
                  </span>
                </div>
                {i < STEP_KEYS.length - 1 && (
                  <div
                    className={`w-8 h-px mx-1 ${done ? "bg-emerald-500/50" : ""}`}
                    style={!done ? { background: "var(--surface-7)" } : undefined}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1 ───────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleSubmit(onStep1Submit)}>
            <div
              className="rounded-2xl p-7"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-strong)" }}
            >
              <h2
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
              >
                {t("onboarding.title")}
              </h2>
              <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
                {t("onboarding.subtitle")}
              </p>

              <div className="mb-6">
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  {t("newBusiness.nameLabel")}
                </label>
                <input
                  {...register("name", {
                    onChange: (e) =>
                      saveDraft({
                        business: {
                          ...getDraft().business,
                          name: e.target.value,
                        } as BusinessForm,
                      }),
                  })}
                  placeholder={
                    selectedType === "personal"
                      ? t("onboarding.namePlaceholderPersonal")
                      : selectedType === "mass"
                        ? t("onboarding.namePlaceholderHousehold")
                        : t("onboarding.namePlaceholderCompany")
                  }
                  className={`w-full bg-[var(--surface-3)] border rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-faint)]
                    focus:outline-none focus:ring-2 transition-all text-sm
                    ${errors.name
                      ? "border-red-500/50 focus:ring-red-500/20"
                      : "border-[var(--border-strong)] focus:ring-emerald-500/20 focus:border-emerald-500/40"
                    }`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  {t("newBusiness.typeLabel")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {BUSINESS_TYPES.map(
                    ({ value, labelKey, subKey, icon: Icon, accent, bg, border }) => {
                      const isSelected = selectedType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleTypeChange(value)}
                          className="relative rounded-xl p-4 text-left transition-all duration-200 border"
                          style={{
                            background: isSelected
                              ? bg
                              : "var(--surface-1)",
                            borderColor: isSelected
                              ? border
                              : "var(--border)",
                          }}
                        >
                          {isSelected && (
                            <div
                              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                              style={{ background: accent }}
                            />
                          )}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                            style={{
                              background: isSelected
                                ? `${accent}22`
                                : "var(--surface-4)",
                              color: isSelected ? accent : "var(--text-muted)",
                            }}
                          >
                            <Icon size={15} />
                          </div>
                          <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>
                            {t(labelKey)}
                          </div>
                          <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            {t(subKey)}
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold
                rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-sm group"
            >
              {t("common.continue")}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </form>
        )}

        {/* ── STEP 2 (Business Mode) ──────────────────── */}
        {step === 2 && selectedType === "business" && (
          <div>
            <div
              className="rounded-2xl p-7"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-strong)" }}
            >
              <h2
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
              >
                {t("newBusiness.detailsTitle")}
              </h2>
              <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
                {t("newBusiness.detailsSubtitle")}
              </p>

              <div className="mb-6">
                <label className="block text-sm mb-3" style={{ color: "var(--text-secondary)" }}>{t("newBusiness.whatKind")}</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {BUSINESS_SUB_TYPES.map(({ value, icon: Icon }) => {
                    const isSelected = bizDetails.businessType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateBizDetails({ businessType: value })}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all border"
                        style={{
                          background: isSelected ? "rgba(245,158,11,0.1)" : "var(--surface-2)",
                          borderColor: isSelected ? "rgba(245,158,11,0.45)" : "var(--border)",
                          color: isSelected ? "#f59e0b" : "var(--text-secondary)",
                        }}
                      >
                        <Icon size={15} />
                        {enumLabel(t, "businessSubType", value)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>{t("newBusiness.phoneOptional")}</label>
                  <input
                    value={bizDetails.phone}
                    onChange={(e) => updateBizDetails({ phone: e.target.value })}
                    placeholder={t("customer.phonePlaceholder")}
                    className="w-full bg-[var(--surface-3)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--text-primary)]
                      placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>{t("settings.currency")}</label>
                  <select
                    value={bizDetails.currency}
                    onChange={(e) => updateBizDetails({ currency: toCurrency(e.target.value) })}
                    className="w-full bg-[var(--surface-3)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--text-primary)]
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {t("businessSettings.currencyOption", { code: c, name: t(`currency.${c}`) })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>{t("newBusiness.addressOptional")}</label>
                <input
                  value={bizDetails.address}
                  onChange={(e) => updateBizDetails({ address: e.target.value })}
                  placeholder={t("newBusiness.addressPlaceholder")}
                  className="w-full bg-[var(--surface-3)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--text-primary)]
                    placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>{t("newBusiness.openingBalanceOptional")}</label>
                <input
                  type="number" inputMode="decimal"
                  min="0"
                  value={bizDetails.openingBalance}
                  onChange={(e) => updateBizDetails({ openingBalance: e.target.value })}
                  placeholder={t("common.zero")}
                  className="w-full bg-[var(--surface-3)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--text-primary)]
                    placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-sm"
                />
                <p className="mt-1.5 text-xs" style={{ color: "var(--text-faint)" }}>{t("newBusiness.openingBalanceHint")}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-strong)]
                  text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all text-sm"
              >
                <ArrowLeft size={15} />
                {t("common.back")}
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting || !bizDetails.businessType}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950
                  font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-sm group"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {t("onboarding.finishSetup")}
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 (Category) ───────────────────────── */}
        {step === 2 && selectedType !== "business" && (
          <div>
            <div
              className="rounded-2xl p-7"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-strong)" }}
            >
              <h2
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
              >
                {t("newBusiness.categoryTitle")}
              </h2>
              <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
                {t("onboarding.categorySubtitle")}
              </p>

              {loadingCats ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2
                    size={22}
                    className="animate-spin text-emerald-500"
                  />
                </div>
              ) : (
                <>
                  {allCats.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {t("newBusiness.available")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allCats.map((cat) => {
                          const isSelected = selectedCatId === cat._id;
                          const isCustom = customCat?._id === cat._id;
                          return (
                            <button
                              key={cat._id}
                              type="button"
                              onClick={() => handleSelectCat(cat._id)}
                              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border"
                              style={{
                                background: isSelected
                                  ? "rgba(16,185,129,0.12)"
                                  : "var(--surface-2)",
                                borderColor: isSelected
                                  ? "rgba(16,185,129,0.45)"
                                  : "var(--border)",
                                color: isSelected ? "#10b981" : "var(--text-secondary)",
                              }}
                            >
                              {isSelected ? (
                                <Check size={13} />
                              ) : (
                                <Tag size={13} />
                              )}
                              {cat.name}
                              {isCustom && (
                                <span className="text-[10px] ml-0.5" style={{ color: "var(--text-faint)" }}>
                                  {t("newBusiness.custom")}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!customCat ? (
                    <div>
                      <p className="text-xs mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {t("newBusiness.orCreateOwn")}
                      </p>
                      <div className="flex gap-2">
                        <input
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomCat();
                            }
                          }}
                          placeholder={t("newBusiness.newCatPlaceholder")}
                          className="flex-1 bg-[var(--surface-3)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--text-primary)]
                            placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                            focus:border-emerald-500/40 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCat}
                          disabled={!newCatName.trim() || addingCat}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-500/10
                            border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20
                            disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {addingCat ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Plus size={17} />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Check size={13} className="text-emerald-400" />
                      <span>
                        {t("newBusiness.customCreatedPrefix")}{" "}
                        <span className="text-emerald-400">
                          "{customCat.name}"
                        </span>{" "}
                        {t("newBusiness.customCreatedSuffix")}
                      </span>
                    </div>
                  )}

                  {selectedCatId && (
                    <div className="mt-5 flex items-center gap-2 text-sm text-emerald-400">
                      <Check size={14} />
                      <span>{t("newBusiness.oneSelected")}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-strong)]
                  text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all text-sm"
              >
                <ArrowLeft size={15} />
                {t("common.back")}
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950
                  font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-sm group"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {!selectedCatId ? t("onboarding.skipAndFinish") : t("onboarding.finishSetup")}
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ───────────────────────────────── */}
        {step === 3 && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border-strong)" }}
          >
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <Check size={28} className="text-emerald-400" />
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
            >
              {t("onboarding.allSet")}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("onboarding.takingYou")}
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-7)" }}>
                <div className="h-full bg-emerald-500 rounded-full animate-[progress_1.6s_linear_forwards]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  );
};

export default OnboardingPage;
