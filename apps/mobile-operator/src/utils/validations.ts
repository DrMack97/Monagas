// TODO: Validaciones de entrada usuario - Player 3 (Fullstack)
// Paso 1: Validar email con regex
// Paso 2: Validar password mínimo 6 caracteres
// Paso 3: Validar rangos numéricos (BPH, BPD, presión)
// Prompt de implementación rápida:
// "Crear validateEmail, validatePassword, validateReading con mensajes error"
// Entregable:
// - validateEmail(email) → { valid: bool, error: string }
// - validatePassword(password) → { valid: bool, error: string }
// - validateReading(type, value) → { valid: bool, error: string }
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    return { valid: false, error: 'Email es requerido' }
  }
  if (!regex.test(email)) {
    return { valid: false, error: 'Email inválido' }
  }
  return { valid: true }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password es requerido' }
  }
  if (password.length < 6) {
    return { valid: false, error: 'Password debe tener mínimo 6 caracteres' }
  }
  return { valid: true }
}

export function validateReading(type: string, value: number): { valid: boolean; error?: string } {
  const ranges = {
    bph: { min: 0, max: 1000 },
    bpd: { min: 0, max: 1000 },
    presion: { min: 0, max: 5000 },
    temperatura: { min: -50, max: 200 }
  }

  const range = ranges[type as keyof typeof ranges]
  if (!range) {
    return { valid: false, error: 'Tipo de lectura inválido' }
  }
  if (value < range.min || value > range.max) {
    return { 
      valid: false, 
      error: `${type} debe estar entre ${range.min} y ${range.max}` 
    }
  }
  return { valid: true }
}

export function validateTank(tank: { numero: number; capacidad: number; nivel: number }): { valid: boolean; error?: string } {
  if (!tank.numero || tank.numero < 1) {
    return { valid: false, error: 'Número de tanque debe ser >= 1' }
  }
  if (!tank.capacidad || tank.capacidad <= 0) {
    return { valid: false, error: 'Capacidad debe ser > 0' }
  }
  if (tank.nivel < 0 || tank.nivel > 100) {
    return { valid: false, error: 'Nivel debe estar entre 0 y 100%' }
  }
  return { valid: true }
}
