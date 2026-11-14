import { http, HttpResponse } from "msw";
import type { Settings, UpdateSettingsInput } from "@/api/types";
import { API } from "./api";
import { server } from "./server";

export function settingsFixture(overrides: Partial<Settings> = {}): Settings {
  return {
    targetMarginRetail: 50,
    targetMarginWholesale: 35,
    updatedAt: "2026-11-10T10:00:00Z",
    ...overrides,
  };
}

export function mockSettings(settings: Settings = settingsFixture()) {
  server.use(http.get(`${API}/api/v1/settings`, () => HttpResponse.json(settings)));
}

/** Accepts every update, answers with what was sent, and returns the list of bodies it received. */
export function mockSettingsUpdate() {
  const calls: UpdateSettingsInput[] = [];
  server.use(
    http.put(`${API}/api/v1/settings`, async ({ request }) => {
      const body = (await request.json()) as UpdateSettingsInput;
      calls.push(body);
      return HttpResponse.json(settingsFixture(body));
    }),
  );
  return calls;
}