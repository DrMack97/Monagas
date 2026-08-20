// src/components/OfflineBanner.tsx
//
// Reescrito de cero — la versión anterior estaba en tema claro
// (bg-yellow-100/text-gray-900), nunca pasó por el tema oscuro del
// resto de la app, y dependía de useOfflineSync.ts (cola falsa, ver
// docs/technical/offline-strategy.md). Montado globalmente en
// main.tsx para que se vea en cualquier pantalla, no solo en
// RegistroPage — el Operador puede perder señal en cualquier momento.
import { FiCloudOff } from 'react-icons/fi'
import { useConnectivity } from '../hooks/useConnectivity'

export default function OfflineBanner() {
  const { isOnline } = useConnectivity()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-950/90 border-b border-red-800 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center gap-2 text-sm text-red-300">
        <FiCloudOff aria-hidden="true" />
        <span>Sin conexión — tus lecturas se guardan y se envían solas al reconectar.</span>
      </div>
    </div>
  )
}
