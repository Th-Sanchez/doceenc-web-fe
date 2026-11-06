import { describe, expect, it, vi } from "vitest";
import { toApiError } from "@/api/problem";
import { applyServerError } from "./form-errors";

type Fields = { packagePrice: string; purchasedOn: string };
const mapping = {
  fields: { "price.packagePrice": "packagePrice" as const },
  codes: { PURCHASE_DATE_IN_FUTURE: "purchasedOn" as const },
};

describe("applyServerError", () => {
  it("places field errors on their inputs and has nothing left for the alert", () => {
    const setError = vi.fn();
    const error = toApiError(400, {
      code: "VALIDATION_FAILED",
      errors: [{ field: "price.packagePrice", code: "DecimalMin" }],
    });

    expect(applyServerError<Fields>(error, setError, mapping)).toBeNull();
    expect(setError).toHaveBeenCalledWith("packagePrice", { type: "server", message: "O valor mínimo é 0,01." });
  });

  it("places a business error on the field it belongs to", () => {
    const setError = vi.fn();
    const error = toApiError(422, { code: "PURCHASE_DATE_IN_FUTURE" });

    expect(applyServerError<Fields>(error, setError, mapping)).toBeNull();
    expect(setError).toHaveBeenCalledWith("purchasedOn", {
      type: "server",
      message: "A data da compra não pode ser no futuro.",
    });
  });

  it("returns the message for the alert when no field matches", () => {
    const setError = vi.fn();

    expect(applyServerError<Fields>(toApiError(409, { code: "INGREDIENT_ALREADY_EXISTS" }), setError, mapping)).toBe(
      "Já existe um insumo com este nome e marca.",
    );
    expect(setError).not.toHaveBeenCalled();
  });
});