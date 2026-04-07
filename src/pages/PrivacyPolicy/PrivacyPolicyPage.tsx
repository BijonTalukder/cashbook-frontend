// pages/PrivacyPolicyPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronDown, TrendingUp, FileText, Settings, Share2,
    Lock, Clock, CheckSquare, Trash2, Baby, Cookie,
    Globe, RefreshCw, Mail, ChevronLeft,
} from "lucide-react";

/* ── Constants — update these ─────────────────────── */
const CONTACT_EMAIL = "support@hisabboi.app";
const APP_URL = "https://hisabboi.app";
const LAST_UPDATED = "January 1, 2025";

/* ── Types ────────────────────────────────────────── */
interface Section {
    id: string;
    icon: React.ElementType;
    color: string;
    title: string;
    content: React.ReactNode;
}

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
    <li className="flex gap-2 py-0.5 text-sm" style={{ color: "#94a3b8" }}>
        <span style={{ color: "#10b981", flexShrink: 0 }}>•</span>
        <span>{children}</span>
    </li>
);

const DataTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
    <div className="rounded-xl overflow-hidden my-3" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <table className="w-full text-sm border-collapse">
            <thead>
                <tr style={{ background: "rgba(16,185,129,0.08)" }}>
                    {headers.map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 font-semibold"
                            style={{ color: "#10b981", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        {row.map((cell, j) => (
                            <td key={j} className="px-4 py-2.5 align-top" style={{ color: "#94a3b8" }}>
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

/* ── Accordion Item ───────────────────────────────── */
const AccordionItem = ({ section, defaultOpen = false }: { section: Section; defaultOpen?: boolean }) => {
    const [open, setOpen] = useState(defaultOpen);
    const Icon = section.icon;
    return (
        <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all"
                style={{ background: open ? "rgba(255,255,255,0.02)" : "transparent" }}
            >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: section.color }}>
                    <Icon size={16} style={{ color: "#fff" }} />
                </div>
                <span className="flex-1 text-sm font-semibold text-white">{section.title}</span>
                <ChevronDown
                    size={15}
                    style={{
                        color: "#475569",
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        flexShrink: 0,
                    }}
                />
            </button>

            {open && (
                <div className="px-5 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    {section.content}
                </div>
            )}
        </div>
    );
};

/* ── Section Definitions ──────────────────────────── */
const SECTIONS: Section[] = [
    {
        id: "collect",
        icon: FileText,
        color: "rgba(16,185,129,0.18)",
        title: "1. Information We Collect",
        content: (
            <>
                <SectionTitle>Account Information</SectionTitle>
                <DataTable
                    headers={["Data", "Why We Collect It"]}
                    rows={[
                        ["Full name", "To identify your account and personalize your experience"],
                        ["Email address", "For account login, password reset, and notifications"],
                        ["Password (hashed)", "To authenticate your account securely"],
                        ["Profile information", "To display in the app and to other business members"],
                    ]}
                />
                <SectionTitle>Financial Data</SectionTitle>
                <DataTable
                    headers={["Data", "Why We Collect It"]}
                    rows={[
                        ["Income & expense records", "Core app functionality — HisabBoi management"],
                        ["Transaction categories", "To organize and analyze your finances"],
                        ["Business names & types", "To manage multiple accounts (personal, company, mess)"],
                        ["Mess meal records", "To calculate mess member costs and settlements"],
                        ["Member balances & dues", "To track who owes what in shared accounts"],
                    ]}
                />
                <SectionTitle>Device & Usage Data</SectionTitle>
                <ul className="space-y-0.5 mt-1">
                    <Li>Device type, OS version (for crash reporting and compatibility)</Li>
                    <Li>App usage patterns (to improve features)</Li>
                    <Li>IP address (for security and fraud prevention)</Li>
                    <Li>Push notification tokens (to send you alerts)</Li>
                </ul>
                <Hl>
                    <span className="font-semibold">We do NOT collect:</span> payment card numbers, bank credentials,
                    government ID, precise GPS location, contacts, photos, or microphone/camera data.
                </Hl>
            </>
        ),
    },
    {
        id: "use",
        icon: Settings,
        color: "rgba(59,130,246,0.2)",
        title: "2. How We Use Your Information",
        content: (
            <>
                <p className="text-sm mt-4 mb-2" style={{ color: "#94a3b8" }}>
                    We use the information we collect for the following purposes:
                </p>
                <ul className="space-y-1.5 mt-1">
                    <Li><strong className="text-white">Provide core services</strong> — manage your HisabBoi, calculate mess summaries, generate invoices</Li>
                    <Li><strong className="text-white">Account management</strong> — create and manage your account and business profiles</Li>
                    <Li><strong className="text-white">Collaboration</strong> — share relevant data with members you invite to your business</Li>
                    <Li><strong className="text-white">AI-powered insights</strong> — analyze financial data to provide personalized suggestions</Li>
                    <Li><strong className="text-white">Security</strong> — detect fraud, prevent abuse, and maintain account safety</Li>
                    <Li><strong className="text-white">Improvements</strong> — understand usage patterns to improve features and fix bugs</Li>
                    <Li><strong className="text-white">Communication</strong> — send transactional emails and important notifications</Li>
                    <Li><strong className="text-white">Legal compliance</strong> — meet our obligations under applicable laws</Li>
                </ul>
                <Hl>
                    We process your financial data <strong>only</strong> to provide the services you request.
                    We <strong>never</strong> use your financial data for advertising purposes.
                </Hl>
            </>
        ),
    },
    {
        id: "sharing",
        icon: Share2,
        color: "rgba(139,92,246,0.2)",
        title: "3. Data Sharing & Third Parties",
        content: (
            <>
                <p className="text-sm mt-4 mb-2" style={{ color: "#94a3b8" }}>
                    We do <strong className="text-white">not</strong> sell, rent, or trade your personal data. We share data only in limited cases:
                </p>
                <SectionTitle>Within the App</SectionTitle>
                <ul className="space-y-0.5">
                    <Li>Business members you invite can see shared transaction data and balances</Li>
                    <Li>Mess members can see their own meal counts and dues</Li>
                    <Li>You control who is invited to your businesses</Li>
                </ul>
                <SectionTitle>Service Providers</SectionTitle>
                <DataTable
                    headers={["Provider", "Purpose", "Data Shared"]}
                    rows={[
                        ["MongoDB Atlas", "Database hosting", "All app data (encrypted at rest)"],
                        ["Google Cloud", "Push notifications", "Device tokens, anonymized usage"],
                        ["Google Gemini AI", "AI financial assistant", "Anonymized business summary only"],
                        ["Hosting provider", "Server infrastructure", "Encrypted user data"],
                    ]}
                />
                <SectionTitle>Legal Requirements</SectionTitle>
                <p className="text-sm" style={{ color: "#94a3b8" }}>
                    We may disclose your information if required by law, court order, or to protect our legal rights
                    or the safety of our users.
                </p>
                <Warn>
                    We never share your personal financial data with advertisers, data brokers, or marketing companies.
                </Warn>
            </>
        ),
    },
    {
        id: "security",
        icon: Lock,
        color: "rgba(16,185,129,0.18)",
        title: "4. Data Security",
        content: (
            <>
                <p className="text-sm mt-4 mb-2" style={{ color: "#94a3b8" }}>
                    We implement industry-standard security measures to protect your data:
                </p>
                <ul className="space-y-1.5 mt-1">
                    <Li><strong className="text-white">Encryption in transit</strong> — all data transmitted over HTTPS/TLS</Li>
                    <Li><strong className="text-white">Encryption at rest</strong> — your data is encrypted in our database</Li>
                    <Li><strong className="text-white">Password hashing</strong> — passwords hashed using bcrypt; we never store plaintext</Li>
                    <Li><strong className="text-white">JWT authentication</strong> — secure token-based authentication with expiry</Li>
                    <Li><strong className="text-white">Access controls</strong> — only authorized users can access their own business data</Li>
                    <Li><strong className="text-white">Regular reviews</strong> — we regularly review and update our security practices</Li>
                </ul>
                <p className="text-sm mt-3" style={{ color: "#94a3b8" }}>
                    While we take strong measures to protect your data, no system is 100% secure.
                    Please keep your credentials confidential and log out on shared devices.
                </p>
            </>
        ),
    },
    {
        id: "retention",
        icon: Clock,
        color: "rgba(245,158,11,0.2)",
        title: "5. Data Retention",
        content: (
            <>
                <DataTable
                    headers={["Data Type", "Retention Period"]}
                    rows={[
                        ["Account data", "Until account is deleted by user"],
                        ["Transaction records", "Until business or account is deleted"],
                        ["Meal & mess data", "Until business or account is deleted"],
                        ["Backups", "Up to 30 days after deletion request"],
                        ["Anonymized analytics", "Up to 2 years"],
                        ["Legal/compliance data", "As required by applicable law"],
                    ]}
                />
                <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>
                    When you delete your account, we will permanently delete your personal data within{" "}
                    <strong className="text-white">30 days</strong>, except where required by law.
                </p>
            </>
        ),
    },
    {
        id: "rights",
        icon: CheckSquare,
        color: "rgba(16,185,129,0.18)",
        title: "6. Your Rights & Choices",
        content: (
            <>
                <ul className="space-y-1.5 mt-4">
                    <Li><strong className="text-white">Access</strong> — view all data we hold about you in the app</Li>
                    <Li><strong className="text-white">Correction</strong> — update your profile information anytime in Settings</Li>
                    <Li><strong className="text-white">Deletion</strong> — delete your account and all data from Settings → Delete Account</Li>
                    <Li><strong className="text-white">Data export</strong> — contact us to request a copy of your data</Li>
                    <Li><strong className="text-white">Opt-out</strong> — disable push notifications in your device settings</Li>
                    <Li><strong className="text-white">Object</strong> — object to certain data processing by contacting us</Li>
                </ul>
                <Hl>
                    <strong>Account Deletion:</strong> Go to{" "}
                    <strong>Settings → Delete Account</strong> or visit our data deletion page.
                    All your data will be permanently removed within 30 days.
                </Hl>
            </>
        ),
    },
    {
        id: "deletion",
        icon: Trash2,
        color: "rgba(239,68,68,0.2)",
        title: "7. Account & Data Deletion",
        content: (
            <>
                <p className="text-sm mt-4 mb-2" style={{ color: "#94a3b8" }}>
                    You may request full deletion of your account and data at any time. Upon deletion:
                </p>
                <ul className="space-y-0.5">
                    <Li>Your profile, email, and account credentials are permanently removed</Li>
                    <Li>All businesses you own and their transactions are deleted</Li>
                    <Li>Meal records, invoices, and mess data are deleted</Li>
                    <Li>Your membership in other users' businesses is removed</Li>
                    <Li>Backups are purged within 30 days</Li>
                </ul>
                <SectionTitle>How to delete your account</SectionTitle>
                <ul className="space-y-0.5">
                    <Li>In the app: <strong className="text-white">Settings → Delete Account</strong></Li>
                    <Li>Via web: visit our data deletion request page at <strong className="text-white">{APP_URL}/data-deletion</strong></Li>
                    <Li>Via email: send a request to <strong className="text-white">{CONTACT_EMAIL}</strong></Li>
                </ul>
                <Warn>
                    Account deletion is permanent and irreversible. Please export any data you need before deleting.
                </Warn>
            </>
        ),
    },
    {
        id: "children",
        icon: Baby,
        color: "rgba(59,130,246,0.2)",
        title: "8. Children's Privacy",
        content: (
            <>
                <p className="text-sm mt-4" style={{ color: "#94a3b8" }}>
                    HisabBoi is not directed at children under the age of <strong className="text-white">13</strong>.
                    We do not knowingly collect personal information from children under 13.
                </p>
                <p className="text-sm mt-3" style={{ color: "#94a3b8" }}>
                    If you are a parent or guardian and believe your child has provided us with personal information,
                    please contact us immediately at{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#10b981" }}>{CONTACT_EMAIL}</a>.
                    We will promptly delete such information.
                </p>
            </>
        ),
    },
    {
        id: "cookies",
        icon: Cookie,
        color: "rgba(139,92,246,0.2)",
        title: "9. Cookies & Tracking Technologies",
        content: (
            <>
                <p className="text-sm mt-4 mb-2" style={{ color: "#94a3b8" }}>
                    The HisabBoi mobile app does not use browser cookies. We may use the following technologies:
                </p>
                <ul className="space-y-1.5">
                    <Li><strong className="text-white">JWT tokens</strong> — stored securely on your device for authentication</Li>
                    <Li><strong className="text-white">Local storage</strong> — to cache your data for offline access</Li>
                    <Li><strong className="text-white">Push notification tokens</strong> — to deliver notifications to your device</Li>
                    <Li><strong className="text-white">Anonymized analytics</strong> — to understand app usage and improve performance</Li>
                </ul>
                <p className="text-sm mt-3" style={{ color: "#94a3b8" }}>
                    We do not use cross-site tracking, advertising trackers, or fingerprinting technologies.
                </p>
            </>
        ),
    },
    {
        id: "international",
        icon: Globe,
        color: "rgba(16,185,129,0.18)",
        title: "10. International Data Transfers",
        content: (
            <>
                <p className="text-sm mt-4" style={{ color: "#94a3b8" }}>
                    HisabBoi is primarily designed for users in Bangladesh. Your data may be processed and stored
                    on servers located outside your country. By using our app, you consent to such transfers.
                </p>
                <p className="text-sm mt-3" style={{ color: "#94a3b8" }}>
                    We ensure that all data transfers comply with applicable data protection laws and that your
                    data receives the same level of protection regardless of where it is processed.
                </p>
            </>
        ),
    },
    {
        id: "changes",
        icon: RefreshCw,
        color: "rgba(245,158,11,0.2)",
        title: "11. Changes to This Policy",
        content: (
            <>
                <p className="text-sm mt-4 mb-2" style={{ color: "#94a3b8" }}>
                    We may update this Privacy Policy from time to time. When we make material changes, we will:
                </p>
                <ul className="space-y-0.5">
                    <Li>Update the "Last Updated" date at the top of this page</Li>
                    <Li>Send a notification through the app</Li>
                    <Li>For significant changes, ask for your consent before continuing</Li>
                </ul>
                <p className="text-sm mt-3" style={{ color: "#94a3b8" }}>
                    Your continued use of HisabBoi after changes constitutes acceptance of the updated policy.
                </p>
            </>
        ),
    },
];

/* ════════════════════════════════════════════════════
   PrivacyPolicyPage
════════════════════════════════════════════════════ */
const PrivacyPolicyPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen" style={{ background: "#0a0f1e" }}>

            {/* ── Top bar ── */}
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
                    <span className="text-white font-semibold text-sm">Privacy Policy</span>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 pb-16">

                {/* ── Hero ── */}
                <div className="rounded-2xl p-6 mb-6"
                    style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.08),rgba(13,148,136,0.04))", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 text-xs font-medium"
                        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                        📄 Legal Document
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Privacy Policy</h1>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>
                        This Privacy Policy explains how HisabBoi collects, uses, and protects your personal
                        information when you use our app and services. By using HisabBoi, you agree to the
                        terms described below.
                    </p>
                    <p className="text-xs mt-4" style={{ color: "#475569" }}>
                        <strong style={{ color: "#64748b" }}>Effective Date:</strong> January 1, 2025
                        {" "}·{" "}
                        <strong style={{ color: "#64748b" }}>Last Updated:</strong> {LAST_UPDATED}
                    </p>
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
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: "linear-gradient(135deg,#10b981,#0d9488)" }}>
                        <Mail size={20} className="text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Contact Us</h2>
                    <p className="text-sm mb-4" style={{ color: "#64748b" }}>
                        Have questions about your privacy? We're here to help.
                    </p>
                    <a href={`mailto:${CONTACT_EMAIL}`}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm"
                        style={{ background: "linear-gradient(135deg,#10b981,#0d9488)", color: "#022c22" }}>
                        ✉️ {CONTACT_EMAIL}
                    </a>
                    <p className="text-xs mt-4" style={{ color: "#334155" }}>
                        HisabBoi · Dhaka, Bangladesh
                    </p>
                </div>

                {/* ── Footer note ── */}
                <p className="text-center text-xs mt-6" style={{ color: "#334155" }}>
                    © 2025 HisabBoi. All rights reserved.
                </p>

            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
