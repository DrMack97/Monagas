// TODO: Cohort analysis utilities - Player 3 (Fullstack)
// Paso 1: Group users by cohort
// Paso 2: Calculate retention
// Paso 3: Visualize cohorts
// Prompt de implementación rápida:
// "Crear cohort utils con group, retention, matrix"
export interface User {
  id: string
  createdAt: Date
  lastActiveAt: Date
  totalEvaluations: number
}

export interface Cohort {
  name: string
  users: User[]
  startDate: Date
  endDate: Date
}

export interface RetentionData {
  period: number
  retained: number
  rate: number
}

// Group users by cohort (weekly)
export function groupByCohortWeekly(users: User[]): Cohort[] {
  const cohorts: Map<string, Cohort> = new Map()

  users.forEach(user => {
    const weekStart = getWeekStart(user.createdAt)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const cohortKey = `${weekStart.toISOString().split('T')[0]}`

    if (!cohorts.has(cohortKey)) {
      cohorts.set(cohortKey, {
        name: `Semana del ${weekStart.toLocaleDateString()}`,
        users: [],
        startDate: weekStart,
        endDate: weekEnd
      })
    }

    cohorts.get(cohortKey)!.users.push(user)
  })

  return Array.from(cohorts.values())
}

// Get week start
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Calculate retention for cohort
export function calculateRetention(
  cohort: Cohort,
  periods: number = 4
): RetentionData[] {
  const initialSize = cohort.users.length
  const retention: RetentionData[] = []

  for (let i = 0; i < periods; i++) {
    const periodStart = new Date(cohort.startDate)
    periodStart.setDate(periodStart.getDate() + (i * 7))
    
    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodEnd.getDate() + 7)

    const retained = cohort.users.filter(user => {
      const lastActive = new Date(user.lastActiveAt)
      return lastActive >= periodStart && lastActive < periodEnd
    }).length

    retention.push({
      period: i,
      retained,
      rate: initialSize > 0 ? (retained / initialSize) * 100 : 0
    })
  }

  return retention
}

// Create retention matrix
export function createRetentionMatrix(cohorts: Cohort[], maxPeriods: number = 4): number[][] {
  return cohorts.map(cohort => {
    const retention = calculateRetention(cohort, maxPeriods)
    return retention.map(r => Math.round(r.rate))
  })
}

// Get cohort metrics
export function getCohortMetrics(cohort: Cohort): {
  size: number
  avgEvaluations: number
  activeUsers: number
  avgSessionDuration: number
} {
  return {
    size: cohort.users.length,
    avgEvaluations: cohort.users.reduce((sum, u) => sum + u.totalEvaluations, 0) / cohort.users.length,
    activeUsers: cohort.users.filter(u => {
      const daysSinceLastActive = (Date.now() - new Date(u.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLastActive < 7
    }).length,
    avgSessionDuration: 0 // Would need session data
  }
}
