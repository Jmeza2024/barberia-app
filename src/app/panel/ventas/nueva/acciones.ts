"use server";

import { redirect } from "next/navigation";
import { obtenerPerfil } from "@/lib/sesion";

export type EstadoVenta = { error: string | null };

export async function registrarVenta(_anterior: EstadoVenta, datos: FormData): Promise<EstadoVenta> {
  const { supabase, perfil } = await obtenerPerfil();

  // El barbero solo registra a su nombre; el dueño elige. (RLS también lo revisa.)
  const barbero = perfil?.rol === "dueno" ? String(datos.get("barbero") ?? "") : perfil?.id;
  const servicio = String(datos.get("servicio") ?? "");
  const precio = Number(datos.get("precio"));
  const formaPago = String(datos.get("forma_pago") ?? "efectivo");

  // Cada producto llega como un campo "producto-<id>" con la cantidad.
  const productos = [...datos.entries()]
    .filter(([campo, valor]) => campo.startsWith("producto-") && Number(valor) > 0)
    .map(([campo, valor]) => ({ producto: campo.replace("producto-", ""), cantidad: Number(valor) }));

  if (!barbero) return { error: "Elige el barbero" };

  // Todo se guarda en un solo paso con la función de 0004_ventas.sql.
  const { data: ventaId, error } = await supabase.rpc("registrar_venta", {
    p_estilista: barbero,
    p_forma_pago: formaPago,
    p_servicio: servicio || null,
    p_precio_servicio: servicio ? precio : null,
    p_productos: productos,
  });

  if (error) return { error: error.message };
  redirect(`/panel/ventas/${ventaId}?aviso=nueva`);
}
