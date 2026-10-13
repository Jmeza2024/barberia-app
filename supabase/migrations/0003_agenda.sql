-- =====================================================================
-- Etapa 5: horas libres para el equipo (cambiar una cita de hora)
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
--
-- Se parece a horas_disponibles (0002), con dos diferencias:
-- 1. Ignora la propia cita que se está cambiando (p_excluir_cita), para
--    que se pueda mover de 10:00 a 10:15 aunque se crucen.
-- 2. No aplica la anticipación mínima ni el límite de días: el equipo
--    puede mover una cita a dentro de 20 minutos o a dentro de un mes.
-- Solo la pueden usar usuarios conectados (el equipo), no el público.
-- =====================================================================

create function horas_libres_equipo(
  p_servicio      uuid,
  p_fecha         date,
  p_estilista     uuid,
  p_excluir_cita  uuid default null
) returns table (inicio timestamptz)
language sql stable security definer set search_path = public as $$
  with
  srv as (
    select make_interval(mins => duracion_min) as duracion
    from servicios where id = p_servicio
  ),
  candidatos as (
    select gs as inicio, srv.duracion
    from horarios h
    cross join srv
    cross join lateral generate_series(
      ((p_fecha + h.hora_inicio) at time zone 'America/Bogota'),
      ((p_fecha + h.hora_fin)    at time zone 'America/Bogota') - srv.duracion,
      interval '15 minutes'
    ) as gs
    where h.estilista_id = p_estilista
      and h.dia_semana = extract(dow from p_fecha)
  )
  select c.inicio
  from candidatos c
  where c.inicio > now()
    and not exists (
      select 1 from citas ci
      where ci.estilista_id = p_estilista
        and ci.id is distinct from p_excluir_cita
        and ci.estado in ('confirmada', 'atendida')
        and tstzrange(ci.inicio, ci.fin) && tstzrange(c.inicio, c.inicio + c.duracion)
    )
    and not exists (
      select 1 from bloqueos b
      where b.estilista_id = p_estilista
        and tstzrange(b.inicio, b.fin) && tstzrange(c.inicio, c.inicio + c.duracion)
    )
  order by c.inicio
$$;

revoke execute on function horas_libres_equipo(uuid, date, uuid, uuid) from public, anon;
grant  execute on function horas_libres_equipo(uuid, date, uuid, uuid) to authenticated;
