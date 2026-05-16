// TODO: Componente Button con variantes - Player 2 (Frontend)
// Paso 1: Button con variants (primary, secondary, danger, ghost)
// Paso 2: Sizes (sm, md, lg)
// Paso 3: Loading state
// Prompt de implementación rápida:
// "Crear Button con variant, size, loading, disabled"
// Entregable:
// - Variants: primary, secondary, danger, ghost
// - Sizes: sm, md, lg
// - Loading spinner interno
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWitdh?: boolean
  icon?: string
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWitdh = false,
  icon,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    ghost: 'bg-transparent text-blue-600 hover:bg-blue-50 disabled:text-blue-300'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={`
        rounded-lg font-medium transition-colors flex items-center justify-center gap-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWitdh ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      )}
      {!loading && icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
