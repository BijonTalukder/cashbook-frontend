// pages/PrivacyPolicyPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronDown, TrendingUp, FileText, Settings, Share2,
    Lock, Clock, CheckSquare, Trash2, Baby, Cookie,
    Globe, RefreshCw, Mail, ChevronLeft,
} from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";
import LanguageToggle from "../../components/shared/LanguageToggle";

/* ── Constants — update these ─────────────────────── */
const CONTACT_EMAIL = "support@hisabboi.app";
const APP_URL = "https://hisabboi.app";
const EFFECTIVE_DATE = "January 1, 2025";
const LAST_UPDATED = "January 1, 2025";

/* ── Content model ────────────────────────────────────
   Sections are described as data so both languages share
   one layout; every string comes from the locale files.
─────────────────────────────────────────────────────── */
type Block =
    | { kind: "title"; key: string }
    | { kind: "p"; key: string }
    | { kind: "list"; key: string }
    | { kind: "table"; headers: string[]; rowsKey: string }
    | { kind: "highlight"; key: string; labelKey?: string }
    | { kind: "warn"; key: string };

interface Section {
    id: string;
    icon: React.ElementType;
    color: string;
    titleKey: string;
    blocks: Block[];
}

const SECTIONS: Section[] = [
    {
        id: "collect",
        icon: FileText,
        color: "rgba(16,185,129,0.18)",
        titleKey: "privacy.s1.title",
        blocks: [
            { kind: "title", key: "privacy.s1.accountInfo" },
            { kind: "table", headers: ["privacy.th.data", "privacy.th.why"], rowsKey: "privacy.s1.accountRows" },
            { kind: "title", key: "privacy.s1.financialData" },
            { kind: "table", headers: ["privacy.th.data", "privacy.th.why"], rowsKey: "privacy.s1.financialRows" },
            { kind: "title", key: "privacy.s1.deviceUsage" },
            { kind: "list", key: "privacy.s1.deviceList" },
            { kind: "highlight", labelKey: "privacy.s1.notCollectLabel", key: "privacy.s1.notCollectBody" },
        ],
    },
    {
        id: "use",
        icon: Settings,
        color: "rgba(59,130,246,0.2)",
        titleKey: "privacy.s2.title",
        blocks: [
            { kind: "p", key: "privacy.s2.intro" },
            { kind: "list", key: "privacy.s2.list" },
            { kind: "highlight", key: "privacy.s2.highlight" },
        ],
    },
    {
        id: "sharing",
        icon: Share2,
        color: "rgba(139,92,246,0.2)",
        titleKey: "privacy.s3.title",
        blocks: [
            { kind: "p", key: "privacy.s3.intro" },
            { kind: "title", key: "privacy.s3.withinApp" },
            { kind: "list", key: "privacy.s3.withinAppList" },
            { kind: "title", key: "privacy.s3.providers" },
            {
                kind: "table",
                headers: ["privacy.th.provider", "privacy.th.purpose", "privacy.th.shared"],
                rowsKey: "privacy.s3.providerRows",
            },
            { kind: "title", key: "privacy.s3.legal" },
            { kind: "p", key: "privacy.s3.legalBody" },
            { kind: "warn", key: "privacy.s3.warn" },
        ],
    },
    {
        id: "security",
        icon: Lock,
        color: "rgba(16,185,129,0.18)",
        titleKey: "privacy.s4.title",
        blocks: [
            { kind: "p", key: "privacy.s4.intro" },
            { kind: "list", key: "privacy.s4.list" },
            { kind: "p", key: "privacy.s4.outro" },
        ],
    },
    {
        id: "retention",
        icon: Clock,
        color: "rgba(245,158,11,0.2)",
        titleKey: "privacy.s5.title",
        blocks: [
            { kind: "table", headers: ["privacy.th.dataType", "privacy.th.retention"], rowsKey: "privacy.s5.rows" },
            { kind: "p", key: "privacy.s5.outro" },
        ],
    },
    {
        id: "rights",
        icon: CheckSquare,
        color: "rgba(16,185,129,0.18)",
        titleKey: "privacy.s6.title",
        blocks: [
            { kind: "list", key: "privacy.s6.list" },
            { kind: "highlight", key: "privacy.s6.highlight" },
        ],
    },
    {
        id: "deletion",
        icon: Trash2,
        color: "rgba(239,68,68,0.2)",
        titleKey: "privacy.s7.title",
        blocks: [
            { kind: "p", key: "privacy.s7.intro" },
            { kind: "list", key: "privacy.s7.list" },
            { kind: "title", key: "privacy.s7.howTitle" },
            { kind: "list", key: "privacy.s7.howList" },
            { kind: "warn", key: "privacy.s7.warn" },
        ],
    },
    {
        id: "children",
        icon: Baby,
        color: "rgba(59,130,246,0.2)",
        titleKey: "privacy.s8.title",
        blocks: [
            { kind: "p", key: "privacy.s8.body1" },
            { kind: "p", key: "privacy.s8.contact" },
        ],
    },
    {
        id: "cookies",
        icon: Cookie,
        color: "rgba(139,92,246,0.2)",
        titleKey: "privacy.s9.title",
        blocks: [
            { kind: "p", key: "privacy.s9.intro" },
            { kind: "list", key: "privacy.s9.list" },
            { kind: "p", key: "privacy.s9.outro" },
        ],
    },
    {
        id: "international",
        icon: Globe,
        color: "rgba(16,185,129,0.18)",
        titleKey: "privacy.s10.title",
        blocks: [
            { kind: "p", key: "privacy.s10.body1" },
            { kind: "p", key: "privacy.s10.body2" },
        ],
    },
    {
        id: "changes",
        icon: RefreshCw,
        color: "rgba(245,158,11,0.2)",
        titleKey: "privacy.s11.title",
        blocks: [
            { kind: "p", key: "privacy.s11.intro" },
            { kind: "list", key: "privacy.s11.list" },
            { kind: "p", key: "privacy.s11.outro" },
        ],
    },
];

/* ── Small UI helpers ─────────────────────────────── */
const Hl = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl p-4 my-3 text-sm"
        style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)", color: "#a7f3d0" }}>
        {children}
    </div>
);

const Warn = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl p-4 my-3 text-sm"
        style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", color: "#fcd34d" }}>
        {children}
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-semibold uppercase tracking-widest mt-5 mb-2 first:mt-4"
        style={{ color: "#10b981" }}>{children}</p>
);

const Li = ({ children }: { children: React.ReactNode }) => (
    <li className="flex gap-2 py-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
        <span style={{ color: "#10b981", flexShrink: 0 }}>•</span>
        <span>{children}</span>
    </li>
);

const DataTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
    <div className="rounded-xl overflow-hidden my-3" style={{ border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr style={{ background: "rgba(16,185,129,0.08)" }}>
                        {headers.map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 font-semibold"
                                style={{ color: "#10b981", borderBottom: "1px solid var(--border)" }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--surface-2)" : "none" }}>
                            {row.map((cell, j) => (
                                <td key={j} className="px-4 py-2.5 align-top" style={{ color: "var(--text-secondary)" }}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

/* ── Block renderer ───────────────────────────────── */
const Blocks = ({ blocks }: { blocks: Block[] }) => {
    const { t, tList, tRows } = useTranslation();

    return (
        <>
            {blocks.map((block, i) => {
                switch (block.kind) {
                    case "title":
                        return <SectionTitle key={i}>{t(block.key)}</SectionTitle>;
                    case "p":
                        return (
                            <p key={i} className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
                                {t(block.key, { email: CONTACT_EMAIL, appUrl: APP_URL })}
                            </p>
                        );
                    case "list":
                        return (
                            <ul key={i} className="space-y-0.5 mt-2">
                                {tList(block.key, { email: CONTACT_EMAIL, appUrl: APP_URL }).map((item, j) => (
                                    <Li key={j}>{item}</Li>
                                ))}
                            </ul>
                        );
                    case "table":
                        return (
                            <DataTable
                                key={i}
                                headers={block.headers.map((h) => t(h))}
                                rows={tRows(block.rowsKey)}
                            />
                        );
                    case "highlight":
                        return (
                            <Hl key={i}>
                                {block.labelKey && (
                                    <span className="font-semibold">{t(block.labelKey)} </span>
                                )}
                                {t(block.key)}
                            </Hl>
                        );
                    case "warn":
                        return <Warn key={i}>{t(block.key)}</Warn>;
                }
            })}
        </>
    );
};

/* ── Accordion Item ───────────────────────────────── */
const AccordionItem = ({ section, defaultOpen = false }: { section: Section; defaultOpen?: boolean }) => {
    const [open, setOpen] = useState(defaultOpen);
    const { t } = useTranslation();
    const Icon = section.icon;

    return (
        <div className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <button
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="row-press w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left"
                style={{ background: open ? "var(--surface-1)" : "transparent" }}
            >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: section.color }}>
                    <Icon size={16} style={{ color: "#fff" }} />
                </div>
                <span className="flex-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {t(section.titleKey)}
                </span>
                <ChevronDown
                    size={15}
                    style={{
                        color: "var(--text-faint)",
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        flexShrink: 0,
                    }}
                />
            </button>

            {open && (
                <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--border)" }}>
                    <Blocks blocks={section.blocks} />
                </div>
            )}
        </div>
    );
};

/* ════════════════════════════════════════════════════
   PrivacyPolicyPage
════════════════════════════════════════════════════ */
const PrivacyPolicyPage = () => {
    const navigate = useNavigate();
    const { t, isBangla } = useTranslation();

    return (
        <div
          className="min-h-screen"
          style={{
            background: "var(--bg)",
            paddingTop: "var(--safe-top)",
            paddingBottom: "var(--safe-bottom)",
          }}
        >

            {/* ── Top bar ── */}
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
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {t("privacy.navTitle")}
                    </span>
                </div>
                <div className="ml-auto">
                    <LanguageToggle />
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 pb-16">

                {/* ── Hero ── */}
                <div className="rounded-2xl p-6 mb-6"
                    style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.08),rgba(13,148,136,0.04))", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 text-xs font-medium"
                        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                        {t("privacy.badge")}
                    </div>
                    <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                        {t("privacy.heroTitle")}
                    </h1>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {t("privacy.heroBody")}
                    </p>
                    <p className="text-xs mt-4" style={{ color: "var(--text-faint)" }}>
                        <strong style={{ color: "var(--text-muted)" }}>{t("privacy.effectiveDateLabel")}</strong>{" "}
                        {EFFECTIVE_DATE}
                        {" "}·{" "}
                        <strong style={{ color: "var(--text-muted)" }}>{t("privacy.lastUpdatedLabel")}</strong>{" "}
                        {LAST_UPDATED}
                    </p>
                    {isBangla && (
                        <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>
                            {t("privacy.translationNote")}
                        </p>
                    )}
                </div>

                {/* ── Sections ── */}
                <div className="space-y-3">
                    {SECTIONS.map((section, i) => (
                        <AccordionItem
                            key={section.id}
                            section={section}
                            defaultOpen={i === 0}
                        />
                    ))}
                </div>

                {/* ── Contact card ── */}
                <div className="rounded-2xl p-6 mt-6 text-center"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: "linear-gradient(135deg,#10b981,#0d9488)" }}>
                        <Mail size={20} className="text-white" />
                    </div>
                    <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                        {t("privacy.contactTitle")}
                    </h2>
                    <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                        {t("privacy.contactBody")}
                    </p>
                    <a href={`mailto:${CONTACT_EMAIL}`}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm"
                        style={{ background: "linear-gradient(135deg,#10b981,#0d9488)", color: "#022c22" }}>
                        ✉️ {CONTACT_EMAIL}
                    </a>
                    <p className="text-xs mt-4" style={{ color: "var(--text-faint)" }}>
                        {t("privacy.location")}
                    </p>
                </div>

                {/* ── Footer note ── */}
                <p className="text-center text-xs mt-6" style={{ color: "var(--text-faint)" }}>
                    {t("privacy.copyright")}
                </p>

            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
