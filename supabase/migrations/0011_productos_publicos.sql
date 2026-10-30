-- Etapa: los clientes ven los productos a la venta en la página de inicio.
--
-- La tabla de productos sigue privada (tiene el costo y las unidades exactas).
-- Esta función solo entrega lo que el cliente necesita: nombre, precio y si
-- está agotado. Solo salen los productos activos.
--
-- Se puede correr más de una vez sin problema.

create or replace function productos_a_la_venta()
returns table (id uuid, nombre text, precio numeric, agotado boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.nombre, p.precio_venta, p.existencias <= 0
  from productos p
  where p.activo
  order by p.nombre
$$;

grant execute on function productos_a_la_venta() to anon, authenticated;
