"use server";

import { revalidatePath } from "next/cache";
import { exigirDueno } from "@/lib/sesion";

export type EstadoProducto = {
  error: string | null;
  exito: string | null;
  valores: { nombre: string; precio: string; existencias: string; minimo: string };
  intento: number;
};

// Crea un producto. Las unidades iniciales se guardan con sumar_existencias
// para que queden en el historial del inventario.
export async function crearProducto(
  anterior: EstadoProducto,
  datos: FormData,
): Promise<EstadoProducto> {
  const { supabase } = await exigirDueno();
  const valores = {
    nombre: String(datos.get("nombre") ?? "").trim(),
    precio: String(datos.get("precio") ?? ""),
    existencias: String(datos.get("existencias") ?? "0"),
    minimo: String(datos.get("minimo") ?? "3"),
  };
  const intento = anterior.intento + 1;
  const fallo = (error: string): EstadoProducto => ({ error, exito: null, valores, intento });

  const precio = Number(valores.precio);
  const existencias = Number(valores.existencias) || 0;
  if (valores.nombre.length < 2) return fallo("Escribe el nombre del producto");
  if (!(precio >= 0) || valores.precio === "") return fallo("Escribe el precio de venta");
  if (existencias < 0) return fallo("Las unidades no pueden ser negativas");

  const { data: producto, error } = await supabase
    .from("productos")
    .insert({ nombre: valores.nombre, precio_venta: precio, minimo_aviso: Number(valores.minimo) || 0 })
    .select("id")
    .single();
  if (error || !producto) return fallo(`No se pudo crear: ${error?.message}`);

  if (existencias > 0) {
    await supabase.rpc("sumar_existencias", {
      p_producto: producto.id,
      p_cantidad: existencias,
      p_motivo: "inventario inicial",
    });
  }

  revalidatePath("/panel/productos");
  return {
    error: null,
    exito: `${valores.nombre} quedó creado`,
    valores: { nombre: "", precio: "", existencias: "0", minimo: "3" },
    intento,
  };
}

export async function cambiarPrecioProducto(id: string, datos: FormData) {
  const { supabase } = await exigirDueno();
  const precio = Number(datos.get("precio"));
  if (precio >= 0) await supabase.from("productos").update({ precio_venta: precio }).eq("id", id);
  revalidatePath("/panel/productos");
}

// Llegó mercancía: suma unidades (o resta, con un número negativo, si se contó mal).
export async function sumarUnidades(id: string, datos: FormData) {
  const { supabase } = await exigirDueno();
  const cantidad = Math.trunc(Number(datos.get("cantidad")));
  if (cantidad) {
    await supabase.rpc("sumar_existencias", {
      p_producto: id,
      p_cantidad: cantidad,
      p_motivo: cantidad > 0 ? "llegó mercancía" : "ajuste de conteo",
    });
  }
  revalidatePath("/panel/productos");
}

export async function cambiarActivoProducto(id: string, activo: boolean) {
  const { supabase } = await exigirDueno();
  await supabase.from("productos").update({ activo }).eq("id", id);
  revalidatePath("/panel/productos");
}
