// Busca las citas confirmadas de un día que aún no tienen recordatorio y,
// si WhatsApp Business está configurado, se los envía.
// Lo usan el envío automático diario (api/recordatorios) y el botón
// "Enviar todos" de la página de recordatorios.
import "server-only";
import { sumarDias } from "./formato";
import { mensajeRecordatorio } from "./mensajes";
import { enviarPlantilla } from "./whatsapp";
import type { crearClienteServidor } from "./supabase/server";

type Cliente = Pick<Awaited<ReturnType<typeof crearClienteServidor>>, "from">;

export type CitaRecordatorio = {
  id: string;
  inicio: string;
  codigo_cancelacion: string;
  recordatorio_enviado: boolean;
  servicios: { nombre: string } | null;
  clientes: { nombre: string; telefono: string } | null;
  estilistas: { nombre: string } | null;
};

// Las citas confirmadas de un día (en hora de Bogotá), con o sin recordatorio.
export async function citasDelDia(supabase: Cliente, fecha: string) {
  const { data } = await supabase
    .from("citas")
    .select(
      "id, inicio, codigo_cancelacion, recordatorio_enviado, servicios(nombre), clientes(nombre, telefono), estilistas(nombre)",
    )
    .eq("estado", "confirmada")
    .gte("inicio", `${fecha}T00:00:00-05:00`)
    .lt("inicio", `${sumarDias(fecha, 1)}T00:00:00-05:00`)
    .order("inicio")
    .returns<CitaRecordatorio[]>();
  return data ?? [];
}

export function mensajeDe(cita: CitaRecordatorio, sitio: string) {
  return mensajeRecordatorio({
    cliente: cita.clientes?.nombre ?? "",
    servicio: cita.servicios?.nombre ?? "",
    barbero: cita.estilistas?.nombre ?? "",
    inicio: cita.inicio,
    enlace: `${sitio}/cita/${cita.codigo_cancelacion}`,
  });
}

// Envía los que faltan. Devuelve cuántos salieron y cuántos fallaron.
export async function enviarRecordatoriosDelDia(supabase: Cliente, fecha: string, sitio: string) {
  const pendientes = (await citasDelDia(supabase, fecha)).filter((c) => !c.recordatorio_enviado && c.clientes);
  let enviados = 0;
  let fallidos = 0;
  for (const cita of pendientes) {
    const ok = await enviarPlantilla(cita.clientes!.telefono, mensajeDe(cita, sitio));
    if (ok) {
      // Se marca para no enviarlo dos veces.
      await supabase.from("citas").update({ recordatorio_enviado: true }).eq("id", cita.id);
      enviados++;
    } else {
      fallidos++;
    }
  }
  return { enviados, fallidos };
}
