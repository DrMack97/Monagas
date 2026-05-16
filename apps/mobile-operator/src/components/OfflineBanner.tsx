// TODO: Banner de estado offline - Player 2 (Frontend)
// Paso 1: Mostrar banner cuando offline
// Paso 2: Mostrar queue length
// Paso 3: Sync button
// Prompt de implementación rápida:
// "Crear OfflineBanner con isOnline, queueLength, sync"
import React from 'react'
import { useOffline } from '../hooks/useOffline'

export default function OfflineBanner() {
  const { isOnline, queueLength, isSyncing, sync } = useOffline()

  if (isOnline && queueLength === 0) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-3 ${
      isOnline 
        ? 'bg-yellow-100 border-b border-yellow-300' 
        : 'bg-red-100 border-b border-red-300'
    }`}>
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {isOnline ? '☁️' : '📴'}
          </span>
          <div>
            <p className={`font-medium ${isOnline ? 'text-yellow-800' : 'text-red-800'}`}>
              {isOnline ? 'Sincronizando...' : 'Modo Offline'}
            </p>
            {queueLength > 0 && (
              <p className={`text-sm ${isOnline ? 'text-yellow-700' : 'text-red-700'}`}>
                {queueLength} operación(ones) pendiente(s)
              </p>
            )}
          </div>
        </div>
        
        {!isOnline && (
          <button
            onClick={sync}
            disabled={isSyncing}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-red-300"
          >
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        )}
      </div>
    </div>
  )
}
