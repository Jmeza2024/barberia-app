-- =====================================================================
-- Mostrar también las horas ya reservadas (en rojo) al reservar
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
--
-- horas_del_dia devuelve TODAS las horas del día con una marca:
--   reservada = false -> libre, el cliente la puede tocar
--   reservada = true  -> ya tiene cita (si es "cualquier barbero",
--                        cuando todos están ocupados a esa hora)
-- No dice quién reservó: solo que la hora está tomada.
-- reservar_cita sigue revisando con horas_disponibles, así que una hora
-- reservada nunca se puede volver a tomar.
-- =====================================================================

create function horas_del_dia(
  p_servicio   uuid,
  p_fecha      date,
  p_estilista  uuid default null
) returns table (inicio timestamptz, reservada boolean)
language sql stable security definer set search_path = public as $$
  with
  cfg as (
    select minutos_anticipacion, dias_para_reservar from negocio where id = 1
  ),
  srv as (
    select make_interval(mins => duracion_min) as duracion
    from servicios where id = p_servicio and activo
  ),
  -- Las mismas horas posibles que horas_disponibles (0008).
  candidatos as (
    select h.estilista_id, gs as inicio, srv.duracion
    from horarios h
    join estilistas e           on e.id = h.estilista_id and e.activo
    join estilista_servicios es on es.estilista_id = h.estilista_id
                               and es.servicio_id = p_servicio
    cross join srv
    cross join lateral generate_series(
      ((p_fecha + h.hora_inicio) at time zone 'America/Bogota'),
      ((p_fecha + h.hora_fin)    at time zone 'America/Bogota') - srv.duracion,
      srv.duracion
    ) as gs
    where h.dia_semana = extract(dow from p_fecha)
      and (p_estilista is null or h.estilista_id = p_estilista)
  ),
  -- Para cada barbero y hora: ¿choca con una cita? ¿está bloqueada?
  marcadas as (
    select
      c.inicio,
      exists (
        select 1 from citas ci
        where ci.estilista_id = c.estilista_id
          and ci.estado in ('confirmada', 'atendida')
          and tstzrange(ci.inicio, ci.fin) && tstzrange(c.inicio, c.inicio + c.duracion)
      ) as con_cita,
      exists (
        select 1 from bloqueos b
        where b.estilista_id = c.estilista_id
          and tstzrange(b.inicio, b.fin) && tstzrange(c.inicio, c.inicio + c.duracion)
      ) as bloqueada
    from candidatos c, cfg
    where c.inicio >= now() + make_interval(mins => cfg.minutos_anticipacion)
      and p_fecha <= (now() at time zone 'America/Bogota')::date + cfg.dias_para_reservar
  )
  -- Una hora está reservada si ningún barbero la tiene libre.
  -- Las horas solo bloqueadas (vacaciones, permisos) no se muestran.
  select m.inicio, bool_and(m.con_cita or m.bloqueada) as reservada
  from marcadas m
  group by m.inicio
  having bool_or(not m.bloqueada)
  order by m.inicio
$$;

grant execute on function horas_del_dia(uuid, date, uuid) to anon, authenticated;
