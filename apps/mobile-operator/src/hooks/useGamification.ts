// TODO: Hook para gamification - Player 2 (Frontend)
// Paso 1: Get progress
// Paso 2: Add XP
// Paso 3: Show achievements
// Prompt de implementación rápida:
// "Crear useGamification hook con progress, addXP, achievements"
import { useState, useEffect, useCallback } from 'react'
import { gamification } from '../services/gamification'

export function useGamification(userId: string) {
  const [progress, setProgress] = useState(gamification.getUserProgress(userId))
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  // Load progress
  useEffect(() => {
    const load = async () => {
      const p = await gamification.getUserProgress(userId)
      setProgress(p)
      
      const lb = await gamification.getLeaderboard(10)
      setLeaderboard(lb)
      
      setLoading(false)
    }

    load()
  }, [userId])

  // Add XP
  const addXP = useCallback(async (xp: number) => {
    const newProgress = await gamification.addXP(userId, xp)
    setProgress(newProgress)
  }, [userId])

  // Update streak
  const updateStreak = useCallback(async () => {
    const newProgress = await gamification.updateStreak(userId)
    setProgress(newProgress)
  }, [userId])

  // Get XP for action
  const getXpForAction = useCallback((action: string) => {
    return gamification.getXPForAction(action)
  }, [])

  // Track action
  const trackAction = useCallback(async (action: string) => {
    const xp = getXpForAction(action)
    await addXP(xp)
  }, [addXP, getXpForAction])

  return {
    progress,
    leaderboard,
    loading,
    addXP,
    updateStreak,
    trackAction,
    level: progress.level,
    totalXP: progress.totalXP,
    xpProgress: gamification.getXPProgress(progress.totalXP, progress.level),
    streakDays: progress.streakDays,
    achievements: progress.achievements.length,
    nextLevelXP: gamification.getXPForNextLevel(progress.level)
  }
}
