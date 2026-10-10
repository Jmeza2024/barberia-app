"use client";
import { useActionState } from "react";
import { crearBarbero, type EstadoFormulario } from "./acciones";

const estiloCampo =
  "w-full rounded-lg border border-black/20 bg-transparent p-3 dark:border-white/25";

const inicial: EstadoFormulario = {
  error: null,
  exito: null,
  valores: { nombre: "", correo: "", comision: "40" },
  intento: 0,
};

export default function FormularioBarbero() {
  const [estado, accion, cargando] = useActionState(crearBarbero, inicial);

  return (
    // key={estado.intento}: después de cada envío el formulario se vuelve a
    // dibujar con los valores que devolvió el servidor (vacíos si salió bien).
    <form
      key={estado.intento}
      action={accion}
      className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/15"
    >
      <h2 className="font-semibold">Agregar barbero</h2>
      {estado.error && (
        <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800">{estado.error}</p>
      )}
      {estado.exito && (
        <p className="rounded-lg bg-green-100 p-3 text-sm text-green-800">{estado.exito}</p>
      )}
      <input
        name="nombre"
        required
        placeholder="Nombre"
        defaultValue={estado.valores.nombre}
        className={estiloCampo}
      />
      <input
        name="correo"
        type="email"
        required
        placeholder="Correo para entrar"
        defaultValue={estado.valores.correo}
        className={estiloCampo}
      />
      <input
        name="contrasena"
        type="text"
        required
        minLength={8}
        placeholder="Contraseña (mínimo 8)"
        className={estiloCampo}
      />
      <label className="block text-sm">
        Comisión (%)
        <input
          name="comision"
          type="number"
          min={0}
          max={100}
          step="0.5"
          defaultValue={estado.valores.comision}
          className={`${estiloCampo} mt-1`}
        />
      </label>
      <button
        disabled={cargando}
        className="w-full rounded-xl bg-black py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {cargando ? "Creando…" : "Crear barbero"}
      </button>
      <p className="text-xs opacity-60">
        Entrégale al barbero su correo y contraseña. Entra por /ingresar.
      </p>
    </form>
  );
}
