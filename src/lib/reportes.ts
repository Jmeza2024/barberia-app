// Arma el reporte de un periodo: lo que vendió cada barbero, su comisión y
// lo que queda para el negocio. Lo usan la página de reportes y la descarga.
//
// Regla de comisión: la comisión es un porcentaje de los SERVICIOS (cortes)
// del barbero. Los productos no pagan comisión: quedan para el negocio.
import type { crearClienteServidor } from "./supabase/server";
import type { Periodo } from "./periodos";
import { formatoPesos } from "./formato";

export type FilaBarbero = {
  id: string;
  nombre: string;
  porcentaje: number;
  cortes: number;
  servicios: number;
  productos: number;
  total: number;
  comision: number;
  negocio: number; // lo que deja este barbero al negocio: total − comisión
};

export type Reporte = {
  barberos: FilaBarbero[];
  dias: { dia: string; cortes: number; total: number }[];
  totales: { cortes: number; servicios: number; productos: number; total: number; comision: number; negocio: number };
};

type Cliente = Awaited<ReturnType<typeof crearClienteServidor>>;

export async function armarReporte(supabase: Cliente, periodo: Periodo): Promise<Reporte> {
  const rango = { p_desde: periodo.desde, p_hasta: periodo.hasta };
  const [{ data: filas, error: errorFilas }, { data: dias, error: errorDias }] = await Promise.all([
    supabase.rpc("reporte_por_barbero", rango),
    supabase.rpc("reporte_por_dia", rango),
  ]);
  // Mejor un error claro que un reporte en ceros que parezca real.
  // Lo más común: falta correr 0005_reportes.sql en Supabase.
  const error = errorFilas ?? errorDias;
  if (error) throw new Error(`No se pudo armar el reporte: ${error.message}`);

  // Postgres manda los números grandes como texto: Number(...) los convierte.
  const barberos: FilaBarbero[] = (filas ?? []).map((f: Record<string, unknown>) => {
    const servicios = Number(f.servicios);
    const total = Number(f.total);
    const porcentaje = Number(f.porcentaje_comision);
    const comision = Math.round((servicios * porcentaje) / 100);
    return {
      id: String(f.estilista_id),
      nombre: String(f.nombre),
      porcentaje,
      cortes: Number(f.cortes),
      servicios,
      productos: Number(f.productos),
      total,
      comision,
      negocio: total - comision,
    };
  });

  const sumar = (campo: keyof Omit<FilaBarbero, "id" | "nombre" | "porcentaje">) =>
    barberos.reduce((suma, b) => suma + b[campo], 0);

  return {
    barberos,
    dias: (dias ?? []).map((d: Record<string, unknown>) => ({
      dia: String(d.dia),
      cortes: Number(d.cortes),
      total: Number(d.total),
    })),
    totales: {
      cortes: sumar("cortes"),
      servicios: sumar("servicios"),
      productos: sumar("productos"),
      total: sumar("total"),
      comision: sumar("comision"),
      negocio: sumar("negocio"),
    },
  };
}

// El reporte en texto, para enviarlo por WhatsApp.
export function reporteEnTexto(periodo: Periodo, reporte: Reporte) {
  const t = reporte.totales;
  const lineas = [
    `*Reporte: ${periodo.titulo}*`,
    `Cortes: ${t.cortes}`,
    `Total vendido: ${formatoPesos(t.total)} (servicios ${formatoPesos(t.servicios)}, productos ${formatoPesos(t.productos)})`,
    `Comisiones: ${formatoPesos(t.comision)}`,
    `Para el negocio: ${formatoPesos(t.negocio)}`,
    "",
    ...reporte.barberos
      .filter((b) => b.total > 0)
      .map(
        (b) =>
          `${b.nombre}: ${b.cortes} cortes, servicios ${formatoPesos(b.servicios)}, comisión ${b.porcentaje}% = ${formatoPesos(b.comision)}`,
      ),
  ];
  return lineas.join("\n");
}
