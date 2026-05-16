// TODO: Hook wrapper cálculos @core - Player 3 (Fullstack)
// Paso 1: Importar funciones de @core/calculos
// Paso 2: Envolver con validación de inputs
// Paso 3: Manejar errores de cálculo
// Prompt de implementación rápida:
// "Crear useCalculations que exponga calcularBPH, calcularQg con validación y error handling"
// Entregable:
// - calcularNetos(bph, bpd) → number | error
// - calcularQg(presion, temperatura) → number | error
// - Validar rangos antes de calcular
import { calcularBPH, calcularQg, validarRango } from '@core/calculos'

export function useCalculations() {
  const calcularNetos = (bph: number, bpd: number) => {
    if (!validarRango('bph', bph)) {
      throw new Error('BPH fuera de rango válido')
    }
    if (!validarRango('bpd', bpd)) {
      throw new Error('BPD fuera de rango válido')
    }
    return calcularBPH(bph, bpd)
  }

  const calcularGas = (presion: number, temperatura: number) => {
    if (!validarRango('presion', presion)) {
      throw new Error('Presión fuera de rango válido')
    }
    if (!validarRango('temperatura', temperatura)) {
      throw new Error('Temperatura fuera de rango válido')
    }
    return calcularQg(presion, temperatura)
  }

  return {
    calcularNetos,
    calcularGas
  }
}
