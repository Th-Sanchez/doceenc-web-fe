import type { BaseUnit } from "@/api/types";
import { messages } from "@/i18n/messages";
import { formatMoney, formatUnitCost } from "@/lib/format";

/** 45 -> "45 min", 60 -> "1h", 80 -> "1h 20 min". */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest} min`;
}

/**
 * Cost of one yield unit. Per piece it reads as money (R$ 0,72); per gram or ml it is a fraction
 * of a cent and needs the extra digits, like the ingredient unit cost.
 */
export function formatRecipeUnitCost(value: number, unit: BaseUnit): string {
  return unit === "UNIT" ? formatMoney(value) : formatUnitCost(value, unit);
}

/** Same as above but always with the unit, for places that have no "Custo / un" label ("R$ 0,72 / un"). */
export function formatRecipeUnitCostWithUnit(value: number, unit: BaseUnit): string {
  return unit === "UNIT" ? `${formatMoney(value)} / ${messages.units.UNIT}` : formatUnitCost(value, unit);
}