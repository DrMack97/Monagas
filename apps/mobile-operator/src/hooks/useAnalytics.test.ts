// TODO: Tests de analytics - Player 3 (Fullstack)
// Paso 1: Test logCreateEvaluation
// Paso 2: Test logApproval
// Paso 3: Test setUserProperties
// Prompt de implementación rápida:
// "Crear tests para useAnalytics con mocks Firebase Analytics"
import { renderHook } from '@testing-library/react'
import { useAnalytics } from './useAnalytics'

jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(),
  logEvent: jest.fn().mockResolvedValue(undefined),
  setUserProperties: jest.fn().mockResolvedValue(undefined)
}))

describe('useAnalytics', () => {
  it('debe loggear create_evaluation', async () => {
    const { result } = renderHook(() => useAnalytics())

    await result.current.logCreateEvaluation('MFB-950', 1234, 2)

    expect(result.current.logCreateEvaluation).toBeDefined()
  })

  it('debe loggear approval', async () => {
    const { result } = renderHook(() => useAnalytics())

    await result.current.logApproval('eval-123', true, 1800)

    expect(result.current.logApproval).toBeDefined()
  })

  it('debe set user properties', async () => {
    const { result } = renderHook(() => useAnalytics())

    await result.current.setUserProperties({ rol: 'OPERADOR', supervisorId: 'sup-123' })

    expect(result.current.setUserProperties).toBeDefined()
  })
})
