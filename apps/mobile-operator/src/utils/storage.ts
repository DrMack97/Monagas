// TODO: AsyncStorage utilities - Player 2 (Frontend)
// Paso 1: CRUD operations
// Paso 2: Versioning
// Paso 3: Encryption (optional)
// Prompt de implementación rápida:
// "Crear storage utils con get, set, remove, versioning"
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface StorageItem<T> {
  version: number
  data: T
  timestamp: number
}

// Generic storage helpers
export async function storageSet<T>(key: string, data: T, version: number = 1): Promise<void> {
  const item: StorageItem<T> = {
    version,
    data,
    timestamp: Date.now()
  }
  
  await AsyncStorage.setItem(key, JSON.stringify(item))
}

export async function storageGet<T>(key: string, expectedVersion: number = 1): Promise<T | null> {
  try {
    const stored = await AsyncStorage.getItem(key)
    if (!stored) return null
    
    const item: StorageItem<T> = JSON.parse(stored)
    
    // Check version
    if (item.version < expectedVersion) {
      console.warn(`Storage version mismatch: ${item.version} < ${expectedVersion}`)
      // Migrate or return null
      return null
    }
    
    return item.data
  } catch (error) {
    console.error('Failed to get storage:', error)
    return null
  }
}

export async function storageRemove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key)
}

export async function storageHas(key: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(key)
    return value !== null
  } catch {
    return false
  }
}

// Array storage
export async function storageAddToArray<T>(key: string, item: T, maxItems: number = 100): Promise<void> {
  const array = (await storageGet<T[]>(key)) || []
  array.unshift(item)
  
  // Trim to maxItems
  if (array.length > maxItems) {
    array.splice(maxItems)
  }
  
  await storageSet(key, array)
}

export async function storageGetArray<T>(key: string): Promise<T[]> {
  return (await storageGet<T[]>(key)) || []
}

// Clear storage
export async function clearStorage(): Promise<void> {
  await AsyncStorage.clear()
}

// Get all keys
export async function getAllKeys(): Promise<string[]> {
  return await AsyncStorage.getAllKeys()
}

// Migrate storage
export async function migrateStorage(
  key: string,
  migrations: Record<number, (data: any) => any>
): Promise<void> {
  const stored = await AsyncStorage.getItem(key)
  if (!stored) return
  
  const item: StorageItem<any> = JSON.parse(stored)
  const currentVersion = item.version
  
  // Apply migrations
  let data = item.data
  for (let v = currentVersion + 1; v <= Object.keys(migrations).length; v++) {
    if (migrations[v]) {
      data = migrations[v](data)
    }
  }
  
  await storageSet(key, data, Object.keys(migrations).length + 1)
}
