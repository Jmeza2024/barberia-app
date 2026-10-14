// Un "layout" envuelve todas las páginas de su carpeta. Este pone el menú
// del panel (abajo en el celular, arriba en pantallas grandes) y revisa
// que quien entra sea parte del equipo.
import { LogOut, Scissors } from "lucide-react";
import { obtenerPerfil } from "@/lib/sesion";
import { cerrarSesion } from "../ingresar/acciones";
import NavPanel from "./NavPanel";

export const dynamic = "force-dynamic";

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const { usuario, perfil } = await obtenerPerfil();

  // Tiene cuenta, pero no es (o ya no es) parte del equipo.
  if (!perfil || !perfil.activo) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-xl font-bold">Tu cuenta no tiene acceso</h1>
        <p className="mt-2 text-sm text-suave">
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
    // pb-24: espacio abajo para que la barra del celular no tape el contenido.
    <div className="mx-auto max-w-3xl px-4 pt-5 pb-24 md:pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borde pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-boton">
            <Scissors size={18} />
          </span>
          <div>
            <p className="font-semibold leading-tight">{perfil.nombre}</p>
            <p className="text-xs text-suave">{esDueno ? "Dueño" : "Barbero"}</p>
          </div>
        </div>
        <NavPanel esDueno={esDueno} />
        <form action={cerrarSesion} className="hidden md:block">
          <button className="flex items-center gap-1.5 text-sm text-suave hover:text-texto">
            <LogOut size={16} />
            Salir
          </button>
        </form>
      </header>
      <div className="py-6">{children}</div>
    </div>
  );
}
