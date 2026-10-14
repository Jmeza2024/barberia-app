// Un adorno para separar secciones: línea — tijeras — línea.
// Le da el toque clásico de barbería sin agregar colores.
import { Scissors } from "lucide-react";

export default function Adorno({ texto }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 text-suave">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-zinc-500" />
      {texto ? (
        <span className="text-[11px] font-medium tracking-[0.35em] uppercase">{texto}</span>
      ) : (
        <Scissors size={14} className="rotate-90" />
      )}
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-zinc-500" />
    </div>
  );
}
