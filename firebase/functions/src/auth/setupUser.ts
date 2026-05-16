// TODO: Trigger crear usuario con valores default - Player 1 (Backend)
// Paso 1: auth.user().onCreate trigger
// Paso 2: Crear documento en Firestore users/ con valores default
// Paso 3: Set rol default = 'OPERADOR'
// Prompt de implementación rápida:
// "Crear setupUser onCreate trigger, crear documento users/{uid} con default values"
// Entregable:
// - Trigger en signup
// - Crear documento users/{uid}
// - Default rol = 'OPERADOR', activo = true
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const setupUser = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user

  try {
    // Crear documento en Firestore
    await admin.firestore().collection('users').doc(uid).set({
      uid,
      email: email || '',
      nombre: displayName || 'Sin nombre',
      fotoUrl: photoURL || null,
      rol: 'OPERADOR', // Default
      phone: null,
      activo: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log(`User ${uid} created with default role OPERADOR`)

    // TODO: Set custom claim con rol default
    await admin.auth().setCustomUserClaims(uid, { role: 'OPERADOR' })

    return {
      success: true,
      uid,
      rol: 'OPERADOR'
    }
  } catch (error) {
    console.error('Error setting up user:', error)
    throw error
  }
})
