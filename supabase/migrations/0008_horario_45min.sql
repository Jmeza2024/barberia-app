-- =====================================================================
-- Horario de 8:00 a. m. a 8:00 p. m., descanso de 12 a 1, cortes de 45 min
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
-- =====================================================================

begin;

-- 1. El horario que se muestra en la página de inicio ("Abierto de ...").
update negocio set hora_apertura = '08:00', hora_cierre = '20:00';
alter table negocio alter column hora_apertura set default '08:00';
alter table negocio alter column hora_cierre   set default '20:00';

-- 2. Horario de cada barbero, partido en dos para el descanso:
--    mañana de 8 a 12 y tarde de 1 a 8.
--    Todo en una sola instrucción: borra los horarios viejos y crea los nuevos
--    con los mismos días. Si un barbero no tenía horario, queda de lunes a sábado.
with viejos as (
  delete from horarios returning estilista_id, dia_semana
),
dias as (
  select distinct estilista_id, dia_semana from viejos
  union
  select e.id, d.dia from estilistas e cross join generate_series(1, 6) as d(dia)
  where not exists (select 1 from viejos v where v.estilista_id = e.id)
)
insert into horarios (estilista_id, dia_semana, hora_inicio, hora_fin)
  select dias.estilista_id, dias.dia_semana, t.inicio, t.fin
  from dias
  cross join (values (time '08:00', time '12:00'), (time '13:00', time '20:00')) as t(inicio, fin);

-- 3. Los cortes duran 45 minutos (los servicios con "corte" en el nombre).
--    Los demás (barba, cejas...) se cambian en el panel: Más > Servicios.
update servicios set duracion_min = 45 where nombre ilike '%corte%';

-- 4. Las horas para reservar van seguidas, según lo que dura el servicio:
--    un corte de 45 min ofrece 8:00, 8:45, 9:30... (antes eran cada 15 min).
create or replace function horas_disponibles(
  p_servicio   uuid,
  p_fecha      date,
  p_estilista  uuid default null
) returns table (estilista_id uuid, inicio timestamptz)
language sql stable security definer set search_path = public as $$
  with
  cfg as (
    select minutos_anticipacion, dias_para_reservar from negocio where id = 1
  ),
  srv as (
    select make_interval(mins => duracion_min) as duracion
    from servicios where id = p_servicio and activo
  ),
  -- Todas las horas posibles, una tras otra según la duración, dentro del horario de cada barbero.
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
  )
  -- Quitamos las que ya pasaron, las que chocan con citas y las bloqueadas.
  select c.estilista_id, c.inicio
  from candidatos c, cfg
  where c.inicio >= now() + make_interval(mins => cfg.minutos_anticipacion)
    and p_fecha <= (now() at time zone 'America/Bogota')::date + cfg.dias_para_reservar
    and not exists (
      select 1 from citas ci
      where ci.estilista_id = c.estilista_id
        and ci.estado in ('confirmada', 'atendida')
        and tstzrange(ci.inicio, ci.fin) && tstzrange(c.inicio, c.inicio + c.duracion)
    )
    and not exists (
      select 1 from bloqueos b
      where b.estilista_id = c.estilista_id
        and tstzrange(b.inicio, b.fin) && tstzrange(c.inicio, c.inicio + c.duracion)
    )
  order by c.inicio, c.estilista_id
$$;

-- Lo mismo para el equipo cuando cambia una cita de hora.
create or replace function horas_libres_equipo(
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
      srv.duracion
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

commit;
