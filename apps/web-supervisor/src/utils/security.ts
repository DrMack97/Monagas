// TODO: Security utilities para web - Player 3 (Fullstack)
// Paso 1: XSS protection
// Paso 2: CSRF protection
// Paso 3: Content Security Policy
// Prompt de implementación rápida:
// "Crear security utils web con XSS, CSRF, CSP"
export function sanitizeHTML(input: string): string {
  const temp = document.createElement('div')
  temp.textContent = input
  return temp.innerHTML
}

export function escapeXML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Generate CSRF token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Validate CSRF token
export function validateCSRFToken(token: string, expected: string): boolean {
  return token === expected && token.length === 64
}

// CSP headers (should be set in server, but useful for validation)
export const CONTENT_SECURITY_POLICY = `
  default-src 'self'
  script-src 'self' 'unsafe-inline' https://www.gstatic.com
  style-src 'self' 'unsafe-inline'
  img-src 'self' data: https://*
  font-src 'self' data:
  connect-src 'self' https://firestore.googleapis.com
  frame-ancestors 'self'
  form-action 'self'
`

// Sanitize file upload
export function validateFileUpload(file: File, allowedTypes: string[], maxSizeMB: number): {
  valid: boolean
  error?: string
} {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido' }
  }
  
  // Check file size
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    return { valid: false, error: `Archivo demasiado grande. Máximo ${maxSizeMB}MB` }
  }
  
  return { valid: true }
}
