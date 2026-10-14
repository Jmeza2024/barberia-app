"use client";
// useActionState conecta el formulario con la acción del servidor y nos
// devuelve su respuesta (el error y el correo) y si todavía está cargando.
// Ojo: React limpia el formulario después de enviarlo, por eso le
// devolvemos el correo con defaultValue.
import { useActionState } from "react";
import { iniciarSesion, type EstadoIngreso } from "./acciones";

const estiloCampo =
  "w-full rounded-lg border border-borde bg-transparent p-3";

const inicial: EstadoIngreso = { error: null, correo: "" };

export default function FormularioIngreso() {
  const [estado, accion, cargando] = useActionState(iniciarSesion, inicial);

  return (
    <form action={accion} className="mt-6 space-y-3">
      {estado.error && (
        <p className="rounded-lg bg-red-950/60 p-3 text-sm text-red-200">{estado.error}</p>
      )}
      <input
        name="correo"
        type="email"
        required
        placeholder="Correo"
        defaultValue={estado.correo}
        key={estado.correo}
        className={estiloCampo}
      />
      <input
        name="contrasena"
        type="password"
        required
        placeholder="Contraseña"
        className={estiloCampo}
      />
      <button
        disabled={cargando}
        className="w-full rounded-xl boton-plata py-4 font-semibold text-black disabled:opacity-50"
      >
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
