// TODO: Gamification service - Player 2 (Frontend)
// Paso 1: XP y leveling
// Paso 2: Achievements
// Paso 3: Leaderboard
// Prompt de implementación rápida:
// "Crear gamification con XP, achievements, leaderboard"
// Entregable:
// - Add XP, get level
// - Unlock achievement
// - Get leaderboard
import AsyncStorage from '@react-native-async-storage/async-storage'

interface UserProgress {
  userId: string
  totalXP: number
  level: number
  achievements: string[]
  streakDays: number
  lastActiveDate: string
}

interface Achievement {
  id: string
  name: string
  description: string
  xp: number
  icon: string
  condition: (progress: UserProgress) => boolean
}

interface LeaderboardEntry {
  userId: string
  nombre: string
  totalXP: number
  level: number
  rank: number
}

export class GamificationService {
  private achievements: Achievement[] = [
    {
      id: 'first_evaluation',
      name: 'Primera Evaluación',
      description: 'Registra tu primera evaluación',
      xp: 50,
      icon: '🎯',
      condition: (progress) => progress.totalXP >= 50
    },
    {
      id: 'streak_7_days',
      name: 'Racha de 7 Días',
      description: 'Activo por 7 días consecutivos',
      xp: 100,
      icon: '🔥',
      condition: (progress) => progress.streakDays >= 7
    },
    {
      id: '100_evaluaciones',
      name: 'Experto',
      description: '100 evaluaciones completadas',
      xp: 500,
      icon: '🏆',
      condition: (progress) => progress.totalXP >= 2000
    },
    {
      id: 'top_supervisor',
      name: 'Top Supervisor',
      description: 'Llega al nivel 10',
      xp: 300,
      icon: '⭐',
      condition: (progress) => progress.level >= 10
    },
    {
      id: 'weekend_warrior',
      name: 'Guerrero de Fin de Semana',
      description: '5 evaluaciones en fin de semana',
      xp: 150,
      icon: '🌟',
      condition: (progress) => progress.totalXP >= 500
    }
  ]

  // Get level from XP
  getLevel(totalXP: number): number {
    // Level formula: level = floor(sqrt(XP / 50))
    return Math.floor(Math.sqrt(totalXP / 50)) + 1
  }

  // Get XP for next level
  getXPForNextLevel(level: number): number {
    return level * level * 50
  }

  // Get XP progress percentage
  getXPProgress(totalXP: number, level: number): number {
    const currentLevelXP = (level - 1) * (level - 1) * 50
    const nextLevelXP = level * level * 50
    const progress = totalXP - currentLevelXP
    const required = nextLevelXP - currentLevelXP
    
    return Math.min(100, (progress / required) * 100)
  }

  // Add XP
  async addXP(userId: string, xp: number): Promise<UserProgress> {
    const progress = await this.getUserProgress(userId)
    
    progress.totalXP += xp
    
    const oldLevel = progress.level
    progress.level = this.getLevel(progress.totalXP)
    
    // Level up
    if (progress.level > oldLevel) {
      console.log(`🎉 Level up! Now level ${progress.level}`)
      progress.totalXP += 50 // Bonus for level up
    }
    
    await this.saveProgress(userId, progress)
    
    // Check achievements
    await this.checkAchievements(userId, progress)
    
    return progress
  }

  // Get user progress
  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      const stored = await AsyncStorage.getItem(`progress_${userId}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
    }

    // Default progress
    return {
      userId,
      totalXP: 0,
      level: 1,
      achievements: [],
      streakDays: 0,
      lastActiveDate: new Date().toISOString().split('T')[0]
    }
  }

  // Save progress
  private async saveProgress(userId: string, progress: UserProgress) {
    try {
      await AsyncStorage.setItem(`progress_${userId}`, JSON.stringify(progress))
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  // Check achievements
  private async checkAchievements(userId: string, progress: UserProgress) {
    for (const achievement of this.achievements) {
      if (!progress.achievements.includes(achievement.id)) {
        if (achievement.condition(progress)) {
          await this.unlockAchievement(userId, achievement)
        }
      }
    }
  }

  // Unlock achievement
  private async unlockAchievement(userId: string, achievement: Achievement) {
    const progress = await this.getUserProgress(userId)
    
    progress.achievements.push(achievement.id)
    
    await this.saveProgress(userId, progress)
    
    console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.xp} XP)`)
    
    // Add XP for achievement
    await this.addXP(userId, achievement.xp)
  }

  // Update streak
  async updateStreak(userId: string): Promise<UserProgress> {
    const progress = await this.getUserProgress(userId)
    
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    if (progress.lastActiveDate === yesterday) {
      // Continue streak
      progress.streakDays++
    } else if (progress.lastActiveDate !== today) {
      // Reset streak (missed a day)
      progress.streakDays = 1
    }
    
    progress.lastActiveDate = today
    
    await this.saveProgress(userId, progress)
    
    return progress
  }

  // Get leaderboard (mock)
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    // This would be from Firestore in production
    const mockUsers: LeaderboardEntry[] = [
      { userId: 'user-1', nombre: 'Juan Pérez', totalXP: 5450, level: 10, rank: 1 },
      { userId: 'user-2', nombre: 'María García', totalXP: 4820, level: 9, rank: 2 },
      { userId: 'user-3', nombre: 'Carlos López', totalXP: 4200, level: 9, rank: 3 },
      { userId: 'user-4', nombre: 'Ana Rodríguez', totalXP: 3850, level: 8, rank: 4 },
      { userId: 'user-5', nombre: 'Luis Martínez', totalXP: 3420, level: 8, rank: 5 },
      { userId: 'user-6', nombre: 'Laura Sánchez', totalXP: 2980, level: 7, rank: 6 },
      { userId: 'user-7', nombre: 'Pedro Ramírez', totalXP: 2650, level: 7, rank: 7 },
      { userId: 'user-8', nombre: 'Lucía Flores', totalXP: 2320, level: 6, rank: 8 },
      { userId: 'user-9', nombre: 'Jorge Torres', totalXP: 1980, level: 6, rank: 9 },
      { userId: 'user-10', nombre: 'Sofía Rivera', totalXP: 1650, level: 5, rank: 10 }
    ]

    return mockUsers.slice(0, limit)
  }

  // Get all achievements
  getAllAchievements(): Achievement[] {
    return this.achievements
  }

  // Get user achievements
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const progress = await this.getUserProgress(userId)
    
    return this.achievements.filter(a => progress.achievements.includes(a.id))
  }

  // Get XP for action
  getXPForAction(action: string): number {
    const xpMap: Record<string, number> = {
      create_evaluation: 10,
      submit_evaluation: 20,
      complete_evaluation: 50,
      onboard_new_user: 100,
      invite_colleague: 150,
      perfect_day: 75,
      weekend_evaluation: 25
    }
    
    return xpMap[action] || 10
  }
}

export const gamification = new GamificationService()
