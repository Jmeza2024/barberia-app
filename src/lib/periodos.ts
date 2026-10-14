// Periodos de los reportes: un día, una semana (lunes a domingo), un mes o
// unas fechas a mano. Todo con fechas de texto "AAAA-MM-DD".
import { hoyEnBogota, sumarDias } from "./formato";

export type TipoPeriodo = "dia" | "semana" | "mes" | "rango";

export type Periodo = {
  tipo: TipoPeriodo;
  desde: string;
  hasta: string;
  titulo: string;
  anterior: string | null; // la fecha que abre el periodo anterior (null en "rango")
  siguiente: string | null; // la del siguiente, o null si es el futuro
};

const esFecha = (texto?: string) => !!texto && /^\d{4}-\d{2}-\d{2}$/.test(texto);

const fechaUTC = (fecha: string) => new Date(`${fecha}T12:00:00Z`);

// "2026-10-12" -> "12 de octubre"
function diaYMes(fecha: string) {
  return fechaUTC(fecha).toLocaleDateString("es-CO", { timeZone: "UTC", day: "numeric", month: "long" });
}

// "del 12 al 18 de octubre", o "del 28 de septiembre al 4 de octubre" si cambia el mes.
function entreFechas(desde: string, hasta: string) {
  const mismoMes = desde.slice(0, 7) === hasta.slice(0, 7);
  const inicio = mismoMes ? String(Number(desde.slice(8))) : diaYMes(desde);
  return `del ${inicio} al ${diaYMes(hasta)}`;
}

function lunesDe(fecha: string) {
  const diaSemana = fechaUTC(fecha).getUTCDay(); // 0 = domingo
  return sumarDias(fecha, -((diaSemana + 6) % 7));
}

function primeroDelMes(fecha: string) {
  return `${fecha.slice(0, 8)}01`;
}

function sumarMeses(fecha: string, meses: number) {
  const d = fechaUTC(primeroDelMes(fecha));
  d.setUTCMonth(d.getUTCMonth() + meses);
  return d.toISOString().slice(0, 10);
}

// Lee el periodo de la dirección, por ejemplo ?periodo=semana&fecha=2026-10-12
export function leerPeriodo(parametros: {
  periodo?: string;
  fecha?: string;
  desde?: string;
  hasta?: string;
}): Periodo {
  const hoy = hoyEnBogota();
  const fecha = esFecha(parametros.fecha) ? parametros.fecha! : hoy;
  const tipo: TipoPeriodo = (["dia", "semana", "mes", "rango"] as const).includes(
    parametros.periodo as TipoPeriodo,
  )
    ? (parametros.periodo as TipoPeriodo)
    : "semana";
  const siguienteSiNoEsFuturo = (inicio: string) => (inicio <= hoy ? inicio : null);

  if (tipo === "dia") {
    const texto = fechaUTC(fecha).toLocaleDateString("es-CO", {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return {
      tipo,
      desde: fecha,
      hasta: fecha,
      titulo: texto.charAt(0).toUpperCase() + texto.slice(1),
      anterior: sumarDias(fecha, -1),
      siguiente: siguienteSiNoEsFuturo(sumarDias(fecha, 1)),
    };
  }

  if (tipo === "mes") {
    const desde = primeroDelMes(fecha);
    const siguienteMes = sumarMeses(fecha, 1);
    const texto = fechaUTC(desde).toLocaleDateString("es-CO", { timeZone: "UTC", month: "long", year: "numeric" });
    return {
      tipo,
      desde,
      hasta: sumarDias(siguienteMes, -1),
      titulo: texto.charAt(0).toUpperCase() + texto.slice(1),
      anterior: sumarMeses(fecha, -1),
      siguiente: siguienteSiNoEsFuturo(siguienteMes),
    };
  }

  if (tipo === "rango") {
    let desde = esFecha(parametros.desde) ? parametros.desde! : primeroDelMes(hoy);
    let hasta = esFecha(parametros.hasta) ? parametros.hasta! : hoy;
    if (desde > hasta) [desde, hasta] = [hasta, desde];
    // Máximo un año, para que el reporte no sea eterno.
    if (desde < sumarDias(hasta, -366)) desde = sumarDias(hasta, -366);
    return {
      tipo,
      desde,
      hasta,
      titulo: `D${entreFechas(desde, hasta).slice(1)}`,
      anterior: null,
      siguiente: null,
    };
  }

  // Semana: de lunes a domingo.
  const desde = lunesDe(fecha);
  const hasta = sumarDias(desde, 6);
  return {
    tipo,
    desde,
    hasta,
    titulo: `Semana ${entreFechas(desde, hasta)}`,
    anterior: sumarDias(desde, -7),
    siguiente: siguienteSiNoEsFuturo(sumarDias(desde, 7)),
  };
}

// La parte de la dirección que identifica un periodo, para armar enlaces.
export function parametrosDe(periodo: Periodo, fecha?: string) {
  return periodo.tipo === "rango"
    ? `periodo=rango&desde=${periodo.desde}&hasta=${periodo.hasta}`
    : `periodo=${periodo.tipo}&fecha=${fecha ?? periodo.desde}`;
}
