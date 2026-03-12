// pages/DataDeletionPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft, TrendingUp, Trash2, Mail,
    CheckCircle, AlertTriangle, Loader2, Shield,
} from "lucide-react";

const CONTACT_EMAIL = "support@hisabboi.app"; 

type Status = "idle" | "loading" | "success" | "error";

const DataDeletionPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [reason, setReason] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) { setError("Email address is required."); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address."); return; }
        setError("");
        setStatus("loading");
        try {
            // Replace with your actual API call or email service
            await new Promise((res) => setTimeout(res, 1200));
            setStatus("success");
        } catch {
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen" style={{ background: "#0a0f1e" }}>

            {/* Top bar */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14"
                style={{ background: "rgba(8,13,25,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>
                <button onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-400 rounded-lg flex items-center justify-center">
                        <TrendingUp size={11} className="text-emerald-950" />
                    </div>
                    <span className="text-white font-semibold text-sm">Delete Account</span>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-8 pb-16">

                {/* ── Success ── */}
                {status === "success" ? (
                    <div className="rounded-2xl p-8 text-center"
                        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                            style={{ background: "linear-gradient(135deg,#10b981,#0d9488)" }}>
                            <CheckCircle size={28} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-3">Request Received</h2>
                        <p className="text-sm mb-2" style={{ color: "#94a3b8" }}>
                            We received your deletion request for:
                        </p>
                        <p className="text-sm font-semibold mb-6" style={{ color: "#10b981" }}>{email}</p>

                        <div className="rounded-xl p-4 text-left mb-6"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#10b981" }}>
                                What happens next
                            </p>
                            {[
                                "We will verify your email within 1–2 business days",
                                "You will receive a confirmation email with next steps",
                                "Your account and all data will be permanently deleted within 30 days",
                                "Backups will be purged within 30 days of deletion",
                            ].map((step, i) => (
                                <div key={i} className="flex gap-3 mb-2 last:mb-0">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                                        style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                                        {i + 1}
                                    </div>
                                    <p className="text-sm" style={{ color: "#94a3b8" }}>{step}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs" style={{ color: "#475569" }}>
                            Questions? Email us at{" "}
                            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#10b981" }}>{CONTACT_EMAIL}</a>
                        </p>
                    </div>

                ) : (
                    <>
                        {/* ── Hero ── */}
                        <div className="rounded-2xl p-6 mb-6"
                            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                                style={{ background: "rgba(239,68,68,0.12)" }}>
                                <Trash2 size={22} style={{ color: "#ef4444" }} />
                            </div>
                            <h1 className="text-xl font-bold text-white mb-2">Request Account Deletion</h1>
                            <p className="text-sm" style={{ color: "#94a3b8" }}>
                                Submit your email below to request permanent deletion of your HisabBoi account
                                and all associated data. We will process your request within{" "}
                                <strong className="text-white">30 days</strong>.
                            </p>
                        </div>

                        {/* ── What gets deleted ── */}
                        <div className="rounded-2xl p-5 mb-6"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#64748b" }}>
                                Data that will be permanently deleted
                            </p>
                            {[
                                "Your profile, name, and email address",
                                "All businesses you own and their transaction records",
                                "Meal records, invoices, and mess summaries",
                                "Your membership in other users' businesses",
                                "All settings and preferences",
                                "Account backups (within 30 days)",
                            ].map((item) => (
                                <div key={item} className="flex items-start gap-2.5 mb-2 last:mb-0">
                                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "#ef4444" }} />
                                    <p className="text-sm" style={{ color: "#94a3b8" }}>{item}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── App shortcut tip ── */}
                        <div className="rounded-xl p-4 mb-6 flex gap-3"
                            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                            <Shield size={18} style={{ color: "#10b981", flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <p className="text-sm font-semibold text-white mb-1">Faster: Delete from the app</p>
                                <p className="text-sm" style={{ color: "#94a3b8" }}>
                                    If you have access to your account, go to{" "}
                                    <strong className="text-white">Settings → Delete Account</strong> for immediate deletion.
                                </p>
                            </div>
                        </div>

                        {/* ── Form ── */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Email Address <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                    placeholder="your@email.com"
                                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: error ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                                        color: "white",
                                    }}
                                />
                                {error && (
                                    <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                                        <AlertTriangle size={11} /> {error}
                                    </p>
                                )}
                                <p className="text-xs mt-1.5" style={{ color: "#475569" }}>
                                    Use the email address associated with your HisabBoi account.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Reason{" "}
                                    <span className="text-xs font-normal" style={{ color: "#475569" }}>(optional)</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Tell us why you're leaving..."
                                    rows={3}
                                    className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: "white",
                                    }}
                                />
                            </div>

                            {status === "error" && (
                                <div className="rounded-xl p-3 flex gap-2"
                                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                    <AlertTriangle size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                                    <p className="text-sm" style={{ color: "#fca5a5" }}>
                                        Something went wrong. Please email us directly at{" "}
                                        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#ef4444" }}>{CONTACT_EMAIL}</a>.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-all active:scale-95"
                                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white" }}>
                                {status === "loading"
                                    ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                                    : <><Trash2 size={16} /> Submit Deletion Request</>}
                            </button>
                        </form>

                        {/* ── Direct email fallback ── */}
                        <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Mail size={13} style={{ color: "#475569" }} />
                                <p className="text-xs" style={{ color: "#475569" }}>Or email us directly</p>
                            </div>
                            <a href={`mailto:${CONTACT_EMAIL}?subject=Account%20Deletion%20Request`}
                                className="text-sm" style={{ color: "#10b981" }}>
                                {CONTACT_EMAIL}
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DataDeletionPage;
