import { z } from "zod";
import { messages } from "@/i18n/messages";
import { decimalField } from "@/lib/decimal-field";

const s = messages.settings.validation;

/** Percentage in [0, 99.99] with at most two decimals, the same range the server accepts. */
const margin = decimalField({
  min: 0,
  max: 99.99,
  decimals: 2,
  minMessage: s.marginRange,
  maxMessage: s.marginRange,
});

export const settingsSchema = z.object({
  targetMarginRetail: margin,
  targetMarginWholesale: margin,
});

export type SettingsFormInput = z.input<typeof settingsSchema>;
export type SettingsFormValues = z.output<typeof settingsSchema>;