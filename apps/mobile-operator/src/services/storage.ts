// TODO: Cache local IndexedDB para offline - Player 3 (Fullstack)
// Paso 1: Configurar IndexedDB con idb library
// Paso 2: Guardar evaluaciones, pozos en cache
// Paso 3: Leer desde cache cuando offline
// Prompt de implementación rápida:
// "Crear IndexedDB wrapper con save, get, clear para evaluaciones offline"
// Entregable:
// - saveEvaluation(evaluation) → Promise
// - getPendingEvaluations() → Promise[]
// - clearEvaluation(id) → Promise
import { openDB } from 'idb'

const DB_NAME = 'monagas-cache'
const DB_VERSION = 1
const STORE_EVALUATIONS = 'evaluations'
const STORE_WELLS = 'wells'

export async function initCache() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_EVALUATIONS)) {
        db.createObjectStore(STORE_EVALUATIONS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_WELLS)) {
        db.createObjectStore(STORE_WELLS, { keyPath: 'id' })
      }
    }
  })
}

export async function saveEvaluation(evaluation: any) {
  const db = await initCache()
  await db.put(STORE_EVALUATIONS, evaluation)
}

export async function getPendingEvaluations() {
  const db = await initCache()
  return db.getAll(STORE_EVALUATIONS)
}

export async function clearEvaluation(id: string) {
  const db = await initCache()
  await db.delete(STORE_EVALUATIONS, id)
}

export async function cacheWells(wells: any[]) {
  const db = await initCache()
  const tx = db.transaction(STORE_WELLS, 'readwrite')
  for (const well of wells) {
    await tx.store.put(well)
  }
  await tx.done
}

export async function getCachedWells() {
  const db = await initCache()
  return db.getAll(STORE_WELLS)
}
