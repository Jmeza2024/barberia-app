-- Datos de ejemplo para probar. Cámbialos por los reales de la barbería.
-- Cómo usarlo: Supabase > SQL Editor > pegar > Run (después de 0001_esquema.sql).

insert into negocio (id, nombre) values (1, 'Mi Barbería')
on conflict (id) do nothing;

insert into servicios (nombre, categoria, precio, duracion_min) values
  ('Corte clásico',        'Cortes',    20000, 30),
  ('Corte + barba',        'Cortes',    30000, 45),
  ('Arreglo de barba',     'Barba',     12000, 20),
  ('Cejas',                'Extras',     5000, 10);

insert into productos (nombre, precio_venta, existencias) values
  ('Cera para cabello',  25000, 10),
  ('Aceite para barba',  30000,  6),
  ('Shampoo',            22000,  8);
