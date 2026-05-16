// TODO: Cloud Function asignarRol(userId, rol) - Player 1 (Backend)
// Paso 1: Validar que caller es admin
// Paso 2: Set custom claim con admin.assertCustomAuth
// Paso 3: Retornar éxito/error
// Prompt de implementación rápida:
// "Crear assignRole https.onCall con admin.assertCustomAuth, setCustomUserClaims"
// Entregable:
// - Solo admin puede llamar
// - Set custom claim { role: 'OPERADOR' }
// - Retornar { success: true, userId, rol }
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const assignRole = functions.https.onCall(
  async (data: { userId: string; rol: string }, context) => {
    // Verificar que el caller es admin
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'No autorizados')
    }

    const { userId, rol } = data

    // Validar rol
    const validRoles = ['OPERADOR', 'SUP_CAMPO', 'SUP_MAYOR', 'COORDINADOR', 'GERENTE']
    if (!validRoles.includes(rol)) {
      throw new functions.https.HttpsError('invalid-argument', 'Rol inválido')
    }

    try {
      // Set custom claim
      await admin.auth().setCustomUserClaims(userId, { role: rol })

      return {
        success: true,
        userId,
        rol,
        message: `Rol ${rol} asignado a ${userId}`
      }
    } catch (error) {
      console.error('Error assigning role:', error)
      throw new functions.https.HttpsError('internal', 'Error asignando rol')
    }
  }
)
