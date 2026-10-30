-- El negocio ahora se llama Navia Barber Studio (igual al logo nuevo).
-- Este nombre sale en los mensajes de WhatsApp y en la página de inicio.
-- Solo cambia el nombre si todavía tiene el viejo. Se puede correr más de una vez.
update negocio set nombre = 'Navia Barber Studio' where nombre = 'Navia Barber Club';
