// src/hooks/useNotifications.test.ts
//
// Pruebas del hook sobre services/push.ts (que se simula entero: su lógica ya
// la cubre services/push.test.ts). Aquí se verifica el pegamento de React:
// preferencia por defecto, qué hace el interruptor, y que el Dashboard solo
// registre el dispositivo si el usuario no apagó las notificaciones.
//
// Reemplaza a la versión anterior, que probaba el flujo web (Notification +
// firebase/messaging + VAPID) — eliminado porque no funciona en el WebView.

import { act, renderHook, waitFor } from '@testing-library/react'
import { useNotifications } from './useNotifications'

// La fábrica crea los mocks DENTRO de jest.mock (se hoistea por encima de los
// imports; una constante externa estaría aún sin inicializar) y luego se
// importa el módulo simulado para configurarlos.
jest.mock('../services/push', () => ({
  pushSoportado: jest.fn(),
  activarPush: jest.fn(),
  desactivarPush: jest.fn(),
  leerPreferencia: jest.fn(),
  guardarPreferencia: jest.fn(),
  suscribirRecibidas: jest.fn(),
}))
import * as svc from '../services/push'
const mockSvc = svc as unknown as Record<string, jest.Mock>

beforeEach(() => {
  jest.clearAllMocks()
  mockSvc.pushSoportado.mockReturnValue(true)
  mockSvc.leerPreferencia.mockResolvedValue(true)
  mockSvc.activarPush.mockResolvedValue('activadas')
  mockSvc.desactivarPush.mockResolvedValue(undefined)
  mockSvc.guardarPreferencia.mockResolvedValue(undefined)
  mockSvc.suscribirRecibidas.mockReturnValue(jest.fn())
})

describe('useNotifications', () => {
  it('lee la preferencia guardada al montar', async () => {
    mockSvc.leerPreferencia.mockResolvedValue(false)
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.habilitadas).toBe(false))
  })

  it('en navegador (no soportado) no lee preferencia ni se suscribe', () => {
    mockSvc.pushSoportado.mockReturnValue(false)
    const { result } = renderHook(() => useNotifications())
    expect(result.current.soportado).toBe(false)
    expect(mockSvc.leerPreferencia).not.toHaveBeenCalled()
    expect(mockSvc.suscribirRecibidas).not.toHaveBeenCalled()
  })

  it('se desuscribe de los avisos al desmontar', () => {
    const baja = jest.fn()
    mockSvc.suscribirRecibidas.mockReturnValue(baja)
    const { unmount } = renderHook(() => useNotifications())
    unmount()
    expect(baja).toHaveBeenCalled()
  })

  it('activar(): guarda la preferencia, registra el dispositivo y devuelve true', async () => {
    const { result } = renderHook(() => useNotifications())
    let ok = false
    await act(async () => { ok = await result.current.activar() })
    expect(ok).toBe(true)
    expect(mockSvc.guardarPreferencia).toHaveBeenCalledWith(true)
    expect(mockSvc.activarPush).toHaveBeenCalled()
    expect(result.current.permisoDenegado).toBe(false)
  })

  it('activar() con permiso denegado: devuelve false y marca permisoDenegado', async () => {
    mockSvc.activarPush.mockResolvedValue('denegadas')
    const { result } = renderHook(() => useNotifications())
    let ok = true
    await act(async () => { ok = await result.current.activar() })
    expect(ok).toBe(false)
    expect(result.current.permisoDenegado).toBe(true)
  })

  it('desactivar(): guarda la preferencia en false y quita el token', async () => {
    const { result } = renderHook(() => useNotifications())
    await act(async () => { await result.current.desactivar() })
    expect(mockSvc.guardarPreferencia).toHaveBeenCalledWith(false)
    expect(mockSvc.desactivarPush).toHaveBeenCalled()
    expect(result.current.habilitadas).toBe(false)
  })

  it('sincronizar() registra el dispositivo si la preferencia está activada', async () => {
    const { result } = renderHook(() => useNotifications())
    await act(async () => { await result.current.sincronizar() })
    expect(mockSvc.activarPush).toHaveBeenCalledTimes(1)
  })

  it('sincronizar() NO registra si el usuario apagó las notificaciones', async () => {
    mockSvc.leerPreferencia.mockResolvedValue(false)
    const { result } = renderHook(() => useNotifications())
    await act(async () => { await result.current.sincronizar() })
    expect(mockSvc.activarPush).not.toHaveBeenCalled()
  })

  it('sincronizar() en navegador no hace nada', async () => {
    mockSvc.pushSoportado.mockReturnValue(false)
    const { result } = renderHook(() => useNotifications())
    await act(async () => { await result.current.sincronizar() })
    expect(mockSvc.activarPush).not.toHaveBeenCalled()
  })
})
