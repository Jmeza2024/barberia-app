// Tipos y cálculos de ventas que usan varias pantallas (ventas del día y,
// en la etapa 7, los reportes).

export type FormaPago = "efectivo" | "transferencia" | "tarjeta";

export const nombreFormaPago: Record<FormaPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export type LineaVenta = {
  id: string;
  tipo: "servicio" | "producto";
  cantidad: number;
  precio_unitario: number;
  servicios: { nombre: string } | null;
  productos: { nombre: string } | null;
};

export type Venta = {
  id: string;
  fecha_hora: string;
  forma_pago: FormaPago;
  total: number;
  cita_id: string | null;
  estilistas: { id: string; nombre: string } | null;
  clientes: { nombre: string } | null;
  detalle_venta: LineaVenta[];
};

// Lo que se le pide a Supabase para traer una venta con sus líneas.
export const columnasVenta =
  "id, fecha_hora, forma_pago, total, cita_id, estilistas(id, nombre), clientes(nombre), detalle_venta(id, tipo, cantidad, precio_unitario, servicios(nombre), productos(nombre))";

export type Resumen = {
  cortes: number; // cuántos servicios se hicieron
  servicios: number; // plata de los servicios
  productos: number; // plata de los productos
  total: number;
};

const resumenVacio = (): Resumen => ({ cortes: 0, servicios: 0, productos: 0, total: 0 });

// Suma un grupo de ventas. Los montos llegan de Supabase como texto o número,
// por eso usamos Number(...) antes de sumar.
export function resumir(ventas: Venta[]): Resumen {
  const r = resumenVacio();
  for (const venta of ventas) {
    for (const linea of venta.detalle_venta) {
      const valor = linea.cantidad * Number(linea.precio_unitario);
      if (linea.tipo === "servicio") {
        r.cortes += linea.cantidad;
        r.servicios += valor;
      } else {
        r.productos += valor;
      }
      r.total += valor;
    }
  }
  return r;
}

// Agrupa las ventas por barbero y resume cada grupo.
export function resumirPorBarbero(ventas: Venta[]) {
  const grupos = new Map<string, { nombre: string; ventas: Venta[] }>();
  for (const venta of ventas) {
    const id = venta.estilistas?.id ?? "?";
    if (!grupos.has(id)) grupos.set(id, { nombre: venta.estilistas?.nombre ?? "?", ventas: [] });
    grupos.get(id)!.ventas.push(venta);
  }
  return [...grupos.entries()]
    .map(([id, g]) => ({ id, nombre: g.nombre, ...resumir(g.ventas) }))
    .sort((a, b) => b.total - a.total);
}

// Cuánto entró por cada forma de pago (para cuadrar la caja al final del día).
export function totalPorFormaPago(ventas: Venta[]) {
  const totales: Record<FormaPago, number> = { efectivo: 0, transferencia: 0, tarjeta: 0 };
  for (const venta of ventas) totales[venta.forma_pago] += Number(venta.total);
  return totales;
}

// Primero el servicio y después los productos, para leerlo siempre igual.
export function ordenarLineas(lineas: LineaVenta[]) {
  return [...lineas].sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === "servicio" ? -1 : 1));
}

// "Corte clásico + 2 × Cera para cabello"
export function describirLineas(lineas: LineaVenta[]) {
  return ordenarLineas(lineas)
    .map((l) => {
      const nombre = l.servicios?.nombre ?? l.productos?.nombre ?? "?";
      return l.cantidad > 1 ? `${l.cantidad} × ${nombre}` : nombre;
    })
    .join(" + ");
}
