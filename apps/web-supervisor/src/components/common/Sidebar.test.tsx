// src/components/common/Sidebar.test.tsx
//
// En el teléfono la barra lateral no existe (hidden md:flex): no había forma de llegar a Aprobaciones o
// Analytics. Ahora hay además una barra inferior solo móvil con los mismos destinos. jsdom no evalúa los
// breakpoints de Tailwind, así que aquí se comprueba que existen las dos navegaciones, que ofrecen lo
// mismo según el rol, y que la móvil lleva las clases que la limitan a pantallas pequeñas.

import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'

const montar = (rol: any) => render(<MemoryRouter><Sidebar rol={rol} /></MemoryRouter>)
const destinos = (nombre: string) =>
  within(screen.getByRole('navigation', { name: nombre })).getAllByRole('link').map((a) => a.textContent)

describe('Sidebar + navegación móvil', () => {
  it('GERENTE: la barra móvil ofrece Pozos, Aprobaciones, Analytics y Usuarios, igual que la lateral', () => {
    montar('GERENTE')
    expect(destinos('Navegación móvil')).toEqual(['Pozos', 'Aprobaciones', 'Analytics', 'Usuarios'])
    expect(destinos('Navegación principal')).toEqual(['Pozos', 'Aprobaciones', 'Analytics', 'Usuarios'])
  })

  it('SUP_CAMPO: solo Pozos (las otras pantallas son de gestión)', () => {
    montar('SUP_CAMPO')
    expect(destinos('Navegación móvil')).toEqual(['Pozos'])
  })

  it('la barra móvil solo se ve en pantallas pequeñas y la lateral solo en grandes', () => {
    montar('GERENTE')
    expect(screen.getByRole('navigation', { name: 'Navegación móvil' }).className).toMatch(/md:hidden/)
    expect(screen.getByRole('navigation', { name: 'Navegación principal' }).className).toMatch(/hidden md:flex/)
  })

  it('los enlaces apuntan a las rutas reales', () => {
    montar('GERENTE')
    const hrefs = within(screen.getByRole('navigation', { name: 'Navegación móvil' }))
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['/dashboard', '/aprobaciones', '/analytics', '/usuarios'])
  })
})
