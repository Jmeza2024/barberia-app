"use client";
// "use client" = este componente corre en el celular del cliente, no en el
// servidor. Lo necesitamos porque reacciona a los toques: elegir servicio,
// barbero, día y hora, sin recargar la página.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, Scissors, User } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import {
  formatoFechaLarga,
  formatoHora,
  formatoPesos,
  hoyEnBogota,
  partesDeFecha,
  sumarDias,
} from "@/lib/formato";

type Servicio = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  duracion_min: number;
};
type Estilista = { id: string; nombre: string; foto_url: string | null };
type Relacion = { estilista_id: string; servicio_id: string };
// reservada = ya tiene cita: se muestra en rojo y no se puede tocar.
type Hora = { inicio: string; reservada: boolean };

type Props = {
  servicios: Servicio[];
  estilistas: Estilista[];
  relacion: Relacion[];
  diasParaReservar: number;
};

// "cualquiera" = todavía no ha elegido barbero (en el paso 2 siempre elige uno).
const CUALQUIERA = "cualquiera";

export default function Reserva({ servicios, estilistas, relacion, diasParaReservar }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => crearClienteNavegador(), []);

  // "Estado": lo que el cliente ha elegido hasta ahora. Cuando cambia,
  // React vuelve a dibujar la pantalla con los valores nuevos.
  const [paso, setPaso] = useState(1);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [estilistaId, setEstilistaId] = useState<string>(CUALQUIERA);
  const [fecha, setFecha] = useState(hoyEnBogota());
  const [horas, setHoras] = useState<Hora[]>([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [hora, setHora] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo los barberos que hacen el servicio elegido.
  const estilistasDelServicio = estilistas.filter((e) =>
    relacion.some((r) => r.estilista_id === e.id && r.servicio_id === servicio?.id),
  );

  const dias = Array.from({ length: diasParaReservar + 1 }, (_, i) => sumarDias(hoyEnBogota(), i));

  // Cada vez que cambia el servicio, el barbero o el día, pedimos las horas del día
  // (libres y reservadas).
  useEffect(() => {
    if (paso !== 3 || !servicio) return;
    let cancelado = false;
    setCargandoHoras(true);
    setHora(null);

    supabase
      .rpc("horas_del_dia", {
        p_servicio: servicio.id,
        p_fecha: fecha,
        p_estilista: estilistaId === CUALQUIERA ? null : estilistaId,
      })
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) setError(error.message);
        setHoras((data as Hora[] | null) ?? []);
        setCargandoHoras(false);
      });

    return () => {
      cancelado = true;
    };
  }, [paso, servicio, estilistaId, fecha, supabase]);

  async function confirmar() {
    if (!servicio || !hora) return;
    setEnviando(true);
    setError(null);

    const { data: codigo, error } = await supabase.rpc("reservar_cita", {
      p_servicio: servicio.id,
      p_inicio: hora,
      p_nombre: nombre,
      p_telefono: telefono,
      p_estilista: estilistaId === CUALQUIERA ? null : estilistaId,
      p_nota: nota,
    });

    if (error) {
      setError(error.message);
      setEnviando(false);
      return;
    }
    router.push(`/cita/${codigo}`);
  }

  const nombreEstilista =
    estilistaId === CUALQUIERA
      ? "Cualquier barbero"
      : estilistas.find((e) => e.id === estilistaId)?.nombre;

  return (
    <div className="mt-4">
      {/* Barra de progreso: 4 rayitas, se llenan a medida que avanza. */}
      <div className="flex items-center justify-between text-sm text-suave">
        <span>Paso {paso} de 4</span>
        {paso > 1 && (
          <button onClick={() => setPaso(paso - 1)} className="flex items-center gap-1 text-texto">
            <ChevronLeft size={16} />
            Atrás
          </button>
        )}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-1 rounded-full ${n <= paso ? "bg-white" : "bg-borde"}`} />
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-950/60 p-3 text-sm text-red-200">{error}</p>
      )}

      {/* Paso 1: servicio */}
      {paso === 1 && (
        <section className="mt-4">
          <h2 className="text-lg font-semibold">¿Qué te vas a hacer?</h2>
          <ul className="mt-3 space-y-2">
            {servicios.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setServicio(s);
                    setEstilistaId(CUALQUIERA);
                    setPaso(2);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-borde bg-tarjeta p-4 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-boton">
                    <Scissors size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">{s.nombre}</span>
                    <span className="text-sm text-suave">{s.duracion_min} min</span>
                  </span>
                  <span className="font-semibold">{formatoPesos(s.precio)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Paso 2: barbero */}
      {paso === 2 && (
        <section className="mt-4">
          <h2 className="text-lg font-semibold">¿Con quién?</h2>
          <ul className="mt-3 space-y-2">
            {estilistasDelServicio.map(
              (e) => (
                <li key={e.id}>
                  <button
                    onClick={() => {
                      setEstilistaId(e.id);
                      setPaso(3);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-borde bg-tarjeta p-4 text-left"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-boton font-semibold">
                      {e.nombre.charAt(0)}
                    </span>
                    <span className="font-medium">{e.nombre}</span>
                  </button>
                </li>
              ),
            )}
          </ul>
        </section>
      )}

      {/* Paso 3: día y hora */}
      {paso === 3 && (
        <section className="mt-4">
          <h2 className="text-lg font-semibold">¿Cuándo?</h2>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {dias.map((d) => {
              const p = partesDeFecha(d);
              const elegido = d === fecha;
              return (
                <button
                  key={d}
                  onClick={() => setFecha(d)}
                  className={`min-w-16 rounded-xl border p-2 text-center ${
                    elegido
                      ? "border-white bg-white text-black"
                      : "border-borde bg-tarjeta"
                  }`}
                >
                  <span className="block text-xs capitalize">
                    {d === dias[0] ? "Hoy" : d === dias[1] ? "Mañana" : p.diaSemana}
                  </span>
                  <span className="block text-lg font-semibold">{p.dia}</span>
                  <span className="block text-xs">{p.mes}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            {cargandoHoras ? (
              <p className="text-sm text-suave">Buscando horas libres…</p>
            ) : horas.length === 0 ? (
              <p className="text-sm text-suave">No hay horas libres este día. Prueba otro.</p>
            ) : (
              <>
                {horas.every((h) => h.reservada) && (
                  <p className="mb-3 text-sm text-suave">Este día ya está lleno. Prueba otro.</p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {horas.map((h) =>
                    h.reservada ? (
                      <div
                        key={h.inicio}
                        aria-disabled
                        className="rounded-lg border border-red-500/60 bg-red-950/60 py-2 text-center text-red-300"
                      >
                        <span className="block text-sm font-medium">
                          {formatoHora(h.inicio)}
                        </span>
                        <span className="block text-[10px] leading-tight">Hora reservada</span>
                      </div>
                    ) : (
                      <button
                        key={h.inicio}
                        onClick={() => {
                          setHora(h.inicio);
                          setPaso(4);
                        }}
                        className="rounded-lg border border-borde bg-tarjeta py-3 text-sm font-medium hover:border-white"
                      >
                        {formatoHora(h.inicio)}
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Paso 4: datos y confirmación */}
      {paso === 4 && servicio && hora && (
        <section className="mt-4">
          <div className="space-y-2 rounded-xl border border-borde bg-tarjeta p-4 text-sm">
            <p className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-2">
                <Scissors size={16} className="text-suave" />
                {servicio.nombre}
              </span>
              {formatoPesos(servicio.precio)}
            </p>
            <p className="flex items-center gap-2">
              <User size={16} className="text-suave" />
              {nombreEstilista}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays size={16} className="text-suave" />
              {formatoFechaLarga(hora)}, {formatoHora(hora)}
            </p>
          </div>

          <h2 className="mt-6 text-lg font-semibold">Tus datos</h2>
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              confirmar();
            }}
            className="mt-3 space-y-3"
          >
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              maxLength={60}
              className="w-full rounded-lg border border-borde bg-transparent p-3"
            />
            <input
              required
              type="tel"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Celular (WhatsApp)"
              className="w-full rounded-lg border border-borde bg-transparent p-3"
            />
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota opcional (ej. degradado bajo)"
              maxLength={300}
              rows={2}
              className="w-full rounded-lg border border-borde bg-transparent p-3"
            />
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-xl boton-plata py-4 font-semibold text-black disabled:opacity-50"
            >
              {enviando ? "Reservando…" : "Confirmar cita"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
