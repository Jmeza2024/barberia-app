"use client";
import { useActionState } from "react";
import { crearProducto, type EstadoProducto } from "./acciones";

const estiloCampo =
  "w-full rounded-lg border border-black/20 bg-transparent p-3 dark:border-white/25";

const inicial: EstadoProducto = {
  error: null,
  exito: null,
  valores: { nombre: "", precio: "", existencias: "0", minimo: "3" },
  intento: 0,
};

export default function FormularioProducto() {
  const [estado, accion, cargando] = useActionState(crearProducto, inicial);
  const v = estado.valores;

  return (
    <form
      key={estado.intento}
      action={accion}
      className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/15"
    >
      <h2 className="font-semibold">Agregar producto</h2>
      {estado.error && <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800">{estado.error}</p>}
      {estado.exito && <p className="rounded-lg bg-green-100 p-3 text-sm text-green-800">{estado.exito}</p>}
      <input name="nombre" required placeholder="Nombre, ej. Cera mate" defaultValue={v.nombre} className={estiloCampo} />
      <label className="block text-sm">
        Precio de venta
        <input
          name="precio"
          type="number"
          inputMode="numeric"
          min={0}
          step={500}
          required
          defaultValue={v.precio}
          className={`${estiloCampo} mt-1`}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Unidades que hay
          <input name="existencias" type="number" min={0} defaultValue={v.existencias} className={`${estiloCampo} mt-1`} />
        </label>
        <label className="block text-sm">
          Avisar cuando queden
          <input name="minimo" type="number" min={0} defaultValue={v.minimo} className={`${estiloCampo} mt-1`} />
        </label>
      </div>
      <button
        disabled={cargando}
        className="w-full rounded-xl bg-black py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {cargando ? "Guardando…" : "Crear producto"}
      </button>
    </form>
  );
}
