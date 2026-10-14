"use server";

import { revalidatePath } from "next/cache";
import { exigirDueno } from "@/lib/sesion";

// Cambiar el % de un barbero desde el reporte. El cálculo se actualiza al instante.
export async function cambiarPorcentaje(id: string, datos: FormData) {
  const { supabase } = await exigirDueno();
  const porcentaje = Number(datos.get("porcentaje"));
  if (porcentaje >= 0 && porcentaje <= 100) {
    await supabase.from("estilistas").update({ porcentaje_comision: porcentaje }).eq("id", id);
  }
  revalidatePath("/panel/reportes");
  revalidatePath("/panel/barberos");
}
