// TODO: Componente Input con validación - Player 2 (Frontend)
// Paso 1: Input con label
// Paso 2: Mostrar error si existe
// Paso 3: Icono opcional
// Prompt de implementación rápida:
// "Crear Input con label, error, icon, helperText"
// Entregable:
// - Input con label arriba
// - Error en rojo abajo
// - Icono opcional a la izquierda
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  icon?: string
  leftIcon?: boolean
}

export default function Input({
  label,
  error,
  helperText,
  icon,
  leftIcon = true,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <div className="relative">
        {icon && leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          className={`
            w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
            ${icon && leftIcon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        
        {icon && !leftIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}
