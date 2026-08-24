import { useCallback, useMemo } from "react";
import { useLanguageStore } from "../store/languageStore";
import { LANGUAGE_META, type Language } from "./config";
import {
  interpolate,
  translate,
  translateList,
  translateMatrix,
  type TranslationVars,
} from "./translate";

export type TFunction = (key: string, vars?: TranslationVars) => string;

/**
 * `const { t } = useTranslation();`  →  `t("common.save")`
 * Supports `{{var}}` interpolation, e.g. t("customer.totalDue", { amount }).
 */
export const useTranslation = () => {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);

  const t = useCallback<TFunction>(
    (key, vars) => translate(language, key, vars),
    [language],
  );

  /** For keys whose value is a JSON array of strings (bullet lists, tag rows). */
  const tList = useCallback(
    (key: string, vars?: TranslationVars) =>
      translateList(language, key).map((item) => interpolate(item, vars)),
    [language],
  );

  /** For keys whose value is a JSON array of string arrays (table rows). */
  const tRows = useCallback(
    (key: string) => translateMatrix(language, key),
    [language],
  );

  const meta = useMemo(() => LANGUAGE_META[language], [language]);

  return {
    t,
    tList,
    tRows,
    language,
    setLanguage,
    toggleLanguage,
    meta,
    isBangla: language === "bn",
  };
};

export type { Language };
