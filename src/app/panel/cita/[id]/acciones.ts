"use server";
// Acciones sobre una cita. No revisamos aquí si la cita es de este barbero:
// eso lo hace la base de datos con las reglas RLS. Si un barbero intenta
// cambiar una cita ajena, la actualización simplemente no afecta ninguna fila.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function marcarEstado(id: string, estado: "atendida" | "no_vino" | "confirmada") {
  const supabase = await crearClienteServidor();
  const { data: cita } = await supabase
    .from("citas")
    .update({ estado })
    .eq("id", id)
    .select("cliente_id, gratis")
    .maybeSingle();
  revalidatePath(`/panel/cita/${id}`);

  // ¿Con este corte completó la tarjeta? Entonces mostramos el botón para avisarle.
  if (estado === "atendida" && cita && !cita.gratis) {
    const { data } = await supabase.rpc("tarjeta_de", { p_cliente: cita.cliente_id });
    const tarjeta = (data as { sellos: number; gratis_disponibles: number }[] | null)?.[0];
    if (tarjeta && tarjeta.sellos === 0 && tarjeta.gratis_disponibles > 0) {
      redirect(`/panel/cita/${id}?aviso=premio`);
    }
  }
}

export async function cancelarCita(id: string, datos: FormData) {
  const supabase = await crearClienteServidor();
  const motivo = String(datos.get("motivo") ?? "").trim() || "Cancelada por la barbería";
  await supabase
    .from("citas")
    .update({ estado: "cancelada", motivo_cancelacion: motivo })
    .eq("id", id)
    .eq("estado", "confirmada");
  // ?aviso=cancelada hace que la página muestre el botón para avisar al cliente.
  redirect(`/panel/cita/${id}?aviso=cancelada`);
}

export async function cambiarHora(id: string, estilistaId: string, inicio: string, duracionMin: number) {
  const supabase = await crearClienteServidor();
  const fin = new Date(new Date(inicio).getTime() + duracionMin * 60_000).toISOString();

  const { error } = await supabase
    .from("citas")
    .update({ estilista_id: estilistaId, inicio, fin, recordatorio_enviado: false })
    .eq("id", id);

  // Si otra cita tomó esa hora justo antes, la base de datos lo rechaza.
  if (error) redirect(`/panel/cita/${id}?error=ocupada`);
  redirect(`/panel/cita/${id}?aviso=cambiada`);
}
