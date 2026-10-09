// Funciones para mostrar precios, fechas y horas en formato de Colombia.
// Todas las horas se muestran en la zona horaria de Bogotá, sin importar
// dónde esté el celular del cliente.

export const ZONA_HORARIA = "America/Bogota";

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// 20000 -> "$ 20.000"
export function formatoPesos(valor: number) {
  return pesos.format(valor);
}

// "2026-10-12T15:00:00Z" -> "10:00 a. m."
export function formatoHora(fecha: string | Date) {
  return new Date(fecha).toLocaleTimeString("es-CO", {
    timeZone: ZONA_HORARIA,
    hour: "numeric",
    minute: "2-digit",
  });
}

// "2026-10-12T15:00:00Z" -> "Lunes, 12 de octubre"
export function formatoFechaLarga(fecha: string | Date) {
  const texto = new Date(fecha).toLocaleDateString("es-CO", {
    timeZone: ZONA_HORARIA,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// La fecha de hoy en Bogotá como texto "AAAA-MM-DD".
export function hoyEnBogota() {
  return new Date().toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

// Suma días a una fecha "AAAA-MM-DD" y devuelve otra en el mismo formato.
export function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// "2026-10-12" -> { diaSemana: "lun", dia: "12", mes: "oct" } para los botones del calendario.
export function partesDeFecha(fecha: string) {
  const d = new Date(`${fecha}T12:00:00Z`);
  const opciones = { timeZone: "UTC" } as const;
  return {
    diaSemana: d.toLocaleDateString("es-CO", { ...opciones, weekday: "short" }),
    dia: d.toLocaleDateString("es-CO", { ...opciones, day: "numeric" }),
    mes: d.toLocaleDateString("es-CO", { ...opciones, month: "short" }),
  };
}
