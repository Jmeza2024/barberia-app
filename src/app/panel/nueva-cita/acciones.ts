"use server";

import { redirect } from "next/navigation";
import { obtenerPerfil } from "@/lib/sesion";

export type EstadoNuevaCita = {
  error: string | null;
  // Lo escrito, para no perderlo si hay un error.
  valores: Record<string, string>;
  intento: number;
};

// Crea una cita desde el panel: para quien llama por teléfono o llega al local.
// A diferencia de la reserva pública, aquí no exigimos que la hora esté
// dentro del horario: el barbero decide. Solo se impide que se cruce con otra.
export async function crearCitaEquipo(
  anterior: EstadoNuevaCita,
  datos: FormData,
): Promise<EstadoNuevaCita> {
  const { supabase, perfil } = await obtenerPerfil();
  const valores = Object.fromEntries(
    ["nombre", "telefono", "servicio", "barbero", "fecha", "hora", "nota"].map((campo) => [
      campo,
      String(datos.get(campo) ?? "").trim(),
    ]),
  );
  const fallo = (error: string) => ({ error, valores, intento: anterior.intento + 1 });

  const telefono = valores.telefono.replace(/\D/g, "");
  if (valores.nombre.length < 2) return fallo("Escribe el nombre del cliente");
  if (telefono.length < 7) return fallo("Escribe un teléfono válido");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valores.fecha) || !/^\d{2}:\d{2}$/.test(valores.hora)) {
    return fallo("Elige el día y la hora");
  }

  // El barbero solo puede crear citas para sí mismo. El dueño, para cualquiera.
  const estilistaId = perfil?.rol === "dueno" && valores.barbero ? valores.barbero : perfil?.id;

  const { data: servicio } = await supabase
    .from("servicios")
    .select("duracion_min")
    .eq("id", valores.servicio)
    .single();
  if (!servicio) return fallo("Elige un servicio");

  const { data: cliente, error: errorCliente } = await supabase
    .from("clientes")
    .upsert({ nombre: valores.nombre, telefono }, { onConflict: "telefono" })
    .select("id")
    .single();
  if (errorCliente || !cliente) return fallo(`No se pudo guardar el cliente: ${errorCliente?.message}`);

  // Bogotá es UTC-5 todo el año.
  const inicio = new Date(`${valores.fecha}T${valores.hora}:00-05:00`);
  const fin = new Date(inicio.getTime() + servicio.duracion_min * 60_000);

  const { data: cita, error } = await supabase
    .from("citas")
    .insert({
      cliente_id: cliente.id,
      estilista_id: estilistaId,
      servicio_id: valores.servicio,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      nota: valores.nota || null,
    })
    .select("id")
    .single();

  if (error) {
    // 23P01 es el código de Postgres para "se cruza con otra cita".
    return fallo(
      error.code === "23P01"
        ? "Ese barbero ya tiene una cita a esa hora"
        : `No se pudo crear la cita: ${error.message}`,
    );
  }

  redirect(`/panel/cita/${cita.id}`);
}
