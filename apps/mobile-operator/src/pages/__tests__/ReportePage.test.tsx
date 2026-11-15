// src/pages/__tests__/ReportePage.test.tsx
//
// El texto de WhatsApp sale del reporte estándar del Informe Técnico (04/11/2026): se prueba que el
// formulario alimente los campos nuevos (nocturno, asunto, plan, viajes de vacuum) y que el enlace
// de WhatsApp lleve ese texto, sin alertas.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportePage from '../ReportePage'
import { updateDoc } from 'firebase/firestore'
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
      tanques: [{ tanqueId: 't1', mi: 0, mf: 48.75, dif: 48.75, th: 1, reductor: 0, trasegado: 120.9, bph: 5.2, bpd: 124.8, aysBls: 27.456, netos: 97.3 }],
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

  describe('botón de avance preliminar', () => {
    it('se llama "Guardar avance" (no "Snapshot") y aclara qué pasa sin señal', async () => {
      const { container } = render(<ReportePage pozoId="p1" evalId="e1" />)
      await userEvent.setup().click(screen.getByRole('button', { name: /^calcular promedio$/i }))
      expect(screen.getByRole('button', { name: /guardar avance/i })).toBeInTheDocument()
      expect(screen.getByText('Si no hay señal se envía sola al volver la red.')).toBeInTheDocument()
      expect(container.textContent).not.toMatch(/snapshot/i)
    })

    it('al pulsarlo guarda en la evaluación (base de datos, no un archivo) y confirma "Avance guardado."', async () => {
      ;(updateDoc as jest.Mock).mockClear()
      render(<ReportePage pozoId="p1" evalId="e1" />)
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
      await user.click(screen.getByRole('button', { name: /guardar avance/i }))
      expect(updateDoc).toHaveBeenCalledTimes(1)
      const datos = (updateDoc as jest.Mock).mock.calls[0][1]
      expect(datos.resultados).toBeDefined()
      expect(datos).not.toHaveProperty('estado') // el avance NO cierra la evaluación ni la envía a supervisión
      expect(await screen.findByText('Avance guardado.')).toBeInTheDocument()
    })
  })

  describe('alerta de balance de masas al cierre (no bloquea)', () => {
    async function abrir() {
      const user = userEvent.setup()
      render(<ReportePage pozoId="p1" evalId="e1" />)
      await user.click(screen.getByRole('button', { name: /datos del reporte/i }))
      return user
    }
    const campo = (etiqueta: string) => screen.getByLabelText(etiqueta) as HTMLInputElement

    it('existencia igual a la medida por nivel (48.75 pulg × 2.4 = 117 Bls): sin alerta', async () => {
      const user = await abrir()
      // ya viene precargada con la medición (117): sin alerta
      expect(campo('Existencia (Bls)')).toHaveValue(117)
      expect(campo('Existencia (Bls)')).toHaveAttribute('data-nivel', 'OK')
      expect(screen.queryByText(/difiere/i)).not.toBeInTheDocument()
    })

    it('existencia con el decimal corrido (11.7): ROJA con sugerencia de decimal', async () => {
      const user = await abrir()
      await user.clear(campo('Existencia (Bls)'))
      await user.type(campo('Existencia (Bls)'), '11.7')
      expect(campo('Existencia (Bls)')).toHaveAttribute('data-nivel', 'ROJA')
      expect(campo('Existencia (Bls)').className).toMatch(/border-red-500/)
      expect(
        screen.getByText('Alerta roja: difiere 105.30 Bls de la medida por nivel (117.00 Bls). ¿Se omitió o sobra un decimal?')
      ).toBeInTheDocument()
    })

    it('existencia que difiere menos de una pulgada (118 vs 117): AMARILLA', async () => {
      const user = await abrir()
      await user.clear(campo('Existencia (Bls)'))
      await user.type(campo('Existencia (Bls)'), '118')
      expect(campo('Existencia (Bls)')).toHaveAttribute('data-nivel', 'AMARILLA')
      expect(screen.getByText(/alerta amarilla: difiere 1.00 Bls/i)).toBeInTheDocument()
    })

    it('total trasegado acumulado MENOR que lo trasegado en el ciclo (12.09 < 120.90): ROJA', async () => {
      const user = await abrir()
      await user.type(campo('Total Trasegado Acumulado (Bls)'), '12.09')
      expect(campo('Total Trasegado Acumulado (Bls)')).toHaveAttribute('data-nivel', 'ROJA')
      expect(
        screen.getByText(
          'Alerta roja: el acumulado (12.09 Bls) es menor que lo trasegado en este ciclo (120.90 Bls); no puede serlo. ¿Se omitió un decimal?'
        )
      ).toBeInTheDocument()
    })

    it('total trasegado acumulado correcto (incluye lo anterior al ciclo): sin alerta', async () => {
      const user = await abrir()
      await user.type(campo('Total Trasegado Acumulado (Bls)'), '2542.92')
      expect(campo('Total Trasegado Acumulado (Bls)')).toHaveAttribute('data-nivel', 'OK')
    })

    it('campos vacíos no generan alerta, y con alerta roja se puede calcular y compartir igual (no bloquea)', async () => {
      const user = await abrir()
      expect(campo('Existencia (Bls)')).toHaveAttribute('data-nivel', 'OK')
      await user.clear(campo('Existencia (Bls)'))
      await user.type(campo('Existencia (Bls)'), '11.7')
      await user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
      expect(screen.getByRole('link', { name: /whatsapp/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /guardar avance/i })).toBeEnabled()
    })
  })
})
