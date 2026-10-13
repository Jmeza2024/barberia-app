// Nombres y colores de cada estado de una cita, para usarlos en todas las pantallas.
export type EstadoCita = "confirmada" | "atendida" | "cancelada" | "no_vino";

export const nombreEstado: Record<EstadoCita, string> = {
  confirmada: "Confirmada",
  atendida: "Atendida",
  cancelada: "Cancelada",
  no_vino: "No vino",
};

export const colorEstado: Record<EstadoCita, string> = {
  confirmada: "bg-blue-100 text-blue-800",
  atendida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
  no_vino: "bg-amber-100 text-amber-800",
};
