import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

/**
 * The API rejects requests that change state unless this header is present (CSRF defense for the
 * cookie-based session): a cross-site page cannot add it without a CORS preflight.
 */
export const REQUIRED_HEADER = "X-Requested-With";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// 401 is the normal answer of these endpoints when nobody is logged in, not an expired session.
const AUTH_PROBE_PATHS = new Set<string>(["/api/v1/auth/login", "/api/v1/auth/me"]);

let unauthorizedHandler: (() => void) | undefined;

/** Called when a request other than login/me gets a 401 (the session expired or was revoked). */
export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  unauthorizedHandler = handler;
}

const middleware: Middleware = {
  onRequest({ request }) {
    if (!SAFE_METHODS.has(request.method)) {
      request.headers.set(REQUIRED_HEADER, "doceenc-web");
    }
    return request;
  },
  onResponse({ response, schemaPath }) {
    if (response.status === 401 && !AUTH_PROBE_PATHS.has(schemaPath)) {
      unauthorizedHandler?.();
    }
    return response;
  },
};

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  credentials: "include", // send the session cookie, also when the API is on another subdomain
  // openapi-fetch would otherwise capture globalThis.fetch when this module is imported. Resolving it
  // on every call keeps later replacements (test doubles, instrumentation) in effect.
  fetch: (request) => globalThis.fetch(request),
});
api.use(middleware);
