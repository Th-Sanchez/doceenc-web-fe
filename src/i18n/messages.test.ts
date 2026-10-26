import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/problem";
import { messageForError } from "./messages";

describe("messageForError", () => {
  it("translates known API error codes", () => {
    const error = new ApiError(401, { code: "INVALID_CREDENTIALS" });
    expect(messageForError(error)).toBe("E-mail ou senha inválidos.");
  });

  it("falls back to a generic message for unknown codes and missing problem bodies", () => {
    expect(messageForError(new ApiError(400, { code: "SOMETHING_NEW" }))).toBe("Algo deu errado. Tente novamente.");
    expect(messageForError(new ApiError(502))).toBe("Algo deu errado. Tente novamente.");
  });

  it("explains connection failures", () => {
    expect(messageForError(new TypeError("Failed to fetch"))).toContain("Não foi possível conectar");
  });
});
