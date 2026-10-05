// sw/firebase-messaging-sw.template.js
//
// Plantilla del service worker de notificaciones push del panel de
// supervisión (checklist Fase 6, #47). NO se sirve tal cual: el plugin de
// Vite de vite.config.ts reemplaza los dos marcadores con guiones bajos
// dobles que aparecen al final (configuración y versión de Firebase) y lo
// publica como /firebase-messaging-sw.js (en dev y en el build). Así la
// configuración de cada ambiente (dev / staging / prod) sale de los .env y no
// queda escrita en un archivo versionado.
//
// Por qué existe: con la pestaña cerrada o en segundo plano, el navegador
// entrega el push a este worker, y es él quien debe mostrar la notificación.
// El SDK de FCM lo hace solo al inicializarlo (mensajes con payload
// `notification`, que es lo que manda notifyMgr.ts). Con la pestaña visible el
// SDK no muestra nada: reenvía el mensaje a la página (onMessage, ver
// services/push.ts).

// Se registra ANTES de importar el SDK para que corra primero; el SDK trae el
// suyo, pero solo abre un enlace si el mensaje lo trae (notifyMgr no lo manda).
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const destino = new URL('/aprobaciones', self.location.origin).href
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const abierta = ventanas.find((v) => v.url.startsWith(self.location.origin))
      if (abierta) {
        await abierta.focus()
        // navigate() puede rechazar si la ventana aún no es controlable: en ese caso
        // basta con haberla traído al frente.
        await abierta.navigate(destino).catch(() => {})
      } else {
        await self.clients.openWindow(destino)
      }
    })()
  )
})

// Misma versión que la dependencia `firebase` instalada (vite.config.ts la lee
// de node_modules): los scripts compat de gstatic son los oficiales para workers.
importScripts('https://www.gstatic.com/firebasejs/__FIREBASE_VERSION__/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/__FIREBASE_VERSION__/firebase-messaging-compat.js')

firebase.initializeApp(__FIREBASE_CONFIG__)
firebase.messaging()
