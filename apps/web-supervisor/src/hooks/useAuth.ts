// src/hooks/useAuth.ts
//
// Mismo patrón que apps/mobile-operator/src/hooks/useAuth.ts, adaptado
// a que aquí conviven 3 roles (SUP_CAMPO, SUP_AREA, GERENTE) en vez de
// uno solo. Expone tanto `pozoAsignado` (relevante para SUP_CAMPO) como
// `zona` (relevante para SUP_AREA) — assignRole.ts ya asigna ambos
// claims sin importar el rol; cada consumidor usa el que le aplica.

import { useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../services/firebase'
import type { Rol, Zona } from '@core/types'

interface AuthState {
  user: User | null
  rol: Rol | null
  zona: Zona | null
  pozoAsignado: string | null
  loading: boolean
  error: string | null
}

const MENSAJES_ERROR: Record<string, string> = {
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta de nuevo en unos minutos.',
  'auth/network-request-failed': 'Sin conexión. Verifica tu internet.',
}

function mapAuthError(code: string): string {
  return MENSAJES_ERROR[code] ?? 'No se pudo iniciar sesión. Intenta de nuevo.'
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    rol: null,
    zona: null,
    pozoAsignado: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({
          user: null, rol: null, zona: null, pozoAsignado: null,
          loading: false, error: null,
        })
        return
      }

      const tokenResult = await user.getIdTokenResult()
      const rol = (tokenResult.claims.rol as Rol) ?? null
      const zona = (tokenResult.claims.zona as Zona) ?? null
      const pozoAsignado = (tokenResult.claims.pozoAsignado as string | null) ?? null

      setState({ user, rol, zona, pozoAsignado, loading: false, error: null })
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: mapAuthError(err.code ?? ''),
      }))
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  return { ...state, login, logout }
}
