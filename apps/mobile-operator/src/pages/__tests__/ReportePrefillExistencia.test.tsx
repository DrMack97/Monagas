// src/pages/__tests__/ReportePrefillExistencia.test.tsx
//
// Prefill de Existencia y Trasegable: "la Existencia debe cargar el último valor ingresado por el operador (medición
// del tanque en esa hora). Este mismo valor debe reflejarse en el campo Trasegable como previsión para fluidos
// incarreables".

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportePage from '../ReportePage'
import { updateDoc } from 'firebase/firestore'

jest.mock('firebase/firestore', () => ({ doc: jest.fn(), updateDoc: jest.fn().mockResolvedValue(undefined), serverTimestamp: jest.fn() }))
jest.mock('../../hooks/usePozoInfo', () => ({
  usePozoInfo: () => ({
    pozo: { id: 'p1', nombre: 'SBC-61 L', empresa: 'DSI', equipo: 'WT 1440', horasEval: 5, zona: 'MONAGAS', tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 2.4 }, { id: 't2', nombre: 'Tanque 2', mi: 0, ft: 2.4 }] },
    loading: false, error: null,
  }),
}))
const lecturasMock = jest.fn()
jest.mock('../../hooks/useLecturasEvaluacion', () => ({ useLecturasEvaluacion: () => lecturasMock() }))
jest.mock('../../hooks/useReporteAnterior', () => ({ useReporteAnterior: () => ({ anterior: null }) }))

const tanque = (id: string, mf: number) => ({ tanqueId: id, mi: 0, mf, dif: mf, th: 1, reductor: 0, bph: 2.4, bpd: 57.6, aysBls: 0, netos: 57.6 })
const lectura = (hora: number, mf1: number, mf2: number) => ({
  id: `l${hora}`, hora, timestamp: new Date(2026, 10, 4, 7 + hora, 0), operativos: { pCab: 540, pSep: 300 }, tanques: [tanque('t1', mf1), tanque('t2', mf2)],
})

async function abrir(lecturas: unknown[]) {
  lecturasMock.mockReturnValue({ lecturas, loading: false })
  const user = userEvent.setup()
  render(<ReportePage pozoId="p1" evalId="e1" />)
  await user.click(screen.getByRole('button', { name: /datos del reporte/i }))
  const c = (e: string) => screen.getByLabelText(e) as HTMLInputElement
  return { user, existencia: () => c('Existencia (Bls)'), trasegable: () => c('Trasegable (Bls)'), acumulado: () => c('Total Trasegado Acumulado (Bls)') }
}
const textoWhatsApp = () => decodeURIComponent((screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement).href.split('text=')[1])

beforeEach(() => (updateDoc as jest.Mock).mockClear())

describe('Reporte — prefill de Existencia y Trasegable', () => {
  it('la Existencia carga la medición de los tanques de la última lectura (0 + 48.75 pulg × 2.4 = 117 Bls)', async () => {
    const f = await abrir([lectura(1, 0, 48.75)])
    expect(f.existencia()).toHaveValue(117)
    expect(f.existencia()).toHaveAttribute('data-prefill', 'true')
  })

  it('el mismo valor se refleja en Trasegable como previsión de fluidos incarreables', async () => {
    const f = await abrir([lectura(1, 0, 48.75)])
    expect(f.trasegable()).toHaveValue(117)
    expect(f.trasegable()).toHaveAttribute('data-prefill', 'true')
    expect(screen.getByText(/trasegable la repite como previsión de fluidos incarreables/i)).toBeInTheDocument()
  })

  it('usa la ÚLTIMA lectura (la medición de esa hora), no las anteriores', async () => {
    const f = await abrir([lectura(1, 0, 10), lectura(2, 0, 20), lectura(3, 5, 48.75)])
    expect(f.existencia()).toHaveValue(129) // (5 + 48.75) × 2.4
  })

  it('suma todos los tanques (cada uno con su factor)', async () => {
    const f = await abrir([lectura(1, 10, 10)])
    expect(f.existencia()).toHaveValue(48) // (10 + 10) × 2.4
  })

  it('si el operador cambia la Existencia, Trasegable la acompaña mientras no lo haya tocado', async () => {
    const f = await abrir([lectura(1, 0, 48.75)])
    await f.user.clear(f.existencia())
    await f.user.type(f.existencia(), '100')
    expect(f.existencia()).toHaveAttribute('data-prefill', 'false')
    expect(f.trasegable()).toHaveValue(100)
    expect(f.trasegable()).toHaveAttribute('data-prefill', 'true')
  })

  it('si el operador edita Trasegable, deja de seguir a la Existencia', async () => {
    const f = await abrir([lectura(1, 0, 48.75)])
    await f.user.clear(f.trasegable())
    await f.user.type(f.trasegable(), '80')
    expect(f.trasegable()).toHaveValue(80)
    expect(f.trasegable()).toHaveAttribute('data-prefill', 'false')
    await f.user.clear(f.existencia())
    await f.user.type(f.existencia(), '90')
    expect(f.trasegable()).toHaveValue(80) // ya no sigue
  })

  it('una Existencia distinta de la medida sigue activando la alerta de balance (no bloquea)', async () => {
    const f = await abrir([lectura(1, 0, 48.75)])
    await f.user.clear(f.existencia())
    await f.user.type(f.existencia(), '11.7')
    expect(f.existencia()).toHaveAttribute('data-nivel', 'ROJA')
    expect(screen.getByRole('button', { name: /^calcular promedio$/i })).toBeEnabled()
  })

  it('con la Existencia precargada (= medida) no hay alerta', async () => {
    const f = await abrir([lectura(1, 0, 48.75)])
    expect(f.existencia()).toHaveAttribute('data-nivel', 'OK')
  })

  it('si el operador borra la Existencia a propósito, no se vuelve a rellenar (y Trasegable queda vacío)', async () => {
    const f = await abrir([lectura(1, 0, 48.75)])
    await f.user.clear(f.existencia())
    expect(f.existencia()).toHaveValue(null)
    expect(f.existencia()).toHaveAttribute('data-prefill', 'false')
    expect(f.trasegable()).toHaveValue(null)
  })

  it('sin lecturas no hay nada que precargar: ambos campos vacíos', async () => {
    const f = await abrir([])
    expect(f.existencia()).toHaveValue(null)
    expect(f.trasegable()).toHaveValue(null)
    expect(f.existencia()).toHaveAttribute('data-prefill', 'false')
  })

  it('si a algún tanque le falta la medida NO se precarga un total parcial', async () => {
    const parcial = { id: 'l1', hora: 1, timestamp: new Date(), operativos: {}, tanques: [tanque('t1', 10)] } // falta t2
    const f = await abrir([parcial])
    expect(f.existencia()).toHaveValue(null)
  })

  it('el texto de WhatsApp lleva Existencia y Trasegable sin teclear; el acumulado queda "—" (no un 0 inventado)', async () => {
    const f = await abrir([lectura(1, 0, 48.75)])
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    const t = textoWhatsApp()
    expect(t).toContain('• Existencia Total: 117 Bls | Total Trasegable: 117 Bls')
    expect(t).toContain('• Total Trasegado Acumulado: —')
    expect(t).toContain('• Total Despachado General: —')
  })

  it('al guardar el avance solo se guarda lo que hay: existencia y trasegable, SIN totalTrasegado en 0', async () => {
    const f = await abrir([lectura(1, 0, 48.75)])
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    await f.user.click(screen.getByRole('button', { name: /guardar avance/i }))
    const { resumenTanques } = (updateDoc as jest.Mock).mock.calls[0][1].reporteOperativo
    expect(resumenTanques).toEqual({ existencia: 117, trasegable: 117 })
  })

  it('al digitar el acumulado, el total despachado se calcula (acumulado + existencia)', async () => {
    const f = await abrir([lectura(1, 0, 48.75)])
    await f.user.type(f.acumulado(), '2542.92')
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    const t = textoWhatsApp()
    expect(t).toContain('• Total Trasegado Acumulado: 2,542.92 Bls')
    expect(t).toContain('• Total Despachado General: 2,659.92 Bls') // el ejemplo del informe
  })
})
