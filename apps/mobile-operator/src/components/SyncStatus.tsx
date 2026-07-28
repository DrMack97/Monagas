// TODO: Componente estado de sync - Player 2 (Frontend)
// Paso 1: Mostrar estado sync
// Paso 2: Mostrar último sync
// Paso 3: Manual sync button
// Prompt de implementación rápida:
// "Crear SyncStatus con lastSync, sync button"
import React, { useState, useEffect } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function SyncStatus() {
  const { isOnline, queue } = useOfflineSync();
  const queueLength = queue.length;
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (isOnline && queueLength === 0) {
      setLastSync(new Date());
    }
  }, [isOnline, queueLength]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Estado de Sincronización</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Operaciones pendientes:</span>
          <span className="font-medium">{queueLength}</span>
        </div>
        
        {lastSync && (
          <div className="flex justify-between">
            <span className="text-gray-600">Última sync:</span>
            <span className="font-medium">{lastSync.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {queueLength > 0 && (
        <button
          onClick={() => {/* Función de sincronización */}}
          disabled={!isOnline}
          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Sincronizar ahora
        </button>
      )}
    </div>
  );
}
