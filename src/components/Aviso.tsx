// Un mensaje arriba de la página después de guardar o borrar algo.
// El texto llega en la dirección: /panel/servicios?aviso=Guardado
export default function Aviso({ texto }: { texto?: string }) {
  if (!texto) return null;
  return <p className="mt-4 rounded-xl border border-borde bg-boton p-3 text-sm">{texto}</p>;
}
