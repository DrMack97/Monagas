// TODO: Hook cola sincronización offline - Player 3 (Fullstack)
// Paso 1: Detectar conexión con navigator.onLine
// Paso 2: Guardar operaciones pendientes en IndexedDB
// Paso 3: Sync automático cuando vuelve conexión
// Prompt de implementación rápida:
// "Crear useOfflineSync con IndexedDB, detect offline, auto sync online"
// Entregable:
// - Operación se guarda en cola si offline
// - onOnline dispara sync
// - Cola se vacía después de sync exitoso

import { useState, useEffect } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'monagas-offline';
const STORE_NAME = 'pending-operations';

// ✅ Definir el tipo de operación
type QueueOperation = {
  id?: number;
  type: string;
  data: any;
  timestamp: number;
};

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueueOperation[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cargar cola al iniciar
    loadQueue();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = async (operation: any) => {
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
    await db.add(STORE_NAME, { ...operation, timestamp: Date.now() });
    await loadQueue();
  };

  const loadQueue = async () => {
    try {
      const db = await openDB(DB_NAME, 1);
      const ops = await db.getAll(STORE_NAME);
      setQueue(ops as QueueOperation[]); // ✅ Cast explícito
    } catch (error) {
      console.error('Error loading queue:', error);
      setQueue([]);
    }
  };

  const syncQueue = async () => {
    if (!isOnline) return;
    for (const op of queue) {
      try {
        await executeOperation(op);
        if (op.id !== undefined) {
          await deleteFromQueue(op.id);
        }
      } catch (err) {
        console.error('Sync failed:', err);
      }
    }
  };

  const deleteFromQueue = async (id: number) => {
    try {
      const db = await openDB(DB_NAME, 1);
      await db.delete(STORE_NAME, id);
      await loadQueue();
    } catch (error) {
      console.error('Error deleting from queue:', error);
    }
  };

  return { isOnline, queue, addToQueue };
}

async function executeOperation(op: QueueOperation) {
  // TODO: Implementar según tipo de operación
  console.log('Executing operation:', op);
}