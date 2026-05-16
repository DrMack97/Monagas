// TODO: Performance utilities web - Player 3 (Fullstack)
// Paso 1: Web Vitals
// Paso 2: Lazy loading
// Paso 3: Code splitting
// Prompt de implementación rápida:
// "Crear performance utils web con Web Vitals, lazy"
export function measureWebVitals() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // FCP (First Contentful Paint)
    const fcp = performance.getEntriesByType('paint').find(
      entry => entry.name === 'first-contentful-paint'
    )
    
    // LCP (Largest Contentful Paint)
    // FID (First Input Delay)
    // CLS (Cumulative Layout Shift)
    
    return {
      fcp: fcp ? fcp.startTime : 0,
      navigationStart: performance.timing.navigationStart,
      domComplete: performance.timing.domComplete - performance.timing.navigationStart,
      loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
    }
  }
  return null
}

// Report metrics
export function reportMetrics() {
  const metrics = measureWebVitals()
  
  if (metrics) {
    console.log('📊 Performance Metrics:')
    console.log(`  FCP: ${metrics.fcp.toFixed(2)}ms`)
    console.log(`  DOM Complete: ${metrics.domComplete.toFixed(2)}ms`)
    console.log(`  Load Complete: ${metrics.loadComplete.toFixed(2)}ms`)
  }
}

// Prefetch
export function prefetch(url: string) {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = url
  document.head.appendChild(link)
}

// Preload
export function preload(url: string) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = url
  link.as = 'script'
  document.head.appendChild(link)
}

// Cache
export const cache = new Map<string, any>()

export function cached<T>(key: string, fn: () => T): T {
  if (cache.has(key)) {
    return cache.get(key)
  }
  
  const result = fn()
  cache.set(key, result)
  
  return result
}

// Batch requests
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(fn => fn()))
    results.push(...batchResults)
  }
  
  return results
}

// Virtual list (simplified)
export function getVisibleItems<T>(
  items: T[],
  startIndex: number,
  visibleCount: number
): T[] {
  return items.slice(startIndex, startIndex + visibleCount)
}
