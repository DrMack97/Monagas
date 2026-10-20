# Modelo de Coste por Archivo/Iteración — Well Testing MVP · Fase 1

---

## 1. Definiciones del Modelo

| Término | Definición |
|---|---|
| **Iteración de archivo** | 1 unidad de trabajo completa sobre un archivo: edición + tests que pasan + revisión aprobada |
| **LOC estimadas** | Líneas de código esperadas al terminar el archivo en Fase 1 |
| **Peso_j** | `LOC_j / Σ LOC_all_en_feature` — proporción del archivo sobre el total de la feature |
| **Coste_file_j** | `Coste_feature × Peso_j` — cuánto vale ese archivo dentro de la feature |
| **Pago_dev_j** | `(Horas_dev × Tarifa_dev) × Peso_j` — lo que gana el dev por ese archivo |

---

## 2. Inventario Completo de Archivos — Estructura Definitiva

### Columnas
- **Archivo**: ruta relativa al root del proyecto
- **Owner**: quién lo escribe
- **LOC est.**: líneas estimadas al terminar Fase 1
- **Complejidad**: B = Baja / M = Media / A = Alta (factor de ajuste opcional)

---

### 🧙‍♂️ Player 1 — Backend (Firebase + Types)

| # | Archivo | LOC est. | Complejidad |
|---|---|:---:|:---:|
| 1 | `firebase/functions/src/index.ts` | 50 | B |
| 2 | `firebase/functions/src/auth/assignRole.ts` | 130 | A |
| 3 | `firebase/functions/src/auth/setupUser.ts` | 90 | M |
| 4 | `firebase/functions/src/approvals/onEvalSubmit.ts` | 120 | A |
| 5 | `firebase/functions/src/approvals/onApprove.ts` | 100 | M |
| 6 | `firebase/functions/src/approvals/onReject.ts` | 80 | M |
| 7 | `firebase/functions/src/notifications/notifyMgr.ts` | 70 | B |
| 8 | `firebase/functions/src/notifications/notifyOperator.ts` | 70 | B |
| 9 | `firebase/functions/src/utils/logger.ts` | 40 | B |
| 10 | `firebase/functions/src/utils/errors.ts` | 35 | B |
| 11 | `firebase/functions/src/utils/validators.ts` | 60 | M |
| 12 | `firebase/functions/src/types.ts` | 80 | M |
| 13 | `firebase/firestore.rules` | 220 | A |
| 14 | `firebase/firestore.emulator.rules` | 180 | M |
| 15 | `firebase/storage.rules` | 80 | M |
| 16 | `firebase/.firebaserc` | 25 | B |
| 17 | `packages/core/src/types/database.ts` | 160 | A |
| 18 | `packages/core/src/types/ui.ts` | 90 | M |
| 19 | `packages/core/src/types/api.ts` | 80 | M |
| 20 | `packages/core/src/types/index.ts` | 15 | B |
| 21 | `packages/core/src/constants/roles.ts` | 30 | B |
| 22 | `packages/core/src/constants/states.ts` | 35 | B |
| 23 | `packages/core/src/constants/limits.ts` | 30 | B |
| 24 | `packages/core/src/constants/tank-factors.ts` | 40 | B |
| 25 | `packages/core/src/constants/index.ts` | 15 | B |
| **TOTAL P1** | | **1,855 LOC** | |

---

### 🎨 Player 2 — Frontend (UI + Estilos)

| # | Archivo | LOC est. | Complejidad |
|---|---|:---:|:---:|
| 26 | `apps/mobile-operator/src/App.tsx` | 120 | M |
| 27 | `apps/mobile-operator/src/pages/LoginPage.tsx` | 190 | M |
| 28 | `apps/mobile-operator/src/pages/DashboardPage.tsx` | 260 | M |
| 29 | `apps/mobile-operator/src/pages/NuevoPozoPage.tsx` | 310 | A |
| 30 | `apps/mobile-operator/src/pages/RegistroPage.tsx` | 480 | A |
| 31 | `apps/mobile-operator/src/pages/TablaPage.tsx` | 280 | M |
| 32 | `apps/mobile-operator/src/pages/ReportePage.tsx` | 210 | M |
| 33 | `apps/mobile-operator/src/components/LoginForm.tsx` | 120 | B |
| 34 | `apps/mobile-operator/src/components/PozoCard.tsx` | 150 | M |
| 35 | `apps/mobile-operator/src/components/TankInputSection.tsx` | 190 | A |
| 36 | `apps/mobile-operator/src/components/AlertBanner.tsx` | 80 | B |
| 37 | `apps/mobile-operator/src/styles/globals.css` | 150 | M |
| 38 | `apps/mobile-operator/src/styles/tailwind.css` | 40 | B |
| 39 | `apps/web-supervisor/src/App.tsx` | 100 | M |
| 40 | `apps/web-supervisor/src/components/common/Header.tsx` | 110 | M |
| 41 | `apps/web-supervisor/src/components/common/Sidebar.tsx` | 140 | M |
| 42 | `apps/web-supervisor/src/components/common/KPICard.tsx` | 90 | B |
| 43 | `apps/web-supervisor/src/components/tables/EvaluationTable.tsx` | 200 | A |
| 44 | `apps/web-supervisor/src/components/tables/UserTable.tsx` | 150 | M |
| 45 | `apps/web-supervisor/src/components/tables/columns.tsx` | 120 | M |
| 46 | `apps/web-supervisor/src/components/charts/ProductionTrend.tsx` | 180 | A |
| 47 | `apps/web-supervisor/src/components/charts/WellComparison.tsx` | 160 | A |
| 48 | `apps/web-supervisor/src/components/charts/GasVsLiquids.tsx` | 140 | M |
| 49 | `apps/web-supervisor/src/pages/LoginPage.tsx` | 160 | M |
| 50 | `apps/web-supervisor/src/pages/DashboardPage.tsx` | 300 | A |
| 51 | `apps/web-supervisor/src/pages/WellDetailPage.tsx` | 280 | A |
| 52 | `apps/web-supervisor/src/pages/NewWellPage.tsx` | 290 | A |
| 53 | `apps/web-supervisor/src/pages/ApprovalQueuePage.tsx` | 220 | M |
| 54 | `apps/web-supervisor/src/pages/UsersPage.tsx` | 180 | M |
| 55 | `apps/web-supervisor/src/styles/globals.css` | 120 | M |
| 56 | `apps/web-supervisor/src/styles/tailwind.css` | 40 | B |
| 57 | `docs/design/colors.md` | 80 | B |
| 58 | `docs/design/typography.md` | 60 | B |
| 59 | `docs/design/icons.md` | 50 | B |
| **TOTAL P2** | | **5,350 LOC** | |

---

### 🛡️ Player 3 — DevOps/Fullstack (Hooks + Services + CI + Core Logic)

| # | Archivo | LOC est. | Complejidad |
|---|---|:---:|:---:|
| 60 | `apps/mobile-operator/src/hooks/useFirestore.ts` | 260 | A |
| 61 | `apps/mobile-operator/src/hooks/useOfflineSync.ts` | 220 | A |
| 62 | `apps/mobile-operator/src/hooks/useCalculations.ts` | 150 | M |
| 63 | `apps/mobile-operator/src/hooks/useWhatsApp.ts` | 80 | B |
| 64 | `apps/mobile-operator/src/hooks/useAuthRole.ts` | 120 | M |
| 65 | `apps/mobile-operator/src/services/firebase.ts` | 180 | M |
| 66 | `apps/mobile-operator/src/services/storage.ts` | 210 | A |
| 67 | `apps/mobile-operator/src/services/native.ts` | 100 | M |
| 68 | `apps/mobile-operator/src/services/whatsapp.ts` | 60 | B |
| 69 | `apps/mobile-operator/src/utils/validations.ts` | 80 | M |
| 70 | `apps/mobile-operator/src/utils/formatters.ts` | 70 | B |
| 71 | `apps/mobile-operator/src/types/local.ts` | 60 | B |
| 72 | `apps/mobile-operator/src/components/__tests__/LoginForm.test.tsx` | 120 | M |
| 73 | `apps/mobile-operator/src/components/__tests__/TankInputSection.test.tsx` | 150 | M |
| 74 | `apps/web-supervisor/src/services/firebase.ts` | 180 | M |
| 75 | `apps/web-supervisor/src/services/export.ts` | 240 | A |
| 76 | `apps/web-supervisor/src/services/realtime.ts` | 150 | M |
| 77 | `apps/web-supervisor/src/hooks/useWells.ts` | 130 | M |
| 78 | `apps/web-supervisor/src/hooks/useApprovals.ts` | 140 | M |
| 79 | `apps/web-supervisor/src/hooks/useExport.ts` | 110 | M |
| 80 | `apps/web-supervisor/src/hooks/useAuthRole.ts` | 120 | M |
| 81 | `apps/web-supervisor/src/utils/validations.ts` | 70 | B |
| 82 | `apps/web-supervisor/src/utils/formatters.ts` | 60 | B |
| 83 | `apps/web-supervisor/src/types/local.ts` | 60 | B |
| 84 | `apps/web-supervisor/src/components/common/__tests__/KPICard.test.tsx` | 80 | B |
| 85 | `apps/web-supervisor/src/components/tables/__tests__/EvaluationTable.test.tsx` | 130 | M |
| 86 | `apps/web-supervisor/src/components/__tests__/ProductionTrend.test.tsx` | 100 | M |
| 87 | `packages/core/src/calculos/tanque.ts` | 200 | A |
| 88 | `packages/core/src/calculos/aga3.ts` | 180 | A |
| 89 | `packages/core/src/calculos/validators.ts` | 80 | M |
| 90 | `packages/core/src/calculos/index.ts` | 15 | B |
| 91 | `packages/core/src/utils/formatters.ts` | 60 | B |
| 92 | `packages/core/src/utils/validators.ts` | 80 | M |
| 93 | `packages/core/src/utils/index.ts` | 15 | B |
| 94 | `packages/core/src/index.ts` | 20 | B |
| 95 | `packages/core/__tests__/tanque.test.ts` | 160 | A |
| 96 | `packages/core/__tests__/aga3.test.ts` | 130 | M |
| 97 | `packages/core/__tests__/validators.test.ts` | 100 | M |
| 98 | `packages/core/package.json` | 30 | B |
| 99 | `packages/core/tsconfig.json` | 25 | B |
| 100 | `firebase/functions/tests/assignRole.test.ts` | 130 | M |
| 101 | `firebase/functions/tests/approvals.test.ts` | 150 | M |
| 102 | `firebase/functions/.env.example` | 25 | B |
| 103 | `firebase/functions/.eslintrc.json` | 30 | B |
| 104 | `firebase/functions/tsconfig.json` | 25 | B |
| 105 | `firebase/functions/package.json` | 40 | B |
| 106 | `firebase/firebase.json` | 50 | B |
| 107 | `.github/workflows/test.yml` | 60 | M |
| 108 | `.github/workflows/build.yml` | 70 | M |
| 109 | `.github/workflows/deploy.yml` | 90 | A |
| 110 | `.github/CODEOWNERS` | 30 | B |
| 111 | `.gitignore` | 50 | B |
| 112 | `.prettierrc` | 20 | B |
| 113 | `.env.example` | 35 | B |
| 114 | `eslint.config.js` | 80 | M |
| 115 | `tsconfig.base.json` | 80 | M |
| 116 | `pnpm-workspace.yaml` | 20 | B |
| 117 | `package.json` (root) | 100 | M |
| 118 | `apps/mobile-operator/capacitor.config.ts` | 40 | B |
| 119 | `apps/mobile-operator/package.json` | 40 | B |
| 120 | `apps/mobile-operator/tsconfig.json` | 35 | B |
| 121 | `apps/mobile-operator/vite.config.ts` | 60 | M |
| 122 | `apps/web-supervisor/package.json` | 40 | B |
| 123 | `apps/web-supervisor/tsconfig.json` | 35 | B |
| 124 | `apps/web-supervisor/vite.config.ts` | 60 | M |
| **TOTAL P3** | | **5,560 LOC** | |

---

### 📜 Player 4 — Product Manager (Documentación)

| # | Archivo | LOC est. | Complejidad |
|---|---|:---:|:---:|
| 125 | `docs/business/FRD.md` | 300 | A |
| 126 | `docs/business/TRD.md` | 250 | A |
| 127 | `docs/business/use-cases.md` | 200 | M |
| 128 | `docs/business/glossary.md` | 150 | B |
| 129 | `docs/business/business-rules.md` | 200 | M |
| 130 | `docs/technical/firestore-schema.md` | 250 | A |
| 131 | `docs/technical/api.md` | 200 | M |
| 132 | `docs/technical/security.md` | 150 | M |
| 133 | `docs/technical/offline-strategy.md` | 180 | M |
| 134 | `docs/technical/architecture.md` | 200 | A |
| 135 | `docs/manuals/operator-guide.md` | 300 | M |
| 136 | `docs/manuals/supervisor-guide.md` | 250 | M |
| 137 | `docs/manuals/admin-setup.md` | 200 | M |
| 138 | `docs/decisions/001-use-firestore-offline-persistence.md` | 100 | B |
| 139 | `docs/decisions/002-monorepo-structure.md` | 100 | B |
| 140 | `docs/decisions/003-capacitor-over-native.md` | 100 | B |
| 141 | `docs/design/mockups/v4-supervisor-dashboard.html` | 50 | B |
| 142 | `apps/mobile-operator/README.md` | 100 | B |
| 143 | `apps/web-supervisor/README.md` | 100 | B |
| 144 | `firebase/functions/README.md` | 100 | B |
| 145 | `packages/core/README.md` | 120 | B |
| 146 | `README.md` (root) | 200 | M |
| **TOTAL P4** | | **3,500 LOC** | |

---

## 3. Resumen LOC y Presupuesto Base

### LOC Totales por Player

| Player | Rol | LOC Totales | % del Proyecto |
|---|---|:---:|:---:|
| P1 | Backend | 1,855 | 11.4% |
| P2 | Frontend | 5,350 | 32.9% |
| P3 | DevOps/Fullstack | 5,560 | 34.2% |
| P4 | PM | 3,500 | 21.5% |
| **TOTAL** | | **16,265** | **100%** |

### Tarifas y Presupuesto Fase 1 (4 semanas = 160 horas c/u)

| Player | Tarifa/h | Horas F1 | Coste Total |
|---|:---:|:---:|:---:|
| P1 Backend | $60 | 160 | $9,600 |
| P2 Frontend | $55 | 160 | $8,800 |
| P3 DevOps | $70 | 160 | $11,200 |
| P4 PM | $50 | 80 | $4,000 |
| **TOTAL FASE 1** | | **560 h** | **$33,600** |

---

## 4. Fórmulas del Modelo

### Peso de un archivo dentro de una feature

```
Peso_j = LOC_j / Σ LOC_todos_los_archivos_de_la_feature
```

### Coste del archivo dentro de la feature

```
Coste_file_j = Coste_total_feature × Peso_j
```

### Pago al desarrollador por ese archivo

```
Pago_dev_j = (Horas_dev_en_feature × Tarifa_dev) × (LOC_j / Σ LOC_dev_en_feature)
```

> **Nota:** El denominador del peso es solo los LOC del dev en esa feature, no los de todos los devs.
> Así se mide el esfuerzo individual, no el total de la feature.

---

## 5. Ejemplo Completo — Feature: "Registro de Lectura por Hora"

Esta es la feature más crítica de Fase 1. Involucra archivos de los 4 Players.

### Archivos afectados

| Archivo | Owner | LOC afectadas |
|---|:---:|:---:|
| `pages/RegistroPage.tsx` | P2 | 480 |
| `components/TankInputSection.tsx` | P2 | 190 |
| `components/AlertBanner.tsx` | P2 | 80 |
| `hooks/useFirestore.ts` | P3 | 260 |
| `hooks/useCalculations.ts` | P3 | 150 |
| `hooks/useOfflineSync.ts` | P3 | 220 |
| `services/storage.ts` | P3 | 210 |
| `calculos/tanque.ts` | P3 | 200 |
| `calculos/aga3.ts` | P3 | 180 |
| `__tests__/tanque.test.ts` | P3 | 160 |
| `__tests__/aga3.test.ts` | P3 | 130 |
| `firestore.rules` | P1 | 220 |
| `types/database.ts` (ILecture, ITank) | P1 | 160 |
| `constants/limits.ts` | P1 | 30 |
| `docs/business/business-rules.md` | P4 | 200 |
| `docs/technical/firestore-schema.md` | P4 | 250 |
| **TOTAL** | | **2,920 LOC** |

### Esfuerzo estimado por Player en esta feature

| Player | Horas en feature | Coste en feature |
|---|:---:|:---:|
| P1 | 28 h | 28 × $60 = $1,680 |
| P2 | 40 h | 40 × $55 = $2,200 |
| P3 | 48 h | 48 × $70 = $3,360 |
| P4 | 12 h | 12 × $50 = $600 |
| **TOTAL feature** | **128 h** | **$7,840** |

### Distribución de Pago por Archivo — Player 2

LOC de P2 en esta feature: 480 + 190 + 80 = **750 LOC**
Coste P2 en feature: **$2,200**

| Archivo P2 | LOC | Peso | Pago Dev |
|---|:---:|:---:|:---:|
| `RegistroPage.tsx` | 480 | 480/750 = 64.0% | $2,200 × 0.640 = **$1,408** |
| `TankInputSection.tsx` | 190 | 190/750 = 25.3% | $2,200 × 0.253 = **$557** |
| `AlertBanner.tsx` | 80 | 80/750 = 10.7% | $2,200 × 0.107 = **$235** |
| **TOTAL P2** | **750** | **100%** | **$2,200** |

### Distribución de Pago por Archivo — Player 3

LOC de P3 en esta feature: 260+150+220+210+200+180+160+130 = **1,510 LOC**
Coste P3 en feature: **$3,360**

| Archivo P3 | LOC | Peso | Pago Dev |
|---|:---:|:---:|:---:|
| `useFirestore.ts` | 260 | 17.2% | **$578** |
| `useOfflineSync.ts` | 220 | 14.6% | **$490** |
| `services/storage.ts` | 210 | 13.9% | **$467** |
| `calculos/tanque.ts` | 200 | 13.2% | **$444** |
| `calculos/aga3.ts` | 180 | 11.9% | **$400** |
| `useCalculations.ts` | 150 | 9.9% | **$333** |
| `__tests__/tanque.test.ts` | 160 | 10.6% | **$356** |
| `__tests__/aga3.test.ts` | 130 | 8.6% | **$292** |
| **TOTAL P3** | **1,510** | **100%** | **$3,360** |

### Distribución de Pago por Archivo — Player 1

LOC de P1 en esta feature: 220 + 160 + 30 = **410 LOC**
Coste P1 en feature: **$1,680**

| Archivo P1 | LOC | Peso | Pago Dev |
|---|:---:|:---:|:---:|
| `firestore.rules` | 220 | 53.7% | **$902** |
| `types/database.ts` | 160 | 39.0% | **$655** |
| `constants/limits.ts` | 30 | 7.3% | **$123** |
| **TOTAL P1** | **410** | **100%** | **$1,680** |

### Distribución de Pago por Archivo — Player 4

LOC de P4 en esta feature: 200 + 250 = **450 LOC**
Coste P4 en feature: **$600**

| Archivo P4 | LOC | Peso | Pago Dev |
|---|:---:|:---:|:---:|
| `docs/business/business-rules.md` | 200 | 44.4% | **$266** |
| `docs/technical/firestore-schema.md` | 250 | 55.6% | **$334** |
| **TOTAL P4** | **450** | **100%** | **$600** |

---

## 6. Ajuste por Complejidad (Opcional)

Si prefieres ponderar por complejidad además de LOC, aplica un multiplicador:

| Complejidad | Multiplicador |
|:---:|:---:|
| B (Baja) | 1.0× |
| M (Media) | 1.5× |
| A (Alta) | 2.5× |

### Fórmula con complejidad

```
LOC_ponderadas_j = LOC_j × Multiplicador_complejidad_j
Peso_j = LOC_ponderadas_j / Σ LOC_ponderadas_all
```

### Ejemplo — Player 3, Feature "Registro de Lectura" con ponderación

| Archivo | LOC | Mult. | LOC pond. | Peso pond. | Pago pond. |
|---|:---:|:---:|:---:|:---:|:---:|
| `useFirestore.ts` | 260 | 2.5 | 650 | 21.0% | **$706** |
| `useOfflineSync.ts` | 220 | 2.5 | 550 | 17.7% | **$595** |
| `services/storage.ts` | 210 | 2.5 | 525 | 16.9% | **$568** |
| `calculos/tanque.ts` | 200 | 2.5 | 500 | 16.1% | **$541** |
| `calculos/aga3.ts` | 180 | 2.5 | 450 | 14.5% | **$488** |
| `useCalculations.ts` | 150 | 1.5 | 225 | 7.3% | **$245** |
| `__tests__/tanque.test.ts` | 160 | 2.5 | 400 | 12.9% | **$433** |
| `__tests__/aga3.test.ts` | 130 | 1.5 | 195 | 6.3% | **$212** |
| — | — | — | **3,495 pond.** | **100%** | **$3,360** |

> La suma siempre es el coste del dev en la feature ($3,360). Solo cambia la distribución entre archivos.

---

## 7. Tabla Rápida de Referencia — Valor por Archivo por Feature

Basado en el presupuesto de Fase 1 ($33,600 / 16,265 LOC = **$2.07 por LOC sin ponderar**):

| Archivo | Owner | LOC | Valor base ($2.07/LOC) |
|---|:---:|:---:|:---:|
| `RegistroPage.tsx` | P2 | 480 | $994 |
| `useFirestore.ts` | P3 | 260 | $538 |
| `firestore.rules` | P1 | 220 | $455 |
| `useOfflineSync.ts` | P3 | 220 | $455 |
| `services/storage.ts` | P3 | 210 | $435 |
| `calculos/tanque.ts` | P3 | 200 | $414 |
| `docs/technical/firestore-schema.md` | P4 | 250 | $518 |
| `NuevoPozoPage.tsx` | P2 | 310 | $642 |
| `types/database.ts` | P1 | 160 | $331 |
| `calculos/aga3.ts` | P3 | 180 | $373 |

> **Interpretación:** Si un archivo vale $538 y el dev lo itera con éxito (pasa tests + revisión),
> eso es lo que "gana" esa iteración en términos de valor generado para el proyecto.

---

## 8. Reglas de Validación de Iteración

Para que una iteración se considere **exitosa** y el pago se libere:

| Criterio | Quién valida |
|---|---|
| El archivo compila sin errores TS | CI automático (P3) |
| Los tests del archivo pasan (si aplica) | CI automático (P3) |
| La feature funciona end-to-end en staging | Morgan (P4) |
| El PR fue aprobado por al menos 1 reviewer | CODEOWNERS (P3) |
| No hay regresiones en tests existentes | CI automático (P3) |

---

*Documento generado para Well Testing MVP — Fase 1 · Estructura: Monagas/*
