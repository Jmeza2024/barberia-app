// Cliente de Supabase para usar en el navegador (componentes con "use client").
// Usa la clave "anon", que es pública: lo que puede hacer está limitado por
// las reglas de seguridad (RLS) que definimos en supabase/migrations.
import { createBrowserClient } from "@supabase/ssr";

export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
