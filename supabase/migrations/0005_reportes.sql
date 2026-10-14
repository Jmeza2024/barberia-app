-- =====================================================================
-- Etapa 7: reportes y comisión
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
--
-- Para un mes con cientos de ventas no conviene traer cada venta a la
-- página y sumarla allá. Estas funciones hacen las sumas dentro de la base
-- de datos y devuelven solo el resultado: unas pocas filas.
--
-- Son "security invoker" (lo normal): con las reglas RLS, el dueño suma
-- las ventas de todos y un barbero solo las suyas.
-- =====================================================================

-- Una fila por barbero: cortes, plata de servicios, de productos y total,
-- entre dos fechas (las dos incluidas), en hora de Bogotá.
create function reporte_por_barbero(p_desde date, p_hasta date)
returns table (
  estilista_id         uuid,
  nombre               text,
  porcentaje_comision  numeric,
  cortes               bigint,
  servicios            numeric,
  productos            numeric,
  total                numeric
)
language sql stable set search_path = public as $$
  with
  lineas as (
    select v.estilista_id, d.tipo, d.cantidad, d.cantidad * d.precio_unitario as valor
    from ventas v
    join detalle_venta d on d.venta_id = v.id
    where v.fecha_hora >= (p_desde::timestamp at time zone 'America/Bogota')
      and v.fecha_hora <  ((p_hasta + 1)::timestamp at time zone 'America/Bogota')
  ),
  sumas as (
    select estilista_id,
           coalesce(sum(cantidad) filter (where tipo = 'servicio'), 0) as cortes,
           coalesce(sum(valor)    filter (where tipo = 'servicio'), 0) as servicios,
           coalesce(sum(valor)    filter (where tipo = 'producto'), 0) as productos
    from lineas
    group by estilista_id
  )
  -- Salen todos los barberos activos (aunque no hayan vendido) y los
  -- desactivados que sí vendieron en esas fechas.
  select e.id, e.nombre, e.porcentaje_comision,
         coalesce(s.cortes, 0), coalesce(s.servicios, 0), coalesce(s.productos, 0),
         coalesce(s.servicios, 0) + coalesce(s.productos, 0)
  from estilistas e
  left join sumas s on s.estilista_id = e.id
  where e.activo or s.estilista_id is not null
  order by 7 desc, e.nombre
$$;

-- Una fila por cada día entre dos fechas, aunque ese día no se haya vendido.
create function reporte_por_dia(p_desde date, p_hasta date)
returns table (dia date, cortes bigint, total numeric)
language sql stable set search_path = public as $$
  with lineas as (
    select (v.fecha_hora at time zone 'America/Bogota')::date as dia,
           d.tipo, d.cantidad, d.cantidad * d.precio_unitario as valor
    from ventas v
    join detalle_venta d on d.venta_id = v.id
    where v.fecha_hora >= (p_desde::timestamp at time zone 'America/Bogota')
      and v.fecha_hora <  ((p_hasta + 1)::timestamp at time zone 'America/Bogota')
  )
  select dias.dia::date,
         coalesce(sum(l.cantidad) filter (where l.tipo = 'servicio'), 0),
         coalesce(sum(l.valor), 0)
  from generate_series(p_desde, p_hasta, interval '1 day') as dias(dia)
  left join lineas l on l.dia = dias.dia::date
  group by dias.dia
  order by dias.dia
$$;

revoke execute on function reporte_por_barbero(date, date) from public, anon;
revoke execute on function reporte_por_dia(date, date)     from public, anon;
grant  execute on function reporte_por_barbero(date, date) to authenticated;
grant  execute on function reporte_por_dia(date, date)     to authenticated;
