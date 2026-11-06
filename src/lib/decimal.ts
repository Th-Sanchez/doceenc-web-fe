/**
 * Parses what a person types in a pt-BR number field.
 *  - With a comma, the comma is the decimal separator and dots must be valid thousands separators:
 *    "1.234,56" and "1234,56" are 1234.56.
 *  - Without a comma, a dot followed by exactly three digits is a thousands separator ("1.234" is 1234);
 *    any other dot is a decimal point ("7.90" is 7.9, "1.2345" is 1.2345).
 * Returns null for anything else (letters, negatives, malformed grouping).
 */
export function parseDecimal(input: string): number | null {
  const text = input.replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (text === "") return null;

  let normalized: string;
  if (text.includes(",")) {
    if (!/^(\d{1,3}(\.\d{3})+|\d*),\d*$/.test(text)) return null;
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    normalized = text.replace(/\./g, "");
  } else if (/^\d+(\.\d+)?$/.test(text)) {
    normalized = text;
  } else {
    return null;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Text for pre-filling an input from a stored number (no thousands separator, comma as decimal). */
export function toInputText(value: number, minFractionDigits = 0): string {
  return value.toLocaleString("pt-BR", {
    useGrouping: false,
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: 4,
  });
}