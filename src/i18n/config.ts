/* ─── Language configuration ──────────────────────────────
 * Static JSON translations live in ./locales. Adding a language
 * means dropping a new JSON file in there and listing it below.
 * ─────────────────────────────────────────────────────────── */

export const LANGUAGES = ["en", "bn"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export interface LanguageMeta {
  /** Name in English, for developer-facing UI */
  label: string;
  /** Name in its own script, for the language switcher */
  nativeLabel: string;
  /** Short badge shown in compact toggles */
  short: string;
  /** BCP-47 tag used for Intl date/number formatting */
  locale: string;
}

export const LANGUAGE_META: Record<Language, LanguageMeta> = {
  en: { label: "English", nativeLabel: "English", short: "EN", locale: "en-GB" },
  bn: { label: "Bangla", nativeLabel: "বাংলা", short: "বাং", locale: "bn-BD" },
};

export const isLanguage = (v: unknown): v is Language =>
  typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);

/** bn* browser locales map to Bangla, everything else to English. */
export const detectLanguage = (): Language => {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  return navigator.language?.toLowerCase().startsWith("bn") ? "bn" : DEFAULT_LANGUAGE;
};
