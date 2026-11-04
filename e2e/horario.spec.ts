import { test, expect, type Page } from "@playwright/test";
import { BARBERO, DUENO, ESCRIBIR, HAY_BARBERO, HAY_DUENO, SIN_USUARIO, ingresar, sinErrores } from "./ayuda";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cambia el horario y cierra días: solo en una base de pruebas, y una sola vez.
test.skip(!ESCRIBIR, "Cambia el horario: activa con E2E_ESCRIBIR=1 (solo en una base de pruebas)");
test.beforeEach(({}, info) => test.skip(info.project.name !== "computador", "Basta con correrla una vez"));

// Un día a partir de hoy que caiga en el día de la semana pedido (0 = domingo).
function proximo(diaSemana: number) {
  const d = new Date(Date.now() - 5 * 3600 * 1000);
  do d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() !== diaSemana);
  return d.toISOString().slice(0, 10);
}

async function horasLibres(page: Page, fecha: string) {
  const h = { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" };
  const servicios = await (await page.request.get(`${URL}/rest/v1/servicios?select=id,nombre&activo=eq.true`, { headers: h })).json();
  const corte = servicios.find((s: { nombre: string }) => /corte/i.test(s.nombre)) ?? servicios[0];
  const r = await page.request.post(`${URL}/rest/v1/rpc/horas_del_dia`, {
    headers: h,
    data: { p_servicio: corte.id, p_fecha: fecha },
  });
  return (await r.json()) as { inicio: string; reservada: boolean }[];
}

test.describe("Horario y días libres", () => {
  test.skip(!HAY_DUENO, SIN_USUARIO);

  test("el dueño cambia el horario y se aplica al reservar", async ({ page }) => {
    await ingresar(page, DUENO);
    await page.goto("/panel/horario");
    await expect(page.getByRole("heading", { level: 1, name: "Horario y días libres" })).toBeVisible();

    // Jueves: abre 10:00, cierra 14:00, sin pausa.
    await page.locator('input[name="abre-4"]').fill("10:00");
    await page.locator('input[name="cierra-4"]').fill("14:00");
    await page.locator('input[name="descanso-4"]').uncheck();
    await page.getByRole("button", { name: "Guardar horario" }).click();
    await expect(page.getByText("Horario guardado")).toBeVisible();

    const horas = await horasLibres(page, proximo(4));
    const enBogota = horas.map((h) =>
      new Date(h.inicio).toLocaleTimeString("en-GB", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit" }),
    );
    expect(enBogota[0]).toBe("10:00");
    expect(enBogota.every((h) => h >= "10:00" && h < "14:00")).toBe(true);

    // Deja el jueves como estaba.
    await page.locator('input[name="abre-4"]').fill("08:00");
    await page.locator('input[name="cierra-4"]').fill("20:00");
    await page.locator('input[name="descanso-4"]').check();
    await page.getByRole("button", { name: "Guardar horario" }).click();
    await expect(page.getByText("Horario guardado")).toBeVisible();
    await sinErrores(page);
  });

  test("una hora de cierre antes de la apertura no se guarda", async ({ page }) => {
    await ingresar(page, DUENO);
    await page.goto("/panel/horario");
    await page.locator('input[name="abre-2"]').fill("18:00");
    await page.locator('input[name="cierra-2"]').fill("09:00");
    await page.getByRole("button", { name: "Guardar horario" }).click();
    await expect(page.getByText(/la hora de cierre debe ser después/)).toBeVisible();
  });

  test("cerrar y abrir un día de toda la barbería", async ({ page }) => {
    await ingresar(page, DUENO);
    const fecha = proximo(5);
    expect((await horasLibres(page, fecha)).length).toBeGreaterThan(0);

    await page.goto("/panel/horario");
    await page.locator('input[name="fecha"]').fill(fecha);
    await page.locator('select[name="quien"]').selectOption("todos");
    await page.getByRole("button", { name: "Cerrar el día" }).click();
    await expect(page.getByText(/Día cerrado/)).toBeVisible();
    expect(await horasLibres(page, fecha)).toEqual([]);

    await page.getByRole("button", { name: "Abrir otra vez" }).first().click();
    await expect(page.getByText("Día abierto otra vez")).toBeVisible();
    expect((await horasLibres(page, fecha)).length).toBeGreaterThan(0);
  });
});

test.describe("El barbero y sus días", () => {
  test.skip(!HAY_BARBERO, SIN_USUARIO);

  test("ve cerrar un día pero no el horario de la barbería", async ({ page }) => {
    await ingresar(page, BARBERO);
    await page.goto("/panel/horario");
    await expect(page.getByRole("button", { name: "Cerrar el día" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar horario" })).toHaveCount(0);
    await expect(page.locator('select[name="quien"]')).toHaveCount(0);
    await sinErrores(page);
  });
});
