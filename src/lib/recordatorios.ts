// Las citas confirmadas de un día, con el mensaje de recordatorio de cada una.
// Si algún día se agrega el envío automático (WhatsApp Business), puede
// reusar estas mismas funciones.
import { sumarDias } from "./formato";
import { mensajeRecordatorio } from "./mensajes";
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
