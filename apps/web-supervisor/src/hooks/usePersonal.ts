// src/hooks/usePersonal.ts
//
// Lista OPERADOR y SUP_CAMPO visibles según el rol de quien consulta:
// SUP_AREA ve solo su zona, GERENTE ve todos. Coincide exactamente
// con el alcance que ya validan crearPersonal.ts y reassignPozo.ts
// del lado del servidor — este hook solo decide QUÉ MOSTRAR, nunca
// qué está permitido escribir (eso lo deciden las Cloud Functions).

import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { IUsuario, Rol, Zona } from '@core/types'

const ROLES_PERSONAL = ['OPERADOR', 'SUP_CAMPO']

export function usePersonal(rol: Rol | null, zona: Zona | null) {
  const [personal, setPersonal] = useState<IUsuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!rol || (rol !== 'SUP_AREA' && rol !== 'GERENTE')) {
      setPersonal([])
      setLoading(false)
      return
    }

    setLoading(true)
    const q =
      rol === 'SUP_AREA'
        ? query(
            collection(db, 'usuarios'),
            where('rol', 'in', ROLES_PERSONAL),
            where('zona', '==', zona)
          )
        : query(collection(db, 'usuarios'), where('rol', 'in', ROLES_PERSONAL))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPersonal(
          snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }) as IUsuario)
        )
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [rol, zona])

  return { personal, loading, error }
}
