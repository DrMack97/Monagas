// Corrección de una lectura en la cola de aprobaciones.
// Fallo real: guardar la corrección escribía operativos = { pCab, pSep } y REEMPLAZABA el mapa completo,
// borrando el Reductor (reductorPulgadas) y el Casing (pCsg) de esa lectura. Aquí se emula cómo Firestore
// aplica un updateDoc (una clave normal reemplaza el valor; una ruta con puntos entra al mapa) para comprobar
// el documento RESULTANTE, no solo el payload.

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ApprovalQueuePage from '../ApprovalQueuePage'

const docActual: Record<string, any> = {
  hora: 1,
  timestamp: new Date(2026, 10, 8, 9, 7),
  alertas: [],
  tanques: [{ tanqueId: 't1', mi: 0, mf: 2, dif: 2, th: 1, reductor: 0, trasegado: 5, bph: 10, bpd: 240, aysBls: 0, netos: 240 }],
  operativos: { pCab: 540, pSep: 300, pCsg: 12, reductorPulgadas: '1"' },
}

/** Aplica un updateDoc como Firestore: las claves con punto modifican solo esa parte del mapa. */
function aplicarUpdate(original: Record<string, any>, cambios: Record<string, any>): Record<string, any> {
  const resultado = JSON.parse(JSON.stringify(original, (_k, v) => v))
  for (const [clave, valor] of Object.entries(cambios)) {
    const partes = clave.split('.')
    let cursor = resultado
    for (const parte of partes.slice(0, -1)) cursor = cursor[parte] ??= {}
    cursor[partes[partes.length - 1]] = valor
  }
  return resultado
}

const updateDocMock = jest.fn().mockResolvedValue(undefined)
jest.mock('firebase/firestore', () => ({ doc: jest.fn((...a: unknown[]) => a), updateDoc: (...a: unknown[]) => updateDocMock(...a) }))
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'sup', email: 's@x.com' }, rol: 'GERENTE', zona: 'TODOS', pozoAsignado: null, logout: jest.fn() }) }))
jest.mock('../../hooks/useApprovals', () => ({
  useApprovals: () => ({
    loading: false, error: null, procesando: false, aprobar: jest.fn(), rechazar: jest.fn(),
    pendientes: [{ id: 'ev1', pozoId: 'p1', estado: 'PENDIENTE_SUPERVISOR', fechaCierre: new Date(2026, 10, 8), resultados: { bpdPromedio: 240, netosPromedio: 240, horasTotales: 1 } }],
  }),
}))
jest.mock('../../hooks/usePozosVisibles', () => ({ usePozosVisibles: () => ({ pozos: [{ id: 'p1', nombre: 'SBC-61L', campo: 'Bare' }] }) }))
jest.mock('../../hooks/useLecturasEvaluacion', () => ({
  useLecturasEvaluacion: () => ({ loading: false, error: null, lecturas: [{ id: 'l1', ...docActual }] }),
}))
jest.mock('../../components/common/Header', () => ({ __esModule: true, default: () => null }))
jest.mock('../../components/common/Sidebar', () => ({ __esModule: true, default: () => null }))

async function corregirPCabezal(valor: string) {
  const user = userEvent.setup()
  render(<MemoryRouter><ApprovalQueuePage /></MemoryRouter>)
  await user.click(screen.getByRole('button', { name: /ver lecturas individuales/i }))
  await user.click(screen.getByRole('button', { name: /corregir lectura/i }))
  const campo = screen.getByLabelText('P. Cabezal') as HTMLInputElement
  await user.clear(campo)
  await user.type(campo, valor)
  await user.click(screen.getByRole('button', { name: /guardar corrección/i }))
}

describe('ApprovalQueuePage — corregir una lectura', () => {
  beforeEach(() => updateDocMock.mockClear())

  it('conserva el Reductor y el Casing de la lectura (antes los borraba)', async () => {
    await corregirPCabezal('600')
    expect(updateDocMock).toHaveBeenCalledTimes(1)
    const resultante = aplicarUpdate(docActual, updateDocMock.mock.calls[0][1])
    expect(resultante.operativos).toEqual({ pCab: 600, pSep: 300, pCsg: 12, reductorPulgadas: '1"' })
  })

  it('conserva el resto de la lectura (hora, fecha, alertas) y los campos del tanque (p. ej. trasegado)', async () => {
    await corregirPCabezal('600')
    const resultante = aplicarUpdate(docActual, updateDocMock.mock.calls[0][1])
    expect(resultante.hora).toBe(1)
    expect(resultante.alertas).toEqual([])
    expect(resultante.tanques[0]).toMatchObject({ tanqueId: 't1', mf: 2, trasegado: 5, bph: 10 })
  })

  it('solo escribe campos permitidos por las reglas (tanques / operativos / gas)', async () => {
    await corregirPCabezal('600')
    const permitidos = new Set(['tanques', 'operativos', 'gas'])
    for (const clave of Object.keys(updateDocMock.mock.calls[0][1])) {
      expect(permitidos.has(clave.split('.')[0])).toBe(true)
    }
  })
})
