// tests/assignRole.test.ts
//
// Test de integración real contra el emulador — reemplaza el archivo
// anterior del mismo nombre, que era scaffold ficticio ("Player 3"):
// tres `expect(true).toBe(true)` que no probaban nada, describiendo
// además un diseño viejo de assignRole (recibía "admin auth" como
// parámetro — hoy es un trigger de Firestore sin parámetros de ese
// tipo).
//
// Requiere los emuladores de Auth+Firestore+Functions corriendo — no
// se mockea nada, siguiendo el mismo criterio de verificación de todo
// este proyecto. Correr con:
//   pnpm test          (dentro de firebase/functions — ya envuelve el
//                        comando con `firebase emulators:exec`, ver
//                        package.json)

import { describe, it, expect, afterAll } from '@jest/globals'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'well-testing-dev' })
}

async function esperarCustomClaims(uid: string): Promise<Record<string, unknown> | undefined> {
  // El trigger corre async del lado del emulador - no hay forma de
  // "esperarlo" directamente, así que se sondea el claim hasta que
  // aparezca (con un tope), en vez de un sleep fijo arbitrario.
  //
  // Nota: si esto empieza a fallar con el claim en `undefined` SIEMPRE
  // (no solo lento), sospechar primero de packages/core/dist faltante
  // o desactualizado — un MODULE_NOT_FOUND ahí tumba TODA la carga de
  // funciones (assignRole incluido) de forma silenciosa para quien
  // solo mira este test, no es un problema de timing. Pasó una vez en
  // CI (ver historial del checklist Fase 6, #46) — el script "test"
  // ya corre "pnpm build" antes por eso.
  for (let i = 0; i < 30; i++) {
    const user = await admin.auth().getUser(uid)
    if (user.customClaims?.rol) return user.customClaims
    await new Promise((r) => setTimeout(r, 500))
  }
  return undefined
}

describe('assignRole (trigger real, contra el emulador)', () => {
  const uidsCreados: string[] = []

  afterAll(async () => {
    await Promise.all(uidsCreados.map((uid) => admin.auth().deleteUser(uid).catch(() => {})))
    await Promise.all(
      uidsCreados.map((uid) => admin.firestore().collection('usuarios').doc(uid).delete().catch(() => {}))
    )
  })

  it('asigna el Custom Claim correcto (rol/zona) al crear /usuarios/{uid}', async () => {
    const uid = `test-assignrole-${Date.now()}`
    uidsCreados.push(uid)
    await admin.auth().createUser({ uid })
    await admin.firestore().collection('usuarios').doc(uid).set({
      nombre: 'Test',
      rol: 'SUP_AREA',
      zona: 'MONAGAS',
    })

    const claims = await esperarCustomClaims(uid)
    expect(claims).toEqual({ rol: 'SUP_AREA', pozoAsignado: null, zona: 'MONAGAS' })
  }, 100000)

  it('degrada a OPERADOR cualquier rol no reconocido — incluido "ROOT"', async () => {
    // Este es exactamente el caso documentado en
    // docs/manuals/admin-setup.md: crear /usuarios/{uid} con
    // rol:"ROOT" a mano NO produce un usuario ROOT, lo degrada a
    // OPERADOR sin ningún error visible. Por eso create-root-user.js
    // asigna el Custom Claim directo y nunca pasa por /usuarios/{uid}.
    const uid = `test-assignrole-root-${Date.now()}`
    uidsCreados.push(uid)
    await admin.auth().createUser({ uid })
    await admin.firestore().collection('usuarios').doc(uid).set({
      nombre: 'Test',
      rol: 'ROOT',
      zona: null,
    })

    const claims = await esperarCustomClaims(uid)
    expect(claims?.rol).toBe('OPERADOR')
  }, 100000)
})
