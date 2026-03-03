import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TrendingUp,
  User,
  Building2,
  Home,
  ArrowRight,
  ArrowLeft,
  Plus,
  Check,
  Tag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import {
  businessService,
  type IBusinessCategory,
} from "../../services/business.service";

/* ─── Types ───────────────────────────────────────────── */
const businessSchema = z.object({
  name: z.string().min(2, "Minimum 2 characters").max(60),
  type: z.enum(["personal", "company", "mass"]),
});
type BusinessForm = z.infer<typeof businessSchema>;

const ONBOARDING_KEY = "onboarding_draft";

interface OnboardingDraft {
  business: BusinessForm;
  selectedCategoryId: string | null;
  customCategory: IBusinessCategory | null;
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
    label: "Personal",
    sub: "Track your own finances",
    icon: User,
    accent: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.35)",
  },
  {
    value: "company" as const,
    label: "Company",
    sub: "Manage team expenses",
    icon: Building2,
    accent: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.35)",
  },
  {
    value: "mass" as const,
    label: "Household",
    sub: "Family budget & meals",
    icon: Home,
    accent: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.35)",
  },
];

const STEP_LABELS = ["Business", "Category", "Done"];

/* ─── Component ───────────────────────────────────────── */
const OnboardingPage = () => {
  const navigate = useNavigate();

  // ✅ Fix: primitive selector — object reference পরিবর্তন হলেও loop হবে না
  const defaultBusiness = useAuthStore((s) => s.user?.defaultBusiness);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

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
    setLoadingCats(true);
    try {
      const cats = await businessService.getCategories();
      setGlobalCats(
        cats.filter(
          (c: IBusinessCategory & { isGlobal?: boolean }) => c.isGlobal,
        ),
      );
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoadingCats(false);
    }
    setStep(2);
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
      toast.success(`"${name}" created & selected`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create category";
      toast.error(message);
    } finally {
      setAddingCat(false);
    }
  };

  /* ─── Finish ───────────────────────────────────────── */
  const handleFinish = async () => {
    const savedDraft = getDraft();
    if (!savedDraft.business) {
      toast.error("Business info missing, please go back");
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const business = await businessService.createBusiness({
        name: savedDraft.business.name,
        type: savedDraft.business.type,
        category: savedDraft.selectedCategoryId ?? undefined,
      });
      await businessService.completeOnboarding();
      if (user && token) {
        setAuth({ ...user, defaultBusiness: business._id, onboardingCompleted: true }, token);
      }

      clearDraft();
      setStep(3);
      // ✅ useEffect will auto-navigate when defaultBusiness updates in store
      // setTimeout fallback in case useEffect doesn't fire fast enough
      setTimeout(() => navigate("/dashboard", { replace: true }), 1600);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Setup failed, please try again";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const allCats = customCat
    ? [...globalCats.filter((c) => c._id !== customCat._id), customCat]
    : globalCats;

  /* ─── Render ───────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-6">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-emerald-400 rounded-lg flex items-center justify-center">
            <TrendingUp size={18} className="text-emerald-950" />
          </div>
          <span
            className="text-white font-bold text-xl"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            CashBook
          </span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEP_LABELS.map((label, i) => {
            const idx = i + 1;
            const done = step > idx;
            const active = step === idx;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                      ${done
                        ? "bg-emerald-500 text-emerald-950"
                        : active
                          ? "bg-emerald-500/20 border border-emerald-500/60 text-emerald-400"
                          : "bg-white/5 border border-white/10 text-slate-600"
                      }`}
                  >
                    {done ? <Check size={13} /> : idx}
                  </div>
                  <span
                    className={`text-sm transition-colors ${active
                      ? "text-white"
                      : done
                        ? "text-emerald-400"
                        : "text-slate-600"
                      }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`w-8 h-px mx-1 ${done ? "bg-emerald-500/50" : "bg-white/10"}`}
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
              className="rounded-2xl border border-white/10 p-7"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <h2
                className="text-2xl font-bold text-white mb-1"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Set up your business
              </h2>
              <p className="text-slate-500 text-sm mb-7">
                Every account starts with one business. You can add more later.
              </p>

              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">
                  Business name
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
                      ? "Rahim's Personal"
                      : selectedType === "mass"
                        ? "Our Home"
                        : "Acme Ltd."
                  }
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600
                    focus:outline-none focus:ring-2 transition-all text-sm
                    ${errors.name
                      ? "border-red-500/50 focus:ring-red-500/20"
                      : "border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                    }`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-3">
                  Business type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {BUSINESS_TYPES.map(
                    ({ value, label, sub, icon: Icon, accent, bg, border }) => {
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
                              : "rgba(255,255,255,0.03)",
                            borderColor: isSelected
                              ? border
                              : "rgba(255,255,255,0.08)",
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
                                : "rgba(255,255,255,0.06)",
                              color: isSelected ? accent : "#64748b",
                            }}
                          >
                            <Icon size={15} />
                          </div>
                          <div className="text-white text-sm font-medium mb-0.5">
                            {label}
                          </div>
                          <div className="text-slate-500 text-xs leading-relaxed">
                            {sub}
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
              Continue
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </form>
        )}

        {/* ── STEP 2 ───────────────────────────────── */}
        {step === 2 && (
          <div>
            <div
              className="rounded-2xl border border-white/10 p-7"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <h2
                className="text-2xl font-bold text-white mb-1"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Choose a category
              </h2>
              <p className="text-slate-500 text-sm mb-7">
                Pick one that fits your business, or create your own. You can
                skip.
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
                      <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
                        Available
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
                                  : "rgba(255,255,255,0.04)",
                                borderColor: isSelected
                                  ? "rgba(16,185,129,0.45)"
                                  : "rgba(255,255,255,0.08)",
                                color: isSelected ? "#10b981" : "#94a3b8",
                              }}
                            >
                              {isSelected ? (
                                <Check size={13} />
                              ) : (
                                <Tag size={13} />
                              )}
                              {cat.name}
                              {isCustom && (
                                <span className="text-[10px] text-slate-600 ml-0.5">
                                  (custom)
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
                      <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
                        Or create your own
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
                          placeholder="e.g. Retail, NGO, Freelance..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white
                            placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
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
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Check size={13} className="text-emerald-400" />
                      <span>
                        Custom category{" "}
                        <span className="text-emerald-400">
                          "{customCat.name}"
                        </span>{" "}
                        created
                      </span>
                    </div>
                  )}

                  {selectedCatId && (
                    <div className="mt-5 flex items-center gap-2 text-sm text-emerald-400">
                      <Check size={14} />
                      <span>1 category selected</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10
                  text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm"
              >
                <ArrowLeft size={15} />
                Back
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
                    {!selectedCatId ? "Skip & Finish" : "Finish Setup"}
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
            className="rounded-2xl border border-white/10 p-10 text-center"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <Check size={28} className="text-emerald-400" />
            </div>
            <h2
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              You're all set!
            </h2>
            <p className="text-slate-500 text-sm">
              Taking you to your dashboard...
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
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