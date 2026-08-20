# Estrategia offline — mobile-operator

## Contexto

El Operador registra lecturas en campo, donde frecuentemente no hay
conexión a internet. Las lecturas deben quedar guardadas localmente y
enviarse solas cuando el dispositivo recupera wifi/señal — sin que el
Operador pierda su trabajo ni tenga que reintentar manualmente.

## Decisión

Usar la persistencia offline nativa de Firestore
(`enableIndexedDbPersistence`, ver `src/services/firebase.ts`) en vez
de construir una cola propia sobre IndexedDB.

El scaffold original de la app traía un intento de cola manual
(`useOfflineSync.ts` + el paquete `idb`) que reimplementaba, a mano y
sin terminar, exactamente lo que Firestore ya hace solo: guardar
escrituras en caché local cuando no hay red, y reintentarlas
automáticamente al reconectar. Mantener las dos colas en paralelo solo
agrega riesgo de que se pisen entre sí, así que se retiró esa cola
manual (`useOfflineSync.ts`, `useOffline.ts`, `services/storage.ts`,
`components/SyncStatus.tsx`, `pages/QueuePage.tsx`, dependencia `idb`)
en favor de apoyarse en el SDK.

## Cómo funciona en la práctica

- **Escrituras** (`addDoc`/`updateDoc` en `RegistroPage.tsx`): con
  persistencia activa, Firestore aplica el cambio a su caché local de
  inmediato y lo reintenta solo hasta que el servidor lo confirma. El
  `Promise` que devuelve la llamada, sin embargo, **no se resuelve
  hasta que el servidor confirma** — si el código hace `await` sobre
  eso estando offline, se queda colgado indefinidamente. Por eso
  `handleGuardar()` en `RegistroPage.tsx` detecta conectividad
  (`useConnectivity.ts`, basado en `navigator.onLine`) y, si está
  offline, no espera el round-trip: deja la escritura corriendo en
  segundo plano y sigue de una vez, mostrando "guardada localmente —
  se enviará cuando vuelva la conexión".

- **Lecturas** (`onSnapshot` en pozos/evaluaciones/lecturas): Firestore
  sirve datos desde caché automáticamente si ya se cargaron alguna vez
  con conexión — el Operador puede seguir viendo su pozo y sus
  lecturas ya registradas sin señal.

- **Límite conocido**: `useEvaluacionActual.ts` usa una
  `runTransaction` para arrancar un ciclo nuevo sin crear duplicados
  (ver el candado `pozo.evalEnCursoId`). Las transacciones de Firestore
  SÍ necesitan conexión real (necesitan leer el estado más reciente del
  servidor antes de escribir). Por eso: **el Operador puede seguir
  registrando lecturas offline en un ciclo ya iniciado, pero para
  arrancar un ciclo nuevo en un pozo necesita señal al menos una vez**.
  Pasado ese punto, `useEvaluacionActual.ts` corta la espera a los 8
  segundos y muestra un mensaje claro en vez de dejar la pantalla
  cargando para siempre.

- **UI**: `OfflineBanner.tsx`, montado globalmente en `main.tsx`,
  muestra un aviso fijo mientras `navigator.onLine` sea `false`.

## Por qué persistencia solo en producción, no en el emulador de dev

`services/firebase.ts` activa `enableIndexedDbPersistence` únicamente
fuera de `import.meta.env.DEV` — combinarla con el Firestore Emulator
ha tenido bugs conocidos del SDK (conflictos entre la persistencia y
el protocolo WebChannel del emulador). En desarrollo, para probar el
comportamiento offline, se simula bajando la conexión real hacia el
emulador (o alternando `navigator.onLine` manualmente) en vez de
depender de la persistencia real, que sí está activa en producción.
