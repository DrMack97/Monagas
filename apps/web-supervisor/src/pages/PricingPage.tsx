// TODO: Página de precios - Player 2 (Frontend)
// Paso 1: Free plan
// Paso 2: Premium plan
// Paso 3: Enterprise plan
// Prompt de implementación rápida:
// "Crear PricingPage con 3 plans, features, CTA"
import React from 'react'

interface Plan {
  name: string
  price: string
  period: string
  features: string[]
  highlighted?: boolean
  cta: string
}

export default function PricingPage() {
  const plans: Plan[] = [
    {
      name: 'Free',
      price: '$0',
      period: 'para siempre',
      features: [
        'Evaluaciones ilimitadas',
        '10 reportes/mes',
        'Exportación PDF',
        'Soporte por email',
        'Offline mode básico'
      ],
      cta: 'Comenzar Gratis'
    },
    {
      name: 'Premium',
      price: '$29',
      period: 'por mes',
      features: [
        'Todo de Free',
        'Reportes ilimitados',
        'Análisis avanzado',
        'Exportación Excel',
        'Soporte prioritario',
        'Integraciones API',
        'Usuarios ilimitados',
        'Offline mode completo'
      ],
      highlighted: true,
      cta: 'Comenzar Prueba Gratis'
    },
    {
      name: 'Enterprise',
      price: 'Personalizado',
      period: '',
      features: [
        'Todo de Premium',
        'Implementación custom',
        'SLA garantizado',
        'Soporte 24/7',
        'Onboarding dedicado',
        'Training personalizado',
        'Integraciones custom',
        'Account manager'
      ],
      cta: 'Contactar Ventas'
    }
  ]

  return (
    <div className="p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Planes y Precios</h1>
        <p className="text-xl text-gray-600">
          Elige el plan perfecto para tu equipo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`relative bg-white rounded-2xl shadow-xl p-8 ${
              plan.highlighted 
                ? 'border-4 border-purple-500 scale-105' 
                : 'border border-gray-200'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Más Popular
              </div>
            )}

            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              {plan.period && (
                <p className="text-gray-600">{plan.period}</p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                plan.highlighted
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h2>
        
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">¿Puedo cambiar de plan después?</h3>
            <p className="text-gray-600">Sí, puedes cambiar de plan en cualquier momento desde tu configuración.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">¿Hay descuento por pago anual?</h3>
            <p className="text-gray-600">Sí, recibe 20% de descuento con pago anual en Premium.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">¿Qué pasa después de la prueba?</h3>
            <p className="text-gray-600">Puedes continuar con el plan Free o suscribirte a Premium.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
