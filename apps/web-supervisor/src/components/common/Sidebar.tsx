// src/components/common/Sidebar.tsx
//
// Navegación lateral del panel de supervisión. Antes solo existía el
// link suelto de "Usuarios" en Header — esto le da una ubicación fija
// para crecer (Analytics, Aprobaciones en Fase 2, etc.) sin volver a
// sobrecargar el Header. Los ítems visibles dependen del rol, igual
// que las rutas en App.tsx (RutaSoloGestion).

import { NavLink } from 'react-router-dom'
import type { IconType } from 'react-icons'
import { FiDroplet, FiUsers, FiCheckSquare, FiBarChart2 } from 'react-icons/fi'
import type { Rol } from '@core/types'

interface SidebarProps {
  rol: Rol | null
}

interface NavItem {
  to: string
  label: string
  icon: IconType
  roles?: Rol[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Pozos', icon: FiDroplet },
  { to: '/aprobaciones', label: 'Aprobaciones', icon: FiCheckSquare, roles: ['SUP_AREA', 'GERENTE'] },
  { to: '/analytics', label: 'Analytics', icon: FiBarChart2, roles: ['SUP_AREA', 'GERENTE'] },
  { to: '/usuarios', label: 'Usuarios', icon: FiUsers, roles: ['SUP_AREA', 'GERENTE'] },
]

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-amber-500/10 text-amber-400 font-medium'
      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
  }`

const movilClasses = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] ${
    isActive ? 'text-amber-400 font-medium' : 'text-slate-400'
  }`

export default function Sidebar({ rol }: SidebarProps) {
  const items = NAV_ITEMS.filter((item) => !item.roles || (rol && item.roles.includes(rol)))

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="hidden md:flex md:flex-col w-56 shrink-0 border-r border-slate-800 bg-slate-950/60 p-3 gap-1"
      >
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClasses}>
            <item.icon aria-hidden="true" size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* En el teléfono la barra lateral no existe (hidden md:flex): sin esto no había forma de llegar a
          Aprobaciones o Analytics, solo a Usuarios desde la cabecera. Barra inferior solo para pantallas
          pequeñas; las páginas dejan espacio abajo (pb-16 md:pb-0). */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 inset-x-0 z-20 flex justify-around border-t border-slate-800 bg-slate-950/95 backdrop-blur px-1 py-1.5"
      >
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={movilClasses}>
            <item.icon aria-hidden="true" size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
