import type { BaseUnit } from "@/api/types";
import { messages } from "@/i18n/messages";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const unitMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});
const quantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });
const variation = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export const formatMoney = (value: number) => money.format(value);

/** "R$ 0,0190 / g": the unit cost comes from the API; this only formats it. */
export const formatUnitCost = (value: number, unit: BaseUnit) =>
  `${unitMoney.format(value)} / ${messages.units[unit]}`;

export const formatQuantity = (value: number, unit: BaseUnit) =>
  `${quantity.format(value)} ${messages.units[unit]}`;

/** Variation in percent as sent by the API (20 means +20%). */
export const formatVariation = (value: number) => `${variation.format(value)}%`;

export type Trend = "up" | "down" | "flat";

/** "flat" exactly when the value is displayed as 0,0%. */
export function variationTrend(value: number): Trend {
  if (Math.abs(value) < 0.05) return "flat";
  return value > 0 ? "up" : "down";
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as "YYYY-MM-DD" (toISOString would shift it to UTC). */
export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(iso: string): string {
  const date = parseIsoDate(iso);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** "Ontem, 24/Out", "15/Out" (year only when it is not the current one). */
export function formatLastPurchase(iso: string, today: Date = new Date()): string {
  const date = parseIsoDate(iso);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysAgo = Math.round((startOfToday.getTime() - date.getTime()) / 86_400_000);

  const year = date.getFullYear() === today.getFullYear() ? "" : `/${date.getFullYear()}`;
  const short = `${pad(date.getDate())}/${messages.months[date.getMonth()]}${year}`;

  if (daysAgo === 0) return `${messages.dates.today}, ${short}`;
  if (daysAgo === 1) return `${messages.dates.yesterday}, ${short}`;
  return short;
}