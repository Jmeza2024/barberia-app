"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirDueno } from "@/lib/sesion";

// Para mostrar un mensaje en la página después de guardar o borrar.
function volver(aviso: string): never {
  redirect(`/panel/servicios?aviso=${encodeURIComponent(aviso)}`);
}

// Lee y revisa lo que el dueño escribió en el formulario de un servicio.
function leerServicio(datos: FormData) {
  const servicio = {
    nombre: String(datos.get("nombre") ?? "").trim(),
    categoria: String(datos.get("categoria") ?? "").trim() || "Cortes",
    precio: Number(datos.get("precio")),
    duracion_min: Number(datos.get("duracion")),
  };
  if (servicio.nombre.length < 2) volver("Escribe el nombre del servicio");
  if (!(servicio.precio >= 0)) volver("Escribe un precio válido");
  if (!(servicio.duracion_min >= 5 && servicio.duracion_min <= 480)) {
    volver("La duración debe estar entre 5 y 480 minutos");
  }
  return servicio;
}

// Las páginas que muestran servicios: inicio, reservar y el panel.
function actualizarPaginas() {
  revalidatePath("/", "layout");
}

export async function crearServicio(datos: FormData) {
  const { supabase } = await exigirDueno();
  const servicio = leerServicio(datos);

  const { data: nuevo, error } = await supabase.from("servicios").insert(servicio).select("id").single();
  if (error || !nuevo) volver(`No se pudo crear: ${error?.message}`);

  // Todos los barberos activos lo pueden hacer, así ya se puede reservar.
  const { data: barberos } = await supabase.from("estilistas").select("id").eq("activo", true);
  await supabase
    .from("estilista_servicios")
    .insert((barberos ?? []).map((b) => ({ estilista_id: b.id, servicio_id: nuevo.id })));

  actualizarPaginas();
  volver(`Se creó ${servicio.nombre}`);
}

export async function guardarServicio(id: string, datos: FormData) {
  const { supabase } = await exigirDueno();
  const servicio = leerServicio(datos);
  const { error } = await supabase.from("servicios").update(servicio).eq("id", id);
  if (error) volver(`No se pudo guardar: ${error.message}`);
  actualizarPaginas();
  volver(`Se guardó ${servicio.nombre}`);
}

// Ocultar: el servicio deja de salir para los clientes, pero no se borra.
export async function cambiarActivoServicio(id: string, activo: boolean) {
  const { supabase } = await exigirDueno();
  await supabase.from("servicios").update({ activo }).eq("id", id);
  actualizarPaginas();
}

// Borrar solo se puede si nunca se ha usado en una cita o venta.
export async function borrarServicio(id: string) {
  const { supabase } = await exigirDueno();
  const { data: servicio } = await supabase.from("servicios").select("nombre").eq("id", id).single();
  if (!servicio) volver("Ese servicio no existe");

  const { error } = await supabase.from("servicios").delete().eq("id", id);
  if (error) {
    // 23503 = hay citas o ventas que usan este servicio.
    volver(
      error.code === "23503"
        ? `${servicio.nombre} ya se usó en citas o ventas y no se puede borrar. Toca "Ocultar": deja de salir para los clientes y los reportes se conservan.`
        : `No se pudo borrar: ${error.message}`,
    );
  }
  actualizarPaginas();
  volver(`${servicio.nombre} fue borrado`);
}
