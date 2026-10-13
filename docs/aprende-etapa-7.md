# Lo que aprendimos en la etapa 7: reportes y comisión

## Cómo activarlo en tu Supabase
1. Primero une la etapa 6 (si no lo has hecho) y luego esta, en GitHub.
2. En la terminal de VS Code: `git pull origin main`.
3. En VS Code abre `supabase/migrations/0005_reportes.sql`, presiona **Ctrl + A** y **Ctrl + C**.
4. En Supabase > SQL Editor > **+ New query**, pega con **Ctrl + V** y dale **Run**.
5. `npm run dev` y entra al panel. Como dueño verás **Reportes** en el menú.

## Qué hay de nuevo

| Pantalla | Dirección | Qué hace |
|---|---|---|
| Reportes (solo dueño) | `/panel/reportes` | Elige **Día**, **Semana**, **Mes** o **Fechas** a mano. Muestra total vendido, cortes, comisiones y lo que queda para el negocio; una tarjeta por barbero y una barra por cada día. |
| Descargar | `/panel/reportes/descargar` | El mismo reporte como archivo `.csv`, que se abre en Excel o Google Sheets. |

En cada barbero puedes cambiar el **%** y tocar **Recalcular**: el reporte se actualiza al instante (y queda guardado como su nuevo %). El botón verde **Compartir por WhatsApp** abre WhatsApp con el resumen ya escrito para que elijas a quién enviarlo.

## La regla de la comisión
```
comisión del barbero = servicios del barbero × % / 100
para el negocio      = total vendido − comisiones
```
Los productos no pagan comisión: todo lo de productos queda para el negocio. Ejemplo: Carlos hizo $102.000 en servicios y vendió $55.000 en productos, con 40 %. Su comisión es $40.800 y deja $116.200 al negocio.

La comisión usa el % que tiene **hoy** cada barbero. Si lo cambias, también cambian los reportes de fechas pasadas.

## Ideas importantes

### Sumar en la base de datos, no en la página
En la etapa 6 traíamos las ventas del día y las sumábamos en la página. Para un mes eso pueden ser cientos de ventas (y Supabase entrega máximo 1.000 filas por consulta). Por eso `reporte_por_barbero` y `reporte_por_dia` (en `0005_reportes.sql`) usan `sum(...)` y `group by` adentro de Postgres y devuelven solo unas pocas filas.
```sql
sum(valor) filter (where tipo = 'servicio')  -- suma solo las líneas de servicios
```

### Periodos en la dirección
Como la agenda, el periodo viaja en la dirección: `/panel/reportes?periodo=semana&fecha=2026-10-12`. El archivo `src/lib/periodos.ts` convierte eso en "desde" y "hasta": la semana va de lunes a domingo y el mes del día 1 al último.

### Un archivo que no es una página
`descargar/route.ts` es un **route handler**: en vez de dibujar una página, devuelve un archivo. La cabecera `Content-Disposition: attachment` le dice al navegador que lo descargue.

### Mostrar el error en vez de ceros
Si la función de la base de datos no existe (por ejemplo, olvidaste correr el SQL), `armarReporte` lanza un error. Un reporte en $0 podría parecer real; un error se nota.

## Probado
Con el login de Supabase corriendo localmente, ventas de ejemplo en varios días, y un navegador de tamaño celular:
- Semana del 12 al 18 de octubre: $232.000 vendidos, 7 cortes, $40.800 de comisiones y $191.200 para el negocio.
- Al subir a Carlos a 50 % las comisiones pasaron a $51.000; al volver a 40 %, otra vez $40.800.
- Semana anterior, mes, día y fechas a mano dieron los totales esperados.
- El mensaje de WhatsApp y el archivo para Excel salieron con los mismos números.
- Carlos (barbero) no ve **Reportes**. Si escribe la dirección, lo devuelve a la agenda, y tampoco puede descargar el archivo.

## Mini reto
En `src/app/panel/reportes/page.tsx` busca `bg-green-700` (el botón de WhatsApp) y cámbialo por `bg-emerald-600`.
