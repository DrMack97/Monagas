// src/components/ErrorBoundary.tsx
//
// Envuelve <App/> en main.tsx — un error de render en cualquier parte
// del árbol muestra este fallback en vez de una pantalla en blanco.
import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // ✅ Reportar error a consola (sin Sentry)
    console.error('ErrorBoundary capturó un error:', error);
    console.error('Información del componente:', errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4 flex justify-center text-amber-500"><FiAlertTriangle aria-hidden="true" /></div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Algo salió mal
            </h2>
            <p className="text-slate-400 mb-6">
              {this.state.error?.message || 'Ocurrió un error inesperado'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2 bg-amber-500 text-slate-950 font-medium rounded-lg hover:bg-amber-400 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                Recargar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
