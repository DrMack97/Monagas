// TODO: Hook para A/B testing - Player 3 (Fullstack)
// Paso 1: Get variant
// Paso 2: Track experiment
// Paso 3: Conditional rendering
// Prompt de implementación rápida:
// "Crear useABTesting hook con variant, track"
import { useState, useEffect, useCallback } from 'react'
import { abTesting } from '../services/ab-testing'

export function useABTesting(experimentId: string, userId: string) {
  const [variant, setVariant] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Get variant
  useEffect(() => {
    const getVariant = async () => {
      const v = await abTesting.getVariant(experimentId, userId)
      setVariant(v)
      setLoading(false)
    }

    getVariant()
  }, [experimentId, userId])

  // Track view
  const trackView = useCallback(async () => {
    if (variant) {
      await abTesting.trackExperimentView(experimentId)
    }
  }, [experimentId, variant])

  // Track conversion
  const trackConversion = useCallback(async (conversion: string) => {
    if (variant) {
      await abTesting.trackExperimentConversion(experimentId, conversion)
    }
  }, [experimentId, variant])

  // Check if variant
  const isVariant = useCallback((variantId: string) => {
    return variant === variantId
  }, [variant])

  return {
    variant,
    loading,
    trackView,
    trackConversion,
    isVariant,
    isControl: variant === 'control',
    isTreatment: variant !== 'control' && variant !== null
  }
}
