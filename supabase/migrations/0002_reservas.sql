-- =====================================================================
-- Etapa 3: funciones para que los clientes reserven sin crear cuenta
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
--
-- Los clientes no tienen permiso de escribir en la tabla "citas" (ver RLS
-- en 0001). En su lugar llaman a estas funciones, que revisan todo antes
-- de guardar. "security definer" significa que la función corre con
-- permisos de administrador, pero solo hace lo que está escrito aquí.
-- =====================================================================

-- Horas libres para un servicio en una fecha.
-- Si p_estilista es null, devuelve las horas libres de todos los barberos.
create function horas_disponibles(
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
  -- Todas las horas posibles, cada 15 minutos, dentro del horario de cada barbero.
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
      interval '15 minutes'
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

-- Guarda una cita. Devuelve el código con el que el cliente puede verla o cancelarla.
create function reservar_cita(
  p_servicio   uuid,
  p_inicio     timestamptz,
  p_nombre     text,
  p_telefono   text,
  p_estilista  uuid default null,
  p_nota       text default null
) returns text
language plpgsql volatile security definer set search_path = public as $$
declare
  v_telefono  text := regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
  v_estilista uuid;
  v_duracion  int;
  v_cliente   uuid;
  v_codigo    text;
begin
  if length(trim(coalesce(p_nombre, ''))) < 2 then
    raise exception 'Escribe tu nombre';
  end if;
  if length(v_telefono) < 7 then
    raise exception 'Escribe un teléfono válido';
  end if;

  -- Volvemos a revisar que la hora siga libre (otro cliente pudo tomarla).
  select h.estilista_id into v_estilista
  from horas_disponibles(p_servicio, (p_inicio at time zone 'America/Bogota')::date, p_estilista) h
  where h.inicio = p_inicio
  limit 1;

  if v_estilista is null then
    raise exception 'Esa hora ya no está disponible, elige otra';
  end if;

  select duracion_min into v_duracion from servicios where id = p_servicio;

  -- Si el teléfono ya existe, es el mismo cliente: actualizamos su nombre.
  insert into clientes (nombre, telefono)
  values (trim(p_nombre), v_telefono)
  on conflict (telefono) do update set nombre = excluded.nombre
  returning id into v_cliente;

  insert into citas (cliente_id, estilista_id, servicio_id, inicio, fin, nota)
  values (v_cliente, v_estilista, p_servicio, p_inicio,
          p_inicio + make_interval(mins => v_duracion), nullif(trim(p_nota), ''))
  returning codigo_cancelacion into v_codigo;

  return v_codigo;
exception
  -- Dos personas reservaron la misma hora al mismo tiempo: gana la primera.
  when exclusion_violation then
    raise exception 'Esa hora ya no está disponible, elige otra';
end;
$$;

-- Datos de una cita a partir de su código (para la página "Mi cita").
create function ver_cita(p_codigo text)
returns table (
  servicio     text,
  precio       numeric,
  estilista    text,
  cliente      text,
  inicio       timestamptz,
  fin          timestamptz,
  estado       text
)
language sql stable security definer set search_path = public as $$
  select s.nombre, s.precio, e.nombre, cl.nombre, c.inicio, c.fin, c.estado
  from citas c
  join servicios  s  on s.id  = c.servicio_id
  join estilistas e  on e.id  = c.estilista_id
  join clientes   cl on cl.id = c.cliente_id
  where c.codigo_cancelacion = p_codigo
$$;

-- El cliente cancela su cita con el código. Solo si sigue confirmada y no ha pasado.
create function cancelar_cita(p_codigo text)
returns boolean
language plpgsql volatile security definer set search_path = public as $$
begin
  update citas
  set estado = 'cancelada', motivo_cancelacion = 'Cancelada por el cliente'
  where codigo_cancelacion = p_codigo
    and estado = 'confirmada'
    and inicio > now();
  return found;
end;
$$;

grant execute on function horas_disponibles(uuid, date, uuid)                    to anon, authenticated;
grant execute on function reservar_cita(uuid, timestamptz, text, text, uuid, text) to anon, authenticated;
grant execute on function ver_cita(text)                                          to anon, authenticated;
grant execute on function cancelar_cita(text)                                     to anon, authenticated;
