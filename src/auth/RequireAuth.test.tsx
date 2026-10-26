import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";

describe("route protection", () => {
  it("redirects to the login page when nobody is logged in", async () => {
    mockSession(null);
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("shows the app to a logged-in user", async () => {
    mockSession(USER_EMAIL);
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Bem-vinda!" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();
  });

  it("offers a retry when the session cannot be checked", async () => {
    server.use(http.get(`${API}/api/v1/auth/me`, () => problem(500, "INTERNAL_ERROR")));
    renderApp("/");

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível verificar sua sessão");

    mockSession(USER_EMAIL);
    await userEvent.setup().click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("heading", { name: "Bem-vinda!" })).toBeInTheDocument();
  });

  it("logs out and goes back to the login page", async () => {
    let requiredHeader: string | null = null;
    mockSession(USER_EMAIL);
    server.use(
      http.post(`${API}/api/v1/auth/logout`, ({ request }) => {
        requiredHeader = request.headers.get("x-requested-with");
        mockSession(null);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp("/");

    await userEvent.setup().click(await screen.findByRole("button", { name: "Sair" }));

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(requiredHeader).toBeTruthy();
  });

  it("sends the user to the login page when a request finds the session expired", async () => {
    mockSession(USER_EMAIL);
    server.use(http.post(`${API}/api/v1/auth/logout`, () => problem(401, "UNAUTHENTICATED")));
    renderApp("/");

    await userEvent.setup().click(await screen.findByRole("button", { name: "Sair" }));

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });
});
