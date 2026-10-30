import { expect, type Page } from "@playwright/test";

export const DUENO = {
  correo: process.env.E2E_DUENO_CORREO ?? "dueno@ejemplo.com",
  clave: process.env.E2E_DUENO_CLAVE ?? "clave12345",
};

export const BARBERO = {
  correo: process.env.E2E_BARBERO_CORREO ?? "carlos@ejemplo.com",
  clave: process.env.E2E_BARBERO_CLAVE ?? "clave12345",
};

export const ESCRIBIR = process.env.E2E_ESCRIBIR === "1";

// Ninguna pantalla debe mostrar el error genérico de Next.
export async function sinErrores(page: Page) {
  await expect(page.getByText("Application error")).toHaveCount(0);
  await expect(page.getByText("This page could not be found")).toHaveCount(0);
}

export async function ingresar(page: Page, quien: { correo: string; clave: string }) {
  await page.goto("/ingresar");
  await page.locator('input[type="email"]').fill(quien.correo);
  await page.locator('input[type="password"]').fill(quien.clave);
  await page.locator("form button").click();
  await page.waitForURL(/\/panel/);
}
