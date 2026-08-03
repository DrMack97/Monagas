// TODO: Custom Claims y protección de rutas - Player 3 (Fullstack)
// Paso 1: getAuth().currentUser.getIdTokenResult()
// Paso 2: Extraer rol de custom claims
// Paso 3: wrap con protected Route component
// Prompt de implementación rápida:
// "Crear useAuthRole con role, isLoading, ProtectedRoute component"
// Entregable:
// - role: string | null
// - isLoading: boolean
// - ProtectedRoute({ allowedRoles, children }) → component
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { Navigate } from 'react-router-dom'

export function useAuthRole() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  const fetchRole = async () => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }
    try {
      const token = await user.getIdTokenResult();
      // ✅ Asegura que role sea string o null
      const userRole = token.claims?.role;
      setRole(typeof userRole === 'string' ? userRole : 'OPERADOR');
    } catch (err) {
      console.error('Error fetching role:', err);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  fetchRole();
}, [user]);

  return {
    role,
    isLoading: loading || isLoading,
    hasRole: (allowedRoles: string[]) => allowedRoles.includes(role || '')
  }
}

export function ProtectedRoute({ 
  allowedRoles, 
  children 
}: { 
  allowedRoles: string[] 
  children: React.ReactNode 
}) {
  const { isLoading, hasRole } = useAuthRole()

  if (isLoading) {
    return <div>Cargando...</div>
  }

  if (!hasRole(allowedRoles)) {
    return <Navigate to="/login" replace />
  }

  return children
}
