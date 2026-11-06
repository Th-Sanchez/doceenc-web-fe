import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/api/problem";
import { messageForError, messageForFieldError } from "@/i18n/messages";

export interface ServerErrorMapping<T extends FieldValues> {
  /** Server field path ("price.packagePrice") to form field. */
  fields: Record<string, Path<T>>;
  /** Business error code to the form field it belongs to. */
  codes?: Record<string, Path<T>>;
}

/**
 * Puts server errors on their inputs. Returns the text for the form-level alert,
 * or null when every error found its field.
 */
export function applyServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  { fields, codes = {} }: ServerErrorMapping<T>,
): string | null {
  if (error instanceof ApiError) {
    let placed = false;
    for (const { field, code } of error.fieldErrors) {
      const target = fields[field];
      if (target) {
        setError(target, { type: "server", message: messageForFieldError(code) });
        placed = true;
      }
    }
    const byCode = error.code ? codes[error.code] : undefined;
    if (byCode) {
      setError(byCode, { type: "server", message: messageForError(error) });
      placed = true;
    }
    if (placed) return null;
  }
  return messageForError(error);
}