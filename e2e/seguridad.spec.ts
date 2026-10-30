import { test, expect } from "@playwright/test";
import { ESCRIBIR } from "./ayuda";

// Habla directo con la API de Supabase usando la llave pública (la misma que ve cualquiera).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const h = { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" };

test.describe("Seguridad de la base de datos", () => {
  test.skip(!URL || !ANON, "Faltan las variables NEXT_PUBLIC_SUPABASE_*");
  test.beforeEach(({}, info) => test.skip(info.project.name !== "computador", "Basta con correrla una vez"));

  test("un visitante no puede leer citas, clientes ni ventas", async ({ request }) => {
    for (const tabla of ["citas", "clientes", "ventas", "estilistas"]) {
      const r = await request.get(`${URL}/rest/v1/${tabla}?select=*`, { headers: h });
      const filas = r.ok() ? await r.json() : [];
      expect(filas, `la tabla ${tabla} no debe mostrar filas`).toEqual([]);
    }
  });

  test("un visitante no puede cambiar barberos ni servicios", async ({ request }) => {
    // Si la seguridad fallara, este intento sí cambiaría nombres: solo en una base de pruebas.
    test.skip(!ESCRIBIR, "Intenta escribir: activa con E2E_ESCRIBIR=1 (solo en una base de pruebas)");
    for (const tabla of ["estilistas_publicos", "estilistas", "servicios"]) {
      const r = await request.patch(`${URL}/rest/v1/${tabla}?id=not.is.null`, {
        headers: { ...h, Prefer: "return=representation" },
        data: { nombre: "HACKEADO" },
      });
      const filas = r.ok() ? await r.json() : [];
      expect(filas, `no debe poder editar ${tabla}`).toEqual([]);
    }
  });

  test("un visitante no puede anular ventas ni ver reportes", async ({ request }) => {
    for (const fn of ["anular_venta", "reporte_por_dia", "registrar_venta"]) {
      const r = await request.post(`${URL}/rest/v1/rpc/${fn}`, { headers: h, data: {} });
      expect(r.ok(), `${fn} debe estar cerrado para visitantes`).toBe(false);
    }
  });

  test("texto con inyección SQL no rompe nada", async ({ request }) => {
    const r = await request.post(`${URL}/rest/v1/rpc/ver_cita`, {
      headers: h,
      data: { p_codigo: "' or 1=1; drop table citas; --" },
    });
    expect(r.status()).toBeLessThan(500);
    const cuerpo = await r.json();
    expect(Array.isArray(cuerpo) ? cuerpo : []).toEqual([]);
  });
});
