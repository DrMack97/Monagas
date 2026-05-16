// TODO: A/B Testing service - Player 3 (Fullstack)
// Paso 1: Assign experiments
// Paso 2: Get variant
// Paso 3: Track experiment
// Prompt de implementación rápida:
// "Crear A/B Testing con experiments, variants, tracking"
// Entregable:
// - getExperiment(experimentId) → variant
// - isVariant(experimentId, variant) → boolean
// - trackExperiment(experimentId)
interface Experiment {
  id: string
  name: string
  variants: Array<{
    id: string
    name: string
    percentage: number
  }>
  startDate: Date
  endDate: Date
  active: boolean
}

interface UserAssignment {
  experimentId: string
  variantId: string
  assignedAt: Date
}

export class ABTestingService {
  private experiments: Map<string, Experiment> = new Map()
  private assignments: Map<string, UserAssignment> = new Map()

  constructor() {
    this.loadExperiments()
    this.loadAssignments()
  }

  // Load experiments from config
  private loadExperiments() {
    const defaultExperiments: Experiment[] = [
      {
        id: 'onboarding_v2',
        name: 'Onboarding V2',
        variants: [
          { id: 'control', name: 'Original', percentage: 50 },
          { id: 'variant_a', name: 'Simplified', percentage: 50 }
        ],
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-06-01'),
        active: true
      },
      {
        id: 'button_color',
        name: 'Button Color',
        variants: [
          { id: 'blue', name: 'Blue', percentage: 50 },
          { id: 'green', name: 'Green', percentage: 50 }
        ],
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-31'),
        active: true
      },
      {
        id: 'evaluation_form',
        name: 'Evaluation Form Layout',
        variants: [
          { id: 'vertical', name: 'Vertical', percentage: 33 },
          { id: 'horizontal', name: 'Horizontal', percentage: 33 },
          { id: 'compact', name: 'Compact', percentage: 34 }
        ],
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-06-15'),
        active: true
      }
    ]

    defaultExperiments.forEach(exp => {
      this.experiments.set(exp.id, exp)
    })
  }

  // Load user assignments from storage
  private loadAssignments() {
    // This would be loaded from AsyncStorage
    // Placeholder
  }

  // Save assignment
  private async saveAssignment(assignment: UserAssignment) {
    this.assignments.set(assignment.experimentId, assignment)
    // Save to AsyncStorage
  }

  // Get experiment
  getExperiment(experimentId: string): Experiment | null {
    const experiment = this.experiments.get(experimentId)
    
    if (!experiment) {
      console.warn(`Experiment ${experimentId} not found`)
      return null
    }

    if (!experiment.active) {
      console.warn(`Experiment ${experimentId} is not active`)
      return null
    }

    if (new Date() < experiment.startDate || new Date() > experiment.endDate) {
      console.warn(`Experiment ${experimentId} is not in date range`)
      return null
    }

    return experiment
  }

  // Get variant for user
  async getVariant(experimentId: string, userId: string): Promise<string | null> {
    const experiment = this.getExperiment(experimentId)
    if (!experiment) return null

    // Check if already assigned
    const existing = this.assignments.get(experimentId)
    if (existing) {
      return existing.variantId
    }

    // Assign variant based on percentage
    const random = Math.random() * 100
    let cumulative = 0

    for (const variant of experiment.variants) {
      cumulative += variant.percentage
      if (random <= cumulative) {
        // Save assignment
        const assignment: UserAssignment = {
          experimentId,
          variantId: variant.id,
          assignedAt: new Date()
        }
        await this.saveAssignment(assignment)

        console.log(`✅ Assigned ${experimentId}: ${variant.id}`)
        return variant.id
      }
    }

    // Fallback to first variant
    return experiment.variants[0].id
  }

  // Check if user is in variant
  async isVariant(experimentId: string, variantId: string): Promise<boolean> {
    const variant = await this.getVariant(experimentId, 'user-123')
    return variant === variantId
  }

  // Track experiment view
  async trackExperimentView(experimentId: string) {
    const variant = await this.getVariant(experimentId, 'user-123')
    if (variant) {
      console.log(`📊 Experiment view: ${experimentId} - ${variant}`)
      // Track in analytics
    }
  }

  // Track experiment conversion
  async trackExperimentConversion(experimentId: string, conversion: string) {
    const variant = await this.getVariant(experimentId, 'user-123')
    if (variant) {
      console.log(`📊 Experiment conversion: ${experimentId} - ${variant} - ${conversion}`)
      // Track in analytics
    }
  }

  // Get all active experiments
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(exp => exp.active)
  }

  // Clear assignments (for testing)
  clearAssignments() {
    this.assignments.clear()
  }
}

export const abTesting = new ABTestingService()
