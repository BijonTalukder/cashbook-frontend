import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.firstName}!`);

      // ✅ Fix: defaultBusiness আছে কিনা দেখে navigate করো
      // GuestRoute এও handle করা আছে, কিন্তু explicit navigate better UX
      if (res.data.user?.defaultBusiness) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Login failed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#0a0f1e] to-[#0a0f1e]" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, #059669 0%, transparent 40%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg, transparent, transparent 40px, #10b98120 40px, #10b98120 41px
              ), repeating-linear-gradient(
                90deg, transparent, transparent 40px, #10b98120 40px, #10b98120 41px
              )`,
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-emerald-400 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-950" />
            </div>
            <span
              className="text-white font-bold text-xl tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              CashBook
            </span>
          </div>

          <h1
            className="text-5xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Track every
            <br />
            <span className="text-emerald-400">taka</span>,<br />
            effortlessly.
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Manage your personal finances, team expenses, and household budgets
            — all in one place.
          </p>
        </div>

        <div className="relative z-10 flex gap-8">
          {[
            { value: "৳2.4M", label: "Tracked monthly" },
            { value: "12K+", label: "Active users" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                className="text-2xl font-bold text-emerald-400"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {stat.value}
              </div>
              <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-950" />
            </div>
            <span
              className="text-white font-bold text-lg"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              CashBook
            </span>
          </div>

          <h2
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Sign in
          </h2>
          <p className="text-slate-500 mb-8">
            New here?{" "}
            <Link
              to="/register"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Create an account
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 
                  focus:outline-none focus:ring-2 transition-all text-sm
                  ${
                    errors.email
                      ? "border-red-500/50 focus:ring-red-500/20"
                      : "border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                  }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 
                    focus:outline-none focus:ring-2 transition-all text-sm
                    ${
                      errors.password
                        ? "border-red-500/50 focus:ring-red-500/20"
                        : "border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed 
                text-emerald-950 font-semibold rounded-xl py-3 flex items-center justify-center gap-2 
                transition-all duration-200 text-sm mt-2 group"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-8">
            By signing in you agree to our{" "}
            <span className="text-slate-500 cursor-pointer hover:text-slate-400">
              Terms
            </span>{" "}
            &{" "}
            <span className="text-slate-500 cursor-pointer hover:text-slate-400">
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
