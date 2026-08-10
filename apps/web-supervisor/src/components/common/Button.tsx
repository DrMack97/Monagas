// src/components/common/Button.tsx
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
  secondary: 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}

export default function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`text-sm font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        VARIANT_CLASSES[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  )
}
