"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { enviarRecordatoriosDelDia } from "@/lib/recordatorios";
import { direccionSitio } from "@/lib/whatsapp";

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

// Con WhatsApp Business configurado: enviar todos los que faltan de una vez.
export async function enviarTodos(fecha: string) {
  const supabase = await crearClienteServidor();
  const { enviados, fallidos } = await enviarRecordatoriosDelDia(
    supabase,
    fecha,
    direccionSitio(await headers()),
  );
  redirect(`/panel/recordatorios?fecha=${fecha}&enviados=${enviados}&fallidos=${fallidos}`);
}
