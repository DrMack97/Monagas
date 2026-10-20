// src/components/MarcaLogin.tsx
//
// Cabecera de marca de la pantalla de login: logo, nombre y subtítulo. Reproduce el
// diseño del mockup original (docs/design/mockups: logo en marco redondeado con
// resplandor de color, título, subtítulo en mayúsculas y la zona de operación). El
// logo se había perdido del código real; se recuperó de los mockups
// (docs/design/logo/README.md). El panel de supervisión tiene su propia copia con SU paleta
// (violeta/azul); esta usa la del Operador (esmeralda/azul).

interface MarcaLoginProps {
  subtitulo: string
}

export default function MarcaLogin({ subtitulo }: MarcaLoginProps) {
  return (
    <div className="text-center mb-9">
      <div className="relative w-[100px] h-[100px] mx-auto mb-5">
        <div
          aria-hidden="true"
          className="absolute -inset-1 rounded-[28px] blur-[8px]"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,.3), rgba(59,130,246,.2))' }}
        />
        <div
          className="absolute inset-0 rounded-[24px] border border-white/10 overflow-hidden flex items-center justify-center"
          style={{ background: 'linear-gradient(145deg, #0d2137, #0a1f14)' }}
        >
          <img src="/logo.jpg" alt="WillyTank" className="w-[88px] h-[88px] object-cover rounded-[20px]" />
        </div>
      </div>
      <h1 className="text-[26px] font-bold text-slate-100 font-mono tracking-tight">WillyTank</h1>
      <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.12em]">{subtitulo}</p>
      <p className="text-[11px] text-slate-600 mt-1">Faja del Orinoco · Norte de Monagas</p>
    </div>
  )
}
