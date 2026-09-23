import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Building2, Lock, LogOut, Trash2, ChevronRight,
  Check, Loader2, Eye, EyeOff, Camera, Shield,
  Bell, Palette, Globe, CreditCard, AlertTriangle,
  Home, X, Store, Send, Facebook, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { useBusinessStore } from "../../store/businessStore";
import api from "../../services/api";
import ThemeToggle from "../../components/shared/ThemeToggle";
import LanguageToggle from "../../components/shared/LanguageToggle";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { enumLabel } from "../../i18n/labels";
import {
  TELEGRAM_URL,
  TELEGRAM_HANDLE,
  FACEBOOK_URL,
  FACEBOOK_HANDLE,
} from "../../config/links";

/* ─── Design tokens ───────────────────────────────────── */
const C = {
  bg: "var(--bg)",
  sidebar: "var(--bg-sidebar)",
  card: "var(--surface-1)",
  border: "var(--border)",
  input: "var(--surface-2)",
  hover: "var(--surface-2)",
};

/* ─── Helpers ─────────────────────────────────────────── */
const inputCls = (err?: boolean) => ({
  width: "100%",
  background: C.input,
  border: `1px solid ${err ? "#f87171" : "var(--border-strong)"}`,
  borderRadius: "12px",
  padding: "10px 14px",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
} as React.CSSProperties);

/* ─── Section Header ──────────────────────────────────── */
const SectionHead = ({ icon: Icon, title, desc }: {
  icon: React.ElementType;
  title: string;
  desc?: string;
}) => (
  <div className="flex items-center gap-3 mb-5">
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
    >
      <Icon size={16} />
    </div>
    <div>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
      {desc && <p className="text-xs" style={{ color: "var(--text-faint)" }}>{desc}</p>}
    </div>
  </div>
);

/* ─── Profile Section ─────────────────────────────────── */
const ProfileSection = () => {
  const { user, setAuth, token } = useAuthStore();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const handleSave = async () => {
    if (!firstName.trim()) { toast.error(t("settings.profile.firstNameRequired")); return; }
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/profile", { firstName, lastName });
      setAuth(data.data, token!);
      toast.success(t("settings.profile.updated"));
    } catch {
      toast.error(t("settings.profile.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <SectionHead icon={User} title={t("settings.profile.title")} desc={t("settings.profile.desc")} />

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
          >
            {initials}
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: "#10b981" }}
          >
            <Camera size={10} className="text-emerald-950" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>{user?.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            {t("settings.profile.firstName")}
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inputCls()}
            placeholder={t("settings.profile.firstNamePlaceholder")}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(16,185,129,0.4)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border-strong)"; }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            {t("settings.profile.lastName")}
          </label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inputCls()}
            placeholder={t("settings.profile.lastNamePlaceholder")}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(16,185,129,0.4)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border-strong)"; }}
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
          {t("common.email")}
        </label>
        <input
          value={user?.email ?? ""}
          disabled
          style={{ ...inputCls(), opacity: 0.5, cursor: "not-allowed" }}
        />
        <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
          {t("settings.profile.emailLocked")}
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold press disabled:opacity-60"
        style={{ background: "#10b981", color: "#022c22" }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {t("common.saveChanges")}
      </button>
    </div>
  );
};

/* ─── Password Section ────────────────────────────────── */
const PasswordSection = () => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!current) e.current = t("settings.password.required");
    if (!next) e.next = t("settings.password.required");
    if (next.length < 8) e.next = t("settings.password.min8");
    if (next !== confirm) e.confirm = t("settings.password.mismatch");
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleChange = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: current,
        newPassword: next,
      });
      toast.success(t("settings.password.changed"));
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? t("settings.password.changeFailed");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const PwField = ({
    label, value, onChange, show, onToggle, name,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    name: string;
  }) => (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputCls(!!errors[name]), paddingRight: "40px" }}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(16,185,129,0.4)"; }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = errors[name] ? "#f87171" : "var(--border-strong)"; }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg"
          style={{ color: "var(--text-faint)", width: "36px", height: "36px" }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {errors[name] && (
        <p className="text-[11px] mt-1" style={{ color: "#f87171" }}>{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <SectionHead icon={Lock} title={t("settings.password.title")} desc={t("settings.password.desc")} />

      <div className="space-y-3 mb-4">
        <PwField
          label={t("settings.password.current")} value={current}
          onChange={setCurrent} show={showCur}
          onToggle={() => setShowCur((p) => !p)} name="current"
        />
        <PwField
          label={t("settings.password.new")} value={next}
          onChange={setNext} show={showNew}
          onToggle={() => setShowNew((p) => !p)} name="next"
        />
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            {t("settings.password.confirm")}
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={inputCls(!!errors.confirm)}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(16,185,129,0.4)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = errors.confirm ? "#f87171" : "var(--border-strong)"; }}
          />
          {errors.confirm && (
            <p className="text-[11px] mt-1" style={{ color: "#f87171" }}>{errors.confirm}</p>
          )}
        </div>
      </div>

      <button
        onClick={handleChange}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold press disabled:opacity-60"
        style={{ background: "var(--surface-4)", border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
        {t("settings.password.update")}
      </button>
    </div>
  );
};

/* ─── Business Settings ───────────────────────────────── */
const BusinessSection = () => {
  const { activeBusiness } = useBusinessStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currency } = useFormat();

  const TYPE_META = {
    personal: { icon: User, color: "#10b981" },
    company: { icon: Building2, color: "#3b82f6" },
    mass: { icon: Home, color: "#8b5cf6" },
    business: { icon: Store, color: "#f59e0b" },
  };

  if (!activeBusiness) {
    return (
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <SectionHead icon={Building2} title={t("settings.business.title")} desc={t("settings.business.desc")} />
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>{t("settings.business.none")}</p>
      </div>
    );
  }

  const meta = TYPE_META[activeBusiness.type];
  const Icon = meta.icon;

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <SectionHead icon={Building2} title={t("settings.business.title")} desc={t("settings.business.desc")} />

      {/* Active business card */}
      <div
        className="rounded-xl p-4 mb-4 flex items-center gap-3"
        style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}20` }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.color}18`, color: meta.color }}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{activeBusiness.name}</p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            {t("settings.business.typeAndCurrency", {
              type: enumLabel(t, "businessType", activeBusiness.type),
              currency,
            })}
          </p>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase"
          style={{ background: `${meta.color}15`, color: meta.color }}
        >
          {t("settings.business.active")}
        </span>
      </div>

      {/* Quick links */}
      {(activeBusiness.type === "business"
        ? [
          { label: t("nav.businessSettings"), to: "/business/settings", icon: Building2 },
          { label: t("settings.business.manageMembers"), to: "/members", icon: User },
          { label: t("nav.ledger"), to: "/ledger", icon: CreditCard },
        ]
        : [
          { label: t("settings.business.manageMembers"), to: "/members", icon: User },
          { label: t("settings.business.allTransactions"), to: "/transactions", icon: CreditCard },
        ]
      ).map(({ label, to, icon: LIcon }) => (
        <button
          key={to}
          onClick={() => navigate(to)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2 transition-all"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-light)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.hover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-1)"; }}
        >
          <div className="flex items-center gap-2.5">
            <LIcon size={14} style={{ color: "var(--text-muted)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
          </div>
          <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
        </button>
      ))}
    </div>
  );
};

/* ─── Preferences Section ─────────────────────────────── */
const PreferencesSection = () => {
  const { t } = useTranslation();
  const { currency } = useFormat();
  const [notifs, setNotifs] = useState(true);

  const Toggle = ({
    label, desc, value, onChange,
  }: {
    label: string;
    desc: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between py-3 text-left"
      style={{ borderBottom: "1px solid var(--border-light)" }}
    >
      <div>
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>{desc}</p>
      </div>
      <span
        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all pointer-events-none"
        style={{ background: value ? "#10b981" : "var(--surface-7)" }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all"
          style={{ transform: value ? "translateX(20px)" : "translateX(0)" }}
        />
      </span>
    </button>
  );

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <SectionHead icon={Palette} title={t("settings.preferences.title")} desc={t("settings.preferences.desc")} />

      {/* Appearance / language */}
      <div className="mb-3 space-y-2">
        <ThemeToggle variant="row" />
        <LanguageToggle variant="row" />
      </div>

      <Toggle
        label={t("settings.preferences.pushNotifications")}
        desc={t("settings.preferences.pushDesc")}
        value={notifs}
        onChange={(v) => {
          setNotifs(v);
          toast.success(v ? t("settings.preferences.notificationsOn") : t("settings.preferences.notificationsOff"));
        }}
      />

      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>{t("settings.currency")}</p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("settings.currencyDesc")}</p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <Globe size={12} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--text-primary)" }}>{currency}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Support & Feedback ──────────────────────────────── */
const SupportSection = () => {
  const { t } = useTranslation();

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <SectionHead
        icon={Send}
        title={t("settings.supportSection.title")}
        desc={t("settings.supportSection.desc")}
      />

      <div className="space-y-3">
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all press"
          style={{ background: "rgba(56,151,222,0.08)", border: "1px solid rgba(56,151,222,0.2)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(56,151,222,0.15)", color: "#3897de" }}
          >
            <Send size={16} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("settings.supportSection.telegramTitle")}
            </p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              {t("settings.supportSection.telegramDesc")}
            </p>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#3897de" }}>
              {TELEGRAM_HANDLE}
            </p>
          </div>
          <ExternalLink size={14} style={{ color: "var(--text-faint)" }} />
        </a>

        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all press"
          style={{ background: "rgba(24,119,242,0.08)", border: "1px solid rgba(24,119,242,0.2)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(24,119,242,0.15)", color: "#1877f2" }}
          >
            <Facebook size={16} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("settings.supportSection.facebookTitle")}
            </p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              {t("settings.supportSection.facebookDesc")}
            </p>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#1877f2" }}>
              {FACEBOOK_HANDLE}
            </p>
          </div>
          <ExternalLink size={14} style={{ color: "var(--text-faint)" }} />
        </a>
      </div>
    </div>
  );
};

/* ─── Danger Zone ─────────────────────────────────────── */
const DELETE_TOKEN = "DELETE";

const DangerZone = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    toast.success(t("settings.danger.loggedOut"));
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== DELETE_TOKEN) {
      toast.error(t("settings.danger.typeDelete"));
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/auth/account");
      logout();
      navigate("/login", { replace: true });
      toast.success(t("settings.danger.deleted"));
    } catch {
      toast.error(t("settings.danger.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}
    >
      <SectionHead icon={AlertTriangle} title={t("settings.danger.title")} desc={t("settings.danger.desc")} />

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2 transition-all"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-light)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-4)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-1)"; }}
      >
        <div className="flex items-center gap-2.5">
          <LogOut size={14} style={{ color: "#f59e0b" }} />
          <span className="text-sm" style={{ color: "#fbbf24" }}>{t("settings.danger.signOut")}</span>
        </div>
        <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
      </button>

      {/* Delete account */}
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"; }}
        >
          <div className="flex items-center gap-2.5">
            <Trash2 size={14} style={{ color: "#ef4444" }} />
            <span className="text-sm" style={{ color: "#f87171" }}>{t("settings.danger.deleteAccount")}</span>
          </div>
          <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
        </button>
      ) : (
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
              {t("settings.danger.deleteAccountQuestion")}
            </p>
            <button
              onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
              className="p-2 -m-2 rounded-lg flex items-center justify-center"
            >
              <X size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {t("settings.danger.deleteWarning", { token: DELETE_TOKEN })}
          </p>
          <input
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder={t("settings.danger.deletePlaceholder")}
            style={{ ...inputCls(!!deleteInput && deleteInput !== DELETE_TOKEN), marginBottom: "12px" }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
              className="flex-1 py-2 rounded-xl text-sm"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || deleteInput !== DELETE_TOKEN}
              className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {t("common.delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Settings Page ──────────────────────────────── */
type SettingsTab = "profile" | "business" | "security" | "preferences" | "support" | "danger";

const TABS: { id: SettingsTab; labelKey: string; icon: React.ElementType }[] = [
  { id: "profile", labelKey: "settings.tabs.profile", icon: User },
  { id: "business", labelKey: "settings.tabs.business", icon: Building2 },
  { id: "security", labelKey: "settings.tabs.security", icon: Shield },
  { id: "preferences", labelKey: "settings.tabs.preferences", icon: Bell },
  { id: "support", labelKey: "settings.tabs.support", icon: Send },
  { id: "danger", labelKey: "settings.tabs.danger", icon: AlertTriangle },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { t } = useTranslation();

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 lg:py-8">

        {/* ── Header ──────────────────────────────────── */}
        <div className="mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
          >
            {t("settings.title")}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            {t("settings.subtitle")}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">

          {/* ── Sidebar tabs (desktop) / Pills (mobile) ── */}
          <div className="lg:w-48 flex-shrink-0">
            {/* Mobile: horizontal scroll pills */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
              {TABS.map(({ id, labelKey, icon: Icon }) => {
                const isActive = activeTab === id;
                const isDanger = id === "danger";
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium flex-shrink-0 transition-all"
                    style={{
                      background: isActive
                        ? isDanger ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)"
                        : C.card,
                      border: `1px solid ${isActive
                        ? isDanger ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"
                        : C.border}`,
                      color: isActive
                        ? isDanger ? "#ef4444" : "#10b981"
                        : "var(--text-muted)",
                    }}
                  >
                    <Icon size={12} />
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>

            {/* Desktop: vertical sidebar */}
            <div
              className="hidden lg:block rounded-2xl overflow-hidden sticky top-8"
              style={{ background: C.sidebar, border: `1px solid ${C.border}` }}
            >
              {TABS.map(({ id, labelKey, icon: Icon }, i) => {
                const isActive = activeTab === id;
                const isDanger = id === "danger";
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-all"
                    style={{
                      background: isActive
                        ? isDanger ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)"
                        : "transparent",
                      color: isActive
                        ? isDanger ? "#ef4444" : "#10b981"
                        : "var(--text-muted)",
                      fontWeight: isActive ? 500 : 400,
                      borderBottom: i < TABS.length - 1 ? "1px solid var(--border-light)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.background = C.hover;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <Icon size={15} />
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Content ──────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {activeTab === "profile" && <ProfileSection />}
            {activeTab === "business" && <BusinessSection />}
            {activeTab === "security" && <PasswordSection />}
            {activeTab === "preferences" && <PreferencesSection />}
            {activeTab === "support" && <SupportSection />}
            {activeTab === "danger" && <DangerZone />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
