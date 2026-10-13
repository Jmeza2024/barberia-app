"use client";
import { useActionState } from "react";
import { crearCitaEquipo, type EstadoNuevaCita } from "./acciones";
import { formatoPesos } from "@/lib/formato";

const estiloCampo =
  "w-full rounded-lg border border-black/20 bg-transparent p-3 dark:border-white/25";

type Props = {
  servicios: { id: string; nombre: string; precio: number; duracion_min: number }[];
  barberos: { id: string; nombre: string }[] | null; // null = barbero (no elige)
  fecha: string;
  horaSugerida: string;
};

export default function FormularioCita({ servicios, barberos, fecha, horaSugerida }: Props) {
  const inicial: EstadoNuevaCita = {
    error: null,
    valores: { fecha, hora: horaSugerida },
    intento: 0,
  };
  const [estado, accion, cargando] = useActionState(crearCitaEquipo, inicial);
  const v = estado.valores;

  return (
    <form key={estado.intento} action={accion} className="mt-4 space-y-3">
      {estado.error && (
        <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800">{estado.error}</p>
      )}
      <input name="nombre" required placeholder="Nombre del cliente" defaultValue={v.nombre} className={estiloCampo} />
      <input
        name="telefono"
        type="tel"
        inputMode="tel"
        required
        placeholder="Celular (WhatsApp)"
        defaultValue={v.telefono}
        className={estiloCampo}
      />
      <select name="servicio" required defaultValue={v.servicio ?? ""} className={estiloCampo}>
        <option value="" disabled>
          Servicio
        </option>
        {servicios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre} · {s.duracion_min} min · {formatoPesos(s.precio)}
          </option>
        ))}
      </select>
      {barberos && (
        <select name="barbero" required defaultValue={v.barbero ?? ""} className={estiloCampo}>
          <option value="" disabled>
            Barbero
          </option>
          {barberos.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>
      )}
      <div className="grid grid-cols-2 gap-3">
        <input name="fecha" type="date" required defaultValue={v.fecha} className={estiloCampo} />
        <input name="hora" type="time" step={900} required defaultValue={v.hora} className={estiloCampo} />
      </div>
      <input name="nota" placeholder="Nota (opcional)" defaultValue={v.nota} className={estiloCampo} />
      <button
        disabled={cargando}
        className="w-full rounded-xl bg-black py-4 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {cargando ? "Guardando…" : "Crear cita"}
      </button>
    </form>
  );
}
