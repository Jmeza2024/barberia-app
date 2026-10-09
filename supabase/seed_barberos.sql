-- Dos barberos de ejemplo con horario de lunes a sábado, 9:00 a 19:00,
-- que hacen todos los servicios. Cambia los nombres por los reales.
-- Cómo usarlo: Supabase > SQL Editor > pegar > Run (después de seed.sql).
-- En la etapa 4 conectaremos cada barbero con su usuario y contraseña.

insert into estilistas (nombre, rol, porcentaje_comision) values
  ('Barbero principal', 'dueno',   0),
  ('Barbero 2',         'barbero', 40);

-- Lunes (1) a sábado (6).
insert into horarios (estilista_id, dia_semana, hora_inicio, hora_fin)
select e.id, d, '09:00', '19:00'
from estilistas e cross join generate_series(1, 6) as d;

-- Todos hacen todos los servicios.
insert into estilista_servicios (estilista_id, servicio_id)
select e.id, s.id from estilistas e cross join servicios s;
