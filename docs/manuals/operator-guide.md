# Guía del Operador

Para quien registra las lecturas de un pozo en campo, usando la app en el
teléfono o tablet (mobile-operator).

## 1. Iniciar sesión

Abre la app y entra con el correo y contraseña que te dio tu Supervisor de
Área. No hay registro por tu cuenta — tu cuenta la crea el Supervisor desde
su panel (ver Guía del Supervisor).

## 2. Pantalla principal

Al entrar ves **un solo pozo**: el que tienes asignado en este momento. No
eliges de una lista — si necesitas trabajar otro pozo, tu Supervisor de
Área te reasigna desde su panel y aparece automáticamente aquí.

Si ves "Sin pozo asignado", todavía no te han asignado ninguno — contacta a
tu Supervisor de Área.

En la tarjeta del pozo ves su nombre, estado actual, campo, zona, y cada
cuántas horas se cierra un ciclo de evaluación (por ejemplo, 24H).

Dos botones:
- **Registrar Lectura** — para cargar una medición nueva.
- **Ver Tabla de Lecturas** — el historial de lo que llevas cargado en el
  ciclo actual.

## 3. Registrar una lectura

Desde "Registrar Lectura" cargas los valores medidos en ese momento:
presión de cabezal, casing, separador, línea/reductor, el reductor en
pulgadas, los datos de tanques, y los parámetros de gas cuando aplique.
Guarda con el botón correspondiente — la lectura queda agregada al ciclo
de evaluación que está actualmente EN_CURSO para tu pozo.

**No necesitas señal para esto.** Ver sección 6 (Modo sin conexión).

## 4. Ver la tabla de lecturas

Muestra, en orden, todas las lecturas que llevas cargadas en el ciclo
actual: hora, netos en barriles, caudal de gas, y si alguna lectura
disparó una alerta (por ejemplo, un valor fuera del límite configurado por
el Supervisor para ese pozo). Desde aquí puedes pasar a "Ver Reporte".

## 5. Cerrar el ciclo (Reporte)

Cuando termina el ciclo (por ejemplo, cada 24 horas), entras a la pantalla
de Reporte para:

1. Revisar el promedio de netos calculado a partir de tus lecturas.
2. Completar los datos de cierre del formato oficial de PDVSA — División
   Punta de Mata: Supervisor PDVSA, cuadrilla diurna/nocturna, tipo de
   fluido retornado (API, H2S), resumen de tanques (existencia,
   trasegable, total trasegado), nivel de cellar, viajes de vacuum, y
   notas. Todos estos campos los llena el Operador al cerrar — no el
   Supervisor.
3. Enviar. La evaluación pasa a **Pendiente Supervisor** — a partir de
   ahí ya no puedes editarla; el Supervisor de tu zona (o el Gerente) la
   revisa y la aprueba o la rechaza.
4. Si tu Supervisor **rechaza** la evaluación, vuelve a tu pantalla
   principal como EN_CURSO — puedes corregir y volver a cerrarla.

Desde la misma pantalla puedes generar el texto para compartir el reporte
por WhatsApp, con el mismo formato que se usa en el reporte impreso.

## 6. Modo sin conexión

Si te quedas sin señal en el pozo, **puedes seguir registrando lecturas
con normalidad** — no hay ningún interruptor que activar, siempre está
así. La app guarda todo en el teléfono y lo envía solo, automáticamente,
en cuanto el teléfono recupera señal (wifi o datos). No hace falta que
hagas nada distinto ni que reintentes manualmente.

Dos excepciones a tener en cuenta:
- **La primera vez que abres un pozo nuevo en ese teléfono**, si no hay
  señal todavía no puede cargarlo (nunca lo vio antes) — verás un mensaje
  claro pidiéndote señal al menos una vez. Después de esa primera vez, ya
  funciona sin conexión con normalidad.
- **Iniciar un ciclo nuevo** (la primera lectura después de que el
  ciclo anterior se cerró) necesita un toque de señal para "reservar" el
  ciclo y evitar que dos operadores del mismo pozo, en dos dispositivos
  distintos, arranquen dos ciclos duplicados por accidente. Si no hay
  señal en ese momento exacto, verás un aviso pidiéndote conexión — una
  vez que el ciclo ya está abierto, el resto de las lecturas de ese ciclo
  sí se guardan sin problema aunque pierdas la señal de nuevo.

## 7. Ajustes

Desde el ícono de engranaje en la pantalla principal:

- **Tu correo y tu rol** — de solo lectura, informativo.
- **Notificaciones push** — actívalas para enterarte apenas tu Supervisor
  aprueba o rechaza una evaluación, sin tener que estar revisando la app.
  La primera vez te va a pedir permiso del sistema operativo.
- **Guardado offline** — siempre activo, no es algo que enciendas o
  apagues (ver sección 6).
- **Cerrar sesión.**

## Problemas frecuentes

| Lo que ves | Qué significa |
|---|---|
| "Sin pozo asignado" | Tu Supervisor de Área todavía no te asignó ninguno. |
| "Cargando pozo..." sin avanzar, sin señal | Es la primera vez que este teléfono abre ese pozo — necesitas señal una vez. |
| "Sin conexión — necesitas señal al menos una vez para iniciar un ciclo nuevo" | Estás arrancando un ciclo nuevo sin señal — espera a tener conexión, aunque sea un momento. |
| "guardada localmente — se enviará cuando vuelva la conexión" | Todo bien — es el comportamiento normal sin señal, no es un error. |
