import { useCallback, useMemo } from "react";
import { useLanguageStore } from "../store/languageStore";
import { LANGUAGE_META, type Language } from "./config";
import { translate, type TranslationVars } from "./translate";

export type TFunction = (key: string, vars?: TranslationVars) => string;

/**
 * `const { t } = useTranslation();`  →  `t("common.save")`
 * Supports `{{var}}` interpolation: `t("dues.count", { n: 4 })`.
 */
export const useTranslation = () => {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);

  const t = useCallback<TFunction>(
    (key, vars) => translate(language, key, vars),
    [language],
  );

  const meta = useMemo(() => LANGUAGE_META[language], [language]);

  return { t, language, setLanguage, toggleLanguage, meta, isBangla: language === "bn" };
};

export type { Language };
