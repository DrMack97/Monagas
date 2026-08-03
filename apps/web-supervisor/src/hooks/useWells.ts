// TODO: Custom hook lectura pozos asignados - Player 3 (Fullstack)
// Paso 1: Usar useAuth para obtener current user
// Paso 2: Fetch pozos desde Firestore
// Paso 3: Manejar loading y error states
// Prompt de implementación rápida:
// "Crear useWells con auth, fetch, loading, error, realtime option"
// Entregable:
// - wells: array
// - loading: boolean
// - error: string | null
// - refresh: function
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface Well {
  id: string;
  nombre: string;
  campo: string;
  estado: string;
  netos: number;
  [key: string]: any;
}

export function useWells(supervisorId?: string) {
  const [wells, setWells] = useState<Well[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWells = async () => {
      try {
        const wellsRef = collection(db, 'wells');
        let snapshot;
        
        // ✅ Filtro opcional por supervisorId
        if (supervisorId) {
          const q = query(wellsRef, where('supervisorId', '==', supervisorId));
          snapshot = await getDocs(q);
        } else {
          snapshot = await getDocs(wellsRef);
        }

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Well[];
        
        setWells(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar pozos');
        setLoading(false);
      }
    };

    fetchWells();
  }, [supervisorId]);

  return { wells, loading, error };
}
