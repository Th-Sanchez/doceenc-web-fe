import { vi } from "vitest";

/** jsdom has no matchMedia: every media query gets the same answer. */
export function mockViewport(isDesktop: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: isDesktop,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}