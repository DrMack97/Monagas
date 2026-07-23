// TODO: Página de cola offline - Player 2 (Frontend)
// Paso 1: Mostrar operaciones pendientes
// Paso 2: Mostrar estado
// Paso 3: Retry/Discard buttons
// Prompt de implementación rápida:
// "Crear QueuePage con operaciones, status, retry/discard"

import React, { useState, useEffect } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  data?: any;
}

export default function QueuePage() {
  const { isOnline, queue, addToQueue } = useOfflineSync();
  const [operations, setOperations] = useState<OfflineOperation[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Simula operaciones desde la cola (usando el estado queue del hook)
  useEffect(() => {
    // Como queue es any[], lo mapeamos a OfflineOperation
    const mapped = (queue as any[]).map((item, index) => ({
      id: item.id || `op-${index}`,
      type: item.type || 'create',
      collection: item.collection || 'unknown',
      documentId: item.documentId,
      timestamp: item.timestamp || Date.now(),
      retryCount: item.retryCount || 0,
      status: item.status || 'pending',
      data: item.data,
    }));
    setOperations(mapped);
  }, [queue]);

  const handleSync = async () => {
    setSyncing(true);
    // Simula sincronización (el hook no tiene syncQueue)
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncing(false);
  };

  const handleRetryFailed = async () => {
    // Simula reintento
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleClearAll = async () => {
    if (confirm('¿Borrar toda la cola? Se perderán las operaciones no sincronizadas.')) {
      // El hook no tiene clearQueue, solo podemos limpiar localmente
      setOperations([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cola Offline</h1>
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-sm rounded ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
          <button
            onClick={handleSync}
            disabled={syncing || operations.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-yellow-50 rounded">
            <p className="text-2xl font-bold text-yellow-700">
              {operations.filter(op => op.status === 'pending').length}
            </p>
            <p className="text-sm text-yellow-600">Pendientes</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <p className="text-2xl font-bold text-red-700">
              {operations.filter(op => op.status === 'failed').length}
            </p>
            <p className="text-sm text-red-600">Fallidas</p>
          </div>
        </div>
      </div>

      {operations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">✅</p>
          <p>No hay operaciones en cola</p>
        </div>
      ) : (
        <div className="space-y-2">
          {operations.map(op => (
            <div key={op.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium capitalize">{op.type}</p>
                  <p className="text-sm text-gray-600">
                    {op.collection}/{op.documentId}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(op.status)}`}>
                  {op.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(op.timestamp).toLocaleString()}
                {op.retryCount > 0 && ` • Reintentos: ${op.retryCount}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {operations.length > 0 && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleRetryFailed}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Reintentar fallidas
          </button>
          <button
            onClick={handleClearAll}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Borrar todo
          </button>
        </div>
      )}
    </div>
  );
}
