// TODO: Security utilities para mobile - Player 3 (Fullstack)
// Paso 1: Input sanitization
// Paso 2: Output encoding
// Paso 3: Secure storage
// Prompt de implementación rápida:
// "Crear security utils con sanitize, encode, secure storage"
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  return input
    .trim()
    .replace(/[<>\"'&]/g, '')
    .replace(/\s+/g, ' ')
    .substring(0, 500)
}

export function encodeOutput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Validate email
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Validate password
export function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 128
}

// Hash for local storage (NOT secure for production, use Firebase Auth)
export function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString()
}

// Mask sensitive data
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return `${local.charAt(0)}***@${domain}`
}

export function maskPhone(phone: string): string {
  return phone.replace(/\d/g, '*').slice(0, -4) + phone.slice(-4)
}

// Validate local data
export function validateLocalData(data: any): boolean {
  // Check for required fields
  if (!data || typeof data !== 'object') return false
  
  // Check for corrupted data
  try {
    JSON.stringify(data)
    return true
  } catch {
    return false
  }
}
