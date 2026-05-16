// TODO: Offline sync service avanzado - Player 2 (Frontend)
// Paso 1: Queue de operaciones offline
// Paso 2: Sync automático cuando online
// Paso 3: Conflict resolution
// Prompt de implementación rápida:
// "Crear OfflineSyncService con queue, sync, conflict resolution"
// Entregable:
// - Enqueue operation (create, update, delete)
// - Auto sync cuando online
// - Conflict detection y merge
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, DocumentData } from 'firebase/firestore'
import { db, auth } from '../services/firebase'
import { NetworkInfo } from 'react-native-network-info'

interface OfflineOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  collection: string
  documentId?: string
  data?: DocumentData
  timestamp: number
  retryCount: number
  status: 'pending' | 'syncing' | 'completed' | 'failed'
}

export class OfflineSyncService {
  private static instance: OfflineSyncService
  private queue: OfflineOperation[] = []
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.loadQueue()
    this.startSyncMonitor()
  }

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService()
    }
    return OfflineSyncService.instance
  }

  // Load queue from localStorage
  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem('@offline_queue')
      if (stored) {
        this.queue = JSON.parse(stored)
        console.log(`📦 Loaded ${this.queue.length} offline operations`)
      }
    } catch (error) {
      console.error('Failed to load queue:', error)
    }
  }

  // Save queue to localStorage
  private async saveQueue() {
    try {
      await AsyncStorage.setItem('@offline_queue', JSON.stringify(this.queue))
    } catch (error) {
      console.error('Failed to save queue:', error)
    }
  }

  // Enqueue operation
  async enqueue(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) {
    const op: OfflineOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    }

    this.queue.push(op)
    await this.saveQueue()
    
    console.log(`📥 Enqueued ${operation.type} for ${operation.collection}/${operation.documentId}`)
    
    // Try sync immediately if online
    if (await this.isOnline()) {
      this.sync()
    }

    return op.id
  }

  // Check if online
  private async isOnline(): Promise<boolean> {
    try {
      const connectivity = await NetworkInfo.getNetworkType()
      return connectivity !== 'NONE'
    } catch {
      return false
    }
  }

  // Start sync monitor
  private startSyncMonitor() {
    this.syncInterval = setInterval(async () => {
      if (await this.isOnline() && this.queue.length > 0) {
        await this.sync()
      }
    }, 10000) // Check every 10 seconds
  }

  // Sync queue
  async sync() {
    if (this.isSyncing || this.queue.length === 0) return
    
    this.isSyncing = true
    console.log(`🔄 Starting sync of ${this.queue.length} operations`)

    const failedOps: OfflineOperation[] = []

    for (const op of this.queue) {
      if (op.status === 'completed') continue

      try {
        op.status = 'syncing'
        
        await this.executeOperation(op)
        
        op.status = 'completed'
        console.log(`✅ Synced ${op.type} for ${op.collection}/${op.documentId}`)
      } catch (error) {
        op.retryCount++
        
        if (op.retryCount >= 3) {
          op.status = 'failed'
          console.error(`❌ Failed ${op.type} after 3 retries:`, error)
        } else {
          console.warn(`⚠️ Retry ${op.retryCount}/3 for ${op.type}`)
        }
        
        failedOps.push(op)
      }
    }

    // Remove completed operations
    this.queue = this.queue.filter(op => op.status !== 'completed')
    await this.saveQueue()

    this.isSyncing = false
    console.log(`🔄 Sync completed. ${this.queue.length} operations remaining`)
  }

  // Execute operation
  private async executeOperation(op: OfflineOperation) {
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error('No authenticated user')

    switch (op.type) {
      case 'create':
        if (!op.data) throw new Error('No data for create')
        await addDoc(collection(db, op.collection), {
          ...op.data,
          createdAt: new Date(),
          createdBy: userId
        })
        break

      case 'update':
        if (!op.documentId) throw new Error('No documentId for update')
        await updateDoc(doc(db, op.collection, op.documentId), {
          ...op.data,
          updatedAt: new Date(),
          updatedBy: userId
        })
        break

      case 'delete':
        if (!op.documentId) throw new Error('No documentId for delete')
        await deleteDoc(doc(db, op.collection, op.documentId))
        break
    }
  }

  // Get queue status
  getQueueStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(op => op.status === 'pending').length,
      failed: this.queue.filter(op => op.status === 'failed').length,
      syncing: this.queue.filter(op => op.status === 'syncing').length
    }
  }

  // Clear queue
  async clearQueue() {
    this.queue = []
    await AsyncStorage.removeItem('@offline_queue')
    console.log('🗑️ Queue cleared')
  }

  // Retry failed operations
  async retryFailed() {
    const failed = this.queue.filter(op => op.status === 'failed')
    failed.forEach(op => {
      op.retryCount = 0
      op.status = 'pending'
    })
    await this.saveQueue()
    await this.sync()
  }

  // Cleanup
  dispose() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

// Export singleton
export const offlineSync = OfflineSyncService.getInstance()
