import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowRight, AlertCircle, TrendingUp, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../services/auth.service";
import { logAnalyticsEvent } from "../../config/firebase";
import { useTranslation } from "../../i18n/useTranslation";
import type { TFunction } from "../../i18n/useTranslation";
import LanguageToggle from "../../components/shared/LanguageToggle";

type Step = "email" | "otp" | "password";
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const buildEmailSchema = (t: TFunction) =>
  z.object({
    email: z.string().email(t("auth.validation.emailRequired")),
  });

const buildPasswordSchema = (t: TFunction) =>
  z
    .object({
      password: z.string().min(8, t("auth.validation.passwordMin")),
      confirm: z.string().min(1, t("auth.validation.passwordRequired")),
    })
    .refine((data) => data.password === data.confirm, {
      message: t("auth.passwordsNoMatch"),
      path: ["confirm"],
    });

type EmailFormData = z.infer<ReturnType<typeof buildEmailSchema>>;
type PasswordFormData = z.infer<ReturnType<typeof buildPasswordSchema>>;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const emailSchema = useMemo(() => buildEmailSchema(t), [t]);
  const passwordSchema = useMemo(() => buildPasswordSchema(t), [t]);

  const emailForm = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const otpValue = otp.join("");
  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : 2;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const showError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const extractError = (err: unknown): string => {
    const axiosError = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return (
      axiosError.response?.data?.message ||
      axiosError.message ||
      t("auth.loginFailed")
    );
  };

  const startResendCooldown = () => setCooldown(RESEND_SECONDS);

  const requestCode = async (targetEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword({ email: targetEmail });
      setEmail(targetEmail);
      setStep("otp");
      setOtp(Array(OTP_LENGTH).fill(""));
      startResendCooldown();
      otpRefs.current[0]?.focus();
    } catch (err: unknown) {
      showError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = (data: EmailFormData) => requestCode(data.email.trim());

  const onResend = async () => {
    if (loading || cooldown > 0 || !email) return;
    await requestCode(email);
  };

  const verifyCode = async () => {
    if (loading || otpValue.length !== OTP_LENGTH) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authService.verifyOtp({ email, otp: otpValue });
      setResetToken(res.data.resetToken);
      setStep("password");
      passwordForm.reset({ password: "", confirm: "" });
    } catch (err: unknown) {
      showError(extractError(err));
      setOtp(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword({ resetToken, password: data.password });
      logAnalyticsEvent("reset_password");
      toast.success(t("auth.resetSuccess"));
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      showError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setOtp((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }
    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < digits.length && index + i < OTP_LENGTH; i++) {
        next[index + i] = digits[i];
      }
      return next;
    });
    const target = Math.min(index + digits.length, OTP_LENGTH - 1);
    otpRefs.current[target]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const goBackToEmail = () => {
    setStep("email");
    setError(null);
    setOtp(Array(OTP_LENGTH).fill(""));
    setResetToken("");
  };

  const stepLabels = [t("auth.stepEmail"), t("auth.stepCode"), t("auth.stepNewPassword")];

  const inputClass = (invalid: boolean) =>
    `w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600
     focus:outline-none focus:ring-2 transition-all text-sm
     ${
       invalid
         ? "border-red-500/50 focus:ring-red-500/20"
         : "border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500/40"
     }`;

  return (
    <div className="min-h-screen bg-[#0a0f1e] relative flex items-center justify-center p-6">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#0a0f1e] to-[#0a0f1e]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #059669 0%, transparent 40%)`,
          }}
        />
      </div>

      <div
        className="relative z-10 w-full max-w-md"
        style={{
          paddingTop: "var(--safe-top)",
          paddingBottom: "var(--safe-bottom)",
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-950" />
            </div>
            <span
              className="text-white font-bold text-lg tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {t("app.name")}
            </span>
          </div>
          <LanguageToggle variant="segmented" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {stepLabels.map((label, index) => (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center border transition-colors ${
                    index < stepIndex
                      ? "bg-emerald-500 border-emerald-500 text-emerald-950"
                      : index === stepIndex
                        ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-400"
                        : "bg-white/5 border-white/10 text-slate-500"
                  }`}
                >
                  {index < stepIndex ? <Check size={12} /> : index + 1}
                </span>
                <span
                  className={`text-xs hidden sm:inline ${
                    index === stepIndex ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {label}
                </span>
              </div>
              {index < stepLabels.length - 1 && (
                <div className="h-px flex-1 bg-white/10" />
              )}
            </div>
          ))}
        </div>

        <h2
          className="text-3xl font-bold text-white mb-2"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {step === "email"
            ? t("auth.forgotTitle")
            : step === "otp"
              ? t("auth.verifyCode")
              : t("auth.newPassword")}
        </h2>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          {step === "email"
            ? t("auth.forgotSubtitle")
            : step === "otp"
              ? t("auth.codeSentTo", { email })
              : t("auth.resetSubtitle", { email })}
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-400" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {step === "email" && (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                {t("auth.emailAddress")}
              </label>
              <input
                {...emailForm.register("email")}
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder={t("auth.emailPlaceholder")}
                className={inputClass(!!emailForm.formState.errors.email)}
              />
              {emailForm.formState.errors.email && (
                <p className="mt-1.5 text-xs text-red-400">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed
                text-emerald-950 font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2
                text-sm group press"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
              ) : (
                <>
                  {t("auth.sendCode")}
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <p className="text-slate-600 text-xs leading-relaxed border border-white/5 bg-white/[0.02] rounded-xl p-3.5">
              {t("auth.googleOnlyHint")}
            </p>
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-5">
            <div className="flex gap-2 justify-between" dir="ltr">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onFocus={(e) => e.target.select()}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={OTP_LENGTH}
                  aria-label={`${t("auth.enterOtp")} ${index + 1}`}
                  className="w-11 h-13 sm:w-12 sm:h-14 bg-white/5 border border-white/10 rounded-xl text-white
                    text-center text-lg font-semibold focus:outline-none focus:ring-2
                    focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={verifyCode}
              disabled={loading || otpValue.length !== OTP_LENGTH}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed
                text-emerald-950 font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2
                text-sm group press"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
              ) : (
                <>
                  {t("auth.verifyCode")}
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={goBackToEmail}
                className="text-slate-500 hover:text-slate-300 flex items-center gap-1 press"
              >
                <ArrowLeft size={13} />
                {t("auth.changeEmail")}
              </button>
              <button
                type="button"
                onClick={onResend}
                disabled={loading || cooldown > 0}
                className="text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 disabled:cursor-not-allowed press"
              >
                {cooldown > 0
                  ? t("auth.resendIn", { seconds: cooldown })
                  : loading
                    ? t("auth.sending")
                    : t("auth.resendCode")}
              </button>
            </div>
          </div>
        )}

        {step === "password" && (
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                {t("auth.newPassword")}
              </label>
              <div className="relative">
                <input
                  {...passwordForm.register("password")}
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  enterKeyHint="next"
                  placeholder={t("auth.passwordPlaceholder")}
                  className={`${inputClass(!!passwordForm.formState.errors.password)} pr-14`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 press"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordForm.formState.errors.password && (
                <p className="mt-1.5 text-xs text-red-400">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                {t("auth.confirmPassword")}
              </label>
              <input
                {...passwordForm.register("confirm")}
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                enterKeyHint="go"
                placeholder={t("auth.passwordPlaceholder")}
                className={inputClass(!!passwordForm.formState.errors.confirm)}
              />
              {passwordForm.formState.errors.confirm && (
                <p className="mt-1.5 text-xs text-red-400">
                  {passwordForm.formState.errors.confirm.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed
                text-emerald-950 font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2
                text-sm group press"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
              ) : (
                <>
                  {t("auth.resetPassword")}
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 mt-8">
          <Link
            to="/login"
            className="text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
