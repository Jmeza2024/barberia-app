-- =====================================================================
-- Horario nuevo: de 9:00 a. m. a 9:00 p. m.
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
-- =====================================================================

-- 1. El horario que se muestra en la página de inicio ("Abierto de ...").
update negocio set hora_apertura = '09:00', hora_cierre = '21:00';

-- 2. El horario en que los clientes pueden reservar con cada barbero.
--    Se conservan los días que cada uno ya trabaja; solo cambian las horas.
update horarios set hora_inicio = '09:00', hora_fin = '21:00';

-- 3. El horario por defecto del negocio (los barberos nuevos ya salen con
--    9 a. m. a 9 p. m. desde la app).
alter table negocio alter column hora_apertura set default '09:00';
alter table negocio alter column hora_cierre   set default '21:00';
