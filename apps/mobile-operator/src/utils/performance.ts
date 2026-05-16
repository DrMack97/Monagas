// TODO: Performance utilities mobile - Player 3 (Fullstack)
// Paso 1: Memory tracking
// Paso 2: Render timing
// Paso 3: Bundle size monitoring
// Prompt de implementación rápida:
// "Crear performance utils con memory, render timing"
export function measureRender(componentName: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()
  const duration = end - start

  if (duration > 100) {
    console.warn(`⚠️ ${componentName} render took ${duration.toFixed(2)}ms`)
  }

  return duration
}

export function getMemoryUsage() {
  if ('memory' in performance) {
    const mem = performance.memory as any
    return {
      usedJSHeapSize: mem.usedJSHeapSize,
      totalJSHeapSize: mem.totalJSHeapSize,
      jsHeapSizeLimit: mem.jsHeapSizeLimit,
      usedMB: (mem.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: (mem.totalJSHeapSize / 1024 / 1024).toFixed(2)
    }
  }
  return null
}

// Debounce
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

// Throttle
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Memoize
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = fn(...args)
    cache.set(key, result)
    
    return result
  }) as T
}

// Lazy load
export function lazyLoad<T>(importFn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  
  return importFn().then(module => {
    const end = performance.now()
    console.log(`Loaded in ${end - start.toFixed(2)}ms`)
    return module
  })
}

// Image optimization
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Compression failed'))
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}
