// Cliente de Supabase con la llave maestra (service_role). Se salta todas
// las reglas de seguridad, así que solo lo usamos en el servidor y solo
// para lo que no se puede hacer de otra forma: crear cuentas de usuario.
// "server-only" hace que Next.js falle si alguien lo importa en el navegador.
import "server-only";
import { createClient } from "@supabase/supabase-js";

// El aviso que ve el dueño si la llave no está puesta en el servidor
// (Netlify o Vercel), en vez de que la página se caiga.
export const FALTA_LLAVE =
  "Falta la clave secreta en el servidor. Revisa la variable SUPABASE_SERVICE_ROLE_KEY en Netlify y vuelve a publicar.";

// Devuelve null si falta la llave, para que quien la use muestre FALTA_LLAVE.
export function crearClienteAdmin() {
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!llave) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, llave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
