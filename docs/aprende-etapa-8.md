# Lo que aprendimos en la etapa 8: recordatorios por WhatsApp

## Cómo activarlo
Esta etapa **no tiene SQL nuevo**. Solo:
1. Une la propuesta en GitHub.
2. En la terminal de VS Code: `git pull origin main`.
3. `npm run dev` y entra al panel.

## Qué hay de nuevo

| Pantalla | Dirección | Qué hace |
|---|---|---|
| Recordatorios | `/panel/recordatorios` | Las citas confirmadas de mañana. Cada una tiene un botón **Enviar** que abre WhatsApp con el mensaje listo y la deja marcada como **✓ Enviado**. El barbero ve solo las suyas. |
| Aviso en la agenda | `/panel` | "Mañana hay 3 cita(s) sin recordatorio. Enviar →" |
| Envío automático | `/api/recordatorios` | Si WhatsApp Business está configurado, todos los días a las 5:00 p. m. manda solo los recordatorios de mañana. |

Al **cancelar** o **cambiar** una cita:
- **sin** WhatsApp Business: sale el botón verde para avisar a mano, como antes;
- **con** WhatsApp Business: el aviso sale solo y la página dice "Le avisamos al cliente por WhatsApp automáticamente". Si falla, vuelve a salir el botón.

## Los dos modos

| | Manual (ya funciona) | Automático (WhatsApp Business) |
|---|---|---|
| Costo | Gratis | Meta cobra por cada mensaje (revisa la tabla de precios de Meta para Colombia) |
| Qué hay que hacer | Tocar **Enviar** en cada cita | Registrar el número en Meta una vez |
| El número | Sigue en tu WhatsApp normal | Pasa a WhatsApp Business API y **deja de funcionar en la app normal** (puedes usar un número nuevo solo para esto) |

## Cómo encender el automático (cuando quieras)
Las pantallas de Meta cambian seguido; si algo no coincide, pregúntame y lo vemos juntos.

1. Entra a **developers.facebook.com** con tu Facebook > **Mis apps** > **Crear app** > tipo **Negocio** (Business).
2. En la app, agrega el producto **WhatsApp**.
3. En **WhatsApp > Configuración de la API** agrega el número de la barbería y verifícalo con el código que te llega por SMS. Copia el **Identificador del número de teléfono** (Phone number ID).
4. Crea un **token permanente**: en la configuración del negocio de Meta > **Usuarios del sistema** > crea uno > **Generar token** con el permiso `whatsapp_business_messaging`.
5. En **WhatsApp Manager > Plantillas de mensajes** crea estas 3 plantillas, categoría **Utilidad**, idioma **Español**. El nombre y el texto deben ser exactamente así:

   **recordatorio_cita**
   ```
   Hola {{1}}, te recordamos tu cita de {{2}} el {{3}} a las {{4}} con {{5}}. Si no puedes venir, puedes cancelarla aquí: {{6}}
   ```
   **cita_cancelada**
   ```
   Hola {{1}}, lamentablemente tuvimos que cancelar tu cita de {{2}} del {{3}} a las {{4}}. Responde este mensaje y te agendamos otro día.
   ```
   **cita_cambiada**
   ```
   Hola {{1}}, tu cita de {{2}} quedó para el {{3}} a las {{4}} con {{5}}. Puedes verla aquí: {{6}}
   ```
   Meta las revisa y las aprueba (puede tardar desde minutos hasta un par de días).
6. Pon las claves en `.env.local` (y en la etapa 9, en Vercel). **Nunca** en el código ni en el chat:
   ```
   WHATSAPP_TOKEN=el-token-permanente
   WHATSAPP_PHONE_ID=el-identificador-del-numero
   CRON_SECRET=una-clave-larga-que-inventes
   SITIO_URL=https://tu-app.vercel.app
   ```
7. Reinicia `npm run dev`. En **Recordatorios** dirá "Envío automático encendido".

El envío de las 5:00 p. m. lo hace Vercel con `vercel.json`, así que empieza a funcionar cuando publiquemos la app en la etapa 9. Mientras tanto puedes usar el botón **Enviar los que faltan ahora**.

## Ideas importantes

### Plantillas de WhatsApp
Una empresa no puede escribirle a un cliente cualquier texto cuando quiera: Meta exige **plantillas** aprobadas. El texto fijo se aprueba una vez y los datos (`{{1}}`, `{{2}}`...) cambian en cada mensaje. En `src/lib/mensajes.ts` cada mensaje tiene su nombre de plantilla, sus datos en orden y el texto completo para el botón manual, así los dos modos dicen lo mismo.

### Tareas programadas (cron)
`vercel.json` le dice a Vercel: "llama a `/api/recordatorios` todos los días a las 22:00". Esa hora es UTC, el reloj mundial; en Colombia son las 5:00 p. m. Para que nadie más pueda llamar esa dirección, Vercel manda la clave `CRON_SECRET` y la ruta rechaza a quien no la tenga.

### Marcar para no repetir
Cada cita tiene `recordatorio_enviado`. Al enviar se pone en `true`, así el envío automático no le escribe dos veces al mismo cliente. Si la cita se cambia de hora, vuelve a `false` para recordarle la nueva hora.

### Funcionar sin la pieza opcional
Si faltan las claves de WhatsApp, `whatsappConfigurado()` devuelve `false` y la app sigue con los botones. Así la barbería no depende de que Meta apruebe algo para poder trabajar.

## Probado
Con el login de Supabase local, un servidor falso que hace de WhatsApp y un navegador de tamaño celular:
- **Manual**: la agenda avisó "Mañana hay 3 cita(s) sin recordatorio"; el botón de Marta abrió WhatsApp con el mensaje y su enlace, y quedó **✓ Enviado**; "Marcar pendiente" lo devolvió. Carlos solo vio sus 2 citas.
- **Automático**: sin la clave `CRON_SECRET`, `/api/recordatorios` respondió "No autorizado". Con la clave envió 2 recordatorios con la plantilla y los datos correctos; el tercero (un número que el servidor falso rechaza) quedó pendiente y no se repitió a los que ya habían salido.
- Al cancelar la cita de Luis y cambiar la de Marta, los avisos salieron solos. Con el número que falla salió el botón para enviarlo a mano.

## Mini reto
En `src/lib/mensajes.ts` cambia el texto del recordatorio manual (por ejemplo, agrega "¡Te esperamos! 💈" al final) y pruébalo con el botón **Enviar**. Ojo: si usas el automático, el texto de la plantilla en Meta también tendría que cambiar.
