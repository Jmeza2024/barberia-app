-- Etapa: seguridad para uso real.
--
-- 1. Límite de citas por teléfono: una misma persona puede tener máximo 3
--    citas pendientes. Así nadie llena la agenda con reservas falsas.
-- 2. Nombre y nota con tamaño máximo (60 y 300 letras).
-- 3. Los códigos de "Mi cita" nuevos son más largos y salen de un generador
--    seguro, para que nadie pueda adivinarlos. Los códigos viejos siguen sirviendo.
--
-- Se puede correr más de una vez sin problema.

begin;

alter table citas
  alter column codigo_cancelacion
  set default substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);

create or replace function reservar_cita(
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
  if length(trim(p_nombre)) > 60 then
    raise exception 'El nombre es muy largo';
  end if;
  if length(v_telefono) < 7 or length(v_telefono) > 15 then
    raise exception 'Escribe un teléfono válido';
  end if;
  if length(coalesce(p_nota, '')) > 300 then
    raise exception 'La nota es muy larga (máximo 300 letras)';
  end if;

  -- Máximo 3 citas pendientes por teléfono (compara los últimos 10 dígitos).
  if (select count(*) from citas c join clientes cl on cl.id = c.cliente_id
      where right(cl.telefono, 10) = right(v_telefono, 10)
        and c.estado = 'confirmada' and c.inicio > now()) >= 3 then
    raise exception 'Ya tienes 3 citas pendientes. Para otra, llama o escribe a la barbería';
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

grant execute on function reservar_cita(uuid, timestamptz, text, text, uuid, text) to anon, authenticated;

commit;
