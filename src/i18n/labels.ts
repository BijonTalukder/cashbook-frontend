import type { TFunction } from "./useTranslation";

/** Title-case fallback for server-supplied values that have no translation key. */
const titleCase = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

/**
 * Translate an enum-ish value coming from the API, falling back to a
 * title-cased version of the raw value when the key is missing.
 */
export const enumLabel = (t: TFunction, namespace: string, value?: string | null): string => {
  if (!value) return "";
  const key = `${namespace}.${value}`;
  const label = t(key);
  return label === key ? titleCase(value) : label;
};

export const paymentMethodLabel = (t: TFunction, method?: string | null) =>
  enumLabel(t, "paymentMethod", method);

/**
 * Simple two-form plural: looks up `<keyBase>One` or `<keyBase>Other`.
 * Bangla defines both forms identically; English differentiates.
 */
export const plural = (
  t: TFunction,
  keyBase: string,
  count: number,
  vars: Record<string, string | number> = {},
) => t(`${keyBase}${count === 1 ? "One" : "Other"}`, { ...vars, count });
