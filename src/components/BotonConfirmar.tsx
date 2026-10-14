"use client";
// Un botón que pregunta "¿Seguro?" antes de hacer algo que no se puede deshacer,
// como borrar. Si el dueño toca "Cancelar", el formulario no se envía.
export default function BotonConfirmar({
  accion,
  pregunta,
  className,
  children,
}: {
  accion: () => Promise<void>;
  pregunta: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={accion}
      onSubmit={(evento) => {
        if (!confirm(pregunta)) evento.preventDefault();
      }}
    >
      <button className={className}>{children}</button>
    </form>
  );
}
