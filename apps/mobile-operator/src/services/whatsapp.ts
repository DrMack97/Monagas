// TODO: Constructor de mensajes WhatsApp - Player 3 (Fullstack)
// Paso 1: Formatear mensaje con datos estructurados
// Paso 2: Incluir emojis para legibilidad
// Paso 3: Limitar longitud para WhatsApp
// Prompt de implementación rápida:
// "Crear buildWellReport, buildApprovalRequest con formato WhatsApp"
// Entregable:
// - buildWellReport(pozo, evaluation) → string
// - buildApprovalRequest(pozo, supervisor) → string
// - Máximo 4000 caracteres
export function buildWellReport(pozo: any, evaluation: any): string {
  return `
📊 *REPORTE DE POZO*

🏭 *Nombre:* ${pozo.nombre}
📍 *Ubicación:* ${pozo.ubicacion?.lat}, ${pozo.ubicacion?.lng}

📈 *Lecturas:*
• BPH: ${evaluation.bph}
• BPD: ${evaluation.bpd}
• Netos: ${evaluation.netos} Bls/día
• Qg: ${evaluation.qg} MPCGD
• Presión: ${evaluation.presion} psi
• Temp: ${evaluation.temperatura}°C

📅 *Fecha:* ${new Date(evaluation.fecha).toLocaleDateString()}
👤 *Operador:* ${evaluation.operador}

✅ Estado: ${evaluation.estado}
  `.trim()
}

export function buildApprovalRequest(pozo: any, supervisorName: string): string {
  return `
🔔 *SOLICITUD DE APROBACIÓN*

@${supervisorName}, necesitas aprobar:

🏭 *Pozo:* ${pozo.nombre}
📈 *Producción:* ${pozo.produccion} Bls/día
📅 *Fecha:* ${new Date(pozo.ultimaLectura).toLocaleDateString()}

👉 Abre la app para revisar y aprobar/rechazar
  `.trim()
}

export function buildDailySummary(wells: any[]): string {
  const total = wells.reduce((sum, w) => sum + w.produccion, 0)
  const pending = wells.filter(w => w.estado === 'PENDIENTE_SUPERVISOR').length
  
  return `
📊 *RESUMEN DIARIO*

🏭 Pozos totales: ${wells.length}
📈 Producción total: ${total} Bls/día
⏳ Pendientes: ${pending}

👤 ${wells[0]?.operador || 'Operador'}
  `.trim()
}
