well-testing-mvp/

# ═══════════════════════════════════════════════════════════════════════════
# 🧙‍♂️ PLAYER 1 (Backend) — Tareas Fase 1
# ═══════════════════════════════════════════════════════════════════════════

firebase/
├── functions/
│   ├── src/
│   │   ├── index.ts                        # 🧙‍♂️ P1 - Entry point (exports de funciones)
│   │   ├── auth/
│   │   │   ├── assignRole.ts               # 🧙‍♂️ P1 - Cloud Fn: asignarRol(userId, rol)
│   │   │   └── setupUser.ts                # 🧙‍♂️ P1 - Trigger: crear usuario con defaults
│   │   ├── utils/
│   │   │   ├── logger.ts                   # 🧙‍♂️ P1 - Logging centralizado
│   │   │   ├── errors.ts                   # 🧙‍♂️ P1 - Custom error classes
│   │   │   └── validators.ts               # 🧙‍♂️ P1 - Validaciones server-side
│   │   └── types.ts                        # 🧙‍♂️ P1 - Types importados de @core
│   ├── tests/
│   │   └── assignRole.test.ts              # 🧙‍♂️ P1 - Tests de Cloud Functions
│   ├── tsconfig.json                       # 🧙‍♂️ P1 - TS para functions
│   ├── package.json                        # 🧙‍♂️ P1 - Deps de Cloud Functions
│   └── README.md                           # 📜 P4 - Cómo deployar
│
├── firestore.rules                         # 🧙‍♂️ P1 - Reglas de seguridad (OPERADOR)
├── firestore.emulator.rules                # 🧙‍♂️ P1 - Reglas para emulator dev
├── storage.rules                           # 🧙‍♂️ P1 - Permisos de Storage
│
├── .firebaserc                             # 🧙‍♂️ P1 - Alias Firebase (dev/staging/prod)
└── firebase.json                           # 🧙‍♂️ P1 - Config emulators y hosting


docs/technical/
├── firestore-schema.md                     # 🧙‍♂️ P1 v1.0 - Schema de BD para OPERADOR
│                                            # Colecciones: /usuarios, /pozos, /evaluaciones, /lecturas
│                                            # (VERSIÓN MÍNIMA para Fase 1)
├── firestore-rules.md                      # 🧙‍♂️ P1 - Documento de las reglas de seguridad
└── api.md                                  # 🧙‍♂️ P1 v1.0 - Especificación de Cloud Functions
                                            # Solo: assignRole() en Fase 1


packages/core/src/types/
├── database.ts                             # 🧙‍♂️ P1 - Tipos de BD para OPERADOR
│                                            # IUser, IWell, IEvaluation, ILecture, ITank
├── api.ts                                  # 🧙‍♂️ P1 - Request/Response types para CloudFn
└── index.ts                                # 🧙‍♂️ P1 - Export barrel

packages/core/src/constants/
├── roles.ts                                # 🧙‍♂️ P1 - OPERADOR, SUP_CAMPO (solo los necesarios Fase 1)
├── states.ts                               # 🧙‍♂️ P1 - EN_CURSO, CERRADA (solo los de operador)
└── limits.ts                               # 🧙‍♂️ P1 - Valores máximos de Presión, Diferencial

# ═══════════════════════════════════════════════════════════════════════════
# 🎨 PLAYER 2 (Frontend) — Tareas Fase 1
# ═══════════════════════════════════════════════════════════════════════════

apps/mobile-operator/src/
├── pages/
│   ├── LoginPage.tsx                       # 🎨 P2 - Pantalla de login (UI)
│   ├── DashboardPage.tsx                   # 🎨 P2 - Lista de pozos (UI layout)
│   ├── NuevoPozoPage.tsx                   # 🎨 P2 - Config de pozo (UI layout)
│   ├── RegistroPage.tsx                    # 🎨 P2 - Formulario principal (UI + tabs)
│   ├── TablaPage.tsx                       # 🎨 P2 - Tabla de lecturas (UI)
│   └── ReportePage.tsx                     # 🎨 P2 - Reporte final (UI)
│
├── components/
│   ├── LoginForm.tsx                       # 🎨 P2 - Componente de formulario login
│   ├── PozoCard.tsx                        # 🎨 P2 - Card de pozo con datos
│   ├── TankInputSection.tsx                # 🎨 P2 - Bloque de entrada de tanque
│   ├── AlertBanner.tsx                     # 🎨 P2 - Banner de alertas visual
│   ├── CalcBox.tsx                         # 🎨 P2 - Caja de cálculo visual
│   ├── TabBar.tsx                          # 🎨 P2 - Barra de pestañas
│   ├── TopBar.tsx                          # 🎨 P2 - Barra superior con título
│   └── __tests__/
│       ├── LoginForm.test.tsx              # 🛡️ P3 - Tests de componentes
│       ├── TankInputSection.test.tsx       # 🛡️ P3
│       └── CalcBox.test.tsx                # 🛡️ P3
│
├── styles/
│   ├── globals.css                         # 🎨 P2 - Estilos globales
│   ├── tailwind.css                        # 🎨 P2 - Configuración Tailwind
│   ├── variables.css                       # 🎨 P2 - Variables de color (logo + dark theme)
│   └── responsive.css                      # 🎨 P2 - Queries para móvil
│
├── types/
│   └── local.ts                            # 🎨 P2 - Tipos locales de UI (no en @core)
│
└── public/
    ├── logo.png                            # 🎨 P2 - Logo WillyTank (SVG preferible)
    ├── splash.png                          # 🎨 P2 - Splash screen Android
    └── favicon.ico                         # 🎨 P2 - Favicon

apps/mobile-operator/
├── android/                                # 🎨 P2 (solo assets) / 🛡️ P3 (config)
│   └── app/src/main/res/
│       ├── drawable/                       # 🎨 P2 - Íconos y splash screens
│       └── values/colors.xml               # 🎨 P2 - Colores Android
│
├── capacitor.config.ts                     # 🛡️ P3 - Config de Capacitor
└── vite.config.ts                          # 🛡️ P3 - Config de Vite build para móvil


docs/design/
├── mockups/
│   └── v5-operador-registro.html           # 🎨 P2 - Referencia visual (mockup v5)
├── colors.md                               # 🎨 P2 - Paleta (#f59e0b, #0a0f1a, etc.)
├── typography.md                           # 🎨 P2 - Fuentes (Helvetica, monospace)
└── icons.md                                # 🎨 P2 - Guía de emojis o SVG icons

# ═══════════════════════════════════════════════════════════════════════════
# 🛡️ PLAYER 3 (DevOps/Fullstack) — Tareas Fase 1
# ═══════════════════════════════════════════════════════════════════════════

apps/mobile-operator/src/
├── hooks/
│   ├── useFirestore.ts                     # 🛡️ P3 - CRUD a Firestore (read/write)
│   ├── useOfflineSync.ts                   # 🛡️ P3 - Cola de sync cuando hay conexión
│   ├── useCalculations.ts                  # 🛡️ P3 - Wrapper de @core/calculos
│   ├── useWhatsApp.ts                      # 🛡️ P3 - Constructor de texto wa.me
│   └── useAuthRole.ts                      # 🛡️ P3 - Custom Claims y redirect por rol
│
├── services/
│   ├── firebase.ts                         # 🛡️ P3 - Init Firebase Auth + Firestore
│   ├── storage.ts                          # 🛡️ P3 - Cache local (IndexedDB)
│   ├── native.ts                           # 🛡️ P3 - APIs Capacitor (Geolocation si aplica)
│   └── whatsapp.ts                         # 🛡️ P3 - DeepLink wa.me
│
├── utils/
│   ├── validations.ts                      # 🛡️ P3 - Validaciones de entrada
│   └── formatters.ts                       # 🛡️ P3 - Formateadores (reutiliza @core)
│
├── __tests__/
│   ├── hooks/
│   │   ├── useFirestore.test.ts            # 🛡️ P3 - Tests de CRUD
│   │   └── useCalculations.test.ts         # 🛡️ P3 - Tests de cálculos
│   └── services/
│       ├── storage.test.ts                 # 🛡️ P3 - Tests de cache offline
│       └── firebase.test.ts                # 🛡️ P3 - Tests de init
│
├── App.tsx                                 # 🛡️ P3 - Entry point (routing por rol)
├── vite.config.ts                          # 🛡️ P3 - Config de build para móvil
├── tsconfig.json                           # 🛡️ P3 - TS config móvil
└── package.json                            # 🛡️ P3 - Deps (React, Firebase SDK, Capacitor)


packages/core/src/
├── calculos/
│   ├── tanque.ts                           # 🛡️ P3 - BPH, BPD, Netos (validado MFB-950)
│   ├── aga3.ts                             # 🛡️ P3 - Qg con Fb, Fg, Ftf, Fpv
│   └── validators.ts                       # 🛡️ P3 - Validaciones de rangos
│
├── utils/
│   ├── formatters.ts                       # 🛡️ P3 - fmt(), san(), dateFormat()
│   └── validators.ts                       # 🛡️ P3 - validatePozo(), validateLecture()
│
├── __tests__/
│   ├── tanque.test.ts                      # 🛡️ P3 - Validar 133.10 Bls MFB-950
│   ├── aga3.test.ts                        # 🛡️ P3 - Validar Qg values
│   └── validators.test.ts                  # 🛡️ P3
│
├── index.ts                                # 🛡️ P3 - Barril principal (export *)
├── package.json                            # 🛡️ P3 - Exportaciones de @core
└── tsconfig.json                           # 🛡️ P3 - TS config para core


.github/
├── workflows/
│   ├── test.yml                            # 🛡️ P3 - Tests en push a cualquier rama
│   ├── build.yml                           # 🛡️ P3 - Build en push a main/staging
│   └── deploy.yml                          # 🛡️ P3 - Deploy a Firebase staging
│
├── CODEOWNERS                              # 🛡️ P3 - Quién revisa qué


Root:
├── .github/                                # 🛡️ P3 - CI/CD workflows
├── .gitignore                              # 🛡️ P3 - node_modules, builds, .env
├── .env.example                            # 🛡️ P3 - Variables de entorno (Firebase keys)
├── .prettierrc                             # 🛡️ P3 - Formato código compartido
├── eslint.config.js                        # 🛡️ P3 - Linting compartido
├── tsconfig.base.json                      # 🛡️ P3 - TS base con path mappings
├── pnpm-workspace.yaml                     # 🛡️ P3 - Monorepo config
├── firebase.json                           # 🛡️ P3 - Config Firebase emulator
├── package.json                            # 🛡️ P3 - Scripts globales (dev, test, build, lint)
└── README.md                               # 📜 P4 - Documentación proyecto


# ═══════════════════════════════════════════════════════════════════════════
# 📜 PLAYER 4 (Product Manager) — Tareas Fase 1
# ═══════════════════════════════════════════════════════════════════════════

docs/
├── business/
│   ├── FRD.md                              # 📜 P4 - Functional Requirements (Fase 1)
│   ├── TRD.md                              # 📜 P4 - Technical Requirements (Fase 1)
│   ├── use-cases.md                        # 📜 P4 - Casos de uso Operador (5 pantallas)
│   ├── glossary.md                         # 📜 P4 - BBL, MPCGD, AyS, Resorte, Gamma
│   └── business-rules.md                   # 📜 P4 - Reglas: campos persistentes, flujo cierre
│
├── technical/
│   ├── rendering-strategy.md               # 📜 P4 + 🛡️ P3 - Patrón setForm()/patchCalcBoxes()
│   ├── firestore-schema.md                 # 📜 P4 + 🧙‍♂️ P1 - Schema de BD (OPERADOR)
│   ├── offline-strategy.md                 # 📜 P4 - Cómo funciona sync offline (IndexedDB)
│   └── security.md                         # 📜 P4 + 🧙‍♂️ P1 - Custom Claims y Firestore Rules
│
├── manuals/
│   ├── operator-guide.md                   # 📜 P4 - Guía paso a paso con capturas (Fase 1)
│   └── admin-setup.md                      # 📜 P4 - Setup inicial de Firebase, Custom Claims, usuarios
│
└── decisions/
    ├── 001-use-firestore-offline-persistence.md  # 📜 P4 - ADR: por qué Firestore
    ├── 002-monorepo-structure.md                  # 📜 P4 - ADR: por qué pnpm workspace
    └── 003-set-form-pattern.md                    # 📜 P4 - ADR: patrón de rendering v5


README.md                                  # 📜 P4 - Documentación proyecto (Fase 1)