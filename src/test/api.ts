import { http, HttpResponse } from "msw";
import { server } from "./server";

/** Same value as VITE_API_BASE_URL in the test environment (see vite.config.ts). */
export const API = "http://localhost";

export function problem(status: number, code: string, detail = "error") {
  return HttpResponse.json(
    { type: "about:blank", title: "error", status, detail, code },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

export const USER_EMAIL = "tester@example.com";

/** GET /me answers with the user, or 401 when null. */
export function mockSession(email: string | null) {
  server.use(
    http.get(`${API}/api/v1/auth/me`, () =>
      email ? HttpResponse.json({ email }) : problem(401, "UNAUTHENTICATED"),
    ),
  );
}
