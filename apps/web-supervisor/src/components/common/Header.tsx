// src/components/common/Header.tsx
//
// Header persistente del panel de supervisión. Muestra el rol activo
// (con label legible, no el código crudo) y el botón de cierre de
// sesión. El link a Usuarios solo se ve en md:hidden (mobile) — en
// desktop esa navegación vive en Sidebar.tsx; sin este fallback,
// /usuarios quedaría sin punto de entrada en pantallas donde el
// Sidebar está oculto.

import { Link } from 'react-router-dom'
import { FiDroplet } from 'react-icons/fi'
import type { Rol } from '@core/types'

const ROL_LABEL: Record<string, string> = {
  SUP_CAMPO: 'Supervisor de Campo',
  SUP_AREA: 'Supervisor de Área',
  GERENTE: 'Gerente',
}

interface HeaderProps {
  nombre: string | null
  rol: Rol | null
  onLogout: () => void
}

export default function Header({ nombre, rol, onLogout }: HeaderProps) {
  const puedeGestionarUsuarios = rol === 'SUP_AREA' || rol === 'GERENTE'

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <FiDroplet className="text-lg" aria-hidden="true" />
        <span className="font-semibold text-white hidden sm:inline">Well Testing</span>
      </div>

      <div className="flex items-center gap-3">
        {puedeGestionarUsuarios && (
          <Link
            to="/usuarios"
            className="md:hidden text-xs text-slate-400 border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Usuarios
          </Link>
        )}
        <div className="text-right hidden sm:block">
          <p className="text-sm text-slate-200 leading-tight">{nombre ?? 'Usuario'}</p>
          <p className="text-xs text-slate-500 leading-tight">
            {rol ? ROL_LABEL[rol] ?? rol : ''}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-slate-400 border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-800 hover:text-white transition-colors"
        >
          Salir
        </button>
      </div>
    </header>
  )
}
