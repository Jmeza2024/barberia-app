"use client";
// El menú del panel. En el celular es una barra fija abajo con íconos, como
// las apps (así nada queda cortado). En pantallas grandes va arriba.
// Es un componente de cliente porque usa usePathname() para saber en qué
// página estamos y resaltar ese botón.
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Ellipsis,
  Package,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";

type Opcion = { href: string; nombre: string; icono: LucideIcon };

export default function NavPanel({ esDueno }: { esDueno: boolean }) {
  const ruta = usePathname();

  // Las 3 más usadas van siempre abajo; el resto queda en "Más".
  const principales: Opcion[] = [
    { href: "/panel", nombre: "Agenda", icono: CalendarDays },
    { href: "/panel/ventas", nombre: "Ventas", icono: Receipt },
    { href: "/panel/recordatorios", nombre: "Recordar", icono: Bell },
  ];
  const otras: Opcion[] = [
    { href: "/panel/productos", nombre: "Productos", icono: Package },
    ...(esDueno
      ? [
          { href: "/panel/reportes", nombre: "Reportes", icono: BarChart3 },
          { href: "/panel/barberos", nombre: "Barberos", icono: Users },
        ]
      : []),
  ];

  // /panel/cita/... y /panel/nueva-cita son parte de la Agenda.
  const activa = (href: string) =>
    href === "/panel"
      ? ruta === "/panel" || ruta.startsWith("/panel/cita") || ruta.startsWith("/panel/nueva-cita")
      : ruta.startsWith(href);
  const enMas = ruta === "/panel/mas" || otras.some((o) => activa(o.href));

  return (
    <>
      {/* Pantalla grande: arriba, todas las opciones */}
      <nav className="order-last hidden w-full flex-wrap items-center gap-1 text-sm md:flex">
        {[...principales, ...otras].map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${
              activa(o.href) ? "bg-boton text-texto" : "text-suave hover:text-texto"
            }`}
          >
            <o.icono size={16} />
            {o.nombre === "Recordar" ? "Recordatorios" : o.nombre}
          </Link>
        ))}
      </nav>

      {/* Celular: barra fija abajo */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-fondo/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {[...principales, { href: "/panel/mas", nombre: "Más", icono: Ellipsis }].map((o) => {
            const resaltada = o.href === "/panel/mas" ? enMas : activa(o.href);
            return (
              <Link
                key={o.href}
                href={o.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                  resaltada ? "text-texto" : "text-suave"
                }`}
              >
                <o.icono size={22} strokeWidth={resaltada ? 2.4 : 1.8} />
                {o.nombre}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
