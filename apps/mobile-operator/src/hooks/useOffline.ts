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
import { useState, useEffect } from 'react';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOffline };
};
