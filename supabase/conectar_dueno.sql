-- Conecta la cuenta del dueño con su ficha de barbero. Se hace UNA sola vez.
--
-- Antes: en Supabase ve a Authentication > Users > Add user > Create new user,
-- escribe el correo y la contraseña del dueño y marca "Auto Confirm User".
--
-- Luego cambia el correo de abajo por el del dueño y ejecuta esto en el SQL Editor.

update estilistas
set usuario_id = (select id from auth.users where email = 'dueno@ejemplo.com')
where rol = 'dueno';

-- Revisa que quedó bien: debe mostrar el nombre del dueño y un usuario_id.
select nombre, rol, usuario_id from estilistas where rol = 'dueno';
