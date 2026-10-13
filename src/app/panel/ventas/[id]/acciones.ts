"use server";
// Acciones sobre una venta ya registrada. Como en las citas, RLS impide que
// un barbero cambie ventas ajenas.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function cambiarFormaPago(id: string, datos: FormData) {
  const supabase = await crearClienteServidor();
  await supabase.from("ventas").update({ forma_pago: String(datos.get("forma_pago")) }).eq("id", id);
  revalidatePath(`/panel/ventas/${id}`);
}

// Corregir el precio de un servicio (un descuento, por ejemplo).
// El trigger de 0004 ajusta el total de la venta.
export async function cambiarPrecio(ventaId: string, lineaId: string, datos: FormData) {
  const supabase = await crearClienteServidor();
  const precio = Number(datos.get("precio"));
  if (precio >= 0) {
    await supabase.from("detalle_venta").update({ precio_unitario: precio }).eq("id", lineaId);
  }
  revalidatePath(`/panel/ventas/${ventaId}`);
}

// Agregar un producto a la venta, por ejemplo una cera después del corte.
export async function agregarProducto(ventaId: string, datos: FormData) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("agregar_producto_a_venta", {
    p_venta: ventaId,
    p_producto: String(datos.get("producto") ?? ""),
    p_cantidad: Number(datos.get("cantidad") ?? 1),
  });
  if (error) redirect(`/panel/ventas/${ventaId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/panel/ventas/${ventaId}`);
}

export async function anularVenta(ventaId: string, fecha: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("anular_venta", { p_venta: ventaId });
  if (error) redirect(`/panel/ventas/${ventaId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/panel/ventas?fecha=${fecha}`);
}
