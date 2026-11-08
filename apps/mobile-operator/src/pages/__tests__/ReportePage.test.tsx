// src/pages/__tests__/ReportePage.test.tsx
//
// El texto de WhatsApp sale del reporte estándar del Informe Técnico (04/11/2026): se prueba que el
// formulario alimente los campos nuevos (nocturno, asunto, plan, viajes de vacuum) y que el enlace
// de WhatsApp lleve ese texto, sin alertas.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportePage from '../ReportePage'
import { exportarInformeExcel } from '../../utils/exportExcel'

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}))

const POZO = {
  id: 'p1', nombre: 'SBC-61 L', campo: 'Bare', zona: 'MONAGAS', empresa: 'DSI', equipo: 'Well Testing 1440',
  horasEval: 5, reductorPulgadas: '1"', meterRun: 3.826, diamOrif: 3.25,
  tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 2.4 }],
}
jest.mock('../../hooks/usePozoInfo', () => ({ usePozoInfo: () => ({ pozo: POZO, loading: false, error: null }) }))
jest.mock('../../hooks/useLecturasEvaluacion', () => ({
  useLecturasEvaluacion: () => ({
    loading: false,
    lecturas: [{
      id: 'l1', hora: 1, timestamp: new Date(2026, 10, 4, 7, 57),
      tanques: [{ tanqueId: 't1', mi: 0, mf: 48.75, dif: 48.75, th: 1, reductor: 0, bph: 5.2, bpd: 124.8, aysBls: 27.456, netos: 97.3 }],
      gas: { pf: 300, hw: 43.56, tGas: 130, gg: 0.72, diam: 3.25, meterRun: 3.826, beta: 0.85, Fc: 1.4, Fb: 1, Fg: 1, Ftf: 1, qg: 9.8 },
      operativos: { pCab: 540, pSep: 300 },
      alertas: ['Presión estática excede el resorte configurado'],
    }],
  }),
}))

jest.mock('../../utils/exportExcel', () => ({ exportarInformeExcel: jest.fn() }))
const exportarMock = exportarInformeExcel as jest.Mock

function textoWhatsApp(): string {
  const href = (screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement).href
  return decodeURIComponent(href.split('text=')[1])
}

describe('ReportePage — reporte estándar', () => {
  it('el texto de WhatsApp lleva los datos del formulario, los viajes de vacuum y no las alertas', async () => {
    const user = userEvent.setup()
    render(<ReportePage pozoId="p1" evalId="e1" />)

    await user.click(screen.getByRole('button', { name: /datos del reporte/i }))
    await user.type(screen.getAllByLabelText('Diurno')[0], 'Nelson Fajardo')
    await user.type(screen.getByLabelText('Asunto'), 'Inicia prueba')
    await user.type(screen.getByLabelText('Plan'), 'Evaluar pozo')
    await user.click(screen.getByRole('button', { name: /agregar viaje/i }))
    await user.type(screen.getByLabelText('Chófer (viaje #1)'), 'Rodolfo Rivas')
    await user.type(screen.getByLabelText('Volumen en Bls (viaje #1)'), '120.9')
    await user.type(screen.getByLabelText('Destino (viaje #1)'), 'E/F Santa Bárbara')
    await user.type(screen.getByLabelText('Fecha y hora (viaje #1)'), '2026-11-03T09:05')

    await user.click(screen.getByRole('button', { name: /calcular promedio/i }))

    const t = textoWhatsApp()
    expect(t).toContain('*REPORTE OPERACIONES DE WT*')
    expect(t).toContain('• Diurno: Nelson Fajardo')
    expect(t).toContain('*ASUNTO:* Inicia prueba')
    expect(t).toContain('*PLAN:* Evaluar pozo')
    expect(t).toContain('• Caudal de Gas (Qg): 9.80 MMSCFD')
    expect(t).toContain('   - 1er Viaje: [03/11/2026 - 09:05 Hrs] | Chófer: Rodolfo Rivas | Vol: 120.9 Bls | Destino: E/F Santa Bárbara')
    expect(t).toContain('• Total Trasegado (24 Hrs): 120.9 BLS')
    expect(t).not.toMatch(/alerta|excede el resorte/i)
  })

  it('un viaje sin fecha y hora no se incluye', async () => {
    const user = userEvent.setup()
    render(<ReportePage pozoId="p1" evalId="e1" />)
    await user.click(screen.getByRole('button', { name: /datos del reporte/i }))
    await user.click(screen.getByRole('button', { name: /agregar viaje/i }))
    await user.type(screen.getByLabelText('Chófer (viaje #1)'), 'Sin fecha')
    await user.click(screen.getByRole('button', { name: /calcular promedio/i }))
    const t = textoWhatsApp()
    expect(t).toContain('• Viajes Vacuum (Últimas 24 Hrs): 00')
    expect(t).not.toContain('Sin fecha')
  })

  it('botón Excel: entrega el informe y no muestra error', async () => {
    exportarMock.mockReset().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ReportePage pozoId="p1" evalId="e1" />)
    await user.click(screen.getByRole('button', { name: /calcular promedio/i }))
    await user.click(screen.getByRole('button', { name: /^excel$/i }))
    expect(exportarMock).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/no se pudo exportar/i)).not.toBeInTheDocument()
  })

  it('botón Excel: si la exportación falla, SE AVISA en pantalla (antes fallaba en silencio)', async () => {
    exportarMock.mockReset().mockRejectedValue(new Error('sin espacio'))
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const user = userEvent.setup()
    render(<ReportePage pozoId="p1" evalId="e1" />)
    await user.click(screen.getByRole('button', { name: /calcular promedio/i }))
    await user.click(screen.getByRole('button', { name: /^excel$/i }))
    expect(await screen.findByText(/no se pudo exportar el excel/i)).toBeInTheDocument()
    // y el botón vuelve a estar disponible para reintentar
    expect(screen.getByRole('button', { name: /^excel$/i })).toBeEnabled()
  })

  describe('pantalla: volver, textos y fondo', () => {
    it('tiene botón "Volver" y lo ejecuta (sin él no había cómo retroceder y se cerraba la app)', async () => {
      const volver = jest.fn()
      render(<ReportePage pozoId="p1" evalId="e1" onVolver={volver} />)
      await userEvent.setup().click(screen.getByRole('button', { name: /volver/i }))
      expect(volver).toHaveBeenCalledTimes(1)
    })

    it('el texto de la pantalla no lleva "(PDVSA)" ni "Forzado"', async () => {
      const { container } = render(<ReportePage pozoId="p1" evalId="e1" />)
      const user = userEvent.setup()
      expect(screen.getByRole('button', { name: /^datos del reporte$/i })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
      expect(container.textContent).toMatch(/Cálculo Preliminar —/)
      expect(container.textContent).not.toMatch(/(PDVSA)/)
      expect(container.textContent).not.toMatch(/forzado/i)
    })

    it('el fondo oscuro cubre TODO el ancho: el elemento con el fondo no tiene ancho máximo (en la web se veían lados blancos)', () => {
      const { container } = render(<ReportePage pozoId="p1" evalId="e1" />)
      const raiz = container.firstElementChild as HTMLElement
      expect(raiz.className).toMatch(/bg-slate-950/)
      expect(raiz.className).not.toMatch(/max-w-/)
    })
  })
})
