import { test, expect } from "@playwright/test";
import { BARBERO, DUENO, ingresar, sinErrores } from "./ayuda";

test.describe("Ingreso", () => {
  test("sin sesión, el panel manda a /ingresar", async ({ page }) => {
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/ingresar/);
    await expect(page.getByRole("heading", { name: "Ingreso del equipo" })).toBeVisible();
  });

  test("contraseña equivocada muestra el error", async ({ page }) => {
    await page.goto("/ingresar");
    await page.locator('input[type="email"]').fill(DUENO.correo);
    await page.locator('input[type="password"]').fill("esta-no-es");
    await page.locator("form button").click();
    await expect(page.getByText("Correo o contraseña incorrectos")).toBeVisible();
  });
});

test.describe("Panel del dueño", () => {
  test.beforeEach(async ({ page }) => ingresar(page, DUENO));

  const pantallas: [string, string | RegExp][] = [
    ["/panel", /^(Hoy|.+ de .+)$/],
    ["/panel/nueva-cita", "Nueva cita"],
    ["/panel/ventas", /^Ventas/],
    ["/panel/ventas/nueva", "Registrar venta"],
    ["/panel/productos", "Productos"],
    ["/panel/servicios", "Servicios y precios"],
    ["/panel/barberos", "Barberos"],
    ["/panel/recordatorios", "Recordatorios"],
    ["/panel/reportes", "Reportes"],
    ["/panel/mas", "Más"],
  ];

  for (const [ruta, titulo] of pantallas) {
    test(`abre ${ruta}`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page).toHaveURL(new RegExp(`${ruta}$`));
      await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
      await sinErrores(page);
    });
  }
});

test.describe("Panel del barbero", () => {
  test.beforeEach(async ({ page }) => ingresar(page, BARBERO));

  test("ve su agenda", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await sinErrores(page);
  });

  for (const ruta of ["/panel/barberos", "/panel/servicios", "/panel/reportes"]) {
    test(`no puede abrir ${ruta}`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/panel$/);
    });
  }
});
