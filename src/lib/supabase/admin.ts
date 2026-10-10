// Cliente de Supabase con la llave maestra (service_role). Se salta todas
// las reglas de seguridad, así que solo lo usamos en el servidor y solo
// para lo que no se puede hacer de otra forma: crear cuentas de usuario.
// "server-only" hace que Next.js falle si alguien lo importa en el navegador.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function crearClienteAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
