"use server";

import { revalidatePath } from "next/cache";
import { exigirDueno } from "@/lib/sesion";
import { crearClienteAdmin } from "@/lib/supabase/admin";

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
  const { data: creado, error: errorUsuario } = await admin.auth.admin.createUser({
    email: correo,
    password: contrasena,
    email_confirm: true, // no le pedimos que confirme el correo
  });
  if (errorUsuario || !creado.user) {
    return fallo(
      errorUsuario?.message.includes("already")
        ? "Ya existe una cuenta con ese correo"
        : `No se pudo crear la cuenta: ${errorUsuario?.message}`,
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

  // 3. Por defecto hace todos los servicios y trabaja de lunes a sábado, 9 a 19.
  //    El dueño lo podrá ajustar después.
  const { data: servicios } = await supabase.from("servicios").select("id");
  await supabase
    .from("estilista_servicios")
    .insert((servicios ?? []).map((s) => ({ estilista_id: barbero.id, servicio_id: s.id })));
  await supabase.from("horarios").insert(
    [1, 2, 3, 4, 5, 6].map((dia) => ({
      estilista_id: barbero.id,
      dia_semana: dia,
      hora_inicio: "09:00",
      hora_fin: "19:00",
    })),
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

export async function cambiarComision(id: string, datos: FormData) {
  const { supabase } = await exigirDueno();
  const comision = Number(datos.get("comision"));
  if (comision >= 0 && comision <= 100) {
    await supabase.from("estilistas").update({ porcentaje_comision: comision }).eq("id", id);
  }
  revalidatePath("/panel/barberos");
}
