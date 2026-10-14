// Los textos que se le envían al cliente por WhatsApp. Están en un solo
// lugar para que el botón manual y el envío automático digan lo mismo.
//
// Cada mensaje tiene "datos" en orden ({{1}}, {{2}}...). Así es como Meta
// pide las plantillas: el texto fijo se aprueba una vez y los datos cambian.
import { formatoFechaLarga, formatoHora } from "./formato";

export type DatosCita = {
  cliente: string;
  servicio: string;
  barbero: string;
  inicio: string;
  enlace: string; // la página pública de la cita, para verla o cancelarla
};

const primerNombre = (nombre: string) => nombre.trim().split(" ")[0];
const fecha = (inicio: string) => formatoFechaLarga(inicio).toLowerCase();

export type Plantilla = {
  nombre: string; // como se llama la plantilla en Meta
  datos: string[];
  texto: string; // el mensaje completo, para el botón manual
};

export function mensajeRecordatorio(c: DatosCita): Plantilla {
  const datos = [primerNombre(c.cliente), c.servicio, fecha(c.inicio), formatoHora(c.inicio), c.barbero, c.enlace];
  return {
    nombre: "recordatorio_cita",
    datos,
    texto: `Hola ${datos[0]}, te recordamos tu cita de ${datos[1]} el ${datos[2]} a las ${datos[3]} con ${datos[4]}. Si no puedes venir, puedes cancelarla aquí: ${datos[5]}`,
  };
}

export function mensajeCancelada(c: DatosCita): Plantilla {
  const datos = [primerNombre(c.cliente), c.servicio, fecha(c.inicio), formatoHora(c.inicio)];
  return {
    nombre: "cita_cancelada",
    datos,
    texto: `Hola ${datos[0]}, lamentablemente tuvimos que cancelar tu cita de ${datos[1]} del ${datos[2]} a las ${datos[3]}. Responde este mensaje y te agendamos otro día.`,
  };
}

export function mensajeCambiada(c: DatosCita): Plantilla {
  const datos = [primerNombre(c.cliente), c.servicio, fecha(c.inicio), formatoHora(c.inicio), c.barbero, c.enlace];
  return {
    nombre: "cita_cambiada",
    datos,
    texto: `Hola ${datos[0]}, tu cita de ${datos[1]} quedó para el ${datos[2]} a las ${datos[3]} con ${datos[4]}. Puedes verla aquí: ${datos[5]}`,
  };
}
