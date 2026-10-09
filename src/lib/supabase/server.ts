// Cliente de Supabase para usar en el servidor (páginas y acciones de Next.js).
// Lee la sesión del usuario desde las cookies, así Supabase sabe quién está
// conectado (dueño o barbero) y aplica sus permisos.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function crearClienteServidor() {
  const almacenCookies = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return almacenCookies.getAll();
        },
        setAll(cookiesParaGuardar) {
          try {
            cookiesParaGuardar.forEach(({ name, value, options }) =>
              almacenCookies.set(name, value, options),
            );
          } catch {
            // Se llamó desde un componente de servidor, donde no se pueden
            // escribir cookies. Es seguro ignorarlo.
          }
        },
      },
    },
  );
}
