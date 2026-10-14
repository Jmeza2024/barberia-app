// Página /panel/ventas/[id]: el detalle de una venta. Aquí se corrige la
// forma de pago o el precio, se agregan productos o se anula si fue un error.
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerPerfil } from "@/lib/sesion";
import { fechaEnBogota, formatoFechaLarga, formatoHora, formatoPesos, hoyEnBogota } from "@/lib/formato";
import { columnasVenta, nombreFormaPago, ordenarLineas, type FormaPago, type Venta } from "@/lib/ventas";
import { agregarProducto, anularVenta, cambiarFormaPago, cambiarPrecio } from "./acciones";

const estiloCampo = "rounded-lg border border-borde bg-transparent p-2 text-sm";
const estiloBoton = "rounded-lg border border-borde px-3 py-2 text-sm";

export default async function PaginaVenta({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const { aviso, error } = await searchParams;
  const { supabase, perfil } = await obtenerPerfil();

  const [{ data: venta }, { data: productos }] = await Promise.all([
    supabase.from("ventas").select(columnasVenta).eq("id", id).maybeSingle<Venta>(),
    supabase
      .from("productos")
      .select("id, nombre, precio_venta, existencias")
      .eq("activo", true)
      .gt("existencias", 0)
      .order("nombre"),
  ]);

  // Si no existe o es de otro barbero, RLS no la devuelve.
  if (!venta) notFound();

  const fecha = fechaEnBogota(venta.fecha_hora);
  // Lo mismo que revisa anular_venta en la base de datos, para mostrar o no el botón.
  const puedeAnular = perfil?.rol === "dueno" || fecha === hoyEnBogota();

  return (
    <section className="max-w-xl">
      <Link href={`/panel/ventas?fecha=${fecha}`} className="text-sm underline">
        ← Volver a ventas
      </Link>

      {aviso === "nueva" && (
        <p className="mt-4 rounded-xl bg-emerald-950/60 p-4 text-sm text-emerald-200">Venta registrada.</p>
      )}
      {error && <p className="mt-4 rounded-xl bg-red-950/60 p-4 text-sm text-red-200">{error}</p>}

      <div className="mt-4 rounded-xl border border-borde bg-tarjeta p-4">
        <p className="text-sm text-suave">
          {formatoFechaLarga(venta.fecha_hora)}, {formatoHora(venta.fecha_hora)} · {venta.estilistas?.nombre}
        </p>
        {venta.clientes && <p className="mt-1 font-semibold">{venta.clientes.nombre}</p>}
        {venta.cita_id && (
          <Link href={`/panel/cita/${venta.cita_id}`} className="text-sm underline">
            Ver la cita
          </Link>
        )}

        <ul className="mt-4 space-y-3">
          {ordenarLineas(venta.detalle_venta).map((linea) => (
            <li key={linea.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {linea.cantidad > 1 && `${linea.cantidad} × `}
                {linea.servicios?.nombre ?? linea.productos?.nombre}
              </span>
              {linea.tipo === "servicio" ? (
                // El precio del servicio se puede corregir aquí mismo.
                <form action={cambiarPrecio.bind(null, venta.id, linea.id)} className="flex items-center gap-2">
                  <input
                    name="precio"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={500}
                    defaultValue={Number(linea.precio_unitario)}
                    aria-label="Precio del servicio"
                    className={`${estiloCampo} w-28 text-right`}
                  />
                  <button className={estiloBoton}>Guardar</button>
                </form>
              ) : (
                <span>{formatoPesos(linea.cantidad * Number(linea.precio_unitario))}</span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-borde pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatoPesos(Number(venta.total))}</span>
        </div>
      </div>

      {/* Forma de pago */}
      <form action={cambiarFormaPago.bind(null, venta.id)} className="mt-4 flex items-center gap-2">
        <label htmlFor="forma_pago" className="text-sm">
          Pagó con
        </label>
        <select id="forma_pago" name="forma_pago" defaultValue={venta.forma_pago} className={estiloCampo}>
          {(Object.keys(nombreFormaPago) as FormaPago[]).map((forma) => (
            <option key={forma} value={forma}>
              {nombreFormaPago[forma]}
            </option>
          ))}
        </select>
        <button className={estiloBoton}>Guardar</button>
      </form>

      {/* Agregar un producto */}
      {!!productos?.length && (
        <form
          action={agregarProducto.bind(null, venta.id)}
          className="mt-6 space-y-2 rounded-xl border border-borde bg-tarjeta p-4"
        >
          <h2 className="font-semibold">Agregar producto</h2>
          <div className="flex flex-wrap gap-2">
            <select name="producto" required defaultValue="" className={`${estiloCampo} flex-1`}>
              <option value="" disabled>
                Producto
              </option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {formatoPesos(Number(p.precio_venta))} (quedan {p.existencias})
                </option>
              ))}
            </select>
            <input
              name="cantidad"
              type="number"
              min={1}
              defaultValue={1}
              aria-label="Cantidad"
              className={`${estiloCampo} w-16`}
            />
            <button className={estiloBoton}>Agregar</button>
          </div>
        </form>
      )}

      {/* Anular */}
      {puedeAnular && (
        <form
          action={anularVenta.bind(null, venta.id, fecha)}
          className="mt-6 space-y-2 rounded-xl border border-red-900/70 p-4"
        >
          <h2 className="font-semibold text-red-400">Anular venta</h2>
          <p className="text-sm text-suave">
            Úsalo si se registró por error. Los productos vuelven al inventario
            {venta.cita_id ? " y la cita vuelve a Confirmada" : ""}.
          </p>
          <button className="rounded-xl border border-red-500/70 px-4 py-3 text-sm font-semibold text-red-400">
            Anular venta
          </button>
        </form>
      )}
    </section>
  );
}
