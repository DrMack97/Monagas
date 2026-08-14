// TODO: Welcome screen personalizado - Player 2 (Frontend)
// Paso 1: Onboarding slides
// Paso 2: A/B test variant
// Paso 3: Skip/Complete
// Prompt de implementación rápida:
// "Crear WelcomeScreen con onboarding, A/B test"
import React, { useEffect, useState } from 'react';
import type { IconType } from 'react-icons'
import { FiSmartphone, FiMapPin, FiCloud, FiCheckCircle, FiZap, FiHome, FiEdit, FiMap, FiRefreshCw, FiBell } from 'react-icons/fi'
import { useABTesting } from '../hooks/useABTesting'

interface Slide {
  title: string
  description: string
  icon: IconType
}

export default function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const { variant, trackView } = useABTesting('onboarding_v2', 'user-123')
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    trackView()
  }, [trackView])

  const slides: Slide[] = variant === 'variant_a'
    ? [
        { title: '¡Bienvenido!', description: 'Registra evaluaciones fácilmente', icon: FiSmartphone },
        { title: 'GPS Automático', description: 'Ubicación automática', icon: FiMapPin },
        { title: 'Offline First', description: 'Funciona sin internet', icon: FiCloud },
        { title: 'Listo', description: 'Comienza a evaluar pozos', icon: FiZap }
      ]
    : [
        { title: 'Bienvenido a Monagas', description: 'El sistema de evaluación de pozos', icon: FiHome },
        { title: 'Registro Fácil', description: 'Registra BPH, BPD, Netos, Qg', icon: FiEdit },
        { title: 'GPS Automático', description: 'Obtenemos tu ubicación automáticamente', icon: FiMap },
        { title: 'Offline First', description: 'Funciona sin conexión, sincroniza después', icon: FiRefreshCw },
        { title: 'Notificaciones', description: 'Recibe alertas de aprobaciones', icon: FiBell },
        { title: '¡Listo!', description: 'Comienza a evaluar pozos ahora', icon: FiZap }
      ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center p-6">
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 text-white text-sm"
      >
        Saltar
      </button>

      <div className="text-7xl mb-8 text-white" aria-hidden="true">
        {React.createElement(slides[currentSlide].icon)}
      </div>

      <h1 className="text-3xl font-bold text-white mb-4 text-center">
        {slides[currentSlide].title}
      </h1>

      <p className="text-white text-lg mb-12 text-center max-w-sm">
        {slides[currentSlide].description}
      </p>

      <div className="flex gap-2 mb-8">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>

      <button
        onClick={handleNext}
        className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
      >
        {currentSlide === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
      </button>
    </div>
  )
}
