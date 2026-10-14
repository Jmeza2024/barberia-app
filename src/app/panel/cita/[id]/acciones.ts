"use server";
// Acciones sobre una cita. No revisamos aquí si la cita es de este barbero:
// eso lo hace la base de datos con las reglas RLS. Si un barbero intenta
// cambiar una cita ajena, la actualización simplemente no afecta ninguna fila.

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { mensajeCambiada, mensajeCancelada, type DatosCita, type Plantilla } from "@/lib/mensajes";
import { direccionSitio, enviarPlantilla, whatsappConfigurado } from "@/lib/whatsapp";

type Supabase = Awaited<ReturnType<typeof crearClienteServidor>>;

// Si WhatsApp Business está configurado, le avisa al cliente solo.
// Devuelve "&enviado=1" o "&enviado=0" para que la página sepa qué pasó.
async function avisarCliente(supabase: Supabase, id: string, armar: (c: DatosCita) => Plantilla) {
  if (!whatsappConfigurado()) return "";
  const { data: cita } = await supabase
    .from("citas")
    .select("inicio, codigo_cancelacion, servicios(nombre), clientes(nombre, telefono), estilistas(nombre)")
    .eq("id", id)
    .single<{
      inicio: string;
      codigo_cancelacion: string;
      servicios: { nombre: string } | null;
      clientes: { nombre: string; telefono: string } | null;
      estilistas: { nombre: string } | null;
    }>();
  if (!cita?.clientes) return "&enviado=0";
  const sitio = direccionSitio(await headers());
  const ok = await enviarPlantilla(
    cita.clientes.telefono,
    armar({
      cliente: cita.clientes.nombre,
      servicio: cita.servicios?.nombre ?? "",
      barbero: cita.estilistas?.nombre ?? "",
      inicio: cita.inicio,
      enlace: `${sitio}/cita/${cita.codigo_cancelacion}`,
    }),
  );
  return ok ? "&enviado=1" : "&enviado=0";
}

export async function marcarEstado(id: string, estado: "atendida" | "no_vino" | "confirmada") {
  const supabase = await crearClienteServidor();
  await supabase.from("citas").update({ estado }).eq("id", id);
  revalidatePath(`/panel/cita/${id}`);
}

export async function cancelarCita(id: string, datos: FormData) {
  const supabase = await crearClienteServidor();
  const motivo = String(datos.get("motivo") ?? "").trim() || "Cancelada por la barbería";
  const { data: cancelada } = await supabase
    .from("citas")
    .update({ estado: "cancelada", motivo_cancelacion: motivo })
    .eq("id", id)
    .eq("estado", "confirmada")
    .select("id");
  // Solo avisamos si de verdad se canceló (no si ya estaba cancelada).
  const enviado = cancelada?.length ? await avisarCliente(supabase, id, mensajeCancelada) : "";
  // ?aviso=cancelada hace que la página muestre el aviso para el cliente.
  redirect(`/panel/cita/${id}?aviso=cancelada${enviado}`);
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
  const enviado = await avisarCliente(supabase, id, mensajeCambiada);
  redirect(`/panel/cita/${id}?aviso=cambiada${enviado}`);
}
