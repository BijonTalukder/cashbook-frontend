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

const ROLE_META = {
  admin: {
    label: "Admin",
    icon: Shield,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    desc: "Can manage members, transactions & categories",
  },
  member: {
    label: "Member",
    icon: User,
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    desc: "Can view and add transactions",
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
      toast.success(`Welcome to ${result.businessName}!`);
      // after 2s go to dashboard
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed";
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
      toast.error("Failed to decline");
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
      style={{ background: "#0a0f1e" }}
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
            className="text-white font-bold text-xl"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            HisabBoi
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
            <p className="text-sm" style={{ color: "#475569" }}>
              Loading invitation...
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
              className="text-xl font-bold text-white text-center mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Invitation Not Found
            </h2>
            <p
              className="text-xs text-center mb-6"
              style={{ color: "#475569" }}
            >
              This invitation link is invalid or doesn't exist.
            </p>
            <Link
              to="/login"
              className="block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Back to Login
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
              className="text-xl font-bold text-white text-center mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Invitation Expired
            </h2>
            <p
              className="text-xs text-center mb-6"
              style={{ color: "#475569" }}
            >
              This invitation link has expired. Ask your team admin to send a
              new one.
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
              className="text-xl font-bold text-white text-center mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Already Responded
            </h2>
            <p
              className="text-xs text-center mb-6"
              style={{ color: "#475569" }}
            >
              This invitation has already been accepted or declined.
            </p>
            <Link
              to="/dashboard"
              className="block w-full py-3 rounded-xl text-sm font-semibold text-center"
              style={{ background: "#10b981", color: "#022c22" }}
            >
              Go to Dashboard
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
              className="text-xl font-bold text-white text-center mb-1"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              You're Invited!
            </h2>
            <p
              className="text-sm text-center mb-1"
              style={{ color: "#94a3b8" }}
            >
              <strong style={{ color: "#fff" }}>
                {inviter?.firstName} {inviter?.lastName}
              </strong>{" "}
              invited you to
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
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p className="text-xs" style={{ color: "#64748b" }}>
                You need to{" "}
                <strong style={{ color: "#94a3b8" }}>
                  log in or create an account
                </strong>{" "}
                to accept this invitation. Make sure to use the email this
                invite was sent to.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/login?redirect=/invite/${token}`}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-center transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              >
                Log In
              </Link>
              <Link
                to={`/register?redirect=/invite/${token}`}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-1.5"
                style={{ background: "#10b981", color: "#022c22" }}
              >
                Register <ArrowRight size={14} />
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
              <p className="text-xs mb-1" style={{ color: "#475569" }}>
                <strong style={{ color: "#94a3b8" }}>
                  {inviter?.firstName} {inviter?.lastName}
                </strong>{" "}
                invited you to join
              </p>
              <h2
                className="text-2xl font-bold text-white mb-1"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {business?.name}
              </h2>
              <span
                className="inline-block text-xs px-2.5 py-1 rounded-lg capitalize"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "#64748b",
                }}
              >
                {business?.type}
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
                    Role: {roleMeta.label}
                  </p>
                  <p className="text-xs" style={{ color: "#64748b" }}>
                    {roleMeta.desc}
                  </p>
                </div>
              </div>
            )}

            {/* Logged in as */}
            <div
              className="rounded-xl p-3 mb-6 flex items-center gap-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
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
              <p className="text-xs flex-1" style={{ color: "#64748b" }}>
                Accepting as{" "}
                <span style={{ color: "#94a3b8" }}>{user?.email}</span>
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
                <X size={15} /> Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
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
                    <Check size={15} /> Accept & Join
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
              className="text-xl font-bold text-white text-center mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Welcome Aboard!
            </h2>
            <p
              className="text-xs text-center mb-2"
              style={{ color: "#475569" }}
            >
              You've joined{" "}
              <strong style={{ color: "#10b981" }}>{business?.name}</strong>
            </p>
            <p className="text-xs text-center" style={{ color: "#334155" }}>
              Redirecting to dashboard...
            </p>
            <div
              className="mt-5 h-1 w-full rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.05)" }}
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
              className="text-xl font-bold text-white text-center mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Invitation Declined
            </h2>
            <p
              className="text-xs text-center mb-6"
              style={{ color: "#475569" }}
            >
              You've declined the invitation to join{" "}
              <strong style={{ color: "#94a3b8" }}>{business?.name}</strong>.
            </p>
            <Link
              to="/dashboard"
              className="block w-full py-3 rounded-xl text-sm font-semibold text-center"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Go to Dashboard
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
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
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
