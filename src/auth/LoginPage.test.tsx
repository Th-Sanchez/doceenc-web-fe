import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText("E-mail de acesso"), email);
  if (password) await user.type(screen.getByLabelText("Sua senha secreta"), password);
  await user.click(screen.getByRole("button", { name: "Entrar na Confeitaria" }));
}

describe("LoginPage", () => {
  it("asks for the missing fields without calling the API", async () => {
    mockSession(null);
    let loginCalls = 0;
    server.use(
      http.post(`${API}/api/v1/auth/login`, () => {
        loginCalls++;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp("/login");

    await fillAndSubmit("", "");

    expect(await screen.findByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
    expect(loginCalls).toBe(0);
  });

  it("rejects a malformed e-mail", async () => {
    mockSession(null);
    renderApp("/login");

    await fillAndSubmit("not-an-email", "secret");

    expect(await screen.findByText("Informe um e-mail válido.")).toBeInTheDocument();
  });

  it("logs in, sends the required header and shows the app", async () => {
    let loggedIn = false;
    let requiredHeader: string | null = null;
    server.use(
      http.get(`${API}/api/v1/auth/me`, () =>
        loggedIn ? HttpResponse.json({ email: USER_EMAIL }) : problem(401, "UNAUTHENTICATED"),
      ),
      http.post(`${API}/api/v1/auth/login`, ({ request }) => {
        requiredHeader = request.headers.get("x-requested-with");
        loggedIn = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp("/login");

    await fillAndSubmit(USER_EMAIL, "a-strong-password");

    expect(await screen.findByRole("heading", { name: "Bem-vinda!" })).toBeInTheDocument();
    expect(screen.getByText(USER_EMAIL)).toBeInTheDocument();
    expect(requiredHeader).toBeTruthy();
  });

  it("shows a friendly message for invalid credentials", async () => {
    mockSession(null);
    server.use(http.post(`${API}/api/v1/auth/login`, () => problem(401, "INVALID_CREDENTIALS")));
    renderApp("/login");

    await fillAndSubmit(USER_EMAIL, "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
  });

  it("shows a connection message when the API is unreachable", async () => {
    mockSession(null);
    server.use(http.post(`${API}/api/v1/auth/login`, () => HttpResponse.error()));
    renderApp("/login");

    await fillAndSubmit(USER_EMAIL, "a-strong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor");
  });

  it("sends a user who is already logged in straight to the app", async () => {
    mockSession(USER_EMAIL);
    renderApp("/login");

    expect(await screen.findByRole("heading", { name: "Bem-vinda!" })).toBeInTheDocument();
  });
});
