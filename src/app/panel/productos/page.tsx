// Página /panel/productos: lo que se vende en la barbería (ceras, shampoo...).
// Todo el equipo ve precios y unidades; solo el dueño los cambia.
import { obtenerPerfil } from "@/lib/sesion";
import { formatoPesos } from "@/lib/formato";
import FormularioProducto from "./FormularioProducto";
import { cambiarActivoProducto, cambiarPrecioProducto, sumarUnidades } from "./acciones";

type Producto = {
  id: string;
  nombre: string;
  precio_venta: number;
  existencias: number;
  minimo_aviso: number;
  activo: boolean;
};

const estiloCampo = "w-24 rounded-lg border border-black/20 bg-transparent p-2 dark:border-white/25";
const estiloBoton = "rounded-lg border border-black/20 px-3 py-2 dark:border-white/25";

export default async function PaginaProductos() {
  const { supabase, perfil } = await obtenerPerfil();
  const esDueno = perfil?.rol === "dueno";

  let consulta = supabase
    .from("productos")
    .select("id, nombre, precio_venta, existencias, minimo_aviso, activo")
    .order("activo", { ascending: false })
    .order("nombre");
  if (!esDueno) consulta = consulta.eq("activo", true);
  const { data: productos } = await consulta.returns<Producto[]>();

  const pocos = productos?.filter((p) => p.activo && p.existencias <= p.minimo_aviso) ?? [];

  return (
    <section className={esDueno ? "grid gap-6 md:grid-cols-[1fr_320px]" : ""}>
      <div>
        <h1 className="text-2xl font-bold">Productos</h1>

        {pocos.length > 0 && (
          <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">
            Quedan pocos: {pocos.map((p) => `${p.nombre} (${p.existencias})`).join(", ")}
          </p>
        )}

        <ul className="mt-4 space-y-2">
          {productos?.map((p) => (
            <li
              key={p.id}
              className={`rounded-xl border border-black/10 p-4 dark:border-white/15 ${p.activo ? "" : "opacity-50"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.nombre}</p>
                  <p className="text-sm">
                    {formatoPesos(Number(p.precio_venta))} ·{" "}
                    <span className={p.existencias <= p.minimo_aviso ? "font-semibold text-amber-700" : ""}>
                      {p.existencias} unidad(es)
                    </span>
                    {!p.activo && " · desactivado"}
                  </p>
                </div>
                {esDueno && (
                  <form action={cambiarActivoProducto.bind(null, p.id, !p.activo)}>
                    <button className="text-sm underline">{p.activo ? "Desactivar" : "Activar"}</button>
                  </form>
                )}
              </div>

              {esDueno && (
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <form action={cambiarPrecioProducto.bind(null, p.id)} className="flex items-center gap-2">
                    <input
                      name="precio"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={500}
                      defaultValue={Number(p.precio_venta)}
                      aria-label={`Precio de ${p.nombre}`}
                      className={estiloCampo}
                    />
                    <button className={estiloBoton}>Cambiar precio</button>
                  </form>
                  <form action={sumarUnidades.bind(null, p.id)} className="flex items-center gap-2">
                    <input
                      name="cantidad"
                      type="number"
                      inputMode="numeric"
                      placeholder="+ 0"
                      aria-label={`Unidades que llegaron de ${p.nombre}`}
                      className={`${estiloCampo} w-20`}
                    />
                    <button className={estiloBoton}>Sumar unidades</button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
        {!esDueno && (
          <p className="mt-4 text-xs opacity-60">
            Para vender un producto, ve a Ventas &gt; Registrar venta. Solo el dueño cambia precios y
            unidades.
          </p>
        )}
      </div>
      {esDueno && <FormularioProducto />}
    </section>
  );
}
