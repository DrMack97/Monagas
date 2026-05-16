// TODO: Utilities para métricas - Player 3 (Fullstack)
// Paso 1: Calcular conversion rates
// Paso 2: Statistical significance
// Paso 3: Confidence intervals
// Prompt de implementación rápida:
// "Crear metrics utils con conversion, significance, CI"
export interface ConversionData {
  users: number
  conversions: number
}

export interface ABTestResult {
  control: ConversionData
  treatment: ConversionData
  controlRate: number
  treatmentRate: number
  lift: number
  significance: number
  confident: boolean
}

// Calculate conversion rate
export function calculateConversionRate(data: ConversionData): number {
  if (data.users === 0) return 0
  return (data.conversions / data.users) * 100
}

// Calculate AB test significance (Z-test)
export function calculateABTestSignificance(
  control: ConversionData,
  treatment: ConversionData
): ABTestResult {
  const controlRate = calculateConversionRate(control)
  const treatmentRate = calculateConversionRate(treatment)
  
  const lift = treatmentRate - controlRate
  
  // Pooled proportion
  const pooled = (control.conversions + treatment.conversions) / (control.users + treatment.users)
  
  // Standard error
  const se = Math.sqrt(
    pooled * (1 - pooled) * (1 / control.users + 1 / treatment.users)
  )
  
  // Z-score
  const zScore = (treatmentRate - controlRate) / (se * 100)
  
  // P-value (approximation)
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))
  
  // Significance (1 - p-value)
  const significance = (1 - pValue) * 100
  
  return {
    control,
    treatment,
    controlRate,
    treatmentRate,
    lift,
    significance,
    confident: significance >= 95
  }
}

// Normal CDF approximation
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * x)
  const d = 0.3989423 * Math.exp(-x * x / 2)
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return 1 - prob
}

// Calculate confidence interval
export function calculateConfidenceInterval(
  conversions: number,
  users: number,
  confidence: number = 0.95
): [number, number] {
  if (users === 0) return [0, 0]
  
  const p = conversions / users
  const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645
  
  const se = Math.sqrt(p * (1 - p) / users)
  const margin = z * se
  
  return [
    Math.max(0, (p - margin) * 100),
    Math.min(100, (p + margin) * 100)
  ]
}

// Calculate retention rate
export function calculateRetention(
  initialUsers: number,
  retainedUsers: number,
  period: number
): number {
  if (initialUsers === 0) return 0
  return (retainedUsers / initialUsers) * 100
}

// Calculate DAU/MAU ratio
export function calculateStickiness(dau: number, mau: number): number {
  if (mau === 0) return 0
  return (dau / mau) * 100
}

// Calculate LTV (simplified)
export function calculateLTV(
  avgRevenue: number,
  churnRate: number,
  grossMargin: number = 0.8
): number {
  if (churnRate === 0) return Infinity
  return (avgRevenue * grossMargin) / churnRate
}
