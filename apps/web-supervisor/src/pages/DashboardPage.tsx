import React, { useState } from 'react';

// ═══════════════════════════════════════════════════
// MOTOR DE CÁLCULO TRADUCIDO
// ═══════════════════════════════════════════════════
const san = (v: any) => parseFloat(String(v || 0).replace(',', '.')) || 0;
const fmt = (n: any, d = 2) => isNaN(n) ? '—' : Number(n).toFixed(d);

function calcTanque(tank: any, ft: any) {
  const mi = san(tank.mi), mf = san(tank.mf), fac = san(ft);
  const th = san(tank.th) || 1, red = san(tank.reductor);
  const ays = san(tank.aysPct), dh = san(tank.dilHora);
  const dif = Math.max(0, mf - mi);
  const bph = Math.max(0, (dif * fac - red) / th);
  const bpd = bph * 24, dilDia = dh * 24;
  const aysBls = bpd * (ays / 100);
  const netos = Math.max(0, bpd - dilDia - aysBls);
  return { dif, bph, bpd, dilDia, aysBls, netos };
}

function calcAGA3(g: any) {
  const pf = san(g.pf), hw = san(g.hw), T = san(g.tGas) || 60;
  const Gg = san(g.gg) || 0.65, d = san(g.diam) || 2;
  const Fb = 218.527 * d * d, Fg = Math.sqrt(1 / Gg), Ftf = Math.sqrt(520 / (T + 460));
  const qg = Math.max(0, (Fb * Fg * Ftf * Math.sqrt(Math.max(0, hw * pf))) / 1000);
  return { Fb: Fb.toFixed(2), Fg: Fg.toFixed(4), Ftf: Ftf.toFixed(4), Fpv: '1.0000', qg };
}

// ═══════════════════════════════════════════════════
// DATOS SEMILLA
// ═══════════════════════════════════════════════════
const POZOS = [
  { id: 'p1', nombre: 'MFB-950', campo: 'Bare', zona: 'FAJA', ft: '2.40', limResorte: '300', limGamma: '60', estado: 'EN_CURSO', netos: 133.10, pCab: '190', pSep: '110', torque: '632', rpm: '160', amp: '67', tanques: [{ id: 't1', nombre: 'Tanque 1', mi: '12.50' }, { id: 't2', nombre: 'Tanque 2', mi: '8.20' }] },
  { id: 'p2', nombre: 'MFB-919', campo: 'Bare', zona: 'FAJA', ft: '2.20', limResorte: '350', limGamma: '70', estado: 'PENDIENTE', netos: 57.05, pCab: '290', pSep: '180', torque: '705', rpm: '70', amp: '73', tanques: [{ id: 't1', nombre: 'Tanque 1', mi: '10.00' }] },
  { id: 'p3', nombre: 'MFB-882', campo: 'Norte', zona: 'MONAGAS', ft: '2.10', limResorte: '280', limGamma: '55', estado: 'OFICIAL', netos: 89.40, pCab: '145', pSep: '90', torque: '# 480', rpm: '120', amp: '58', tanques: [{ id: 't1', nombre: 'Tanque 1', mi: '9.50' }] },
];

const LECT_DEMO = [
  { id: 1, h: 1, ts: '22:00', bph: 6.70, bpd: 160.80, netos: 133.10, pCab: 190, qg: 110.63 },
  { id: 2, h: 2, ts: '23:00', bph: 6.85, bpd: 164.40, netos: 135.80, pCab: 188, qg: 108.20 },
  { id: 3, h: 3, ts: '00:00', bph: 6.62, bpd: 158.88, netos: 131.50, pCab: 192, qg: 112.10 },
  { id: 4, h: 4, ts: '01:00', bph: 6.75, bpd: 162.00, netos: 134.20, pCab: 185, qg: 109.80 },
  { id: 5, h: 5, ts: '02:00', bph: 6.58, bpd: 157.92, netos: 130.90, pCab: 195, qg: 111.40 },
];

export default function DashboardPage() {
  // Estado local simulando el "S" de tu script original
  const [screen, setScreen] = useState<'LOGIN' | 'DASHBOARD' | 'DETALLE_POZO'>('DASHBOARD');
  const [pozoSeleccionado, setPozoSeleccionado] = useState(POZOS[0]);
  const [tab, setTab] = useState<'tanque' | 'gas' | 'mecanico'>('tanque');

  return (
    <>
      {/* SECCIÓN DE ESTILOS EMULADOS DIRECTAMENTE DESDE TU CONFIGURACIÓN */}
      <style>{`
        body { background:#0a0f1a; font-family:'Helvetica Neue',Arial,sans-serif; color:#e2e8f0; margin:0; padding:0; }
        .wrap { max-width:480px; margin:0 auto; padding: 16px; }
        .card { background:#111827; border:1px solid #1f2937; border-radius:16px; padding:18px; margin-bottom:14px }
        .topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; padding-top:8px }
        .pcard { background:#111827; border:1px solid #1f2937; border-radius:16px; padding:16px; cursor:pointer; transition:border-color .15s; text-align:left; width:100%; margin-bottom:12px; color: inherit; }
        .pcard:hover { border-color:rgba(245,158,11,.4); }
        .lbl { font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.08em; margin-bottom:5px; display:block }
        .v { font-family:'Courier New',monospace; font-size:20px; font-weight:700; color:#e2e8f0 }
        .v-hl { color:#f59e0b; font-size:22px }
        .cbox { background:#1a2235; border:1px solid #2d3748; border-radius:10px; padding:12px }
        .g2 { display:grid; grid-template-columns:1fr 1fr; gap:12px }
        .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px }
        .bdg { font-size:10px; font-weight:700; padding:3px 10px; border-radius:99px; display:inline-block }
        .bdg-g { background:rgba(5,150,105,.2); color:#34d399; border:1px solid rgba(52,211,153,.3) }
        .bdg-a { background:rgba(217,119,6,.2); color:#fbbf24; border:1px solid rgba(251,191,36,.3) }
        .tabs { display:flex; gap:4px; background:#111827; border:1px solid #1f2937; border-radius:12px; padding:4px; margin-bottom:14px }
        .tab { flex:1; padding:8px 4px; border-radius:8px; border:none; cursor:pointer; font-size:11px; font-weight:700; background:transparent; color:#6b7280; }
        .tab.on { background:#f59e0b; color:#0a0f1a }
        .btn-back { background:#1f2937; border:1px solid #374151; border-radius:8px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#9ca3af; font-size:18px; }
      `}</style>

      <div className="wrap">
        {/* ═══════════════════════════════════════════════════
            VISTA: DASHBOARD PRINCIPAL
            ═══════════════════════════════════════════════════ */}
        {screen === 'DASHBOARD' && (
          <div>
            <div className="topbar">
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>Well Testing App</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Distrito Monagas — Supervisor</div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                Resumen de Producción Activa
              </div>
              <div className="g2">
                <div className="cbox">
                  <span className="lbl">Total Fiscalizado</span>
                  <div className="v v-hl">279.55 <span style={{ fontSize: '11px', color: '#6b7280' }}>Bpd</span></div>
                </div>
                <div className="cbox">
                  <span className="lbl">Pozos en prueba</span>
                  <div className="v">3</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', marginBottom: '10px', textTransform: 'uppercase' }}>
              Monitoreo de Pozos
            </div>

            {POZOS.map((p) => (
              <button
                key={p.id}
                className="pcard"
                onClick={() => {
                  setPozoSeleccionado(p);
                  setScreen('DETALLE_POZO');
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{p.nombre}</span>
                  <span className={`bdg ${p.estado === 'EN_CURSO' ? 'bdg-g' : 'bdg-a'}`}>
                    {p.estado === 'EN_CURSO' ? '● EN CURSO' : '⏳ PENDIENTE'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                  <div>Campo: <strong>{p.campo}</strong></div>
                  <div>Neto: <strong style={{ color: '#34d399' }}>{p.netos} bpd</strong></div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            VISTA: DETALLE DEL POZO SELECCIONADO
            ═══════════════════════════════════════════════════ */}
        {screen === 'DETALLE_POZO' && (
          <div>
            <div className="topbar">
              <button className="btn-back" onClick={() => setScreen('DASHBOARD')}>←</button>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{pozoSeleccionado.nombre}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{pozoSeleccionado.campo} / {pozoSeleccionado.zona}</div>
              </div>
            </div>

            {/* Selector de Pestañas del Mockup */}
            <div className="tabs">
              <button className={`tab ${tab === 'tanque' ? 'on' : ''}`} onClick={() => setTab('tanque')}>🛢️ Tanques</button>
              <button className={`tab ${tab === 'gas' ? 'on' : ''}`} onClick={() => setTab('gas')}>💨 Gas (AGA3)</button>
              <button className={`tab ${tab === 'mecanico' ? 'on' : ''}`} onClick={() => setTab('mecanico')}>⚙️ Mecánico</button>
            </div>

            {/* Contenido Dinámico de las Pestañas */}
            <div className="card">
              {tab === 'tanque' && (
                <div>
                  <div className="lbl">Monitoreo de Niveles</div>
                  <div className="g2" style={{ marginBottom: '12px' }}>
                    <div className="cbox">
                      <span className="lbl">Presión Cabezal</span>
                      <div className="v">{pozoSeleccionado.pCab} <span style={{ fontSize: '10px' }}>psi</span></div>
                    </div>
                    <div className="cbox">
                      <span className="lbl">Presión Separador</span>
                      <div className="v">{pozoSeleccionado.pSep} <span style={{ fontSize: '10px' }}>psi</span></div>
                    </div>
                  </div>
                  {pozoSeleccionado.tanques.map((t: any, i) => (
                    <div key={t.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>{t.nombre}</div>
                      <div className="g3" style={{ marginTop: '5px' }}>
                        <div><span className="lbl">M. Inicial</span><div className="v" style={{ fontSize: '14px' }}>{t.mi} ft</div></div>
                        <div><span className="lbl">Factor T.</span><div className="v" style={{ fontSize: '14px' }}>{pozoSeleccionado.ft}</div></div>
                        <div><span className="lbl">Calculado</span><div className="v" style={{ fontSize: '14px', color: '#34d399' }}>{pozoSeleccionado.netos} bpd</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'gas' && (
                <div>
                  <div className="lbl">Cálculos de Gas Metano</div>
                  <div className="cbox" style={{ marginBottom: '10px' }}>
                    <span className="lbl">Tasa estimada QG</span>
                    <div className="v v-hl">110.63 <span style={{ fontSize: '11px', color: '#6b7280' }}>MSCFD</span></div>
                  </div>
                  <div className="g2">
                    <div><span className="lbl">Diámetro de Platina</span><div className="v" style={{ fontSize: '16px' }}>2.00 pulg</div></div>
                    <div><span className="lbl">Gravedad Esp.</span><div className="v" style={{ fontSize: '16px' }}>0.65</div></div>
                  </div>
                </div>
              )}

              {tab === 'mecanico' && (
                <div>
                  <div className="lbl">Parámetros del Sistema BCP</div>
                  <div className="g3">
                    <div className="cbox"><span className="lbl">Torque</span><div className="v" style={{ fontSize: '16px' }}>{pozoSeleccionado.torque}</div></div>
                    <div className="cbox"><span className="lbl">RPM</span><div className="v" style={{ fontSize: '16px' }}>{pozoSeleccionado.rpm}</div></div>
                    <div className="cbox"><span className="lbl">Amperaje</span><div className="v" style={{ fontSize: '16px' }}>{pozoSeleccionado.amp} A</div></div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabla de Historial Corta del Mockup */}
            <div className="card">
              <div className="lbl" style={{ marginBottom: '8px' }}>Últimas lecturas fiscales</div>
              <div style={{ fontSize: '11px', fontFamily: 'Courier New, monospace' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #1f2937', paddingBottom: '4px', fontWeight: 700, color: '#6b7280' }}>
                  <div>HORA</div>
                  <div>NETO (BPD)</div>
                  <div>P. CAB (PSI)</div>
                </div>
                {LECT_DEMO.slice(0, 3).map((l) => (
                  <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', paddingTop: '6px', color: '#e2e8f0' }}>
                    <div>{l.ts}</div>
                    <div style={{ color: '#34d399' }}>{l.netos}</div>
                    <div>{l.pCab}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}