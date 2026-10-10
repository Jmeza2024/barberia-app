// Un "layout" envuelve todas las páginas de su carpeta. Este pone el menú
// del panel arriba y revisa que quien entra sea parte del equipo.
import Link from "next/link";
import { obtenerPerfil } from "@/lib/sesion";
import { cerrarSesion } from "../ingresar/acciones";

export const dynamic = "force-dynamic";

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const { usuario, perfil } = await obtenerPerfil();

  // Tiene cuenta, pero no es (o ya no es) parte del equipo.
  if (!perfil || !perfil.activo) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-xl font-bold">Tu cuenta no tiene acceso</h1>
        <p className="mt-2 text-sm opacity-70">
          {usuario.email} no está registrado como barbero activo. Pídele al dueño que revise tu
          perfil.
        </p>
        <form action={cerrarSesion} className="mt-6">
          <button className="underline">Salir</button>
        </form>
      </main>
    );
  }

  const esDueno = perfil.rol === "dueno";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4 dark:border-white/15">
        <div>
          <p className="font-semibold">{perfil.nombre}</p>
          <p className="text-xs opacity-70">{esDueno ? "Dueño" : "Barbero"}</p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/panel">Hoy</Link>
          {esDueno && <Link href="/panel/barberos">Barberos</Link>}
          <form action={cerrarSesion}>
            <button className="opacity-70">Salir</button>
          </form>
        </nav>
      </header>
      <div className="py-6">{children}</div>
    </div>
  );
}
