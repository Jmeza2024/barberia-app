// Página /panel/barberos: solo el dueño. Lista de barberos, crear nuevos,
// cambiar su nombre y comisión, desactivar a quien ya no trabaje o borrarlo.
import { Trash2 } from "lucide-react";
import { exigirDueno } from "@/lib/sesion";
import Aviso from "@/components/Aviso";
import BotonConfirmar from "@/components/BotonConfirmar";
import FormularioBarbero from "./FormularioBarbero";
import { borrarBarbero, cambiarActivo, guardarBarbero } from "./acciones";

type Barbero = {
  id: string;
  nombre: string;
  rol: "dueno" | "barbero";
  porcentaje_comision: number;
  activo: boolean;
};

export default async function PaginaBarberos({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;
  const { supabase, perfil } = await exigirDueno();
  const { data: barberos } = await supabase
    .from("estilistas")
    .select("id, nombre, rol, porcentaje_comision, activo")
    .order("activo", { ascending: false })
    .order("nombre")
    .returns<Barbero[]>();

  return (
    <section className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl font-bold">Barberos</h1>
        <Aviso texto={aviso} />
        <ul className="mt-4 space-y-2">
          {barberos?.map((b) => (
            <li
              key={b.id}
              className={`rounded-xl border border-borde bg-tarjeta p-4 ${b.activo ? "" : "opacity-60"}`}
            >
              <p className="text-xs text-suave">
                {b.rol === "dueno" ? "Dueño" : "Barbero"}
                {b.activo ? "" : " · desactivado"}
              </p>

              {/* Nombre y comisión se guardan juntos */}
              <form action={guardarBarbero.bind(null, b.id)} className="mt-2 space-y-2 text-sm">
                <input
                  name="nombre"
                  aria-label="Nombre"
                  required
                  minLength={2}
                  defaultValue={b.nombre}
                  className="w-full rounded-lg border border-borde bg-transparent p-2 text-base font-semibold"
                />
                <div className="flex items-center gap-2">
                  <label htmlFor={`comision-${b.id}`}>Comisión</label>
                  <input
                    id={`comision-${b.id}`}
                    name="comision"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    defaultValue={b.porcentaje_comision}
                    className="w-20 rounded-lg border border-borde bg-transparent p-2"
                  />
                  <span>%</span>
                  <button className="ml-auto rounded-lg border border-borde px-3 py-2">Guardar</button>
                </div>
              </form>

              {/* El dueño no se puede desactivar ni borrar a sí mismo */}
              {b.id !== perfil?.id && (
                <div className="mt-3 flex items-center justify-between border-t border-borde pt-3 text-sm">
                  <form action={cambiarActivo.bind(null, b.id, !b.activo)}>
                    <button className="underline">{b.activo ? "Desactivar" : "Activar"}</button>
                  </form>
                  <BotonConfirmar
                    accion={borrarBarbero.bind(null, b.id)}
                    pregunta={`¿Borrar a ${b.nombre}? Esto no se puede deshacer.`}
                    className="flex items-center gap-1 text-red-400"
                  >
                    <Trash2 size={15} />
                    Borrar
                  </BotonConfirmar>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <FormularioBarbero />
    </section>
  );
}
