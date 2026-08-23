import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { useTranslation } from "../../i18n/useTranslation";

interface ThemeToggleProps {
  variant?: "icon" | "row";
  className?: string;
}

const ThemeToggle = ({ variant = "icon", className = "" }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  if (variant === "row") {
    return (
      <button
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors ${className}`}
        style={{ background: "var(--surface-2)" }}
      >
        <span className="flex items-center gap-3 text-sm" style={{ color: "var(--text-primary)" }}>
          {isDark ? <Moon size={16} /> : <Sun size={16} />}
          {isDark ? t("theme.dark") : t("theme.light")}
        </span>
        <span
          className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors"
          style={{ background: isDark ? "#10b981" : "var(--surface-7)" }}
          aria-hidden="true"
        >
          <span
            className="inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform"
            style={{ transform: isDark ? "translateX(22px)" : "translateX(3px)" }}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 ${className}`}
      style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
};

export default ThemeToggle;
