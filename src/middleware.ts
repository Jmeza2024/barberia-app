// El "middleware" corre antes de cada página. Aquí hace dos cosas:
// 1. Renueva la sesión del usuario para que no se le cierre sola.
// 2. Si alguien sin sesión intenta entrar a /panel, lo manda a /ingresar.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaGuardar) {
          cookiesParaGuardar.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          cookiesParaGuardar.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() le pregunta a Supabase quién es el usuario (y renueva la sesión).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/panel")) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    return NextResponse.redirect(url);
  }

  return respuesta;
}

// Solo corre en /panel e /ingresar, no en la parte pública ni en imágenes.
export const config = {
  matcher: ["/panel/:path*", "/ingresar"],
};
