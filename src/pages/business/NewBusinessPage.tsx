import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TrendingUp, User, Building2, Home,
  ArrowRight, ArrowLeft, Plus, Check, Tag,
  Loader2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { useBusinessStore } from "../../store/businessStore";
import {
  businessService,
  type IBusinessCategory,
} from "../../services/business.service";

const schema = z.object({
  name: z.string().min(2, "Minimum 2 characters").max(60),
  type: z.enum(["personal", "company", "mass"]),
});
type FormData = z.infer<typeof schema>;

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
    label: "Mess",
    sub: "Shared mess accounting",
    icon: Home,
    accent: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.35)",
  },
];

const STEP_LABELS = ["Business", "Category", "Done"];

const NewBusinessPage = () => {
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();
  const { setActiveBusiness } = useBusinessStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [globalCats, setGlobalCats] = useState<IBusinessCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [customCat, setCustomCat] = useState<IBusinessCategory | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [createdBiz, setCreatedBiz] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "personal" },
  });

  const selectedType = watch("type");

  const onStep1Submit = async (_data: FormData) => {
    setLoadingCats(true);
    try {
      const cats = await businessService.getCategories();
      setGlobalCats(
        cats.filter((c: IBusinessCategory & { isGlobal?: boolean }) => c.isGlobal),
      );
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoadingCats(false);
    }
    setStep(2);
  };

  const handleSelectCat = (id: string) =>
    setSelectedCatId((prev) => (prev === id ? null : id));

  const handleAddCustomCat = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      const cat = await businessService.createCategory(name);
      setCustomCat(cat);
      setSelectedCatId(cat._id);
      setNewCatName("");
      toast.success(`"${name}" created & selected`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to create category");
    } finally {
      setAddingCat(false);
    }
  };

  const handleFinish = async () => {
    const formData = watch();
    if (!formData.name) { toast.error("Business name missing"); setStep(1); return; }

    setSubmitting(true);
    try {
      const business = await businessService.createBusiness({
        name: formData.name,
        type: formData.type,
        category: selectedCatId ?? undefined,
      });

      setCreatedBiz(business);
      setActiveBusiness(business);

      // Set as default if user has none
      if (!user?.defaultBusiness && user && token) {
        setAuth({ ...user, defaultBusiness: business._id }, token);
      }

      setStep(3);
      setTimeout(() => navigate("/dashboard"), 1600);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to create business");
    } finally {
      setSubmitting(false);
    }
  };

  const allCats = customCat
    ? [...globalCats.filter((c) => c._id !== customCat._id), customCat]
    : globalCats;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-400 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-950" />
            </div>
            <span
              className="font-bold text-xl"
              style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
            >
              HisabBoi
            </span>
          </div>
          {step !== 3 && (
            <button
              onClick={() => navigate("/dashboard")}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-faint)",
              }}
            >
              <X size={14} />
            </button>
          )}
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
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`w-8 h-px mx-1 ${done ? "bg-emerald-500/50" : ""}`}
                    style={!done ? { background: "var(--surface-7)" } : undefined}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1 ── */}
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
                New Business
              </h2>
              <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
                Add another business to your account.
              </p>

              <div className="mb-6">
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Business name</label>
                <input
                  {...register("name")}
                  placeholder={
                    selectedType === "personal" ? "Rahim's Personal"
                      : selectedType === "mass" ? "Our Mess"
                        : "Acme Ltd."
                  }
                  className={`w-full bg-[var(--surface-3)] border rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-faint)]
                    focus:outline-none focus:ring-2 transition-all text-sm
                    ${errors.name
                      ? "border-red-500/50 focus:ring-red-500/20"
                      : "border-[var(--border-strong)] focus:ring-emerald-500/20 focus:border-emerald-500/40"
                    }`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Business type</label>
                <div className="grid grid-cols-3 gap-3">
                  {BUSINESS_TYPES.map(({ value, label, sub, icon: Icon, accent, bg, border }) => {
                    const isSelected = selectedType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("type", value)}
                        className="relative rounded-xl p-4 text-left transition-all duration-200 border"
                        style={{
                          background: isSelected ? bg : "var(--surface-1)",
                          borderColor: isSelected ? border : "var(--border)",
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
                            background: isSelected ? `${accent}22` : "var(--surface-4)",
                            color: isSelected ? accent : "var(--text-muted)",
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{label}</div>
                        <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold
                rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-sm group"
            >
              Continue
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div>
            <div
              className="rounded-2xl p-7"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-strong)" }}
            >
              <h2
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
              >
                Choose a category
              </h2>
              <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
                Pick one that fits, or create your own. You can skip.
              </p>

              {loadingCats ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={22} className="animate-spin text-emerald-500" />
                </div>
              ) : (
                <>
                  {allCats.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Available</p>
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
                                background: isSelected ? "rgba(16,185,129,0.12)" : "var(--surface-2)",
                                borderColor: isSelected ? "rgba(16,185,129,0.45)" : "var(--border)",
                                color: isSelected ? "#10b981" : "var(--text-secondary)",
                              }}
                            >
                              {isSelected ? <Check size={13} /> : <Tag size={13} />}
                              {cat.name}
                              {isCustom && (
                                <span className="text-[10px] ml-0.5" style={{ color: "var(--text-faint)" }}>(custom)</span>
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
                        Or create your own
                      </p>
                      <div className="flex gap-2">
                        <input
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); handleAddCustomCat(); }
                          }}
                          placeholder="e.g. Retail, NGO, Freelance..."
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
                          {addingCat ? <Loader2 size={15} className="animate-spin" /> : <Plus size={17} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Check size={13} className="text-emerald-400" />
                      <span>
                        Custom category{" "}
                        <span className="text-emerald-400">"{customCat.name}"</span>{" "}
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
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-strong)]
                  text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all text-sm"
              >
                <ArrowLeft size={15} /> Back
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
                    {!selectedCatId ? "Skip & Create" : "Create Business"}
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
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
              Business Created!
            </h2>
            <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{createdBiz?.name}</span> is ready.
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Going to dashboard...</p>
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

export default NewBusinessPage;
