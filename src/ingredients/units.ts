import type { BaseUnit, PriceInput } from "@/api/types";

export const BASE_UNITS: BaseUnit[] = ["GRAM", "MILLILITER", "UNIT"];

/** The UI only ever sends base units; KG and L exist in the API but are not offered here. */
export const INPUT_UNIT: Record<BaseUnit, PriceInput["unit"]> = {
  GRAM: "G",
  MILLILITER: "ML",
  UNIT: "UNIT",
};