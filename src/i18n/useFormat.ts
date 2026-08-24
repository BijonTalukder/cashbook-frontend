import { useMemo } from "react";
import { useLanguageStore } from "../store/languageStore";
import { useBusinessStore } from "../store/businessStore";
import { LANGUAGE_META, type Language } from "./config";
import {
  CURRENCY_META,
  formatCompact,
  formatMoney,
  formatNumber,
  toCurrency,
  type Currency,
  type MoneyOptions,
  type NumberOptions,
} from "../utils/currency";

export type DateStyle = "short" | "medium" | "long" | "day" | "monthYear" | "weekday";

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: "2-digit", month: "short" },
  medium: { day: "2-digit", month: "short", year: "numeric" },
  long: { day: "numeric", month: "long", year: "numeric" },
  day: { day: "2-digit" },
  monthYear: { month: "long", year: "numeric" },
  weekday: { weekday: "long" },
};

const toDate = (value: string | number | Date): Date =>
  value instanceof Date ? value : new Date(value);

/**
 * Locale-aware number, money and date formatting.
 * Money uses the active business's currency (BDT or USD); digits follow the
 * chosen language, so Bangla renders ৳১,২৫,০০০ and English ৳1,25,000.
 */
export const useFormat = (currencyOverride?: Currency) => {
  const language = useLanguageStore((s) => s.language);
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);

  const currency = currencyOverride ?? toCurrency(activeBusiness?.currency);

  return useMemo(() => {
    const locale = LANGUAGE_META[language].locale;

    const num = (value: number, opts?: NumberOptions) =>
      formatNumber(value, language, opts);

    const money = (value: number, opts?: MoneyOptions) =>
      formatMoney(value, currency, language, opts);

    const compact = (value: number, withSymbol = false) =>
      formatCompact(value, language, withSymbol ? currency : undefined);

    const date = (value: string | number | Date | null | undefined, style: DateStyle = "medium") => {
      if (value === null || value === undefined || value === "") return "";
      const d = toDate(value);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleDateString(locale, DATE_OPTIONS[style]);
    };

    const time = (value: string | number | Date | null | undefined) => {
      if (value === null || value === undefined || value === "") return "";
      const d = toDate(value);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    };

    /** Localised month name by 0-based index — for chart axes and month pickers. */
    const monthName = (index: number, style: "short" | "long" = "short") =>
      new Date(2000, ((index % 12) + 12) % 12, 1).toLocaleDateString(locale, { month: style });

    /** Localised weekday name by index, 0 = Sunday — for calendar headers. */
    const weekdayName = (index: number, style: "short" | "long" | "narrow" = "short") =>
      // 2024-01-07 was a Sunday, so adding the index lands on the right weekday.
      new Date(2024, 0, 7 + (((index % 7) + 7) % 7)).toLocaleDateString(locale, { weekday: style });

    const dateTime = (value: string | number | Date | null | undefined) => {
      const dd = date(value, "medium");
      return dd ? `${dd}, ${time(value)}` : "";
    };

    return {
      language,
      locale,
      currency,
      symbol: CURRENCY_META[currency].symbol,
      num,
      money,
      compact,
      date,
      time,
      dateTime,
      monthName,
      weekdayName,
    };
  }, [language, currency]);
};

export type { Currency, Language };
