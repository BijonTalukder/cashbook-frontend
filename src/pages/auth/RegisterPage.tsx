import { useState } from "react";
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
import { useAuthStore } from "../../store/authStore";

const schema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Minimum 8 characters"),
  businessType: z.enum(["personal", "company", "mass"]),
});

type FormData = z.infer<typeof schema>;

const BUSINESS_TYPES = [
  {
    value: "personal" as const,
    label: "Personal",
    description: "Individual finance tracking",
    icon: User,
    color: "emerald",
  },
  {
    value: "company" as const,
    label: "Company",
    description: "Team & business expenses",
    icon: Building2,
    color: "blue",
  },
  {
    value: "mass" as const,
    label: "Household",
    description: "Family & meal management",
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

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authService.register(data);

      // ✅ token সহ setAuth — empty string না
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome, ${res.data.user.firstName}!`);

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
          ?.message ?? "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
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

        <h2
          className="text-3xl font-bold text-white mb-1"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Create account
        </h2>
        <p className="text-slate-500 mb-8">
          Already have one?{" "}
          <Link
            to={`/login${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`}
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                First name
              </label>
              <input
                {...register("firstName")}
                placeholder="Rahim"
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
                Last name
              </label>
              <input
                {...register("lastName")}
                placeholder="Uddin"
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
              Email address
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
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
              Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPass ? "text" : "password"}
                placeholder="Min. 8 characters"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 
                  focus:outline-none focus:ring-2 transition-all text-sm
                  ${errors.password ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500/40"}`}
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

          {/* Business type */}
          <div>
            <label className="block text-sm text-slate-400 mb-3">
              Account type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {BUSINESS_TYPES.map(
                ({ value, label, description, icon: Icon, color }) => {
                  const isSelected = selectedType === value;
                  const colors = colorMap[color as keyof typeof colorMap];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue("businessType", value)}
                      className={`relative border rounded-xl p-4 text-left transition-all duration-200
                      ${isSelected ? colors.selected : "border-white/10 bg-white/5 hover:border-white/20"}`}
                    >
                      {isSelected && (
                        <div
                          className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${colors.dot}`}
                        />
                      )}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${isSelected ? colors.icon : "bg-white/10 text-slate-400"}`}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="text-white text-sm font-medium mb-0.5">
                        {label}
                      </div>
                      <div className="text-slate-500 text-xs leading-relaxed">
                        {description}
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
                Create account
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          By registering you agree to our{" "}
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
  );
};

export default RegisterPage;
