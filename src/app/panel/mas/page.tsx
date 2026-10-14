// Página /panel/mas: en el celular, las opciones que no caben en la barra de abajo.
import Link from "next/link";
import { BarChart3, ChevronRight, LogOut, Package, Users } from "lucide-react";
import { obtenerPerfil } from "@/lib/sesion";
import { cerrarSesion } from "../../ingresar/acciones";

const estiloFila = "flex w-full items-center gap-3 px-4 py-4";

export default async function PaginaMas() {
  const { perfil } = await obtenerPerfil();
  const esDueno = perfil?.rol === "dueno";

  const opciones = [
    { href: "/panel/productos", nombre: "Productos", detalle: "Precios y unidades", icono: Package },
    ...(esDueno
      ? [
          { href: "/panel/reportes", nombre: "Reportes", detalle: "Ganancias y comisiones", icono: BarChart3 },
          { href: "/panel/barberos", nombre: "Barberos", detalle: "Perfiles y comisión", icono: Users },
        ]
      : []),
  ];

  return (
    <section className="max-w-md">
      <h1 className="text-2xl font-bold">Más</h1>
      <ul className="mt-4 divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-tarjeta">
        {opciones.map((o) => (
          <li key={o.href}>
            <Link href={o.href} className={estiloFila}>
              <o.icono size={20} className="text-suave" />
              <span className="flex-1">
                <span className="block font-medium">{o.nombre}</span>
                <span className="block text-xs text-suave">{o.detalle}</span>
              </span>
              <ChevronRight size={18} className="text-suave" />
            </Link>
          </li>
        ))}
        <li>
          <form action={cerrarSesion}>
            <button className={`${estiloFila} text-left text-red-400`}>
              <LogOut size={20} />
              Salir
            </button>
          </form>
        </li>
      </ul>
    </section>
  );
}
