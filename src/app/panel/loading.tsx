// Mientras una página del panel carga, Next.js muestra esto en vez de una
// pantalla vacía: unas cajitas grises que "palpitan" (animate-pulse).
export default function Cargando() {
  return (
    <div className="animate-pulse space-y-3" aria-label="Cargando">
      <div className="h-8 w-48 rounded-lg bg-tarjeta" />
      <div className="h-4 w-24 rounded bg-tarjeta" />
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-20 rounded-xl border border-borde bg-tarjeta" />
      ))}
    </div>
  );
}
