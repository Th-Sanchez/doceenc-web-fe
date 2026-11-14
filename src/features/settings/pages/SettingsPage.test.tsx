import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import { renderApp } from "@/test/render";
import { mockSettings, mockSettingsUpdate, settingsFixture } from "@/test/settings";
import { server } from "@/test/server";

const t = messages.settings;

const retailInput = () => screen.getByLabelText(t.retail, { exact: false });
const wholesaleInput = () => screen.getByLabelText(t.wholesale, { exact: false });

describe("settings page", () => {
  it("shows the current targets and keeps save disabled until something changes", async () => {
    mockSession(USER_EMAIL);
    mockSettings(settingsFixture({ targetMarginRetail: 50, targetMarginWholesale: 35.5 }));
    renderApp("/settings");

    await screen.findByLabelText(t.retail, { exact: false });
    expect(retailInput()).toHaveValue("50");
    expect(wholesaleInput()).toHaveValue("35,5");
    expect(screen.getByRole("button", { name: t.save })).toBeDisabled();
  });

  it("saves both targets as numbers and confirms", async () => {
    mockSession(USER_EMAIL);
    mockSettings();
    const calls = mockSettingsUpdate();
    const user = userEvent.setup();
    renderApp("/settings");

    await screen.findByLabelText(t.retail, { exact: false });
    await user.clear(retailInput());
    await user.type(retailInput(), "42,5");
    await user.click(screen.getByRole("button", { name: t.save }));

    expect(await screen.findByText(t.saved)).toBeInTheDocument();
    expect(calls).toEqual([{ targetMarginRetail: 42.5, targetMarginWholesale: 35 }]);
    // the saved values are the new baseline: nothing left to save
    expect(screen.getByRole("button", { name: t.save })).toBeDisabled();
  });

  it("hides the confirmation as soon as the person edits again", async () => {
    mockSession(USER_EMAIL);
    mockSettings();
    mockSettingsUpdate();
    const user = userEvent.setup();
    renderApp("/settings");

    await screen.findByLabelText(t.retail, { exact: false });
    await user.clear(retailInput());
    await user.type(retailInput(), "40");
    await user.click(screen.getByRole("button", { name: t.save }));
    await screen.findByText(t.saved);

    await user.clear(wholesaleInput());
    await user.type(wholesaleInput(), "30");

    expect(screen.queryByText(t.saved)).not.toBeInTheDocument();
  });

  it("validates before sending: out of range, too many decimals and blank", async () => {
    mockSession(USER_EMAIL);
    mockSettings();
    const calls = mockSettingsUpdate();
    const user = userEvent.setup();
    renderApp("/settings");

    await screen.findByLabelText(t.retail, { exact: false });
    await user.clear(retailInput());
    await user.type(retailInput(), "100");
    await user.click(screen.getByRole("button", { name: t.save }));
    expect(await screen.findByText(t.validation.marginRange)).toBeInTheDocument();

    await user.clear(retailInput());
    await user.type(retailInput(), "50,123");
    await user.click(screen.getByRole("button", { name: t.save }));
    expect(await screen.findByText(messages.validation.decimals(2))).toBeInTheDocument();

    await user.clear(retailInput());
    await user.click(screen.getByRole("button", { name: t.save }));
    expect(await screen.findByText(messages.validation.required)).toBeInTheDocument();

    expect(calls).toEqual([]);
  });

  it("shows the server's error when saving fails", async () => {
    mockSession(USER_EMAIL);
    mockSettings();
    server.use(http.put(`${API}/api/v1/settings`, () => problem(500, "INTERNAL_ERROR")));
    const user = userEvent.setup();
    renderApp("/settings");

    await screen.findByLabelText(t.retail, { exact: false });
    await user.clear(retailInput());
    await user.type(retailInput(), "40");
    await user.click(screen.getByRole("button", { name: t.save }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Algo deu errado do nosso lado.");
    expect(screen.queryByText(t.saved)).not.toBeInTheDocument();
  });

  it("shows an error with a retry button when the settings fail to load", async () => {
    mockSession(USER_EMAIL);
    server.use(http.get(`${API}/api/v1/settings`, () => problem(500, "INTERNAL_ERROR")));
    const user = userEvent.setup();
    renderApp("/settings");

    expect(await screen.findByRole("alert")).toHaveTextContent(t.loadError);

    mockSettings();
    await user.click(screen.getByRole("button", { name: t.retry }));
    await waitFor(() => expect(retailInput()).toHaveValue("50"));
  });
});