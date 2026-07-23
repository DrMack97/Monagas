import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Tipos
interface PozoAsignado {
  id: string;
  nombre: string;
  estado: string;
  produccion: number;
  ultimaLectura: string;
}

interface AuthContextType {
  user: User | null;
  pozoAsignado: PozoAsignado | null;
  loading: boolean;
  error: string | null;
  setPozoAsignado: (pozo: PozoAsignado | null) => void;
  logout: () => Promise<void>;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el Provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pozoAsignado, setPozoAsignado] = useState<PozoAsignado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Cargar pozo asignado desde Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.pozoAsignado) {
              setPozoAsignado(data.pozoAsignado);
            }
          }
        } catch (err) {
          console.error('Error al cargar pozo asignado:', err);
          setError('Error al cargar datos del usuario');
        }
      } else {
        setPozoAsignado(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setPozoAsignado(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError('Error al cerrar sesión');
    }
  };

  const value = {
    user,
    pozoAsignado,
    loading,
    error,
    setPozoAsignado,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};