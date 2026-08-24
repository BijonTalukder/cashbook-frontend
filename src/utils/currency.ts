import type { Language } from "../i18n/config";

/* ─── Supported currencies ────────────────────────────────
 * Display-only: amounts are stored and entered in the business's
 * own currency, so there is no FX conversion anywhere.
 * ─────────────────────────────────────────────────────────── */

export const CURRENCIES = ["BDT", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "BDT";

export interface CurrencyMeta {
  code: Currency;
  symbol: string;
  /** Locale that drives digit grouping — BDT uses lakh/crore grouping. */
  groupingLocale: string;
  minimumFractionDigits: number;
  maximumFractionDigits: number;
}

export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  BDT: {
    code: "BDT",
    symbol: "৳",
    groupingLocale: "en-IN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  USD: {
    code: "USD",
    symbol: "$",
    groupingLocale: "en-US",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
};

export const isCurrency = (v: unknown): v is Currency =>
  typeof v === "string" && (CURRENCIES as readonly string[]).includes(v);

/** Coerce whatever the API returns (legacy EUR/GBP/INR rows included) to a supported code. */
export const toCurrency = (v: unknown): Currency =>
  isCurrency(v) ? v : DEFAULT_CURRENCY;

export const currencySymbol = (v: unknown): string =>
  CURRENCY_META[toCurrency(v)].symbol;

/* ─── Digit localisation ──────────────────────────────────── */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const toBanglaDigits = (s: string): string =>
  s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);

export const localizeDigits = (s: string, language: Language): string =>
  language === "bn" ? toBanglaDigits(s) : s;

/* ─── Number formatting ───────────────────────────────────── */

export interface NumberOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** Override the grouping locale (defaults to the language's regional grouping). */
  groupingLocale?: string;
  /** Set false for values that are not quantities — years, invoice numbers. */
  useGrouping?: boolean;
}

const groupingFor = (language: Language) => (language === "bn" ? "en-IN" : "en-US");

export const formatNumber = (
  value: number,
  language: Language,
  opts: NumberOptions = {},
): string => {
  const n = Number.isFinite(value) ? value : 0;
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = Math.max(minimumFractionDigits, 2),
    groupingLocale = groupingFor(language),
    useGrouping = true,
  } = opts;

  const text = new Intl.NumberFormat(groupingLocale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }).format(n);

  return localizeDigits(text, language);
};

/* ─── Money formatting ────────────────────────────────────── */

export interface MoneyOptions extends NumberOptions {
  /** Drop the currency symbol — useful inside inputs and invoice tables. */
  symbol?: boolean;
  /** Force a fixed number of decimals regardless of the currency default. */
  decimals?: number;
  /** Prefix non-negative values with "+" (used by ledger rows). */
  signed?: boolean;
}

/**
 * `-৳1,25,000` / `$125,000.00` — the sign always leads the symbol so
 * negative amounts read correctly instead of `৳-125,000`.
 */
export const formatMoney = (
  value: number,
  currency: Currency,
  language: Language,
  opts: MoneyOptions = {},
): string => {
  const meta = CURRENCY_META[currency];
  const { symbol = true, decimals, signed = false } = opts;
  const n = Number.isFinite(value) ? value : 0;

  const digits = formatNumber(Math.abs(n), language, {
    groupingLocale: opts.groupingLocale ?? meta.groupingLocale,
    minimumFractionDigits: decimals ?? opts.minimumFractionDigits ?? meta.minimumFractionDigits,
    maximumFractionDigits: decimals ?? opts.maximumFractionDigits ?? meta.maximumFractionDigits,
  });

  const sign = n < 0 ? "-" : signed ? "+" : "";
  return `${sign}${symbol ? meta.symbol : ""}${digits}`;
};

/** Compact form for chart axes: `12k`, `1.5M`, `৳12k`. */
export const formatCompact = (
  value: number,
  language: Language,
  currency?: Currency,
): string => {
  const n = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const prefix = currency ? CURRENCY_META[currency].symbol : "";

  let body: string;
  if (abs >= 1_000_000) body = `${formatNumber(abs / 1_000_000, language, { maximumFractionDigits: 1 })}M`;
  else if (abs >= 1_000) body = `${formatNumber(abs / 1_000, language, { maximumFractionDigits: 0 })}k`;
  else body = formatNumber(abs, language, { maximumFractionDigits: 0 });

  return `${sign}${prefix}${body}`;
};

/** Strips grouping separators and Bangla digits so typed input parses back to a number. */
export const parseAmount = (input: string): number => {
  const latin = input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  const cleaned = latin.replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};
