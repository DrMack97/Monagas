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
import { calcTanque, calcAGA3 } from '@monagas/core/calculos';
import { validarRango } from '@monagas/core/utils';

export function useCalculations() {
  const calcularNetos = (mi: number, mf: number, ft: number, th: number, reductor: number, aysPct: number, dilDia?: number) => {
    // Validaciones (opcionales)
    if (!validarRango('mi', mi)) throw new Error('Medida Inicial fuera de rango');
    if (!validarRango('mf', mf)) throw new Error('Medida Final fuera de rango');
    if (!validarRango('ft', ft)) throw new Error('Factor Tanque fuera de rango');
    if (!validarRango('th', th)) throw new Error('Tiempo fuera de rango');

    return calcTanque({ mi, mf, ft, th, reductor, aysPct, dilDia });
  };

  const calcularGas = (pf: number, hw: number, tGas: number, gg: number, diam: number, meterRun: number) => {
    // Validaciones (opcionales)
    if (!validarRango('pf', pf)) throw new Error('Presión Estática fuera de rango');
    if (!validarRango('hw', hw)) throw new Error('Diferencial Barton fuera de rango');
    if (!validarRango('tGas', tGas)) throw new Error('Temperatura del gas fuera de rango');

    return calcAGA3({ pf, hw, tGas, gg, diam, meterRun });
  };

  return {
    calcularNetos,
    calcularGas,
  };
}
