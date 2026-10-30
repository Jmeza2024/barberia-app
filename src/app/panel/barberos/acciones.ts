"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirDueno } from "@/lib/sesion";
import { crearClienteAdmin, FALTA_LLAVE } from "@/lib/supabase/admin";

export type EstadoFormulario = {
  error: string | null;
  exito: string | null;
  // Lo que el dueño escribió, para no perderlo si hay un error.
  valores: { nombre: string; correo: string; comision: string };
  intento: number;
};

// Crea la cuenta (correo y contraseña) y la ficha de un barbero nuevo.
export async function crearBarbero(
  anterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  // Siempre revisamos en el servidor que quien llama sea el dueño,
  // aunque el botón solo se le muestre a él.
  const { supabase } = await exigirDueno();

  const nombre = String(datos.get("nombre") ?? "").trim();
  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(datos.get("contrasena") ?? "");
  const comision = Number(datos.get("comision") ?? 0);

  const intento = anterior.intento + 1;
  const fallo = (error: string): EstadoFormulario => ({
    error,
    exito: null,
    valores: { nombre, correo, comision: String(datos.get("comision") ?? "") },
    intento,
  });

  if (nombre.length < 2) return fallo("Escribe el nombre del barbero");
  if (contrasena.length < 8) return fallo("La contraseña debe tener al menos 8 caracteres");
  if (!(comision >= 0 && comision <= 100)) return fallo("La comisión debe estar entre 0 y 100");

  // 1. Crear el usuario. Esto necesita la llave maestra (cliente admin).
  const admin = crearClienteAdmin();
  if (!admin) return fallo(FALTA_LLAVE);
  const { data: creado, error: errorUsuario } = await admin.auth.admin.createUser({
    email: correo,
    password: contrasena,
    email_confirm: true, // no le pedimos que confirme el correo
  });
  if (errorUsuario || !creado.user) {
    const mensaje = errorUsuario?.message ?? "";
    return fallo(
      mensaje.includes("already")
        ? "Ya existe una cuenta con ese correo"
        : // Llave puesta pero equivocada (vieja, borrada o pegada con el nombre adelante).
          /api key|jwt|unauthorized|invalid/i.test(mensaje)
          ? "La clave secreta del servidor no es válida. Revisa SUPABASE_SERVICE_ROLE_KEY en Netlify."
          : `No se pudo crear la cuenta: ${mensaje}`,
    );
  }

  // 2. Crear su ficha de barbero, conectada al usuario.
  const { data: barbero, error: errorFicha } = await supabase
    .from("estilistas")
    .insert({ nombre, usuario_id: creado.user.id, porcentaje_comision: comision })
    .select("id")
    .single();

  if (errorFicha || !barbero) {
    // Si falla, borramos la cuenta para no dejarla a medias.
    await admin.auth.admin.deleteUser(creado.user.id);
    return fallo(`No se pudo crear el barbero: ${errorFicha?.message}`);
  }

  // 3. Por defecto hace todos los servicios y trabaja de lunes a sábado,
  //    de 8 a 12 y de 1 a 8 p. m. (descansa de 12 a 1).
  const { data: servicios } = await supabase.from("servicios").select("id");
  await supabase
    .from("estilista_servicios")
    .insert((servicios ?? []).map((s) => ({ estilista_id: barbero.id, servicio_id: s.id })));
  await supabase.from("horarios").insert(
    [1, 2, 3, 4, 5, 6].flatMap((dia) => [
      { estilista_id: barbero.id, dia_semana: dia, hora_inicio: "08:00", hora_fin: "12:00" },
      { estilista_id: barbero.id, dia_semana: dia, hora_inicio: "13:00", hora_fin: "20:00" },
    ]),
  );

  revalidatePath("/panel/barberos");
  return {
    error: null,
    exito: `${nombre} ya puede entrar con ${correo}`,
    valores: { nombre: "", correo: "", comision: "40" },
    intento,
  };
}

export async function cambiarActivo(id: string, activo: boolean) {
  const { supabase, perfil } = await exigirDueno();
  if (id === perfil?.id) return; // el dueño no se puede desactivar a sí mismo
  await supabase.from("estilistas").update({ activo }).eq("id", id);
  revalidatePath("/panel/barberos");
}

// Para mostrar un mensaje en la página después de guardar o borrar.
function volver(aviso: string): never {
  redirect(`/panel/barberos?aviso=${encodeURIComponent(aviso)}`);
}

// Guarda el nombre y la comisión de un barbero.
export async function guardarBarbero(id: string, datos: FormData) {
  const { supabase } = await exigirDueno();
  const nombre = String(datos.get("nombre") ?? "").trim();
  const comision = Number(datos.get("comision"));
  if (nombre.length < 2) volver("Escribe un nombre de al menos 2 letras");
  if (!(comision >= 0 && comision <= 100)) volver("La comisión debe estar entre 0 y 100");

  const { error } = await supabase
    .from("estilistas")
    .update({ nombre, porcentaje_comision: comision })
    .eq("id", id);
  if (error) volver(`No se pudo guardar: ${error.message}`);
  // "layout" actualiza todo el panel: el nombre sale también en la agenda y arriba.
  revalidatePath("/panel", "layout");
  volver(`Se guardaron los cambios de ${nombre}`);
}

// Borra un barbero y su cuenta. Solo se puede si no tiene citas ni ventas:
// esas quedan guardadas para los reportes. Si ya tiene, se desactiva.
export async function borrarBarbero(id: string) {
  const { supabase, perfil } = await exigirDueno();
  if (id === perfil?.id) volver("No te puedes borrar a ti mismo");

  const { data: barbero } = await supabase
    .from("estilistas")
    .select("nombre, usuario_id")
    .eq("id", id)
    .single();
  if (!barbero) volver("Ese barbero no existe");

  const { error } = await supabase.from("estilistas").delete().eq("id", id);
  if (error) {
    // 23503 = otra tabla (citas o ventas) todavía apunta a este barbero.
    volver(
      error.code === "23503"
        ? `${barbero.nombre} tiene citas o ventas guardadas y no se puede borrar. Toca "Desactivar": deja de salir para reservar y sus reportes se conservan.`
        : `No se pudo borrar: ${error.message}`,
    );
  }

  // También borramos su cuenta, para que ya no pueda entrar.
  const admin = crearClienteAdmin();
  if (barbero.usuario_id && admin) await admin.auth.admin.deleteUser(barbero.usuario_id);
  revalidatePath("/panel", "layout");
  volver(
    barbero.usuario_id && !admin
      ? `${barbero.nombre} fue borrado, pero su cuenta sigue activa. ${FALTA_LLAVE}`
      : `${barbero.nombre} fue borrado`,
  );
}
