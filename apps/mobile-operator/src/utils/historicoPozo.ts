// src/utils/historicoPozo.ts
//
// Carga todas las evaluaciones del pozo con sus lecturas, para el Excel "Data Histórica del Equipo".
//
// El Operador ya puede leer las evaluaciones de su pozo y sus lecturas (firestore.rules), así que no hay permisos nuevos.
// La consulta de evaluaciones solo filtra por pozoId (sin índice compuesto) y cada lectura se pide ordenada por hora.
// Sin señal, Firestore responde con lo que haya en la caché del teléfono: el histórico saldrá con lo ya cargado.

import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { ILectura } from '@core/types'
import type { EvaluacionParaExcel } from '@core/utils/exportesExcel'

export async function cargarEvaluacionesDelPozo(pozoId: string): Promise<EvaluacionParaExcel[]> {
  const evaluaciones = await getDocs(query(collection(db, 'evaluaciones'), where('pozoId', '==', pozoId)))
  return Promise.all(
    evaluaciones.docs.map(async (e) => {
      const data = e.data()
      const lecturas = await getDocs(query(collection(db, 'evaluaciones', e.id, 'lecturas'), orderBy('hora', 'asc')))
      return {
        id: e.id,
        creadoEn: data.creadoEn,
        estado: data.estado,
        lecturas: lecturas.docs.map((l) => ({ id: l.id, ...l.data() }) as ILectura),
      }
    })
  )
}
