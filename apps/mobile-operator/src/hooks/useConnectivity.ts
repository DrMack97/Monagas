// src/hooks/useConnectivity.ts
//
// Reemplaza al useOffline.ts/useOfflineSync.ts anteriores — ver
// docs/technical/offline-strategy.md para el porqué: Firestore ya
// tiene su propio mecanismo de persistencia y cola de escrituras
// offline (enableIndexedDbPersistence, activo en services/firebase.ts
// para producción). Reimplementar una cola paralela con IndexedDB a
// mano (lo que useOfflineSync.ts intentaba hacer) no agrega nada,
// solo riesgo de que las dos colas se pisen. Lo único que hacía
// falta de verdad era saber, del lado de la UI, si hay conexión o no
// — eso es simplemente navigator.onLine + los eventos online/offline
// del navegador.
import { useEffect, useState } from 'react'

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline }
}
