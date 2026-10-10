"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoIngreso = { error: string | null; correo: string };

// Recibe el formulario de ingreso. Si hay error, lo devuelve para mostrarlo,
// junto con el correo para no tener que escribirlo otra vez.
export async function iniciarSesion(_estadoAnterior: EstadoIngreso, datos: FormData) {
  const correo = String(datos.get("correo") ?? "").trim();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: String(datos.get("contrasena") ?? ""),
  });

  if (error) return { error: "Correo o contraseña incorrectos", correo };
  redirect("/panel");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
