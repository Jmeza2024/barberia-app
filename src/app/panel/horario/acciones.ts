"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirDueno, obtenerPerfil } from "@/lib/sesion";

function volver(aviso: string, extra = ""): never {
  redirect(`/panel/horario?aviso=${encodeURIComponent(aviso)}${extra}`);
}

const esHora = (texto: string) => /^\d{2}:\d{2}$/.test(texto);
const esFecha = (texto: string) => /^\d{4}-\d{2}-\d{2}$/.test(texto);

// Lee los 7 días del formulario y revisa que las horas tengan sentido.
export async function guardarHorario(datos: FormData) {
  const { supabase } = await exigirDueno();

  const dias = [0, 1, 2, 3, 4, 5, 6].map((dia) => {
    const campo = (nombre: string) => String(datos.get(`${nombre}-${dia}`) ?? "");
    const conDescanso = datos.get(`descanso-${dia}`) === "on";
    return {
      dia,
      abierto: datos.get(`abierto-${dia}`) === "on",
      abre: campo("abre"),
      cierra: campo("cierra"),
      descanso_inicio: conDescanso ? campo("descanso_inicio") : "",
      descanso_fin: conDescanso ? campo("descanso_fin") : "",
    };
  });

  for (const d of dias) {
    if (!d.abierto) continue;
    if (!esHora(d.abre) || !esHora(d.cierra) || d.cierra <= d.abre) {
      volver("Revisa las horas: la hora de cierre debe ser después de la de apertura");
    }
    if (d.descanso_inicio || d.descanso_fin) {
      const bien =
        esHora(d.descanso_inicio) &&
        esHora(d.descanso_fin) &&
        d.descanso_inicio > d.abre &&
        d.descanso_fin > d.descanso_inicio &&
        d.descanso_fin < d.cierra;
      if (!bien) volver("Revisa el descanso: debe empezar y terminar entre la apertura y el cierre");
    }
  }
  if (!dias.some((d) => d.abierto)) volver("Deja al menos un día abierto");

  // Los días cerrados guardan horas válidas aunque no se usen.
  const paraGuardar = dias.map((d) =>
    d.abierto ? d : { ...d, abre: esHora(d.abre) ? d.abre : "08:00", cierra: "20:00", descanso_inicio: "", descanso_fin: "" },
  );
  const { error } = await supabase.rpc("guardar_horario", { p_dias: paraGuardar });
  if (error) volver(`No se pudo guardar: ${error.message}`);

  revalidatePath("/", "layout");
  volver("Horario guardado. Ya se ve así para reservar.");
}

// Cierra un día para toda la barbería ("todos") o para un barbero.
export async function cerrarDia(datos: FormData) {
  const { supabase, perfil } = await obtenerPerfil();
  if (!perfil?.activo) redirect("/panel");

  const fecha = String(datos.get("fecha") ?? "");
  const quien = perfil.rol === "dueno" ? String(datos.get("quien") ?? "todos") : perfil.id;
  const motivo = String(datos.get("motivo") ?? "").trim();
  const cancelar = datos.get("cancelar") === "on";
  if (!esFecha(fecha)) volver("Escoge el día que vas a cerrar");

  const { data, error } = await supabase.rpc("cerrar_dia", {
    p_fecha: fecha,
    p_estilista: quien === "todos" ? null : quien,
    p_motivo: motivo,
    p_cancelar: cancelar,
  });
  if (error) volver(`No se pudo cerrar: ${error.message}`);

  revalidatePath("/panel", "layout");
  // Las citas que se acaban de cancelar viajan en la dirección para avisarles.
  const ids = ((data ?? []) as { cita_id: string }[]).map((c) => c.cita_id);
  volver(
    ids.length
      ? `Día cerrado. Se cancelaron ${ids.length} cita(s): avísale a cada cliente abajo.`
      : "Día cerrado. Ya nadie puede reservar ese día.",
    ids.length ? `&avisar=${ids.join(",")}` : "",
  );
}

export async function abrirDia(fecha: string, estilista: string | null) {
  const { supabase, perfil } = await obtenerPerfil();
  if (!perfil?.activo) redirect("/panel");
  const { error } = await supabase.rpc("abrir_dia", { p_fecha: fecha, p_estilista: estilista });
  if (error) volver(`No se pudo abrir: ${error.message}`);
  revalidatePath("/panel", "layout");
  volver("Día abierto otra vez. Ya se puede reservar.");
}
