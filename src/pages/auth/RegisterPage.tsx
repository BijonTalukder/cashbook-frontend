import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  ArrowRight,
  TrendingUp,
  User,
  Building2,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../services/auth.service";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { TFunction } from "../../i18n/useTranslation";
import LanguageToggle from "../../components/shared/LanguageToggle";

const buildSchema = (t: TFunction) =>
  z.object({
    firstName: z.string().min(1, t("auth.validation.firstNameRequired")).max(50),
    lastName: z.string().min(1, t("auth.validation.lastNameRequired")).max(50),
    email: z.string().email(t("auth.validation.emailRequired")),
    password: z.string().min(8, t("auth.validation.passwordMin")),
    businessType: z.enum(["personal", "company", "mass"]),
  });

type FormData = z.infer<ReturnType<typeof buildSchema>>;

const BUSINESS_TYPES = [
  {
    value: "personal" as const,
    labelKey: "auth.types.personal",
    descriptionKey: "auth.types.personalDesc",
    icon: User,
    color: "emerald",
  },
  {
    value: "company" as const,
    labelKey: "auth.types.company",
    descriptionKey: "auth.types.companyDesc",
    icon: Building2,
    color: "blue",
  },
  {
    value: "mass" as const,
    labelKey: "auth.types.household",
    descriptionKey: "auth.types.householdDesc",
    icon: Home,
    color: "violet",
  },
];

const colorMap = {
  emerald: {
    selected: "border-emerald-500/60 bg-emerald-500/10",
    icon: "bg-emerald-500/20 text-emerald-400",
    dot: "bg-emerald-400",
  },
  blue: {
    selected: "border-blue-500/60 bg-blue-500/10",
    icon: "bg-blue-500/20 text-blue-400",
    dot: "bg-blue-400",
  },
  violet: {
    selected: "border-violet-500/60 bg-violet-500/10",
    icon: "bg-violet-500/20 text-violet-400",
    dot: "bg-violet-400",
  },
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // ✅
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { businessType: "personal" },
  });

  const selectedType = watch("businessType");

  // Pre-warm the backend immediately so cold start is resolved before form submission
  useEffect(() => {
    void api.get("/health", { timeout: 30000 }).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload: FormData = {
        ...data,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
      };

      const res = await authService.register(payload);

      // ✅ token সহ setAuth
      setAuth(res.data.user, res.data.token);
      toast.success(t("auth.welcome", { name: res.data.user.firstName }));

      // ✅ redirect param থাকলে সেখানে যাও (invite flow)
      const redirect = searchParams.get("redirect");
      if (redirect) {
        navigate(redirect, { replace: true });
      } else {
        // নতুন user — onboarding এ পাঠাও
        navigate("/onboarding", { replace: true });
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("auth.registrationFailed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6"
      style={{
        // Edge-to-edge: the form must clear the status bar and the gesture bar.
        paddingTop: "calc(1.5rem + var(--safe-top))",
        paddingBottom: "calc(1.5rem + var(--safe-bottom))",
      }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-400 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-950" />
            </div>
            <span
              className="text-white font-bold text-xl tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {t("app.name")}
            </span>
          </div>
          <LanguageToggle variant="segmented" />
        </div>

        <h2
          className="text-3xl font-bold text-white mb-1"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {t("auth.createAccount")}
        </h2>
        <p className="text-slate-500 mb-8">
          {t("auth.alreadyHaveOne")}{" "}
          <Link
            to={`/login${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`}
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {t("auth.signIn")}
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                {t("auth.firstName")}
              </label>
              <input
                {...register("firstName")}
                autoComplete="given-name"
                autoCapitalize="words"
                enterKeyHint="next"
                placeholder={t("auth.firstNamePlaceholder")}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 
                  focus:outline-none focus:ring-2 transition-all text-sm
                  ${errors.firstName ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500/40"}`}
              />
              {errors.firstName && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                {t("auth.lastName")}
              </label>
              <input
                {...register("lastName")}
                autoComplete="family-name"
                autoCapitalize="words"
                enterKeyHint="next"
                placeholder={t("auth.lastNamePlaceholder")}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 
                  focus:outline-none focus:ring-2 transition-all text-sm
                  ${errors.lastName ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500/40"}`}
              />
              {errors.lastName && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              {t("auth.emailAddress")}
            </label>
            <input
              {...register("email")}
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              placeholder={t("auth.emailPlaceholder")}
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 
                focus:outline-none focus:ring-2 transition-all text-sm
                ${errors.email ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500/40"}`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              {t("auth.password")}
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                enterKeyHint="next"
                placeholder={t("auth.passwordHint")}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-14 text-white placeholder-slate-600 
                  focus:outline-none focus:ring-2 transition-all text-sm
                  ${errors.password ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500/40"}`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? t("auth.hidePassword") : t("auth.showPassword")}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 press"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Business type */}
          <div>
            <label className="block text-sm text-slate-400 mb-3">
              {t("auth.accountType")}
            </label>
            {/* Three across a 360dp screen leaves ~58px of text width, which is
                narrower than the word "management" — the descriptions spilled out
                of their cards. Stack them into full-width rows on phones and keep
                the three-up grid from `sm` upward. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {BUSINESS_TYPES.map(
                ({ value, labelKey, descriptionKey, icon: Icon, color }) => {
                  const isSelected = selectedType === value;
                  const colors = colorMap[color as keyof typeof colorMap];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue("businessType", value)}
                      className={`relative border rounded-xl p-3.5 sm:p-4 text-left press
                      flex items-center gap-3 sm:block
                      ${isSelected ? colors.selected : "border-white/10 bg-white/5 hover:border-white/20"}`}
                    >
                      {isSelected && (
                        <div
                          className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${colors.dot}`}
                        />
                      )}
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 sm:mb-3 ${isSelected ? colors.icon : "bg-white/10 text-slate-400"}`}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-sm font-medium mb-0.5">
                          {t(labelKey)}
                        </div>
                        <div className="text-slate-500 text-xs leading-relaxed">
                          {t(descriptionKey)}
                        </div>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed 
              text-emerald-950 font-semibold rounded-xl py-3 flex items-center justify-center gap-2 
              transition-all duration-200 text-sm group mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
            ) : (
              <>
                {t("auth.createAccount")}
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          {t("auth.termsRegister")}{" "}
          <Link to="/privacy-policy" className="text-slate-500 hover:text-slate-400">
            {t("auth.terms")}
          </Link>{" "}
          {t("auth.and")}{" "}
          <Link to="/privacy-policy" className="text-slate-500 hover:text-slate-400">
            {t("auth.privacyPolicy")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
