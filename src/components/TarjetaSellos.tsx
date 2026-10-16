// La tarjeta de cortes: un círculo por cada corte. Los cortes hechos se
// "tachan" (círculo blanco con tijeras) y el último es el regalo.
import { Gift, Scissors } from "lucide-react";

export type Tarjeta = { sellos: number; meta: number; gratis_disponibles: number };

export default function TarjetaSellos({ tarjeta, pequena }: { tarjeta: Tarjeta; pequena?: boolean }) {
  const { meta, gratis_disponibles } = tarjeta;
  // Si ya ganó el corte gratis, la tarjeta se ve llena hasta que lo use.
  const llenos = gratis_disponibles > 0 ? meta : tarjeta.sellos;
  const tamano = pequena ? "h-8 w-8" : "h-11 w-11";

  return (
    <div>
      <div className="grid grid-cols-5 justify-items-center gap-2">
        {Array.from({ length: meta }, (_, i) => (
          <span
            key={i}
            className={`flex ${tamano} items-center justify-center rounded-full border text-xs ${
              i < llenos ? "border-white bg-white text-black" : "border-borde text-suave"
            }`}
          >
            {i < llenos ? <Scissors size={pequena ? 14 : 18} /> : i + 1}
          </span>
        ))}
      </div>
      <div
        className={`mt-3 flex items-center justify-center gap-2 rounded-xl border py-2 text-sm font-semibold ${
          gratis_disponibles > 0 ? "boton-plata border-transparent" : "border-dashed border-borde text-suave"
        }`}
      >
        <Gift size={16} />
        {gratis_disponibles > 0
          ? "¡Tienes un corte gratis!"
          : `Te faltan ${meta - tarjeta.sellos} para tu corte gratis`}
      </div>
    </div>
  );
}
