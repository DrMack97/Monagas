// TODO: Hook CRUD Firestore - Player 3 (Fullstack)
// Paso 1: Crear funciones create, read, update, delete para colecciones
// Paso 2: Implementar listener realtime con onSnapshot
// Paso 3: Manejar loading y error states
// Prompt de implementación rápida:
// "Crear useFirestore hook con CRUD completo, realtime listener, error handling"
// Entregable:
// - create(collection, data) → Promise
// - read(collection) → Promise
// - update(collection, id, data) → Promise
// - delete(collection, id) → Promise
// - useCollection(collection) → { data, loading, error }
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

// Definir un tipo genérico para los documentos
interface DocumentData {
  id: string;
  [key: string]: any;
}

export async function create(collectionName: string, data: any) {
  const ref = collection(db, collectionName);
  return await addDoc(ref, data);
}

export async function read(collectionName: string) {
  const ref = collection(db, collectionName);
  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function update(collectionName: string, id: string, data: any) {
  const ref = doc(db, collectionName, id);
  return await updateDoc(ref, data);
}

export async function remove(collectionName: string, id: string) {
  const ref = doc(db, collectionName, id);
  return await deleteDoc(ref);
}

export function useCollection(collectionName: string) {
  const [data, setData] = useState<DocumentData[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const ref = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(docs as DocumentData[]);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading, error };
}
