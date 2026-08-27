import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  TrendingUp,
  Building2,
  Shield,
  User,
  Check,
  X,
  Loader2,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import {
  invitationService,
  type IInvitationDetail,
} from "../../services/invitation.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { enumLabel } from "../../i18n/labels";

const ROLE_META = {
  admin: {
    labelKey: "role.admin",
    icon: Shield,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    descKey: "invite.adminDesc",
  },
  member: {
    labelKey: "role.member",
    icon: User,
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    descKey: "invite.memberDesc",
  },
};

type ViewState =
  | "loading"
  | "not-found"
  | "expired"
  | "already-used"
  | "need-login"
  | "ready"
  | "accepted"
  | "declined";

const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { setActiveBusiness } = useBusinessStore();
  const { t } = useTranslation();

  const [state, setState] = useState<ViewState>("loading");
  const [invitation, setInvitation] = useState<IInvitationDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ── Load invitation ──────────────────────────────── */
  useEffect(() => {
    if (!token) {
      setState("not-found");
      return;
    }

    invitationService
      .getByToken(token)
      .then((data) => {
        setInvitation(data);
        // if user not logged in
        if (!user) {
          setState("need-login");
          return;
        }
        setState("ready");
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "";
        if (msg.includes("expired")) {
          setState("expired");
          return;
        }
        if (msg.includes("accepted") || msg.includes("declined")) {
          setState("already-used");
          return;
        }
        setState("not-found");
      });
  }, [token, user]);

  /* ── Accept ───────────────────────────────────────── */
  const handleAccept = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const result = await invitationService.accept(token);
      setState("accepted");
      toast.success(t("invite.welcomeToast", { business: result.businessName }));
      // after 2s go to dashboard
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("invite.acceptFailed");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Decline ──────────────────────────────────────── */
  const handleDecline = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await invitationService.decline(token);
      setState("declined");
    } catch {
      toast.error(t("invite.declineFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const business = invitation?.business as
    | { name: string; type: string }
    | undefined;
  const inviter = invitation?.invitedBy as
    | { firstName: string; lastName: string }
    | undefined;
  const roleMeta = invitation ? ROLE_META[invitation.role] : null;
  const RoleIcon = roleMeta?.icon ?? User;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: "var(--bg)",
        paddingTop: "calc(1.5rem + var(--safe-top))",
        paddingBottom: "calc(1.5rem + var(--safe-bottom))",
      }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 bg-emerald-400 rounded-lg flex items-center justify-center">
            <TrendingUp size={18} className="text-emerald-950" />
          </div>
          <span
            className="font-bold text-xl"
            style={{
              fontFamily: "'DM Serif Display', serif",
              color: "var(--text-primary)",
            }}
          >
            {t("app.name")}
          </span>
        </div>

        {/* ── Loading ─────────────────────────────── */}
        {state === "loading" && (
          <div className="text-center py-16">
            <Loader2
              size={28}
              className="animate-spin mx-auto mb-4"
              style={{ color: "#10b981" }}
            />
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              {t("invite.loading")}
            </p>
          </div>
        )}

        {/* ── Not found ───────────────────────────── */}
        {state === "not-found" && (
          <Card>
            <StatusIcon
              icon={AlertCircle}
              color="#ef4444"
              bg="rgba(239,68,68,0.1)"
            />
            <h2
              className="text-xl font-bold text-center mb-2"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-primary)",
              }}
            >
              {t("invite.notFound")}
            </h2>
            <p
              className="text-xs text-center mb-6"
              style={{ color: "var(--text-faint)" }}
            >
              {t("invite.notFoundDesc")}
            </p>
            <Link
              to="/login"
              className="block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all"
              style={{
                background: "var(--surface-3)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {t("invite.backToLogin")}
            </Link>
          </Card>
        )}

        {/* ── Expired ─────────────────────────────── */}
        {state === "expired" && (
          <Card>
            <StatusIcon
              icon={Clock}
              color="#f59e0b"
              bg="rgba(245,158,11,0.1)"
            />
            <h2
              className="text-xl font-bold text-center mb-2"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-primary)",
              }}
            >
              {t("invite.expired")}
            </h2>
            <p
              className="text-xs text-center mb-6"
              style={{ color: "var(--text-faint)" }}
            >
              {t("invite.expiredDesc")}
            </p>
          </Card>
        )}

        {/* ── Already used ────────────────────────── */}
        {state === "already-used" && (
          <Card>
            <StatusIcon
              icon={Check}
              color="#10b981"
              bg="rgba(16,185,129,0.1)"
            />
            <h2
              className="text-xl font-bold text-center mb-2"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-primary)",
              }}
            >
              {t("invite.alreadyResponded")}
            </h2>
            <p
              className="text-xs text-center mb-6"
              style={{ color: "var(--text-faint)" }}
            >
              {t("invite.alreadyRespondedDesc")}
            </p>
            <Link
              to="/dashboard"
              className="block w-full py-3 rounded-xl text-sm font-semibold text-center"
              style={{ background: "#10b981", color: "#022c22" }}
            >
              {t("invite.goToDashboard")}
            </Link>
          </Card>
        )}

        {/* ── Need login ──────────────────────────── */}
        {state === "need-login" && invitation && (
          <Card>
            <StatusIcon
              icon={RoleIcon}
              color={roleMeta?.color ?? "#10b981"}
              bg={roleMeta?.bg ?? ""}
            />
            <h2
              className="text-xl font-bold text-center mb-1"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-primary)",
              }}
            >
              {t("invite.youreInvited")}
            </h2>
            <p
              className="text-sm text-center mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              <strong style={{ color: "var(--text-primary)" }}>
                {inviter?.firstName} {inviter?.lastName}
              </strong>{" "}
              {t("invite.invitedYouTo")}
            </p>
            <p
              className="text-lg font-bold text-center mb-6"
              style={{ color: "#10b981" }}
            >
              {business?.name}
            </p>
            <div
              className="rounded-xl p-4 mb-6 text-center"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("invite.needLoginPrefix")}{" "}
                <strong style={{ color: "var(--text-secondary)" }}>
                  {t("invite.needLoginBold")}
                </strong>{" "}
                {t("invite.needLoginSuffix")}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/login?redirect=/invite/${token}`}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-center transition-all"
                style={{
                  background: "var(--surface-4)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              >
                {t("invite.logIn")}
              </Link>
              <Link
                to={`/register?redirect=/invite/${token}`}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-1.5"
                style={{ background: "#10b981", color: "#022c22" }}
              >
                {t("invite.register")} <ArrowRight size={14} />
              </Link>
            </div>
          </Card>
        )}

        {/* ── Ready to accept ─────────────────────── */}
        {state === "ready" && invitation && (
          <Card>
            {/* Business info */}
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.15)",
                }}
              >
                <Building2 size={28} style={{ color: "#10b981" }} />
              </div>
              <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>
                <strong style={{ color: "var(--text-secondary)" }}>
                  {inviter?.firstName} {inviter?.lastName}
                </strong>{" "}
                {t("invite.invitedYouToJoin")}
              </p>
              <h2
                className="text-2xl font-bold mb-1"
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  color: "var(--text-primary)",
                }}
              >
                {business?.name}
              </h2>
              <span
                className="inline-block text-xs px-2.5 py-1 rounded-lg"
                style={{
                  background: "var(--surface-3)",
                  color: "var(--text-muted)",
                }}
              >
                {enumLabel(t, "businessType", business?.type)}
              </span>
            </div>

            {/* Role card */}
            {roleMeta && (
              <div
                className="rounded-xl p-4 mb-6 flex items-center gap-3"
                style={{
                  background: `${roleMeta.color}08`,
                  border: `1px solid ${roleMeta.color}25`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: roleMeta.bg }}
                >
                  <RoleIcon size={18} style={{ color: roleMeta.color }} />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: roleMeta.color }}
                  >
                    {t("invite.roleLine", { role: t(roleMeta.labelKey) })}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t(roleMeta.descKey)}
                  </p>
                </div>
              </div>
            )}

            {/* Logged in as */}
            <div
              className="rounded-xl p-3 mb-6 flex items-center gap-2"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #10b981, #0d9488)",
                }}
              >
                <span className="text-[10px] font-bold text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <p className="text-xs flex-1" style={{ color: "var(--text-muted)" }}>
                {t("invite.acceptingAs")}{" "}
                <span style={{ color: "var(--text-secondary)" }}>{user?.email}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  color: "#f87171",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <X size={15} /> {t("invite.decline")}
              </button>
              <button
                onClick={handleAccept}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold press"
                style={{
                  background: "#10b981",
                  color: "#022c22",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <Check size={15} /> {t("invite.acceptAndJoin")}
                  </>
                )}
              </button>
            </div>
          </Card>
        )}

        {/* ── Accepted ────────────────────────────── */}
        {state === "accepted" && (
          <Card>
            <StatusIcon
              icon={Check}
              color="#10b981"
              bg="rgba(16,185,129,0.1)"
            />
            <h2
              className="text-xl font-bold text-center mb-2"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-primary)",
              }}
            >
              {t("invite.welcomeAboard")}
            </h2>
            <p
              className="text-xs text-center mb-2"
              style={{ color: "var(--text-faint)" }}
            >
              {t("invite.youveJoined")}{" "}
              <strong style={{ color: "#10b981" }}>{business?.name}</strong>
            </p>
            <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
              {t("invite.redirecting")}
            </p>
            <div
              className="mt-5 h-1 w-full rounded-full overflow-hidden"
              style={{ background: "var(--surface-3)" }}
            >
              <div className="h-full bg-emerald-500 rounded-full animate-[progress_2s_linear_forwards]" />
            </div>
          </Card>
        )}

        {/* ── Declined ────────────────────────────── */}
        {state === "declined" && (
          <Card>
            <StatusIcon icon={X} color="#ef4444" bg="rgba(239,68,68,0.1)" />
            <h2
              className="text-xl font-bold text-center mb-2"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-primary)",
              }}
            >
              {t("invite.declined")}
            </h2>
            <p
              className="text-xs text-center mb-6"
              style={{ color: "var(--text-faint)" }}
            >
              {t("invite.declinedDescPrefix")}{" "}
              <strong style={{ color: "var(--text-secondary)" }}>{business?.name}</strong>.
            </p>
            <Link
              to="/dashboard"
              className="block w-full py-3 rounded-xl text-sm font-semibold text-center"
              style={{
                background: "var(--surface-3)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {t("invite.goToDashboard")}
            </Link>
          </Card>
        )}
      </div>

      <style>{`
        @keyframes progress { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  );
};

/* ─── Helper components ───────────────────────────────── */
const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    className="rounded-2xl p-6"
    style={{
      background: "var(--surface-1)",
      border: "1px solid var(--border)",
    }}
  >
    {children}
  </div>
);

const StatusIcon = ({
  icon: Icon,
  color,
  bg,
}: {
  icon: any;
  color: string;
  bg: string;
}) => (
  <div
    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
    style={{ background: bg, border: `1px solid ${color}25` }}
  >
    <Icon size={26} style={{ color }} />
  </div>
);

export default InvitePage;
