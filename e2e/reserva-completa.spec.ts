import { test, expect } from "@playwright/test";
import { ESCRIBIR, sinErrores } from "./ayuda";

// Crea una cita de verdad y luego la cancela. Solo corre con E2E_ESCRIBIR=1.
test.skip(!ESCRIBIR, "Crea datos: activa con E2E_ESCRIBIR=1 (solo en una base de pruebas)");

test("reservar, ver la cita y cancelarla", async ({ page }, info) => {
  await page.goto("/reservar");
  await page.locator("section ul button").first().click();
  await page.locator("section ul button").first().click();

  const dias = page.locator("section > div").first().locator("button");
  const horas = page.locator("section .grid button");
  // Cada proyecto (celular/computador) usa un día distinto para no chocar.
  const desde = info.project.name === "celular" ? 1 : 2;
  let hayHora = false;
  for (let i = desde; i < (await dias.count()) && !hayHora; i++) {
    await dias.nth(i).click();
    await expect(page.getByText("Buscando horas libres…")).toHaveCount(0);
    hayHora = (await horas.count()) > 0;
  }
  expect(hayHora).toBe(true);
  await horas.last().click();

  await page.getByPlaceholder("Tu nombre").fill("Prueba Automática");
  await page.getByPlaceholder("Celular (WhatsApp)").fill(`300${Date.now().toString().slice(-7)}`);
  await page.getByRole("button", { name: "Confirmar cita" }).click();

  await page.waitForURL(/\/cita\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: "¡Listo, Prueba Automática!" })).toBeVisible();

  await page.getByRole("button", { name: "Cancelar cita" }).click();
  await expect(page.getByText("Cancelada", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancelar cita" })).toHaveCount(0);
  await sinErrores(page);
});
