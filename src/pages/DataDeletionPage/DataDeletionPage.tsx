// pages/DataDeletionPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft, TrendingUp, Trash2, Mail,
    CheckCircle, AlertTriangle, Loader2, Shield,
} from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import LanguageToggle from "../../components/shared/LanguageToggle";

const CONTACT_EMAIL = "support@hisabboi.app";

type Status = "idle" | "loading" | "success" | "error";

const DataDeletionPage = () => {
    const navigate = useNavigate();
    const { t, tList } = useTranslation();
    const { num } = useFormat();
    const [email, setEmail] = useState("");
    const [reason, setReason] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) { setError(t("dataDeletion.emailRequired")); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { setError(t("dataDeletion.emailInvalid")); return; }
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
        <div
          className="min-h-screen"
          style={{
            background: "var(--bg)",
            paddingTop: "var(--safe-top)",
            paddingBottom: "var(--safe-bottom)",
          }}
        >

            {/* Top bar */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14"
                style={{ background: "var(--header-bg)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(16px)" }}>
                <button onClick={() => navigate(-1)}
                    aria-label={t("common.back")}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-400 rounded-lg flex items-center justify-center">
                        <TrendingUp size={11} className="text-emerald-950" />
                    </div>
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{t("dataDeletion.navTitle")}</span>
                </div>
                <div className="ml-auto">
                    <LanguageToggle />
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
                        <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>{t("dataDeletion.receivedTitle")}</h2>
                        <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                            {t("dataDeletion.receivedBody")}
                        </p>
                        <p className="text-sm font-semibold mb-6" style={{ color: "#10b981" }}>{email}</p>

                        <div className="rounded-xl p-4 text-left mb-6"
                            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#10b981" }}>
                                {t("dataDeletion.whatNext")}
                            </p>
                            {tList("dataDeletion.nextSteps").map((step, i) => (
                                <div key={i} className="flex gap-3 mb-2 last:mb-0">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                                        style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                                        {num(i + 1)}
                                    </div>
                                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{step}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                            {t("dataDeletion.questionsPrefix")}{" "}
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
                            <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{t("dataDeletion.heroTitle")}</h1>
                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                {t("dataDeletion.heroBodyPrefix")}{" "}
                                <strong style={{ color: "var(--text-primary)" }}>
                                    {t("dataDeletion.heroBodyDays")}
                                </strong>.
                            </p>
                        </div>

                        {/* ── What gets deleted ── */}
                        <div className="rounded-2xl p-5 mb-6"
                            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                                {t("dataDeletion.whatDeleted")}
                            </p>
                            {tList("dataDeletion.deletedList").map((item) => (
                                <div key={item} className="flex items-start gap-2.5 mb-2 last:mb-0">
                                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "#ef4444" }} />
                                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── App shortcut tip ── */}
                        <div className="rounded-xl p-4 mb-6 flex gap-3"
                            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                            <Shield size={18} style={{ color: "#10b981", flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{t("dataDeletion.fasterTitle")}</p>
                                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    {t("dataDeletion.fasterBodyPrefix")}{" "}
                                    <strong style={{ color: "var(--text-primary)" }}>
                                        {t("dataDeletion.fasterBodyPath")}
                                    </strong>{" "}
                                    {t("dataDeletion.fasterBodySuffix")}
                                </p>
                            </div>
                        </div>

                        {/* ── Form ── */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                                    {t("dataDeletion.emailLabel")} <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                    placeholder={t("dataDeletion.emailPlaceholder")}
                                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                                    style={{
                                        background: "var(--surface-2)",
                                        border: error ? "1px solid rgba(239,68,68,0.5)" : "1px solid var(--border-strong)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                                {error && (
                                    <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                                        <AlertTriangle size={11} /> {error}
                                    </p>
                                )}
                                <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
                                    {t("dataDeletion.emailHint")}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                                    {t("dataDeletion.reasonLabel")}{" "}
                                    <span className="text-xs font-normal" style={{ color: "var(--text-faint)" }}>
                                        {t("dataDeletion.reasonOptional")}
                                    </span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={t("dataDeletion.reasonPlaceholder")}
                                    rows={3}
                                    className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                                    style={{
                                        background: "var(--surface-2)",
                                        border: "1px solid var(--border-strong)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                            </div>

                            {status === "error" && (
                                <div className="rounded-xl p-3 flex gap-2"
                                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                    <AlertTriangle size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                                    <p className="text-sm" style={{ color: "#fca5a5" }}>
                                        {t("dataDeletion.submitError")}{" "}
                                        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#ef4444" }}>{CONTACT_EMAIL}</a>.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-60 press"
                                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white" }}>
                                {status === "loading"
                                    ? <><Loader2 size={16} className="animate-spin" /> {t("dataDeletion.processing")}</>
                                    : <><Trash2 size={16} /> {t("dataDeletion.submit")}</>}
                            </button>
                        </form>

                        {/* ── Direct email fallback ── */}
                        <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid var(--border-light)" }}>
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Mail size={13} style={{ color: "var(--text-faint)" }} />
                                <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("dataDeletion.orEmailUs")}</p>
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
