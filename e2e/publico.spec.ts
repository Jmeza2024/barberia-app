import { test, expect } from "@playwright/test";
import { sinErrores } from "./ayuda";

test.describe("Páginas para clientes", () => {
  test("inicio: logo, botón de reservar, servicios y productos", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Navia Barber Studio/);
    await expect(page.getByRole("heading", { name: "Servicios" })).toBeVisible();
    const reservar = page.getByRole("link", { name: /Reservar cita/ }).first();
    await expect(reservar).toBeVisible();
    await reservar.click();
    await expect(page).toHaveURL(/\/reservar/);
    await sinErrores(page);
  });

  test("reservar: se puede avanzar hasta los datos sin guardar nada", async ({ page }) => {
    await page.goto("/reservar");
    await expect(page.getByRole("heading", { name: "¿Qué te vas a hacer?" })).toBeVisible();
    await page.locator("section ul button").first().click();

    await expect(page.getByRole("heading", { name: "¿Con quién?" })).toBeVisible();
    await page.locator("section ul button").first().click();

    await expect(page.getByRole("heading", { name: "¿Cuándo?" })).toBeVisible();
    // Busca el primer día con alguna hora libre.
    const dias = page.locator("section > div").first().locator("button");
    const horas = page.locator("section .grid button");
    let hayHora = false;
    for (let i = 0; i < (await dias.count()) && !hayHora; i++) {
      await dias.nth(i).click();
      await expect(page.getByText("Buscando horas libres…")).toHaveCount(0);
      hayHora = (await horas.count()) > 0;
    }
    expect(hayHora, "ningún día de las próximas semanas tiene horas libres").toBe(true);
    await horas.first().click();

    await expect(page.getByRole("heading", { name: "Tus datos" })).toBeVisible();
    await expect(page.getByPlaceholder("Tu nombre")).toHaveAttribute("maxlength", "60");
    await expect(page.getByRole("button", { name: "Confirmar cita" })).toBeVisible();
    await sinErrores(page);
  });

  test("mi tarjeta: un número sin cortes muestra el aviso", async ({ page }) => {
    await page.goto("/tarjeta");
    await expect(page.getByRole("heading", { name: "Mi tarjeta" })).toBeVisible();
    await page.getByPlaceholder("Tu celular").fill(`399${Date.now().toString().slice(-7)}`);
    await page.getByRole("button", { name: "Ver" }).click();
    await expect(page.getByText(/No encontramos cortes con ese número/)).toBeVisible();
    await sinErrores(page);
  });

  test("una cita que no existe muestra un aviso, no un error", async ({ page }) => {
    await page.goto("/cita/noexiste123");
    await expect(page.getByRole("heading", { name: "No encontramos esta cita" })).toBeVisible();
    await sinErrores(page);
  });
});
