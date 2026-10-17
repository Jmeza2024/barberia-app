-- =====================================================================
-- Tarjeta de cortes: por cada 10 cortes, uno gratis.
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
--
-- El cliente no tiene que crear cuenta: su número de celular es su tarjeta.
-- Cuenta como sello cada cita "Atendida" que no fue gratis. Las reservas que
-- se cancelan o donde el cliente no vino NO cuentan.
-- =====================================================================

-- Cuántos cortes hacen falta para ganar uno gratis (el dueño lo puede cambiar).
alter table negocio add column cortes_para_premio int not null default 10
  check (cortes_para_premio between 2 and 50);

-- Marca las citas que son el corte gratis.
alter table citas add column gratis boolean not null default false;

-- La tarjeta de un cliente:
--   sellos: cortes pagados que lleva en la tarjeta actual (0 a 9)
--   gratis_disponibles: cortes gratis ganados que todavía no ha usado
create function tarjeta_de(p_cliente uuid)
returns table (sellos int, meta int, gratis_disponibles int, cortes_pagados int)
language sql stable security definer set search_path = public as $$
  with n as (
    select cortes_para_premio as meta from negocio where id = 1
  ), c as (
    select
      count(*) filter (where estado = 'atendida' and not gratis)::int as pagados,
      -- Un corte gratis ya reservado (o ya usado) cuenta como usado.
      count(*) filter (where gratis and estado in ('confirmada', 'atendida'))::int as usados
    from citas where cliente_id = p_cliente
  )
  select (c.pagados % n.meta)::int,
         n.meta,
         greatest(c.pagados / n.meta - c.usados, 0)::int,
         c.pagados
  from c, n
$$;

-- Al crear una cita (desde la página o desde el panel): si el cliente tiene
-- un corte gratis ganado, esta cita queda como gratis sola.
create function aplicar_corte_gratis() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select gratis_disponibles from tarjeta_de(new.cliente_id)) > 0 then
    new.gratis := true;
  end if;
  return new;
end;
$$;

create trigger al_crear_cita
before insert on citas
for each row execute function aplicar_corte_gratis();

-- La venta de una cita gratis queda en $0 (y por eso no genera comisión).
create or replace function crear_venta_de_cita() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_venta_id uuid;
  v_precio   numeric(12, 2);
begin
  if new.estado = 'atendida' and old.estado is distinct from 'atendida'
     and not exists (select 1 from ventas where cita_id = new.id) then
    select case when new.gratis then 0 else precio end into v_precio
    from servicios where id = new.servicio_id;

    insert into ventas (estilista_id, cita_id, cliente_id)
    values (new.estilista_id, new.id, new.cliente_id)
    returning id into v_venta_id;

    insert into detalle_venta (venta_id, tipo, servicio_id, precio_unitario)
    values (v_venta_id, 'servicio', new.servicio_id, v_precio);
  end if;
  return new;
end;
$$;

-- La página "Mi cita" ahora también muestra si es gratis y la tarjeta.
-- (Hay que borrarla y crearla de nuevo porque cambian sus columnas.)
drop function ver_cita(text);
create function ver_cita(p_codigo text)
returns table (
  servicio            text,
  precio              numeric,
  estilista           text,
  cliente             text,
  inicio              timestamptz,
  fin                 timestamptz,
  estado              text,
  gratis              boolean,
  sellos              int,
  meta                int,
  gratis_disponibles  int
)
language sql stable security definer set search_path = public as $$
  select s.nombre, s.precio, e.nombre, cl.nombre, c.inicio, c.fin, c.estado, c.gratis,
         t.sellos, t.meta, t.gratis_disponibles
  from citas c
  join servicios  s  on s.id  = c.servicio_id
  join estilistas e  on e.id  = c.estilista_id
  join clientes   cl on cl.id = c.cliente_id
  cross join lateral tarjeta_de(c.cliente_id) t
  where c.codigo_cancelacion = p_codigo
$$;

-- Para la página pública "Mi tarjeta": el cliente escribe su celular.
-- Solo devuelve el primer nombre y los sellos, nada más de sus datos.
-- Compara los últimos 10 dígitos, así da igual si escribe el 57 adelante.
create function ver_tarjeta(p_telefono text)
returns table (nombre text, sellos int, meta int, gratis_disponibles int, gratis_reservado boolean)
language sql stable security definer set search_path = public as $$
  select split_part(cl.nombre, ' ', 1), t.sellos, t.meta, t.gratis_disponibles,
         exists (select 1 from citas c where c.cliente_id = cl.id and c.gratis
                 and c.estado = 'confirmada')
  from clientes cl
  cross join lateral tarjeta_de(cl.id) t
  where length(regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g')) >= 7
    and right(cl.telefono, 10) = right(regexp_replace(p_telefono, '\D', '', 'g'), 10)
  limit 1
$$;

revoke execute on function tarjeta_de(uuid) from public, anon;
grant  execute on function tarjeta_de(uuid) to authenticated;
grant  execute on function ver_cita(text)   to anon, authenticated;
grant  execute on function ver_tarjeta(text) to anon, authenticated;
