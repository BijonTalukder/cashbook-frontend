import { Languages } from "lucide-react";
import { LANGUAGES, LANGUAGE_META } from "../../i18n/config";
import { useTranslation } from "../../i18n/useTranslation";

interface LanguageToggleProps {
  /** `icon` for headers, `row` for settings lists, `segmented` for auth/onboarding screens. */
  variant?: "icon" | "row" | "segmented";
  className?: string;
}

const LanguageToggle = ({ variant = "icon", className = "" }: LanguageToggleProps) => {
  const { t, language, setLanguage, toggleLanguage, meta } = useTranslation();

  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center gap-0.5 rounded-xl p-0.5 ${className}`}
        style={{ background: "var(--surface-2)" }}
        role="group"
        aria-label={t("settings.language")}
      >
        {LANGUAGES.map((code) => {
          const active = code === language;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              aria-pressed={active}
              className="px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all"
              style={{
                background: active ? "#10b981" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
              }}
            >
              {LANGUAGE_META[code].nativeLabel}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl ${className}`}
        style={{ background: "var(--surface-2)" }}
      >
        <span className="flex items-center gap-3 text-sm" style={{ color: "var(--text-primary)" }}>
          <Languages size={16} />
          {t("settings.language")}
        </span>
        <div className="inline-flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "var(--surface-3)" }}>
          {LANGUAGES.map((code) => {
            const active = code === language;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                aria-pressed={active}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: active ? "#10b981" : "transparent",
                  color: active ? "#fff" : "var(--text-muted)",
                }}
              >
                {LANGUAGE_META[code].nativeLabel}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={t("settings.switchLanguage")}
      title={t("settings.switchLanguage")}
      className={`h-9 min-w-9 px-2 flex items-center justify-center rounded-xl text-xs font-semibold press ${className}`}
      style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
    >
      {meta.short}
    </button>
  );
};

export default LanguageToggle;
