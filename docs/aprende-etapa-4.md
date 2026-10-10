# Lo que aprendimos en la etapa 4: login y perfiles

## Cómo activarlo en tu Supabase

1. **Llave de administrador.** En Supabase > Project Settings > API copia la clave **service_role** y agrégala a tu `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=la-clave
   ```
   Es la llave maestra: nunca la subas a GitHub ni la compartas.
2. **Cuenta del dueño.** En Supabase > Authentication > Users > **Add user** > Create new user. Escribe el correo y la contraseña del dueño y marca **Auto Confirm User**.
3. **Conectar al dueño con su ficha.** Abre `supabase/conectar_dueno.sql`, cambia `dueno@ejemplo.com` por el correo real y ejecútalo en el SQL Editor.
4. Reinicia `npm run dev` (para que lea la clave nueva) y entra a http://localhost:3000/ingresar.

Desde el panel, en **Barberos**, el dueño crea las cuentas de los demás. El "Barbero 2" de ejemplo no tiene cuenta; desactívalo cuando crees los barberos reales.

## Las pantallas nuevas

| Archivo | Dirección | Qué hace |
|---|---|---|
| `src/app/ingresar/` | `/ingresar` | Formulario de correo y contraseña. |
| `src/app/panel/layout.tsx` | todo `/panel` | Menú de arriba y revisión de que quien entra sea del equipo. |
| `src/app/panel/page.tsx` | `/panel` | Las citas de hoy. |
| `src/app/panel/barberos/` | `/panel/barberos` | Solo el dueño: crear barberos, cambiar comisión, desactivar. |
| `src/middleware.ts` | (antes de cada página) | Renueva la sesión y manda a `/ingresar` a quien no ha entrado. |
| `src/lib/sesion.ts` | (ayudante) | Averigua quién está conectado y si es dueño. |
| `src/lib/supabase/admin.ts` | (ayudante) | Cliente con la llave maestra, solo para crear cuentas. |

## Ideas importantes

### Autenticación y autorización
- **Autenticación** = ¿quién eres? Lo hace Supabase Auth con correo y contraseña. Al entrar, Supabase guarda una **sesión** en una cookie del navegador.
- **Autorización** = ¿qué puedes hacer? Lo deciden las reglas RLS de la etapa 1, usando `auth.uid()` (el usuario conectado) para saber si es el dueño o un barbero.

Por eso la misma consulta de citas en `/panel` le muestra todo al dueño y solo lo suyo al barbero, sin escribir un `if`.

### Tres capas de protección
1. **El middleware** saca de `/panel` a quien no ha iniciado sesión.
2. **Las páginas y acciones** revisan el rol con `exigirDueno()`. Aunque el botón "Barberos" no se le muestre al barbero, si escribe la dirección a mano lo devuelve a `/panel`.
3. **La base de datos (RLS)** rechaza cualquier cambio no permitido, aunque alguien se salte las dos primeras.

Nunca confíes solo en esconder botones: la seguridad de verdad va en el servidor y en la base de datos.

### La llave maestra (service_role)
Crear el usuario de otra persona no lo permite la clave pública (anon). Para eso usamos la `service_role`, que se salta todas las reglas. Por eso:
- Solo se usa en `crearBarbero`, después de comprobar que quien llama es el dueño.
- El archivo tiene `import "server-only"`: si por error se importa en el navegador, Next.js da error al compilar.
- No empieza por `NEXT_PUBLIC_`, así Next.js nunca la envía al celular.

### Formularios con `useActionState`
Los formularios llaman una **Server Action** y reciben su respuesta (error o éxito). React limpia el formulario después de enviarlo, por eso la acción devuelve lo que se escribió y lo ponemos con `defaultValue`. Así, si el correo ya existe, el dueño no pierde lo que había escrito.

## Probado
Con el sistema de login de Supabase corriendo localmente y un navegador de tamaño celular:
- Entrar a `/panel` sin sesión manda a `/ingresar`.
- Una contraseña mala muestra "Correo o contraseña incorrectos" y conserva el correo.
- El dueño entra y ve la cita de hoy con su barbero y el botón de WhatsApp.
- El dueño crea a "Carlos Pérez" con 35% de comisión. Queda con horario de lunes a sábado y todos los servicios, así que ya aparece en las reservas.
- Repetir el correo muestra "Ya existe una cuenta con ese correo" sin borrar el formulario.
- Carlos entra, no ve el menú "Barberos", si escribe `/panel/barberos` lo devuelve a `/panel`, y no ve la cita del dueño.

## Mini reto
En `src/app/panel/page.tsx` cambia el saludo `Hola` por `Buenas` o agrega la fecha de hoy debajo con `formatoFechaLarga(new Date())`.
