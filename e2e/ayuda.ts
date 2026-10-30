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

// Los usuarios de ejemplo solo existen en la base local. Contra la base real,
// las pruebas del panel necesitan un usuario de prueba de verdad en las variables E2E_*.
const BASE_LOCAL = /127\.0\.0\.1|localhost/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
export const HAY_DUENO = BASE_LOCAL || !!process.env.E2E_DUENO_CORREO;
export const HAY_BARBERO = BASE_LOCAL || !!process.env.E2E_BARBERO_CORREO;
export const SIN_USUARIO = "Falta un usuario de prueba: pon E2E_DUENO_CORREO / E2E_BARBERO_CORREO y su clave";

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
