// Averigua quién está conectado y cuál es su ficha de barbero.
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Perfil = {
  id: string;
  nombre: string;
  rol: "dueno" | "barbero";
  activo: boolean;
};

export async function obtenerPerfil() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: perfil } = await supabase
    .from("estilistas")
    .select("id, nombre, rol, activo")
    .eq("usuario_id", user.id)
    .maybeSingle<Perfil>();

  return { supabase, usuario: user, perfil };
}

// Para páginas que solo puede ver el dueño.
export async function exigirDueno() {
  const sesion = await obtenerPerfil();
  if (sesion.perfil?.rol !== "dueno" || !sesion.perfil.activo) redirect("/panel");
  return sesion;
}
