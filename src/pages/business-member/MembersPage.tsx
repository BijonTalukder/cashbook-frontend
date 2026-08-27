import { useEffect, useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Crown,
  Shield,
  User,
  Trash2,
  ChevronDown,
  Loader2,
  X,
  Check,
  Copy,
  RefreshCw,
  AlertCircle,
  MessageCircle,
  Share2,
  Clock,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import { useAuthStore } from "../../store/authStore";
import { businessMembersService } from "../../services/businessMembers.service";
import {
  invitationService,
  type IInvitationDetail,
} from "../../services/invitation.service";
import type { IMember } from "../../services/transaction.service";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { plural } from "../../i18n/labels";
import {
  canShareNative,
  copyToClipboard,
  shareNative,
  shareViaWhatsApp,
} from "../../utils/share";
// import {
//   businessMembersService,
//   type IMember,
// } from "../../services/businessMembers.service";

/* ─── Design tokens ───────────────────────────────────── */
const C = {
  bg: "var(--bg)",
  card: "var(--surface-1)",
  cardHover: "var(--surface-3)",
  border: "var(--border)",
  input: "var(--surface-2)",
  inputBorder: "var(--border-strong)",
};

/* ─── Role config ─────────────────────────────────────── */
const ROLES = {
  owner: {
    labelKey: "role.owner",
    icon: Crown,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  admin: {
    labelKey: "role.admin",
    icon: Shield,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
  },
  member: {
    labelKey: "role.member",
    icon: User,
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
  },
};

type Role = keyof typeof ROLES;

/* ─── Avatar ──────────────────────────────────────────── */
const Avatar = ({
  firstName,
  lastName,
  size = 10,
}: {
  firstName: string;
  lastName: string;
  size?: number;
}) => (
  <div
    className={`w-${size} h-${size} rounded-xl flex items-center justify-center flex-shrink-0`}
    style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
  >
    <span
      className="font-bold text-white"
      style={{ fontSize: size <= 8 ? "10px" : "13px" }}
    >
      {firstName[0]}
      {lastName[0]}
    </span>
  </div>
);

/* ─── Invite link sharing ─────────────────────────────── */
/**
 * Invite emails don't always arrive (SMTP outages, spam filters), so every
 * invite link is also copyable / shareable straight from the app.
 */
const useShareInvite = (link: string, businessName: string) => {
  const { t } = useTranslation();

  const message = t("members.shareMessage", {
    business: businessName,
    link,
  });

  const copy = async () => {
    if (!link) return;
    const ok = await copyToClipboard(link);
    if (ok) toast.success(t("members.linkCopied"));
    else toast.error(t("members.copyFailed"));
  };

  const whatsapp = () => {
    if (!link) return;
    shareViaWhatsApp(message);
  };

  const share = async () => {
    if (!link) return;
    const shared = await shareNative({
      title: t("members.shareSubject", { business: businessName }),
      text: message,
    });
    if (!shared && !canShareNative()) await copy();
  };

  return { copy, whatsapp, share, message };
};

const ShareInviteLink = ({
  link,
  businessName,
  compact = false,
}: {
  link: string;
  businessName: string;
  compact?: boolean;
}) => {
  const { t } = useTranslation();
  const { copy, whatsapp, share } = useShareInvite(link, businessName);

  const actionStyle = {
    background: C.input,
    border: `1px solid ${C.inputBorder}`,
    color: "var(--text-secondary)",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={copy}
          title={t("members.copyLink")}
          className="w-7 h-7 flex items-center justify-center rounded-lg press"
          style={actionStyle}
        >
          <Copy size={12} />
        </button>
        <button
          onClick={whatsapp}
          title={t("members.shareWhatsApp")}
          className="w-7 h-7 flex items-center justify-center rounded-lg press"
          style={{
            background: "rgba(37,211,102,0.1)",
            border: "1px solid rgba(37,211,102,0.25)",
            color: "#25d366",
          }}
        >
          <MessageCircle size={12} />
        </button>
        {canShareNative() && (
          <button
            onClick={share}
            title={t("members.share")}
            className="w-7 h-7 flex items-center justify-center rounded-lg press"
            style={actionStyle}
          >
            <Share2 size={12} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2"
        style={{ background: C.input, border: `1px solid ${C.inputBorder}` }}
      >
        <Link2
          size={13}
          className="flex-shrink-0"
          style={{ color: "var(--text-faint)" }}
        />
        <p
          className="flex-1 text-xs truncate text-left"
          style={{ color: "var(--text-muted)" }}
        >
          {link}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={copy}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium press"
          style={actionStyle}
        >
          <Copy size={13} />
          {t("members.copyLink")}
        </button>
        <button
          onClick={whatsapp}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium press"
          style={{
            background: "rgba(37,211,102,0.12)",
            border: "1px solid rgba(37,211,102,0.3)",
            color: "#25d366",
          }}
        >
          <MessageCircle size={13} />
          {t("members.shareWhatsApp")}
        </button>
        {canShareNative() && (
          <button
            onClick={share}
            className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium press"
            style={actionStyle}
          >
            <Share2 size={13} />
            {t("members.shareOther")}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Invite Modal ────────────────────────────────────── */
const InviteModal = ({
  open,
  onClose,
  onSuccess,
  businessId,
  businessName,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
  businessName: string;
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [emailSent, setEmailSent] = useState(true);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error(t("members.enterEmail"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t("members.invalidEmail"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await businessMembersService.invite(
        businessId,
        email.trim(),
        role,
      );
      const delivered = result.emailSent !== false;
      setInviteLink(result.inviteLink ?? "");
      setEmailSent(delivered);
      setSent(true);
      if (delivered) toast.success(t("members.invitationSent"));
      else toast.warning(t("members.emailFailedToast"));
      onSuccess();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("members.invitationFailed");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("member");
    setSent(false);
    setInviteLink("");
    setEmailSent(true);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      style={{ background: "var(--overlay-scrim)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: `1px solid ${C.border}` }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.1)" }}
            >
              <UserPlus size={15} style={{ color: "#10b981" }} />
            </div>
            <h2
              className="text-base font-semibold"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-primary)",
              }}
            >
              {t("members.inviteMember")}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg -mr-1.5"
            style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5">
          {!sent ? (
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label
                  className="block text-xs mb-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("auth.emailAddress")}
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-faint)" }}
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleInvite();
                    }}
                    placeholder={t("members.emailPlaceholder")}
                    type="email"
                    style={{
                      width: "100%",
                      background: C.input,
                      border: `1px solid ${C.inputBorder}`,
                      borderRadius: "12px",
                      padding: "10px 14px 10px 36px",
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label
                  className="block text-xs mb-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("common.type")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["member", "admin"] as const).map((r) => {
                    const rc = ROLES[r];
                    const RoleIcon = rc.icon;
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className="flex items-center gap-2.5 px-3 py-3 rounded-xl transition-all text-left"
                        style={{
                          background: isSelected ? `${rc.color}12` : C.input,
                          border: `1px solid ${isSelected ? `${rc.color}40` : C.inputBorder}`,
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isSelected
                              ? rc.bg
                              : "var(--surface-3)",
                          }}
                        >
                          <RoleIcon
                            size={13}
                            style={{ color: isSelected ? rc.color : "var(--text-faint)" }}
                          />
                        </div>
                        <div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" }}
                          >
                            {t(rc.labelKey)}
                          </p>
                          <p
                            className="text-[10px]"
                            style={{ color: "var(--text-faint)" }}
                          >
                            {r === "admin" ? t("members.adminAccess") : t("members.memberAccess")}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="ml-auto">
                            <Check size={13} style={{ color: rc.color }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleInvite}
                disabled={submitting || !email.trim()}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 press"
                style={{
                  background: "#10b981",
                  color: "#022c22",
                  opacity: submitting || !email.trim() ? 0.6 : 1,
                }}
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={15} />
                    {t("members.sendInvitation")}
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: emailSent
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(245,158,11,0.1)",
                  border: `1px solid ${
                    emailSent
                      ? "rgba(16,185,129,0.2)"
                      : "rgba(245,158,11,0.25)"
                  }`,
                }}
              >
                {emailSent ? (
                  <Check size={24} style={{ color: "#10b981" }} />
                ) : (
                  <AlertCircle size={24} style={{ color: "#f59e0b" }} />
                )}
              </div>
              <p
                className="text-lg font-bold mb-1"
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  color: "var(--text-primary)",
                }}
              >
                {emailSent
                  ? t("members.invitationSentTitle")
                  : t("members.emailFailedTitle")}
              </p>
              <p className="text-xs mb-5" style={{ color: "var(--text-faint)" }}>
                {emailSent ? (
                  <>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {email}
                    </span>{" "}
                    {t("members.willReceiveEmail")}
                  </>
                ) : (
                  t("members.emailFailedHint")
                )}
              </p>

              {inviteLink && (
                <div className="mb-5">
                  <p
                    className="text-xs mb-2 text-left"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {emailSent
                      ? t("members.orShareLink")
                      : t("members.shareLinkInstead")}
                  </p>
                  <ShareInviteLink
                    link={inviteLink}
                    businessName={businessName}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                    setInviteLink("");
                    setEmailSent(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    background: C.input,
                    border: `1px solid ${C.inputBorder}`,
                    color: "var(--text-secondary)",
                  }}
                >
                  {t("members.inviteAnother")}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    color: "#10b981",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  {t("common.done")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Role dropdown ───────────────────────────────────── */
const RoleDropdown = ({
  currentRole,
  memberId,
  businessId,
  onUpdate,
  disabled,
}: {
  currentRole: Role;
  memberId: string;
  businessId: string;
  onUpdate: () => void;
  disabled: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleChange = async (newRole: "admin" | "member") => {
    if (newRole === currentRole) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      await businessMembersService.updateRole(businessId, memberId, newRole);
      toast.success(t("members.roleUpdated"));
      onUpdate();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("members.roleUpdateFailed");
      toast.error(message);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  if (currentRole === "owner") {
    const rc = ROLES.owner;
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
        style={{ background: rc.bg }}
      >
        <Crown size={11} style={{ color: rc.color }} />
        <span className="text-xs font-medium" style={{ color: rc.color }}>
          {t(rc.labelKey)}
        </span>
      </div>
    );
  }

  const rc = ROLES[currentRole];
  const RcIcon = rc.icon;

  return (
    <div className="relative">
      <button
        disabled={disabled || loading}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all"
        style={{ background: rc.bg }}
      >
        {loading ? (
          <Loader2
            size={11}
            className="animate-spin"
            style={{ color: rc.color }}
          />
        ) : (
          <RcIcon size={11} style={{ color: rc.color }} />
        )}
        <span className="text-xs font-medium" style={{ color: rc.color }}>
          {t(rc.labelKey)}
        </span>
        {!disabled && <ChevronDown size={10} style={{ color: rc.color }} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 w-36 rounded-xl overflow-hidden z-50"
            style={{
              background: "var(--bg-elevated)",
              border: `1px solid ${C.border}`,
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            {(["admin", "member"] as const).map((r) => {
              const ro = ROLES[r];
              const RoIcon = ro.icon;
              return (
                <button
                  key={r}
                  onClick={() => handleChange(r)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-all"
                  style={{
                    background:
                      r === currentRole ? `${ro.color}10` : "transparent",
                    color: r === currentRole ? ro.color : "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (r !== currentRole)
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    if (r !== currentRole)
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                  }}
                >
                  <RoIcon size={12} />
                  {t(ro.labelKey)}
                  {r === currentRole && <Check size={11} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Member Row ──────────────────────────────────────── */
const MemberRow = ({
  member,
  isOwner,
  currentUserId,
  businessId,
  onRemove,
  onUpdate,
}: {
  member: IMember;
  isOwner: boolean;
  currentUserId: string;
  businessId: string;
  onRemove: (m: IMember) => void;
  onUpdate: () => void;
}) => {
  const { t } = useTranslation();
  const isSelf = member._id === currentUserId;
  const canEdit = isOwner && !isSelf && member.role !== "owner";

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 transition-all group"
      style={{ borderBottom: `1px solid var(--border-light)` }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "var(--surface-1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {/* Avatar */}
      <Avatar
        firstName={member.firstName}
        lastName={member.lastName}
        size={10}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {member.firstName} {member.lastName}
          </p>
          {isSelf && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
            >
              {t("members.you")}
            </span>
          )}
        </div>
        <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>
          {member.email}
        </p>
      </div>

      {/* Role */}
      <RoleDropdown
        currentRole={member.role as Role}
        memberId={member._id}
        businessId={businessId}
        onUpdate={onUpdate}
        disabled={!canEdit}
      />

      {/* Remove */}
      {canEdit && (
        <button
          onClick={() => onRemove(member)}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all opacity-0 group-hover:opacity-100"
          style={{ color: "var(--text-muted)", background: "var(--surface-3)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#ef4444";
            (e.currentTarget as HTMLElement).style.background =
              "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.background =
              "var(--surface-3)";
          }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
};

/* ─── Pending invitation row ──────────────────────────── */
const PendingInviteRow = ({
  invite,
  businessName,
  canManage,
  onCancel,
}: {
  invite: IInvitationDetail;
  businessName: string;
  canManage: boolean;
  onCancel: (invite: IInvitationDetail) => void;
}) => {
  const { t } = useTranslation();
  const { date: fmtDate } = useFormat();
  const rc = ROLES[invite.role as Role] ?? ROLES.member;
  const RcIcon = rc.icon;

  return (
    <div
      className="flex items-center gap-3 px-5 py-3"
      style={{ borderTop: `1px solid ${C.border}` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--surface-3)" }}
      >
        <Mail size={14} style={{ color: "var(--text-faint)" }} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="text-sm truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {invite.email}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: rc.bg, color: rc.color }}
          >
            <RcIcon size={9} />
            {t(rc.labelKey)}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
            {t("members.expiresOn", { date: fmtDate(invite.expiresAt) })}
          </span>
        </div>
      </div>

      {invite.inviteLink && (
        <ShareInviteLink
          link={invite.inviteLink}
          businessName={businessName}
          compact
        />
      )}

      {canManage && (
        <button
          onClick={() => onCancel(invite)}
          title={t("members.cancelInvite")}
          className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-all"
          style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#ef4444";
            (e.currentTarget as HTMLElement).style.background =
              "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.background =
              "var(--surface-3)";
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};

/* ─── Members Page ────────────────────────────────────── */
const MembersPage = () => {
  const { activeBusiness } = useBusinessStore();
  const currentUserId = useAuthStore((s) => s.user?._id ?? "");
  const currentUserRole = useAuthStore((s) => s.user?.role ?? "");
  const { t } = useTranslation();
  const { num } = useFormat();

  const [members, setMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<IMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<IInvitationDetail[]>([]);

  // check if current user is owner or admin
  const myMember = members.find((m) => m._id === currentUserId);
  const isOwner = myMember?.role === "owner";
  const isAdmin = myMember?.role === "admin";
  const canInvite = isOwner || isAdmin;

  const fetchMembers = useCallback(async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const data = await businessMembersService.getMembers(activeBusiness._id);
      setMembers(data);
    } catch {
      toast.error(t("members.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, t]);

  /** Pending invites carry the shareable link, so a failed email is recoverable. */
  const fetchPendingInvites = useCallback(async () => {
    if (!activeBusiness || !canInvite) {
      setPendingInvites([]);
      return;
    }
    try {
      const data = await invitationService.getSent(activeBusiness._id);
      setPendingInvites(data.filter((i) => i.status === "pending"));
    } catch {
      // non-fatal — the members list is still usable without it
      setPendingInvites([]);
    }
  }, [activeBusiness, canInvite]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetchPendingInvites();
  }, [fetchPendingInvites]);

  const handleCancelInvite = async (invite: IInvitationDetail) => {
    try {
      await invitationService.cancel(invite._id);
      toast.success(t("members.inviteCancelled"));
      fetchPendingInvites();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("members.cancelFailed");
      toast.error(message);
    }
  };

  const handleRemove = async () => {
    if (!removing || !activeBusiness) return;
    setRemoveLoading(true);
    try {
      await businessMembersService.remove(activeBusiness._id, removing._id);
      toast.success(t("members.removed", { name: removing.firstName }));
      setRemoving(null);
      fetchMembers();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("members.removeFailed");
      toast.error(message);
    } finally {
      setRemoveLoading(false);
    }
  };

  const ownerCount = members.filter((m) => m.role === "owner").length;
  const adminCount = members.filter((m) => m.role === "admin").length;
  const memberCount = members.filter((m) => m.role === "member").length;
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 lg:py-8 space-y-5">
        {/* ── Header ──────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-primary)",
              }}
            >
              {t("members.title")}
            </h1>
            {activeBusiness && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                {plural(t, "members.subtitle", members.length, {
                  business: activeBusiness.name,
                  count: num(members.length),
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchMembers();
                fetchPendingInvites();
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                color: "var(--text-muted)",
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            {canInvite && (
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium press"
                style={{ background: "#10b981", color: "#022c22" }}
              >
                <UserPlus size={15} />
                {t("members.invite")}
              </button>
            )}
          </div>
        </div>

        {/* ── Stats row ───────────────────────────── */}
        {!loading && members.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: ownerCount, ...ROLES.owner },
              { value: adminCount, ...ROLES.admin },
              { value: memberCount, ...ROLES.member },
            ].map(({ labelKey, value, color, bg, icon: Icon }) => (
              <div
                key={labelKey}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p
                    className="text-lg font-bold leading-none"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {num(value)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                    {t(labelKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Member list ──────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          {/* List header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${C.border}` }}
          >
            <div className="flex items-center gap-2">
              <Users size={14} style={{ color: "var(--text-faint)" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-faint)" }}
              >
                {t("members.teamMembers")}
              </span>
            </div>
            {!loading && (
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                {t("members.totalCount", { count: num(members.length) })}
              </span>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2
                size={22}
                className="animate-spin"
                style={{ color: "#10b981" }}
              />
            </div>
          ) : !activeBusiness ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                {t("members.selectBusinessFirst")}
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--surface-2)" }}
              >
                <Users size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {t("members.empty")}
              </p>
              <p className="text-xs mb-5" style={{ color: "var(--text-faint)" }}>
                {t("members.emptyHint")}
              </p>
              {canInvite && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold mx-auto"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    color: "#10b981",
                  }}
                >
                  <UserPlus size={13} /> {t("members.inviteMember")}
                </button>
              )}
            </div>
          ) : (
            members.map((member) => (
              <MemberRow
                key={member._id}
                member={member}
                isOwner={isOwner}
                currentUserId={currentUserId}
                businessId={activeBusiness._id}
                onRemove={setRemoving}
                onUpdate={fetchMembers}
              />
            ))
          )}
        </div>

        {/* ── Pending invitations ─────────────────── */}
        {canInvite && pendingInvites.length > 0 && activeBusiness && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: "var(--text-faint)" }} />
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text-faint)" }}
                >
                  {t("members.pendingInvites")}
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                {t("members.pendingCount", {
                  count: num(pendingInvites.length),
                })}
              </span>
            </div>

            <p
              className="px-5 pb-3 text-[11px]"
              style={{ color: "var(--text-faint)" }}
            >
              {t("members.pendingHint")}
            </p>

            {pendingInvites.map((invite) => (
              <PendingInviteRow
                key={invite._id}
                invite={invite}
                businessName={activeBusiness.name}
                canManage={canInvite}
                onCancel={handleCancelInvite}
              />
            ))}
          </div>
        )}

        {/* ── Role legend ─────────────────────────── */}
        {!loading && members.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <p
              className="text-xs font-medium mb-3"
              style={{ color: "var(--text-faint)" }}
            >
              {t("members.rolePermissions")}
            </p>
            <div className="space-y-2">
              {[
                { role: "owner", desc: t("members.ownerDesc") },
                { role: "admin", desc: t("members.adminDesc") },
                { role: "member", desc: t("members.memberDesc") },
              ].map(({ role, desc }) => {
                const rc = ROLES[role as Role];
                const RcIcon = rc.icon;
                return (
                  <div key={role} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: rc.bg }}
                    >
                      <RcIcon size={11} style={{ color: rc.color }} />
                    </div>
                    <div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: rc.color }}
                      >
                        {t(rc.labelKey)}
                      </span>
                      <span
                        className="text-xs ml-2"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Invite Modal ─────────────────────────── */}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => {
          fetchMembers();
          fetchPendingInvites();
        }}
        businessId={activeBusiness?._id ?? ""}
        businessName={activeBusiness?.name ?? ""}
      />

      {/* ── Remove confirm ───────────────────────── */}
      {removing && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{
            background: "var(--overlay-scrim)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: "var(--bg-elevated)",
              border: `1px solid var(--border-strong)`,
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(239,68,68,0.1)" }}
            >
              <AlertCircle size={20} style={{ color: "#ef4444" }} />
            </div>
            <p
              className="text-center font-semibold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {t("members.removeQuestion", { name: removing.firstName })}
            </p>
            <p
              className="text-xs text-center mb-5"
              style={{ color: "var(--text-faint)" }}
            >
              {t("members.removeWarningPrefix")}{" "}
              <span style={{ color: "var(--text-secondary)" }}>{activeBusiness?.name}</span>
              {t("members.removeWarningSuffix")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoving(null)}
                disabled={removeLoading}
                className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: "var(--surface-3)",
                  border: `1px solid ${C.border}`,
                  color: "var(--text-secondary)",
                }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleRemove}
                disabled={removeLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {removeLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  t("members.remove")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
