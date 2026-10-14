// Nombres y colores de cada estado de una cita, para usarlos en todas las pantallas.
export type EstadoCita = "confirmada" | "atendida" | "cancelada" | "no_vino";

export const nombreEstado: Record<EstadoCita, string> = {
  confirmada: "Confirmada",
  atendida: "Atendida",
  cancelada: "Cancelada",
  no_vino: "No vino",
};

export const colorEstado: Record<EstadoCita, string> = {
  confirmada: "bg-zinc-700 text-zinc-100",
  atendida: "bg-emerald-950/60 text-emerald-200",
  cancelada: "bg-red-950/60 text-red-200",
  no_vino: "bg-amber-950/60 text-amber-200",
};
