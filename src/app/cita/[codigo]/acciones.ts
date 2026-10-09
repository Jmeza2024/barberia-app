"use server";
// "use server" = estas funciones corren en el servidor aunque se llamen
// desde un botón. Se conocen como "Server Actions".

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function cancelarCita(codigo: string) {
  const supabase = await crearClienteServidor();
  await supabase.rpc("cancelar_cita", { p_codigo: codigo });
  // Vuelve a dibujar la página para que muestre "Cancelada".
  revalidatePath(`/cita/${codigo}`);
}
