// Página /panel/reportes: solo el dueño. Cuánto vendió cada barbero en un
// día, una semana, un mes o unas fechas a mano; su comisión y lo que queda
// para el negocio. El dueño puede cambiar el % aquí mismo.
import Link from "next/link";
import { exigirDueno } from "@/lib/sesion";
import { enlaceCompartirWhatsApp, formatoPesos, partesDeFecha } from "@/lib/formato";
import { leerPeriodo, parametrosDe, type TipoPeriodo } from "@/lib/periodos";
import { armarReporte, reporteEnTexto } from "@/lib/reportes";
import { cambiarPorcentaje } from "./acciones";

const pestanas: { tipo: TipoPeriodo; nombre: string }[] = [
  { tipo: "dia", nombre: "Día" },
  { tipo: "semana", nombre: "Semana" },
  { tipo: "mes", nombre: "Mes" },
  { tipo: "rango", nombre: "Fechas" },
];
const estiloBoton = "rounded-lg border border-black/15 px-3 py-2 dark:border-white/20";
const estiloCampo = "rounded-lg border border-black/20 bg-transparent p-2 dark:border-white/25";

export default async function PaginaReportes({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; fecha?: string; desde?: string; hasta?: string }>;
}) {
  const { supabase } = await exigirDueno();
  const periodo = leerPeriodo(await searchParams);
  const reporte = await armarReporte(supabase, periodo);
  const t = reporte.totales;
  const maximoDia = Math.max(...reporte.dias.map((d) => d.total), 1);

  return (
    <section>
      <h1 className="text-2xl font-bold">Reportes</h1>

      {/* Elegir el tipo de periodo */}
      <nav className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-black/5 p-1 text-sm dark:bg-white/10">
        {pestanas.map((p) => (
          <Link
            key={p.tipo}
            href={`/panel/reportes?periodo=${p.tipo}`}
            className={`rounded-lg py-2 text-center ${
              periodo.tipo === p.tipo ? "bg-white font-semibold shadow-sm dark:bg-black" : ""
            }`}
          >
            {p.nombre}
          </Link>
        ))}
      </nav>

      <h2 className="mt-4 text-lg font-semibold">{periodo.titulo}</h2>

      {periodo.tipo === "rango" ? (
        // Formulario GET: las fechas se vuelven parte de la dirección.
        <form className="mt-2 flex flex-wrap items-end gap-2 text-sm">
          <input type="hidden" name="periodo" value="rango" />
          <label>
            Desde
            <input type="date" name="desde" defaultValue={periodo.desde} className={`${estiloCampo} ml-1`} />
          </label>
          <label>
            Hasta
            <input type="date" name="hasta" defaultValue={periodo.hasta} className={`${estiloCampo} ml-1`} />
          </label>
          <button className={estiloBoton}>Ver</button>
        </form>
      ) : (
        <div className="mt-2 flex gap-2 text-sm">
          <Link href={`/panel/reportes?${parametrosDe(periodo, periodo.anterior!)}`} className={estiloBoton}>
            ← Anterior
          </Link>
          {periodo.siguiente && (
            <Link href={`/panel/reportes?${parametrosDe(periodo, periodo.siguiente)}`} className={estiloBoton}>
              Siguiente →
            </Link>
          )}
        </div>
      )}

      {/* Los números grandes */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cifra titulo="Total vendido" valor={formatoPesos(t.total)} />
        <Cifra titulo="Cortes" valor={String(t.cortes)} />
        <Cifra titulo="Comisiones" valor={formatoPesos(t.comision)} />
        <Cifra titulo="Para el negocio" valor={formatoPesos(t.negocio)} resaltar />
      </div>
      <p className="mt-2 text-xs opacity-60">
        Servicios {formatoPesos(t.servicios)} · Productos {formatoPesos(t.productos)}. La comisión se
        calcula solo sobre los servicios; los productos quedan para el negocio.
      </p>

      {/* Cada barbero */}
      <h2 className="mt-6 font-semibold">Por barbero</h2>
      <ul className="mt-2 space-y-2">
        {reporte.barberos.map((b) => (
          <li key={b.id} className="rounded-xl border border-black/10 p-4 dark:border-white/15">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold">{b.nombre}</p>
              <p className="font-semibold">{formatoPesos(b.total)}</p>
            </div>
            <p className="text-sm opacity-70">
              {b.cortes} corte(s) · servicios {formatoPesos(b.servicios)} · productos{" "}
              {formatoPesos(b.productos)}
            </p>
            <form
              action={cambiarPorcentaje.bind(null, b.id)}
              className="mt-3 flex flex-wrap items-center gap-2 text-sm"
            >
              <label htmlFor={`porcentaje-${b.id}`}>Comisión</label>
              <input
                id={`porcentaje-${b.id}`}
                name="porcentaje"
                type="number"
                min={0}
                max={100}
                step="0.5"
                defaultValue={b.porcentaje}
                className={`${estiloCampo} w-20`}
              />
              <span>%</span>
              <button className={estiloBoton}>Recalcular</button>
              <span className="ml-auto">
                = <strong>{formatoPesos(b.comision)}</strong>
              </span>
            </form>
            <p className="mt-2 text-sm">
              Para el negocio: <strong>{formatoPesos(b.negocio)}</strong>
            </p>
          </li>
        ))}
      </ul>

      {/* Día por día, con una barra para comparar */}
      {reporte.dias.length > 1 && (
        <>
          <h2 className="mt-6 font-semibold">Día por día</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {reporte.dias.map((d) => {
              const p = partesDeFecha(d.dia);
              return (
                <li key={d.dia} className="grid grid-cols-[4.5rem_1fr_6.5rem] items-center gap-2">
                  <span className="capitalize">
                    {p.diaSemana} {p.dia}
                  </span>
                  <span className="h-3 rounded bg-black/5 dark:bg-white/10">
                    <span
                      className="block h-3 rounded bg-black dark:bg-white"
                      style={{ width: `${(d.total / maximoDia) * 100}%` }}
                    />
                  </span>
                  <span className="text-right">
                    {formatoPesos(d.total)}
                    <span className="block text-xs opacity-60">{d.cortes} corte(s)</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Sacar el reporte de la app */}
      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={enlaceCompartirWhatsApp(reporteEnTexto(periodo, reporte))}
          className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white"
        >
          Compartir por WhatsApp
        </a>
        <a href={`/panel/reportes/descargar?${parametrosDe(periodo)}`} className={`${estiloBoton} py-3 font-semibold`}>
          Descargar para Excel
        </a>
      </div>
      <p className="mt-3 text-xs opacity-60">
        La comisión usa el % que tiene hoy cada barbero. Si lo cambias, también cambia en los reportes de
        fechas pasadas.
      </p>
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
