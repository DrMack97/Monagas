// TODO: React Error Boundary - Player 2 (Frontend)
// Paso 1: Crear class component ErrorBoundary
// Paso 2: Capture errors en UI
// Paso 3: Mostrar error UI con retry
// Prompt de implementación rápida:
// "Crear ErrorBoundary con componentDidCatch, Fallback UI"
// Entregable:
// - componentDidCatch → Sentry capture
// - Fallback UI con retry button
import React from 'react'
import * as Sentry from '../services/sentry'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error en UI:', error, errorInfo)
    
    // Sentry capture
    Sentry.captureException(error, {
      extra: {
        errorInfo,
        componentStack: errorInfo.componentStack
      }
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Algo salió mal
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'Ocurrió un error inesperado'}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 mt-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
