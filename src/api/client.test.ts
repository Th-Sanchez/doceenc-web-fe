import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { API, problem } from "@/test/api";
import { server } from "@/test/server";
import { api, REQUIRED_HEADER, setUnauthorizedHandler } from "./client";

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the session cookie with every request", async () => {
    server.use(http.get(`${API}/api/v1/auth/me`, () => HttpResponse.json({ email: "a@b.com" })));
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await api.GET("/api/v1/auth/me");

    // The request object built by the client (MSW rebuilds its own copy, so it cannot be asserted there).
    const request = fetchSpy.mock.calls[0]?.[0] as Request;
    expect(request.credentials).toBe("include");
  });

  it("adds the required header to requests that change state, not to reads", async () => {
    const seen: Record<string, string | null> = {};
    server.use(
      http.get(`${API}/api/v1/auth/me`, ({ request }) => {
        seen.get = request.headers.get(REQUIRED_HEADER);
        return HttpResponse.json({ email: "a@b.com" });
      }),
      http.post(`${API}/api/v1/auth/logout`, ({ request }) => {
        seen.post = request.headers.get(REQUIRED_HEADER);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await api.GET("/api/v1/auth/me");
    await api.POST("/api/v1/auth/logout");

    expect(seen.get).toBeNull();
    expect(seen.post).toBeTruthy();
  });

  it("notifies when a request other than login/me finds the session expired", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    server.use(http.post(`${API}/api/v1/auth/logout`, () => problem(401, "UNAUTHENTICATED")));

    await api.POST("/api/v1/auth/logout");

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not treat a 401 from me or login as an expired session", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    server.use(
      http.get(`${API}/api/v1/auth/me`, () => problem(401, "UNAUTHENTICATED")),
      http.post(`${API}/api/v1/auth/login`, () => problem(401, "INVALID_CREDENTIALS")),
    );

    await api.GET("/api/v1/auth/me");
    await api.POST("/api/v1/auth/login", { body: { email: "a@b.com", password: "x" } });

    expect(handler).not.toHaveBeenCalled();
  });
});
