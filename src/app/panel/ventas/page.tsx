// Página /panel/ventas: lo que se vendió en un día. Cortes, productos,
// ganancias y, para el dueño, cuánto vendió cada barbero.
// Igual que en la agenda, RLS hace que el barbero solo vea sus ventas.
import Link from "next/link";
import { obtenerPerfil } from "@/lib/sesion";
import { formatoFechaLarga, formatoHora, formatoPesos, hoyEnBogota, sumarDias } from "@/lib/formato";
import {
  columnasVenta,
  describirLineas,
  nombreFormaPago,
  resumir,
  resumirPorBarbero,
  totalPorFormaPago,
  type FormaPago,
  type Venta,
} from "@/lib/ventas";

const esFecha = (texto?: string) => !!texto && /^\d{4}-\d{2}-\d{2}$/.test(texto);
const estiloBotonDia = "rounded-lg border border-black/15 px-3 py-2 dark:border-white/20";

export default async function PaginaVentas({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const parametros = await searchParams;
  const { supabase, perfil } = await obtenerPerfil();
  const esDueno = perfil?.rol === "dueno";
  const hoy = hoyEnBogota();
  const fecha = esFecha(parametros.fecha) ? parametros.fecha! : hoy;

  const { data } = await supabase
    .from("ventas")
    .select(columnasVenta)
    .gte("fecha_hora", `${fecha}T00:00:00-05:00`)
    .lt("fecha_hora", `${sumarDias(fecha, 1)}T00:00:00-05:00`)
    .order("fecha_hora", { ascending: false })
    .returns<Venta[]>();
  const ventas = data ?? [];

  const resumen = resumir(ventas);
  const porBarbero = resumirPorBarbero(ventas);
  const porFormaPago = totalPorFormaPago(ventas);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Ventas {fecha === hoy ? "de hoy" : `del ${formatoFechaLarga(`${fecha}T12:00:00-05:00`).toLowerCase()}`}
          </h1>
          <p className="mt-1 text-sm opacity-70">{esDueno ? "Todo el equipo" : "Tus ventas"}</p>
        </div>
        <Link
          href="/panel/ventas/nueva"
          className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
        >
          + Registrar venta
        </Link>
      </div>

      <nav className="mt-4 flex items-center gap-2 text-sm">
        <Link href={`/panel/ventas?fecha=${sumarDias(fecha, -1)}`} className={estiloBotonDia}>
          ← Anterior
        </Link>
        {fecha !== hoy && (
          <Link href="/panel/ventas" className={estiloBotonDia}>
            Hoy
          </Link>
        )}
        {fecha < hoy && (
          <Link href={`/panel/ventas?fecha=${sumarDias(fecha, 1)}`} className={estiloBotonDia}>
            Siguiente →
          </Link>
        )}
      </nav>

      {/* Los cuatro números del día */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cifra titulo="Cortes" valor={String(resumen.cortes)} />
        <Cifra titulo="Servicios" valor={formatoPesos(resumen.servicios)} />
        <Cifra titulo="Productos" valor={formatoPesos(resumen.productos)} />
        <Cifra titulo="Total" valor={formatoPesos(resumen.total)} resaltar />
      </div>

      {ventas.length > 0 && (
        <p className="mt-3 text-sm opacity-70">
          {(Object.keys(porFormaPago) as FormaPago[])
            .filter((forma) => porFormaPago[forma] > 0)
            .map((forma) => `${nombreFormaPago[forma]} ${formatoPesos(porFormaPago[forma])}`)
            .join(" · ")}
        </p>
      )}

      {/* Solo el dueño: cuánto vendió cada barbero */}
      {esDueno && porBarbero.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <h2 className="font-semibold">Por barbero</h2>
          <table className="mt-2 w-full text-sm">
            <thead className="text-left opacity-70">
              <tr>
                <th className="py-1 font-normal">Barbero</th>
                <th className="py-1 text-right font-normal">Cortes</th>
                <th className="py-1 text-right font-normal">Servicios</th>
                <th className="py-1 text-right font-normal">Productos</th>
                <th className="py-1 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {porBarbero.map((b) => (
                <tr key={b.id} className="border-t border-black/10 dark:border-white/15">
                  <td className="py-2">{b.nombre}</td>
                  <td className="py-2 text-right">{b.cortes}</td>
                  <td className="py-2 text-right">{formatoPesos(b.servicios)}</td>
                  <td className="py-2 text-right">{formatoPesos(b.productos)}</td>
                  <td className="py-2 text-right font-semibold">{formatoPesos(b.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cada venta */}
      <h2 className="mt-6 font-semibold">Ventas ({ventas.length})</h2>
      {ventas.length === 0 ? (
        <p className="mt-2 text-sm opacity-70">
          No hay ventas este día. Se registran solas al marcar una cita como Atendida.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {ventas.map((venta) => (
            <li key={venta.id}>
              <Link
                href={`/panel/ventas/${venta.id}`}
                className="flex items-start justify-between gap-3 rounded-xl border border-black/10 p-4 dark:border-white/15"
              >
                <div>
                  <p className="font-semibold">{describirLineas(venta.detalle_venta)}</p>
                  <p className="text-xs opacity-70">
                    {formatoHora(venta.fecha_hora)}
                    {esDueno && ` · ${venta.estilistas?.nombre}`}
                    {venta.clientes && ` · ${venta.clientes.nombre}`}
                    {` · ${nombreFormaPago[venta.forma_pago]}`}
                  </p>
                </div>
                <p className="font-semibold">{formatoPesos(Number(venta.total))}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Cifra({ titulo, valor, resaltar }: { titulo: string; valor: string; resaltar?: boolean }) {
  return (
    <div
      className={`rounded-xl p-3 ${
        resaltar
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "border border-black/10 dark:border-white/15"
      }`}
    >
      <p className="text-xs opacity-70">{titulo}</p>
      <p className="text-lg font-bold">{valor}</p>
    </div>
  );
}
