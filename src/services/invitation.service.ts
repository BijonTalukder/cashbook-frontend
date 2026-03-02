import api from "./api";

export interface IInvitationDetail {
  _id: string;
  business: { _id: string; name: string; type: string };
  invitedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt: string;
  createdAt: string;
}

export const invitationService = {
  /* ── Get invite by token (public) ────────────────── */
  getByToken: async (token: string): Promise<IInvitationDetail> => {
    const { data } = await api.get(`/invitations/token/${token}`);
    return data.data as IInvitationDetail;
  },

  /* ── Accept ───────────────────────────────────────── */
  accept: async (
    token: string,
  ): Promise<{ businessId: string; businessName: string; role: string }> => {
    const { data } = await api.post(`/invitations/token/${token}/accept`);
    return data.data;
  },

  /* ── Decline ──────────────────────────────────────── */
  decline: async (token: string): Promise<void> => {
    await api.post(`/invitations/token/${token}/decline`);
  },

  /* ── My pending invitations ───────────────────────── */
  getMyInvitations: async (): Promise<IInvitationDetail[]> => {
    const { data } = await api.get("/invitations/mine");
    return data.data as IInvitationDetail[];
  },

  /* ── Sent invitations (admin view) ───────────────── */
  getSent: async (businessId: string): Promise<IInvitationDetail[]> => {
    const { data } = await api.get(`/invitations/sent/${businessId}`);
    return data.data as IInvitationDetail[];
  },

  /* ── Cancel ───────────────────────────────────────── */
  cancel: async (invitationId: string): Promise<void> => {
    await api.delete(`/invitations/${invitationId}`);
  },
};
