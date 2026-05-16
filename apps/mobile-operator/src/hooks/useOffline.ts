// TODO: Hook para manejar estado offline - Player 2 (Frontend)
// Paso 1: Detectar online/offline
// Paso 2: Mostrar UI offline
// Paso 3: Sync cuando online
// Prompt de implementación rápida:
// "Crear useOffline hook con online state, sync"
// Entregable:
// - isOnline state
// - queue length
// - sync function
import { useState, useEffect, useCallback } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { offlineSync } from '../services/offline-sync'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueLength, setQueueLength] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false
      setIsOnline(online)
      
      if (online) {
        offlineSync.sync()
      }
    })

    return () => unsubscribe()
  }, [])

  // Update queue length
  useEffect(() => {
    const updateQueueLength = () => {
      const status = offlineSync.getQueueStatus()
      setQueueLength(status.pending + status.failed)
    }

    updateQueueLength()
    const interval = setInterval(updateQueueLength, 5000)

    return () => clearInterval(interval)
  }, [])

  // Manual sync
  const sync = useCallback(async () => {
    if (!isOnline) return
    
    setIsSyncing(true)
    await offlineSync.sync()
    setIsSyncing(false)
  }, [isOnline])

  return {
    isOnline,
    queueLength,
    isSyncing,
    sync,
    getStatus: () => offlineSync.getQueueStatus()
  }
}
