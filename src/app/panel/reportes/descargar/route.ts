// /panel/reportes/descargar: el mismo reporte como archivo CSV, que se abre
// en Excel o Google Sheets. Un "route handler" devuelve un archivo en vez
// de una página.
import { exigirDueno } from "@/lib/sesion";
import { leerPeriodo } from "@/lib/periodos";
import { armarReporte } from "@/lib/reportes";

export async function GET(request: Request) {
  const { supabase } = await exigirDueno();
  const parametros = Object.fromEntries(new URL(request.url).searchParams);
  const periodo = leerPeriodo(parametros);
  const reporte = await armarReporte(supabase, periodo);

  // Una celda con comas o comillas va entre comillas.
  const celda = (valor: string | number) => {
    const texto = String(valor);
    return /[",;\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const fila = (...valores: (string | number)[]) => valores.map(celda).join(",");
  const t = reporte.totales;

  const lineas = [
    fila(`Reporte: ${periodo.titulo}`),
    fila("Barbero", "Cortes", "Servicios", "Productos", "Total vendido", "% comisión", "Comisión", "Para el negocio"),
    ...reporte.barberos.map((b) =>
      fila(b.nombre, b.cortes, b.servicios, b.productos, b.total, b.porcentaje, b.comision, b.negocio),
    ),
    fila("TOTAL", t.cortes, t.servicios, t.productos, t.total, "", t.comision, t.negocio),
    "",
    fila("Día", "Cortes", "Total vendido"),
    ...reporte.dias.map((d) => fila(d.dia, d.cortes, d.total)),
  ];

  // "﻿" al inicio le avisa a Excel que el archivo tiene tildes (UTF-8).
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte-${periodo.desde}-a-${periodo.hasta}.csv"`,
    },
  });
}
