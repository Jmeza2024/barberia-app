// Página /panel/servicios: solo el dueño. Cambiar nombre, precio y duración
// de los cortes, crear nuevos, ocultarlos o borrarlos.
import { Trash2 } from "lucide-react";
import { exigirDueno } from "@/lib/sesion";
import { formatoPesos } from "@/lib/formato";
import Aviso from "@/components/Aviso";
import BotonConfirmar from "@/components/BotonConfirmar";
import {
  borrarServicio,
  cambiarActivoServicio,
  crearServicio,
  guardarServicio,
} from "./acciones";

type Servicio = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  duracion_min: number;
  activo: boolean;
};

const estiloCampo = "w-full rounded-lg border border-borde bg-transparent p-2";

// Los campos de un servicio. Se usan igual para editar y para crear uno nuevo.
function Campos({ servicio }: { servicio?: Servicio }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <label className="col-span-2">
        <span className="text-xs text-suave">Nombre</span>
        <input name="nombre" required minLength={2} defaultValue={servicio?.nombre} className={estiloCampo} />
      </label>
      <label className="col-span-2">
        <span className="text-xs text-suave">Categoría (ej. Cortes, Barba)</span>
        <input name="categoria" defaultValue={servicio?.categoria ?? "Cortes"} className={estiloCampo} />
      </label>
      <label>
        <span className="text-xs text-suave">Precio</span>
        <input name="precio" type="number" min={0} step={500} required defaultValue={servicio?.precio} className={estiloCampo} />
      </label>
      <label>
        <span className="text-xs text-suave">Minutos</span>
        <input name="duracion" type="number" min={5} max={480} step={5} required defaultValue={servicio?.duracion_min ?? 30} className={estiloCampo} />
      </label>
    </div>
  );
}

export default async function PaginaServicios({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;
  const { supabase } = await exigirDueno();
  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, nombre, categoria, precio, duracion_min, activo")
    .order("activo", { ascending: false })
    .order("categoria")
    .order("precio")
    .returns<Servicio[]>();

  return (
    <section className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl font-bold">Servicios y precios</h1>
        <p className="mt-1 text-sm text-suave">Lo que cambies aquí se ve de una vez en la página de los clientes.</p>
        <Aviso texto={aviso} />
        <ul className="mt-4 space-y-2">
          {servicios?.map((s) => (
            <li
              key={s.id}
              className={`rounded-xl border border-borde bg-tarjeta p-4 ${s.activo ? "" : "opacity-60"}`}
            >
              <p className="mb-2 flex justify-between text-xs text-suave">
                <span>{s.activo ? "Visible para clientes" : "Oculto"}</span>
                <span>{formatoPesos(s.precio)}</span>
              </p>
              <form action={guardarServicio.bind(null, s.id)} className="space-y-2">
                <Campos servicio={s} />
                <button className="w-full rounded-lg border border-borde py-2 text-sm">Guardar</button>
              </form>
              <div className="mt-3 flex items-center justify-between border-t border-borde pt-3 text-sm">
                <form action={cambiarActivoServicio.bind(null, s.id, !s.activo)}>
                  <button className="underline">{s.activo ? "Ocultar" : "Mostrar"}</button>
                </form>
                <BotonConfirmar
                  accion={borrarServicio.bind(null, s.id)}
                  pregunta={`¿Borrar ${s.nombre}? Esto no se puede deshacer.`}
                  className="flex items-center gap-1 text-red-400"
                >
                  <Trash2 size={15} />
                  Borrar
                </BotonConfirmar>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form action={crearServicio} className="h-fit space-y-3 rounded-xl border border-borde bg-tarjeta p-4">
        <h2 className="text-lg font-semibold">Nuevo servicio</h2>
        <Campos />
        <button className="boton-plata w-full rounded-xl py-3 font-semibold">Crear servicio</button>
      </form>
    </section>
  );
}
