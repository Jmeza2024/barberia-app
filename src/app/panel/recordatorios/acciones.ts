"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

// Botón manual: marca la cita como recordada y abre WhatsApp con el mensaje.
export async function abrirRecordatorio(citaId: string, enlaceWhatsApp: string) {
  if (!enlaceWhatsApp.startsWith("https://wa.me/")) return;
  const supabase = await crearClienteServidor();
  await supabase.from("citas").update({ recordatorio_enviado: true }).eq("id", citaId);
  redirect(enlaceWhatsApp);
}

// Si se tocó por error, se puede volver a dejar pendiente.
export async function marcarPendiente(citaId: string, fecha: string) {
  const supabase = await crearClienteServidor();
  await supabase.from("citas").update({ recordatorio_enviado: false }).eq("id", citaId);
  redirect(`/panel/recordatorios?fecha=${fecha}`);
}
