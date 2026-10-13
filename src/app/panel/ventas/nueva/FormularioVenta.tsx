"use client";
// Este formulario es de cliente porque cambia mientras se llena: al elegir
// un servicio pone su precio, y el total se recalcula con cada producto.
//
// Todos los campos son "controlados" (su valor vive en useState). Así, si
// el servidor devuelve un error, nada de lo escrito se borra.
import { useActionState, useState } from "react";
import { formatoPesos } from "@/lib/formato";
import { nombreFormaPago, type FormaPago } from "@/lib/ventas";
import { registrarVenta, type EstadoVenta } from "./acciones";

const estiloCampo =
  "w-full rounded-lg border border-black/20 bg-transparent p-3 dark:border-white/25";

type Props = {
  servicios: { id: string; nombre: string; precio: number }[];
  productos: { id: string; nombre: string; precio_venta: number; existencias: number }[];
  barberos: { id: string; nombre: string }[] | null; // null = barbero (no elige)
  miId: string;
};

const inicial: EstadoVenta = { error: null };

export default function FormularioVenta({ servicios, productos, barberos, miId }: Props) {
  const [estado, accion, cargando] = useActionState(registrarVenta, inicial);
  const [barbero, setBarbero] = useState(miId);
  const [servicio, setServicio] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");

  function elegirServicio(id: string) {
    setServicio(id);
    const elegido = servicios.find((s) => s.id === id);
    setPrecio(elegido ? String(Number(elegido.precio)) : "");
  }

  function cambiarCantidad(id: string, cambio: number, maximo: number) {
    setCantidades((antes) => {
      const nueva = Math.min(Math.max((antes[id] ?? 0) + cambio, 0), maximo);
      return { ...antes, [id]: nueva };
    });
  }

  const total =
    (servicio ? Number(precio) || 0 : 0) +
    productos.reduce((suma, p) => suma + (cantidades[p.id] ?? 0) * Number(p.precio_venta), 0);

  return (
    <form action={accion} className="mt-4 space-y-4">
      {estado.error && (
        <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800">{estado.error}</p>
      )}

      {barberos && (
        <select name="barbero" value={barbero} onChange={(e) => setBarbero(e.target.value)} className={estiloCampo}>
          {barberos.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>
      )}

      <div className="space-y-2">
        <select name="servicio" value={servicio} onChange={(e) => elegirServicio(e.target.value)} className={estiloCampo}>
          <option value="">Sin servicio (solo productos)</option>
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} · {formatoPesos(Number(s.precio))}
            </option>
          ))}
        </select>
        {servicio && (
          <label className="block text-sm">
            Precio cobrado (cámbialo si hubo descuento)
            <input
              name="precio"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              required
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className={`${estiloCampo} mt-1`}
            />
          </label>
        )}
      </div>

      {productos.length > 0 && (
        <div>
          <p className="text-sm font-semibold">Productos</p>
          <ul className="mt-2 divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/15 dark:border-white/15">
            {productos.map((p) => {
              const cantidad = cantidades[p.id] ?? 0;
              const agotado = p.existencias <= 0;
              return (
                <li key={p.id} className={`flex items-center justify-between gap-2 p-3 ${agotado ? "opacity-50" : ""}`}>
                  <div>
                    <p className="text-sm">{p.nombre}</p>
                    <p className="text-xs opacity-70">
                      {formatoPesos(Number(p.precio_venta))} · {agotado ? "agotado" : `quedan ${p.existencias}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(p.id, -1, p.existencias)}
                      disabled={cantidad === 0}
                      className="h-9 w-9 rounded-lg border border-black/20 disabled:opacity-30 dark:border-white/25"
                      aria-label={`Quitar ${p.nombre}`}
                    >
                      −
                    </button>
                    <span className="w-5 text-center">{cantidad}</span>
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(p.id, 1, p.existencias)}
                      disabled={cantidad >= p.existencias}
                      className="h-9 w-9 rounded-lg border border-black/20 disabled:opacity-30 dark:border-white/25"
                      aria-label={`Agregar ${p.nombre}`}
                    >
                      +
                    </button>
                    {/* El servidor lee la cantidad de este campo escondido. */}
                    <input type="hidden" name={`producto-${p.id}`} value={cantidad} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <fieldset>
        <legend className="text-sm font-semibold">Forma de pago</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.keys(nombreFormaPago) as FormaPago[]).map((forma) => (
            <label
              key={forma}
              className={`cursor-pointer rounded-lg border p-2 text-center text-sm ${
                formaPago === forma
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/20 dark:border-white/25"
              }`}
            >
              <input
                type="radio"
                name="forma_pago"
                value={forma}
                checked={formaPago === forma}
                onChange={() => setFormaPago(forma)}
                className="sr-only"
              />
              {nombreFormaPago[forma]}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        disabled={cargando || (total <= 0 && !servicio)}
        className="w-full rounded-xl bg-black py-4 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {cargando ? "Guardando…" : `Registrar venta · ${formatoPesos(total)}`}
      </button>
    </form>
  );
}
