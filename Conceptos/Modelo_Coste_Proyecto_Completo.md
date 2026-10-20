# Modelo de Coste por Archivo — Proyecto Completo (Fases 0→4)
---
## Parte 1 — La Fórmula, Simple

Hay una sola pregunta que responde el modelo:

> **¿Cuánto vale el trabajo de un dev en un archivo específico?**

La respuesta en 3 pasos:

```
1. Mide cuántas líneas escribió el dev en ese archivo   →  LOC_archivo
2. Suma todas las líneas del dev en esa fase            →  LOC_dev_total
3. Multiplica su coste en la fase por esa proporción    →  Pago

Pago = Coste_dev_en_fase × (LOC_archivo / LOC_dev_total_en_fase)
```
**Ejemplo real (P2, Fase 1):**
- P2 cobra $8,800 en Fase 1
- P2 escribe 2,030 líneas en Fase 1
- `RegistroPage.tsx` tiene 480 líneas
```
Pago = $8,800 × (480 / 2,030) = $8,800 × 23.6% = $2,080
```

Eso es lo que gana P2 por iterar `RegistroPage.tsx` con éxito en Fase 1.

---

### Si un archivo es más difícil, pondera por complejidad

Multiplica las LOC por un factor antes de calcular:

| Complejidad | Factor |
|:---:|:---:|
| B — Baja (config, barrels, docs simples) | 1.0× |
| M — Media (hooks, services, páginas normales) | 1.5× |
| A — Alta (motor de cálculo, reglas Firestore, páginas complejas) | 2.5× |

```
LOC_pond = LOC × Factor
Pago_pond = Coste_dev × (LOC_pond_archivo / LOC_pond_dev_total)
```

La suma de pagos sigue siendo igual al coste total del dev. Solo cambia cómo se distribuye entre archivos fáciles y difíciles.

---

## Parte 2 — Presupuesto Total del Proyecto

### Tarifas por Rol

| Player | Rol | Tarifa/h |
|---|---|:---:|
| P1 | Backend | $60/h |
| P2 | Frontend | $55/h |
| P3 | DevOps | $70/h |
| P4 | PM | $50/h |

### Horas y Coste por Fase (13 semanas totales)

| Fase | Semanas | P1 | P2 | P3 | P4 | **Total** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| F0 — Fundaciones | 1-2 | $4,800 | $4,400 | $5,600 | $2,000 | **$16,800** |
| F1 — App Operador | 3-6 | $9,600 | $8,800 | $11,200 | $4,000 | **$33,600** |
| F2 — Panel Supervisor | 7-9 | $7,200 | $6,600 | $8,400 | $3,000 | **$25,200** |
| F3 — Reportes | 10-11 | $2,400 | $4,400 | $5,600 | $2,000 | **$14,400** |
| F4 — Hardening | 12-13 | $2,400 | $2,200 | $5,600 | $2,000 | **$12,200** |
| **TOTAL** | **13 sem** | **$26,400** | **$26,400** | **$36,400** | **$13,000** | **$102,200** |

*P4 trabaja media jornada (80h en F1, 40h en el resto). Los demás trabajan jornada completa.*

---

## Parte 3 — Inventario Completo de Archivos (149 archivos / 17,515 LOC)

### Cómo leer la tabla
- **LOC**: líneas estimadas al terminar el archivo
- **C**: complejidad (B/M/A)
- **$/iter**: lo que gana el dev cuando itera ese archivo con éxito *(pago simple, sin ponderar)*

---

### 🔵 FASE 0 — Fundaciones (Sem 1-2) · 4,595 LOC · $16,800

#### P1 Backend · $4,800 en F0 · 580 LOC en F0 · **$8.28/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `packages/core/src/types/database.ts` | 160 | A | $1,324 |
| `firebase/firestore.emulator.rules` | 180 | M | $1,490 |
| `packages/core/src/types/ui.ts` | 90 | M | $745 |
| `packages/core/src/types/api.ts` | 80 | M | $662 |
| `firebase/functions/src/types.ts` | 80 | M | $662 |
| `firebase/functions/src/utils/validators.ts` | 60 | M | $497 |
| `firebase/functions/src/index.ts` | 50 | B | $414 |
| `packages/core/src/constants/tank-factors.ts` | 40 | B | $331 |
| `firebase/functions/src/utils/logger.ts` | 40 | B | $331 |
| `packages/core/src/constants/states.ts` | 35 | B | $290 |
| `firebase/functions/src/utils/errors.ts` | 35 | B | $290 |
| `packages/core/src/constants/limits.ts` | 30 | B | $248 |
| `packages/core/src/constants/roles.ts` | 30 | B | $248 |
| `firebase/.firebaserc` | 25 | B | $207 |
| `packages/core/src/types/index.ts` | 15 | B | $124 |
| `packages/core/src/constants/index.ts` | 15 | B | $124 |
| **Total P1 / F0** | **580** | | **$4,800** |

#### P3 DevOps · $5,600 en F0 · 1,615 LOC en F0 · **$3.47/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `packages/core/src/calculos/tanque.ts` | 200 | A | $694 |
| `packages/core/src/calculos/aga3.ts` | 180 | A | $624 |
| `packages/core/__tests__/tanque.test.ts` | 160 | A | $555 |
| `packages/core/__tests__/aga3.test.ts` | 130 | M | $451 |
| `packages/core/__tests__/validators.test.ts` | 100 | M | $347 |
| `package.json` (root) | 100 | M | $347 |
| `tsconfig.base.json` | 80 | M | $277 |
| `eslint.config.js` | 80 | M | $277 |
| `packages/core/src/utils/validators.ts` | 80 | M | $277 |
| `packages/core/src/calculos/validators.ts` | 80 | M | $277 |
| `apps/mobile-operator/vite.config.ts` | 60 | M | $208 |
| `apps/web-supervisor/vite.config.ts` | 60 | M | $208 |
| `packages/core/src/utils/formatters.ts` | 60 | B | $208 |
| `firebase/firebase.json` | 50 | B | $173 |
| `apps/mobile-operator/package.json` | 40 | B | $139 |
| `apps/web-supervisor/package.json` | 40 | B | $139 |
| `firebase/functions/package.json` | 40 | B | $139 |
| `apps/mobile-operator/capacitor.config.ts` | 40 | B | $139 |
| `apps/mobile-operator/tsconfig.json` | 35 | B | $121 |
| `apps/web-supervisor/tsconfig.json` | 35 | B | $121 |
| `firebase/functions/.env.example` | 25 | B | $87 |
| `firebase/functions/tsconfig.json` | 25 | B | $87 |
| `packages/core/tsconfig.json` | 25 | B | $87 |
| `.env.example` | 35 | B | $121 |
| `firebase/functions/.eslintrc.json` | 30 | B | $104 |
| `packages/core/package.json` | 30 | B | $104 |
| `.gitignore` | 50 | B | $173 |
| `.prettierrc` | 20 | B | $69 |
| `pnpm-workspace.yaml` | 20 | B | $69 |
| `packages/core/index.ts` | 20 | B | $69 |
| `packages/core/src/utils/index.ts` | 15 | B | $52 |
| `packages/core/src/calculos/index.ts` | 15 | B | $52 |
| `packages/core/src/index.ts` | 20 | B | $69 |
| **Total P3 / F0** | **1,615** | | **$5,600** |

#### P4 PM · $2,000 en F0 · 1,450 LOC en F0 · **$1.38/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `docs/business/FRD.md` | 300 | A | $414 |
| `docs/business/TRD.md` | 250 | A | $345 |
| `docs/technical/firestore-schema.md` | 250 | A | $345 |
| `docs/technical/architecture.md` | 200 | A | $276 |
| `README.md` | 200 | M | $276 |
| `docs/business/glossary.md` | 150 | B | $207 |
| `docs/decisions/001-use-firestore-offline-persistence.md` | 100 | B | $138 |
| `docs/decisions/002-monorepo-structure.md` | 100 | B | $138 |
| `docs/decisions/003-capacitor-over-native.md` | 100 | B | $138 |
| **Total P4 / F0** | **1,450** | | **$2,000** |

*P2 no tiene archivos en F0. Su trabajo comienza en F1.*

---

### 🟡 FASE 1 — App Operador (Sem 3-6) · 6,870 LOC · $33,600

#### P1 Backend · $9,600 en F1 · 520 LOC en F1 · **$18.46/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `firebase/firestore.rules` | 220 | A | $4,062 |
| `firebase/functions/src/auth/assignRole.ts` | 130 | A | $2,400 |
| `firebase/functions/src/auth/setupUser.ts` | 90 | M | $1,662 |
| `firebase/storage.rules` | 80 | M | $1,477 |
| **Total P1 / F1** | **520** | | **$9,600** |

#### P2 Frontend · $8,800 en F1 · 2,030 LOC en F1 · **$4.33/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `apps/mobile-operator/src/pages/RegistroPage.tsx` | 480 | A | $2,080 |
| `apps/mobile-operator/src/pages/NuevoPozoPage.tsx` | 310 | A | $1,343 |
| `apps/mobile-operator/src/pages/DashboardPage.tsx` | 260 | M | $1,127 |
| `apps/mobile-operator/src/pages/TablaPage.tsx` | 280 | M | $1,213 |
| `apps/mobile-operator/src/pages/ReportePage.tsx` | 210 | M | $910 |
| `apps/mobile-operator/src/pages/LoginPage.tsx` | 190 | M | $823 |
| `apps/mobile-operator/src/components/TankInputSection.tsx` | 190 | A | $823 |
| `apps/mobile-operator/src/components/PozoCard.tsx` | 150 | M | $650 |
| `apps/mobile-operator/src/styles/globals.css` | 150 | M | $650 |
| `apps/mobile-operator/src/components/LoginForm.tsx` | 120 | B | $520 |
| `apps/mobile-operator/src/App.tsx` | 120 | M | $520 |
| `apps/mobile-operator/src/components/AlertBanner.tsx` | 80 | B | $347 |
| `apps/mobile-operator/src/styles/tailwind.css` | 40 | B | $173 |
| **Total P2 / F1** | **2,030** | | **$8,800** |

#### P3 DevOps · $11,200 en F1 · 2,040 LOC en F1 · **$5.49/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `apps/mobile-operator/src/hooks/useFirestore.ts` | 260 | A | $1,427 |
| `apps/mobile-operator/src/services/storage.ts` | 210 | A | $1,153 |
| `apps/mobile-operator/src/hooks/useOfflineSync.ts` | 220 | A | $1,208 |
| `apps/mobile-operator/src/services/firebase.ts` | 180 | M | $988 |
| `apps/mobile-operator/src/hooks/useCalculations.ts` | 150 | M | $824 |
| `firebase/functions/tests/assignRole.test.ts` | 130 | M | $714 |
| `apps/mobile-operator/src/components/__tests__/TankInputSection.test.tsx` | 150 | M | $824 |
| `apps/mobile-operator/src/components/__tests__/LoginForm.test.tsx` | 120 | M | $659 |
| `apps/mobile-operator/src/hooks/useAuthRole.ts` | 120 | M | $659 |
| `apps/mobile-operator/src/services/native.ts` | 100 | M | $549 |
| `.github/workflows/deploy.yml` | 90 | A | $494 |
| `apps/mobile-operator/src/utils/validations.ts` | 80 | M | $440 |
| `.github/workflows/build.yml` | 70 | M | $384 |
| `apps/mobile-operator/src/utils/formatters.ts` | 70 | B | $384 |
| `apps/mobile-operator/src/hooks/useWhatsApp.ts` | 80 | B | $440 |
| `.github/workflows/test.yml` | 60 | M | $329 |
| `apps/mobile-operator/src/services/whatsapp.ts` | 60 | B | $329 |
| `apps/mobile-operator/src/types/local.ts` | 60 | B | $329 |
| `.github/CODEOWNERS` | 30 | B | $165 |
| **Total P3 / F1** | **2,040** | | **$11,200** |

#### P4 PM · $4,000 en F1 · 1,530 LOC en F1 · **$2.61/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `docs/manuals/operator-guide.md` | 300 | M | $784 |
| `docs/business/use-cases.md` | 200 | M | $523 |
| `docs/business/business-rules.md` | 200 | M | $523 |
| `docs/technical/api.md` | 200 | M | $523 |
| `docs/technical/offline-strategy.md` | 180 | M | $471 |
| `docs/technical/security.md` | 150 | M | $392 |
| `docs/manuals/admin-setup.md` | 200 | M | $523 |
| `apps/mobile-operator/README.md` | 100 | B | $261 |
| **Total P4 / F1** | **1,530** | | **$4,000** |

---

### 🟠 FASE 2 — Panel Supervisor (Sem 7-9) · 5,380 LOC · $25,200

#### P1 Backend · $7,200 en F2 · 440 LOC en F2 · **$16.36/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `firebase/functions/src/approvals/onEvalSubmit.ts` | 120 | A | $1,964 |
| `firebase/functions/src/approvals/onApprove.ts` | 100 | M | $1,636 |
| `firebase/functions/src/approvals/onReject.ts` | 80 | M | $1,309 |
| `firebase/functions/src/notifications/notifyMgr.ts` | 70 | B | $1,145 |
| `firebase/functions/src/notifications/notifyOperator.ts` | 70 | B | $1,145 |
| **Total P1 / F2** | **440** | | **$7,200** |

#### P2 Frontend · $6,600 en F2 · 3,160 LOC en F2 · **$2.09/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `apps/web-supervisor/src/pages/DashboardPage.tsx` | 300 | A | $627 |
| `apps/web-supervisor/src/pages/NewWellPage.tsx` | 290 | A | $606 |
| `apps/web-supervisor/src/pages/WellDetailPage.tsx` | 280 | A | $585 |
| `apps/web-supervisor/src/pages/ApprovalQueuePage.tsx` | 220 | M | $460 |
| `apps/web-supervisor/src/components/tables/EvaluationTable.tsx` | 200 | A | $418 |
| `apps/web-supervisor/src/pages/UsersPage.tsx` | 180 | M | $376 |
| `apps/web-supervisor/src/components/charts/ProductionTrend.tsx` | 180 | A | $376 |
| `apps/web-supervisor/src/components/charts/WellComparison.tsx` | 160 | A | $335 |
| `apps/web-supervisor/src/pages/LoginPage.tsx` | 160 | M | $335 |
| `apps/web-supervisor/src/components/charts/GasVsLiquids.tsx` | 140 | M | $293 |
| `apps/web-supervisor/src/components/common/Sidebar.tsx` | 140 | M | $293 |
| `apps/web-supervisor/src/components/tables/UserTable.tsx` | 150 | M | $314 |
| `apps/web-supervisor/src/components/tables/columns.tsx` | 120 | M | $251 |
| `apps/web-supervisor/src/styles/globals.css` | 120 | M | $251 |
| `apps/web-supervisor/src/components/common/Header.tsx` | 110 | M | $230 |
| `apps/web-supervisor/src/App.tsx` | 100 | M | $209 |
| `apps/web-supervisor/src/components/common/KPICard.tsx` | 90 | B | $188 |
| `docs/design/colors.md` | 80 | B | $167 |
| `docs/design/typography.md` | 60 | B | $125 |
| `docs/design/icons.md` | 50 | B | $104 |
| `apps/web-supervisor/src/styles/tailwind.css` | 40 | B | $84 |
| **Total P2 / F2** | **3,160** | | **$6,600** |

#### P3 DevOps · $8,400 en F2 · 1,370 LOC en F2 · **$6.13/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `firebase/functions/tests/approvals.test.ts` | 150 | M | $920 |
| `apps/web-supervisor/src/services/firebase.ts` | 180 | M | $1,104 |
| `apps/web-supervisor/src/services/realtime.ts` | 150 | M | $920 |
| `apps/web-supervisor/src/hooks/useApprovals.ts` | 140 | M | $859 |
| `apps/web-supervisor/src/hooks/useWells.ts` | 130 | M | $798 |
| `apps/web-supervisor/src/components/tables/__tests__/EvaluationTable.test.tsx` | 130 | M | $798 |
| `apps/web-supervisor/src/hooks/useAuthRole.ts` | 120 | M | $736 |
| `apps/web-supervisor/src/components/__tests__/ProductionTrend.test.tsx` | 100 | M | $613 |
| `apps/web-supervisor/src/components/common/__tests__/KPICard.test.tsx` | 80 | B | $491 |
| `apps/web-supervisor/src/utils/validations.ts` | 70 | B | $429 |
| `apps/web-supervisor/src/utils/formatters.ts` | 60 | B | $368 |
| `apps/web-supervisor/src/types/local.ts` | 60 | B | $368 |
| **Total P3 / F2** | **1,370** | | **$8,400** |

#### P4 PM · $3,000 en F2 · 400 LOC en F2 · **$7.50/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `docs/manuals/supervisor-guide.md` | 250 | M | $1,875 |
| `apps/web-supervisor/README.md` | 100 | B | $750 |
| `docs/design/mockups/v4-supervisor-dashboard.html` | 50 | B | $375 |
| **Total P4 / F2** | **400** | | **$3,000** |

---

### 🟢 FASE 3 — Reportes / Exportación (Sem 10-11) · 570 LOC · $14,400

#### P3 DevOps · $5,600 en F3 · 350 LOC en F3 · **$16.00/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `apps/web-supervisor/src/services/export.ts` | 240 | A | $3,840 |
| `apps/web-supervisor/src/hooks/useExport.ts` | 110 | M | $1,760 |
| **Total P3 / F3** | **350** | | **$5,600** |

#### P4 PM · $2,000 en F3 · 220 LOC en F3 · **$9.09/LOC**

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `packages/core/README.md` | 120 | B | $1,091 |
| `firebase/functions/README.md` | 100 | B | $909 |
| **Total P4 / F3** | **220** | | **$2,000** |

*P1 y P2 tienen trabajo en F3 (PDF/XLSX integrado en el motor), pero no hay archivos nuevos — es iteración sobre archivos existentes de F1/F2. El coste P1/P2 de F3 ($2,400 y $4,400) se distribuye proporcionalmente sobre sus archivos de F1/F2 que sean modificados.*

---

### 🔴 FASE 4 — Hardening / Deploy (Sem 12-13) · 100 LOC nuevas · $12,200

La mayoría del trabajo en F4 es iteración y corrección sobre archivos existentes, no archivos nuevos.

#### P4 PM · $2,000 en F4 · 100 LOC en F4

| Archivo | LOC | C | $/iter |
|---|:---:|:---:|:---:|
| `docs/manuals/operator-guide.md` (update) | 50 | B | $1,000 |
| `docs/manuals/supervisor-guide.md` (update) | 50 | B | $1,000 |
| **Total P4 / F4** | **100** | | **$2,000** |

*P1 ($2,400), P2 ($2,200), P3 ($5,600) en F4 invierten en testing de campo, fixes de UX, firma del APK y monitoreo. Esas horas se atribuyen como iteraciones sobre archivos existentes — el sistema de coste las registra como re-iteraciones de los archivos originales.*

---

## Parte 4 — Resumen Ejecutivo

### LOC y Valor Total por Player

| Player | Rol | Archivos | LOC | % proyecto | Coste total | $/LOC media |
|---|---|:---:|:---:|:---:|:---:|:---:|
| P1 | Backend | 25 | 1,925 | 11% | $26,400 | $13.71 |
| P2 | Frontend | 34 | 5,750 | 33% | $26,400 | $4.59 |
| P3 | DevOps | 66 | 5,940 | 34% | $36,400 | $6.13 |
| P4 | PM | 24 | 3,900 | 22% | $13,000 | $3.33 |
| **Total** | | **149** | **17,515** | **100%** | **$102,200** | **$5.84** |

### $/LOC por Fase (referencia rápida)

| Fase | Total LOC | Total $ | $/LOC |
|---|:---:|:---:|:---:|
| F0 — Fundaciones | 4,595 | $16,800 | $3.66 |
| F1 — App Operador | 6,870 | $33,600 | $4.89 |
| F2 — Panel Supervisor | 5,380 | $25,200 | $4.68 |
| F3 — Reportes | 570 | $14,400 | $25.26 |
| F4 — Hardening | 100 | $12,200 | $122.00 |
| **Total** | **17,515** | **$102,200** | **$5.84** |

> **Por qué sube el $/LOC en F3 y F4:** hay menos archivos nuevos pero el mismo equipo a jornada completa. El coste refleja que en esas fases el trabajo es mayormente pruebas, integración y corrección — trabajo real que no produce muchas líneas nuevas pero que es igual de necesario.

---

## Parte 5 — Top 10 Archivos más Valiosos del Proyecto

*(por pago al dev que los itera con éxito)*

| # | Archivo | Owner | Fase | LOC | $/iter |
|:---:|---|:---:|:---:|:---:|:---:|
| 1 | `firebase/firestore.rules` | P1 | F1 | 220 | $4,062 |
| 2 | `apps/web-supervisor/src/services/export.ts` | P3 | F3 | 240 | $3,840 |
| 3 | `apps/mobile-operator/src/pages/RegistroPage.tsx` | P2 | F1 | 480 | $2,080 |
| 4 | `apps/mobile-operator/src/hooks/useOfflineSync.ts` | P3 | F1 | 220 | $1,208 |
| 5 | `apps/mobile-operator/src/hooks/useFirestore.ts` | P3 | F1 | 260 | $1,427 |
| 6 | `apps/mobile-operator/src/services/storage.ts` | P3 | F1 | 210 | $1,153 |
| 7 | `firebase/functions/src/auth/assignRole.ts` | P1 | F1 | 130 | $2,400 |
| 8 | `packages/core/src/types/database.ts` | P1 | F0 | 160 | $1,324 |
| 9 | `firebase/firestore.emulator.rules` | P1 | F0 | 180 | $1,490 |
| 10 | `docs/manuals/supervisor-guide.md` | P4 | F2 | 250 | $1,875 |

---

## Parte 6 — Reglas de Validación (cuándo se libera el pago)

Una iteración se considera **exitosa** — y el pago se libera — cuando pasa los 5 criterios:

| # | Criterio | Validado por |
|:---:|---|---|
| 1 | El archivo compila sin errores TypeScript | CI automático (P3) |
| 2 | Los tests del archivo pasan (si aplica) | CI automático (P3) |
| 3 | No hay regresiones en el resto del proyecto | CI automático (P3) |
| 4 | El PR fue aprobado por al menos 1 reviewer | CODEOWNERS (P3) |
| 5 | La funcionalidad fue validada en staging | Morgan — P4 |

---

*Well Testing MVP · Estructura: Monagas/ · 149 archivos · 17,515 LOC · $102,200 presupuesto total*
