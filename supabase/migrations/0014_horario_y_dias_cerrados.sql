-- =====================================================================
-- Horario del negocio editable desde el panel y días cerrados
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
--
-- 1. horario_negocio: a qué hora abre, descansa y cierra cada día.
--    Lo cambia el dueño en Panel > Horario. Al guardarlo se aplica a
--    todos los barberos (tabla horarios), que es lo que se usa para reservar.
-- 2. cerrar_dia: cierra un día para toda la barbería o para un barbero.
--    Nadie puede reservar ese día y, si se pide, cancela las citas que ya había.
-- =====================================================================

begin;

create table horario_negocio (
  dia_semana       int primary key check (dia_semana between 0 and 6),
  abierto          boolean not null default true,
  abre             time not null default '08:00',
  cierra           time not null default '20:00',
  descanso_inicio  time,
  descanso_fin     time,
  check (cierra > abre),
  check ((descanso_inicio is null) = (descanso_fin is null)),
  check (descanso_inicio is null or (descanso_inicio > abre and descanso_fin > descanso_inicio and descanso_fin < cierra))
);

-- Arranca igual que el horario de hoy: lunes a sábado de 8 a 8, descanso de 12 a 1.
insert into horario_negocio (dia_semana, abierto, descanso_inicio, descanso_fin)
  select d, d between 1 and 6, '12:00', '13:00' from generate_series(0, 6) as d;

alter table horario_negocio enable row level security;
create policy "publico ve horario negocio" on horario_negocio for select using (true);
-- No hay política para escribir: solo se cambia con guardar_horario().
revoke all on horario_negocio from anon, authenticated;
grant select on horario_negocio to anon, authenticated;

-- Copia el horario del negocio a un barbero (mañana y tarde si hay descanso).
-- Se usa al guardar el horario y al crear un barbero nuevo.
create function aplicar_horario_a(p_estilista uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not coalesce(soy_dueno(), false) then
    raise exception 'Solo el dueño puede cambiar el horario';
  end if;
  delete from horarios where estilista_id = p_estilista;
  insert into horarios (estilista_id, dia_semana, hora_inicio, hora_fin)
    select p_estilista, h.dia_semana, t.inicio, t.fin
    from horario_negocio h
    cross join lateral (
      select h.abre as inicio, coalesce(h.descanso_inicio, h.cierra) as fin
      union all
      select h.descanso_fin, h.cierra where h.descanso_fin is not null
    ) as t
    where h.abierto;
end;
$$;

-- p_dias: [{"dia":1,"abierto":true,"abre":"08:00","cierra":"20:00",
--           "descanso_inicio":"12:00","descanso_fin":"13:00"}, ...]
create function guardar_horario(p_dias jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_dia jsonb;
  v_barbero uuid;
begin
  if not coalesce(soy_dueno(), false) then
    raise exception 'Solo el dueño puede cambiar el horario';
  end if;

  for v_dia in select * from jsonb_array_elements(p_dias) loop
    update horario_negocio set
      abierto         = (v_dia->>'abierto')::boolean,
      abre            = (v_dia->>'abre')::time,
      cierra          = (v_dia->>'cierra')::time,
      descanso_inicio = nullif(v_dia->>'descanso_inicio', '')::time,
      descanso_fin    = nullif(v_dia->>'descanso_fin', '')::time
    where dia_semana = (v_dia->>'dia')::int;
  end loop;

  if not exists (select 1 from horario_negocio where abierto) then
    raise exception 'Deja al menos un día abierto';
  end if;

  for v_barbero in select id from estilistas where activo loop
    perform aplicar_horario_a(v_barbero);
  end loop;

  -- Lo que dice la página de inicio ("Abierto de ... a ...").
  update negocio set
    hora_apertura = (select min(abre)   from horario_negocio where abierto),
    hora_cierre   = (select max(cierra) from horario_negocio where abierto)
  where id = 1;
end;
$$;

-- Cierra un día. p_estilista null = toda la barbería (solo el dueño).
-- Devuelve las citas que se cancelaron, para avisarles por WhatsApp.
create function cerrar_dia(
  p_fecha     date,
  p_estilista uuid default null,
  p_motivo    text default null,
  p_cancelar  boolean default true
) returns table (cita_id uuid, cliente text, telefono text, servicio text, barbero text, inicio timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_desde timestamptz := p_fecha::timestamp at time zone 'America/Bogota';
  v_hasta timestamptz := (p_fecha + 1)::timestamp at time zone 'America/Bogota';
  v_motivo text := nullif(left(trim(coalesce(p_motivo, '')), 100), '');
begin
  if p_estilista is null and not coalesce(soy_dueno(), false) then
    raise exception 'Solo el dueño puede cerrar toda la barbería';
  end if;
  if p_estilista is not null
     and not coalesce(soy_dueno(), false)
     and p_estilista is distinct from mi_estilista_id() then
    raise exception 'Solo puedes cerrar tus propios días';
  end if;
  if p_fecha < (now() at time zone 'America/Bogota')::date then
    raise exception 'Ese día ya pasó';
  end if;

  insert into bloqueos (estilista_id, inicio, fin, motivo)
    select e.id, v_desde, v_hasta, coalesce(v_motivo, 'Día cerrado')
    from estilistas e
    where e.activo
      and (p_estilista is null or e.id = p_estilista)
      and not exists (
        select 1 from bloqueos b
        where b.estilista_id = e.id and b.inicio <= v_desde and b.fin >= v_hasta
      );

  if p_cancelar then
    return query
      with canceladas as (
        update citas c set estado = 'cancelada'
        where c.estado = 'confirmada'
          and c.inicio >= v_desde and c.inicio < v_hasta
          and (p_estilista is null or c.estilista_id = p_estilista)
        returning c.id, c.cliente_id, c.servicio_id, c.estilista_id, c.inicio
      )
      select ca.id, cl.nombre, cl.telefono, s.nombre, e.nombre, ca.inicio
      from canceladas ca
      join clientes cl   on cl.id = ca.cliente_id
      join servicios s   on s.id = ca.servicio_id
      join estilistas e  on e.id = ca.estilista_id
      order by ca.inicio;
  end if;
end;
$$;

-- Vuelve a abrir un día cerrado (borra los bloqueos de día completo).
create function abrir_dia(p_fecha date, p_estilista uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_desde timestamptz := p_fecha::timestamp at time zone 'America/Bogota';
  v_hasta timestamptz := (p_fecha + 1)::timestamp at time zone 'America/Bogota';
begin
  if p_estilista is null and not coalesce(soy_dueno(), false) then
    raise exception 'Solo el dueño puede abrir toda la barbería';
  end if;
  if p_estilista is not null
     and not coalesce(soy_dueno(), false)
     and p_estilista is distinct from mi_estilista_id() then
    raise exception 'Solo puedes abrir tus propios días';
  end if;

  delete from bloqueos b
  where b.inicio = v_desde and b.fin = v_hasta
    and (p_estilista is null or b.estilista_id = p_estilista);
end;
$$;

revoke execute on function aplicar_horario_a(uuid)                       from public, anon;
grant  execute on function aplicar_horario_a(uuid)                       to authenticated;
revoke execute on function guardar_horario(jsonb)                        from public, anon;
revoke execute on function cerrar_dia(date, uuid, text, boolean)         from public, anon;
revoke execute on function abrir_dia(date, uuid)                         from public, anon;
grant  execute on function guardar_horario(jsonb)                        to authenticated;
grant  execute on function cerrar_dia(date, uuid, text, boolean)         to authenticated;
grant  execute on function abrir_dia(date, uuid)                         to authenticated;

commit;
