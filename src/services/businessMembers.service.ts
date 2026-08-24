import api from "./api";

export interface IMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: "owner" | "admin" | "member";
}

export interface IInviteResult {
  invitationId?: string;
  inviteLink?: string;
  token?: string;
  email?: string;
  role?: "admin" | "member";
  /** false when SMTP failed — the link must be shared manually */
  emailSent?: boolean;
  /** true when a still-pending invite was re-used instead of creating a new one */
  reused?: boolean;
  expiresAt?: string;
}

export const businessMembersService = {
  /* ── Get all members ──────────────────────────────── */
  getMembers: async (businessId: string): Promise<IMember[]> => {
    const { data } = await api.get(`/business-members/${businessId}`);
    return data.data as IMember[];
  },

  /* ── Invite ───────────────────────────────────────── */
  invite: async (
    businessId: string,
    email: string,
    role: "admin" | "member",
  ): Promise<IInviteResult> => {
    const { data } = await api.post(`/business-members/${businessId}/invite`, {
      email,
      role,
    });
    return data.data ?? {};
  },

  /* ── Remove member ────────────────────────────────── */
  remove: async (businessId: string, memberId: string): Promise<void> => {
    await api.delete(`/business-members/${businessId}/${memberId}`);
  },

  /* ── Update role ──────────────────────────────────── */
  updateRole: async (
    businessId: string,
    memberId: string,
    role: "admin" | "member",
  ): Promise<void> => {
    await api.patch(`/business-members/${businessId}/${memberId}`, { role });
  },
};
