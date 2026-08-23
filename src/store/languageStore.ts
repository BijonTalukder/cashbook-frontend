import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "../i18n/config";

const STORAGE_KEY = "hisabboi-language";

const applyLanguage = (language: Language) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", language);
  }
};

const getInitialLanguage = (): Language => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const value = stored?.state?.language;
    if (isLanguage(value)) return value;
  } catch {
    /* ignore malformed storage */
  }
  return DEFAULT_LANGUAGE;
};

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: getInitialLanguage(),
      setLanguage: (language) => {
        applyLanguage(language);
        set({ language });
      },
      toggleLanguage: () =>
        get().setLanguage(get().language === "en" ? "bn" : "en"),
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state) applyLanguage(state.language);
      },
    },
  ),
);

applyLanguage(getInitialLanguage());
