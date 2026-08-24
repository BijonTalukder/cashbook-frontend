import en from "./locales/en.json";
import bn from "./locales/bn.json";
import { DEFAULT_LANGUAGE, type Language } from "./config";

export type TranslationNode =
  | string
  | TranslationNode[]
  | { [key: string]: TranslationNode };
export type TranslationTree = Record<string, TranslationNode>;

/** English is the source of truth; any key missing from bn.json falls back to it. */
const RESOURCES: Record<Language, TranslationTree> = {
  en: en as TranslationTree,
  bn: bn as TranslationTree,
};

export type TranslationVars = Record<string, string | number>;

const lookup = (tree: TranslationTree, key: string): TranslationNode | undefined => {
  let node: TranslationNode | undefined = tree;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, TranslationNode>)[part];
  }
  return node;
};

/** Fill `{{var}}` placeholders — also used for strings already pulled from a list. */
export const interpolate = (template: string, vars?: TranslationVars): string => {
  if (!vars) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
};

const missing = new Set<string>();

/**
 * Resolve a dot-path key to a string in `language`, falling back to English and
 * finally to the key itself so the UI never renders blank.
 */
export const translate = (
  language: Language,
  key: string,
  vars?: TranslationVars,
): string => {
  const value = lookupBoth(language, key);

  if (typeof value !== "string") {
    warnMissing(key, "translation");
    return key;
  }

  return interpolate(value, vars);
};

const lookupBoth = (language: Language, key: string): TranslationNode | undefined =>
  lookup(RESOURCES[language], key) ?? lookup(RESOURCES[DEFAULT_LANGUAGE], key);

const warnMissing = (key: string, what: string) => {
  if (import.meta.env.DEV && !missing.has(key)) {
    missing.add(key);
    console.warn(`[i18n] missing ${what}: ${key}`);
  }
};

/** Resolve a key whose value is a JSON array of strings — bullet lists, tags. */
export const translateList = (language: Language, key: string): string[] => {
  const value = lookupBoth(language, key);
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    warnMissing(key, "string list");
    return [];
  }
  return value as string[];
};

/** Resolve a key whose value is a JSON array of string arrays — table rows. */
export const translateMatrix = (language: Language, key: string): string[][] => {
  const value = lookupBoth(language, key);
  if (!Array.isArray(value)) {
    warnMissing(key, "table rows");
    return [];
  }
  return value.filter(Array.isArray).map((row) => (row as string[]).map(String));
};

/** Pick a value from an object keyed by language — for data that ships both forms. */
export const pickLocalized = <T,>(
  language: Language,
  value: Partial<Record<Language, T>>,
): T | undefined => value[language] ?? value[DEFAULT_LANGUAGE];
