import { test, expect } from "@playwright/test";

// Golden-path smoke: a fresh user signs up, logs back in, and creates their
// first project and track. Exercises the whole stack — React app, cookie auth
// through the proxy, Spring API and Postgres — in one browser journey.
test("signup, login, create a project and a track", async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-${stamp}@example.com`;
  const username = `e2e_${stamp}`;
  const password = "Password1!";
  const projectName = `E2E Project ${stamp}`;
  const trackName = `E2E Track ${stamp}`;

  // Register — the app authenticates and lands on the dashboard.
  await page.goto("/register");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Nom d'utilisateur").fill(username);
  await page.getByPlaceholder("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer un compte" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Log out, then log back in with the same credentials.
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Create a project — the dialog submit navigates to the project page.
  await page.getByRole("button", { name: "Nouveau projet" }).click();
  const projectDialog = page.getByRole("dialog");
  await projectDialog.getByPlaceholder("Mon album, EP Printemps…").fill(projectName);
  await projectDialog.getByRole("button", { name: "Créer le projet" }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);
  // The name renders in both the header and the page title — either proves it.
  await expect(page.getByText(projectName).first()).toBeVisible();

  // Create a track (metadata only, no audio) — it shows up in the list.
  await page.getByRole("button", { name: "Nouvelle track" }).click();
  const trackDialog = page.getByRole("dialog");
  await trackDialog.getByPlaceholder("Ex: Intro, Couplet 1…").fill(trackName);
  await trackDialog.getByRole("button", { name: "Créer la track" }).click();
  await expect(trackDialog).toBeHidden();
  await expect(page.getByText(trackName).first()).toBeVisible();
});
