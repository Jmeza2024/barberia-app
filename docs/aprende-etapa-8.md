# Lo que aprendimos en la etapa 8: recordatorios por WhatsApp

## Cómo activarlo
Esta etapa **no tiene SQL nuevo**. Solo:
1. Une la propuesta en GitHub.
2. En la terminal de VS Code: `git pull origin main`.
3. `npm run dev` y entra al panel.

## Qué hay de nuevo

| Pantalla | Dirección | Qué hace |
|---|---|---|
| Recordatorios | `/panel/recordatorios` | Las citas confirmadas de mañana (o de otro día). Cada una tiene un botón **Enviar** que abre WhatsApp con el mensaje listo y la deja marcada como **✓ Enviado**. El barbero ve solo las suyas. |
| Aviso en la agenda | `/panel` | "Mañana hay 3 cita(s) sin recordatorio. Enviar →" |

El mensaje dice algo así:
> Hola Marta, te recordamos tu cita de Corte clásico el miércoles, 14 de octubre a las 3:00 p. m. con Carlos Pérez. Si no puedes venir, puedes cancelarla aquí: (enlace)

Los avisos al **cancelar** o **cambiar** una cita siguen igual: sale el botón verde con el mensaje listo.

## Ideas importantes

### Todos los textos en un solo lugar
Los tres mensajes (recordatorio, cancelación y cambio) están en `src/lib/mensajes.ts`. Si quieres cambiar cómo saluda la barbería, se cambia ahí y queda igual en todas las pantallas.

### Una acción que termina en otra página
El botón **Enviar** es un formulario con una Server Action. La acción primero marca la cita (`recordatorio_enviado = true`) y después hace `redirect(...)` al enlace de WhatsApp. Así no se le olvida a nadie marcarla.
```ts
await supabase.from("citas").update({ recordatorio_enviado: true }).eq("id", citaId);
redirect(enlaceWhatsApp);
```
Si se tocó por error, **Marcar pendiente** la devuelve.

### Contar sin traer los datos
El aviso de la agenda solo necesita saber cuántas citas faltan, no cuáles. Por eso la consulta pide `{ count: "exact", head: true }`: Supabase devuelve el número sin enviar las filas.

### Marcar para no repetir
Si una cita se cambia de hora, `recordatorio_enviado` vuelve a `false`, para recordarle al cliente la nueva hora.

## ¿Y que salgan solos?
Por ahora el dueño prefirió el envío con botón: es gratis y no hay que registrar nada. Si más adelante quiere que los recordatorios salgan solos, se puede hacer con **WhatsApp Business** de Meta. Eso tiene costo por mensaje y el número deja de funcionar en la app normal de WhatsApp. Los mensajes de `mensajes.ts` ya guardan sus datos en el orden que pide Meta, así que no habría que reescribirlos.

## Probado
Con el login de Supabase local y un navegador de tamaño celular:
- La agenda avisó "Mañana hay 3 cita(s) sin recordatorio" y el enlace llevó a la lista.
- El botón de Marta abrió WhatsApp con su mensaje y el enlace a su cita, y la cita quedó **✓ Enviado**. "Marcar pendiente" la devolvió.
- Carlos (barbero) solo vio sus 2 citas.

## Mini reto
En `src/lib/mensajes.ts` agrega "¡Te esperamos! 💈" al final del texto del recordatorio y pruébalo con el botón **Enviar**.
