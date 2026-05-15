# Estructura del Proyecto: well-testing-mvp (Por Roles) 🧙‍♂️🎨🛡️📜

Monagas/
├── .github/
│   └── workflows/                          # 🛡️ Player 3 (Fullstack) - CI/CD automático
│
├── apps/                                   # Aplicaciones finales
│   ├── mobile-operator/                    # 🎨 Player 2 + 🛡️ Player 3 - Proyecto Capacitor + Vite para operadores
│   │   ├── public/                         # 🎨 Player 2 - Assets estáticos (íconos, splash screens, logo)
│   │   ├── src/
│   │   │   ├── components/                 # 🎨 Player 2 - UI Atómica (Inputs, Cards de Pozo, Botones)
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── PozoCard.tsx
│   │   │   │   ├── TankInputSection.tsx
│   │   │   │   ├── AlertBanner.tsx
│   │   │   │   └── __tests__/              # 🛡️ Player 3 - Tests de componentes
│   │   │   │       ├── LoginForm.test.tsx
│   │   │   │       └── TankInputSection.test.tsx
│   │   │   ├── pages/                      # 🎨 Player 2 - Flujos de pantallas (UI layout)
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── NuevoPozoPage.tsx
│   │   │   │   ├── RegistroPage.tsx
│   │   │   │   ├── TablaPage.tsx
│   │   │   │   └── ReportePage.tsx
│   │   │   ├── hooks/                      # 🛡️ Player 3 - Lógica de Firestore y sincronización
│   │   │   │   ├── useFirestore.ts         # Lectura/escritura CRUD
│   │   │   │   ├── useOfflineSync.ts       # Cola de sincronización cuando hay conexión
│   │   │   │   ├── useCalculations.ts      # Wrapper de calculos compartidos de @core
│   │   │   │   ├── useWhatsApp.ts          # Generador de texto para wa.me deeplink
│   │   │   │   └── useAuthRole.ts          # Custom Claims y redirección por rol
│   │   │   ├── services/                   # 🛡️ Player 3 - APIs nativas y configuración
│   │   │   │   ├── firebase.ts             # Inicialización de Firebase Auth y Firestore
│   │   │   │   ├── storage.ts              # Cache local (IndexedDB para datos offline)
│   │   │   │   ├── native.ts               # APIs nativas (Geolocation, Camera si aplica)
│   │   │   │   └── whatsapp.ts             # Constructor de mensajes WhatsApp
│   │   │   ├── utils/                      # 🛡️ Player 3 - Helpers locales
│   │   │   │   ├── validations.ts          # Validaciones de entrada de usuario
│   │   │   │   └── formatters.ts           # Formateadores específicos de la app (reutiliza @core/utils)
│   │   │   ├── types/                      # 🛡️ Player 3 - Tipos locales de la app (no compartidos)
│   │   │   │   └── local.ts
│   │   │   ├── styles/                     # 🎨 Player 2 - Estilos Tailwind y CSS globales
│   │   │   │   ├── globals.css
│   │   │   │   └── tailwind.css
│   │   │   └── App.tsx                     # 🎨 Player 2 - Punto de entrada principal
│   │   ├── capacitor.config.ts             # 🛡️ Player 3 - Configuración de Capacitor para Android
│   │   ├── android/                        # 🛡️ Player 3 - Proyecto Android nativo (generado por Capacitor)
│   │   ├── package.json                    # 🛡️ Player 3 - Dependencias exclusivas de la app móvil
│   │   ├── tsconfig.json                   # 🛡️ Player 3 - Configuración de TypeScript para móvil
│   │   ├── vite.config.ts                  # 🛡️ Player 3 - Configuración de empaquetado y build móvil
│   │   └── README.md                       # 📜 Player 4 - Guía para compilar APK
│   │
│   └── web-supervisor/                     # 🎨 Player 2 + 🛡️ Player 3 - Panel web React para supervisores
│       ├── public/                         # 🎨 Player 2 - Assets estáticos (favicon, logos, favicons)
│       ├── src/
│       │   ├── components/
│       │   │   ├── common/                 # 🎨 Player 2 - Componentes reutilizables
│       │   │   │   ├── Header.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── KPICard.tsx
│       │   │   │   └── __tests__/          # 🛡️ Player 3 - Tests de componentes comunes
│       │   │   │       └── KPICard.test.tsx
│       │   │   ├── tables/                 # 🎨 Player 2 - Tablas de datos
│       │   │   │   ├── EvaluationTable.tsx
│       │   │   │   ├── UserTable.tsx
│       │   │   │   ├── columns.tsx         # Definiciones de columnas para React Table
│       │   │   │   └── __tests__/          # 🛡️ Player 3 - Tests de tablas
│       │   │   │       └── EvaluationTable.test.tsx
│       │   │   ├── charts/                 # 🎨 Player 2 - Gráficas y visualizaciones (Recharts)
│       │   │   │   ├── ProductionTrend.tsx
│       │   │   │   ├── WellComparison.tsx
│       │   │   │   └── GasVsLiquids.tsx
│       │   │   └── __tests__/              # 🛡️ Player 3 - Tests de charts
│       │   │       └── ProductionTrend.test.tsx
│       │   ├── pages/                      # 🎨 Player 2 - Páginas del panel web
│       │   │   ├── LoginPage.tsx
│       │   │   ├── DashboardPage.tsx       # KPIs, lista de pozos, botones de acción
│       │   │   ├── WellDetailPage.tsx      # Detalle de pozo, historial, tanques
│       │   │   ├── NewWellPage.tsx         # Crear nuevo pozo (multi-tanque, asignación)
│       │   │   ├── ApprovalQueuePage.tsx   # Cola de aprobaciones pendientes
│       │   │   └── UsersPage.tsx           # Gestión de usuarios (solo lectura en MVP)
│       │   ├── services/                   # 🛡️ Player 3 - Servicios de Firestore y exportación
│       │   │   ├── firebase.ts             # Consultas específicas para supervisor
│       │   │   ├── export.ts               # Generador de PDF (jsPDF) y XLSX (SheetJS)
│       │   │   └── realtime.ts             # Listeners en tiempo real (updates de pozos)
│       │   ├── hooks/                      # 🛡️ Player 3 - Custom hooks para la app web
│       │   │   ├── useWells.ts             # Lectura de pozos asignados
│       │   │   ├── useApprovals.ts         # Flujo de aprobaciones
│       │   │   ├── useExport.ts            # Generación de reportes
│       │   │   └── useAuthRole.ts          # Custom Claims y protección de rutas
│       │   ├── utils/                      # 🛡️ Player 3 - Helpers locales
│       │   │   ├── validations.ts
│       │   │   └── formatters.ts
│       │   ├── types/                      # 🛡️ Player 3 - Tipos locales de la app web
│       │   │   └── local.ts
│       │   ├── styles/                     # 🎨 Player 2 - Estilos Tailwind
│       │   │   ├── globals.css
│       │   │   └── tailwind.css
│       │   └── App.tsx                     # 🎨 Player 2 - Punto de entrada del panel web
│       ├── package.json                    # 🛡️ Player 3 - Dependencias exclusivas web
│       ├── tsconfig.json                   # 🛡️ Player 3 - Configuración de TypeScript para web
│       ├── vite.config.ts                  # 🛡️ Player 3 - Configuración de empaquetado web
│       └── README.md                       # 📜 Player 4 - Guía para deployar en Firebase Hosting
│
├── packages/                               # LÓGICA COMPARTIDA (El "Cerebro" del sistema)
│   └── core/                               # 🧙‍♂️ Player 1 (Backend) + 🛡️ Player 3 (Fullstack) - Código TypeScript puro
│       ├── src/
│       │   ├── calculos/                   # 🛡️ Player 3 - Algoritmos de cálculo (portados del mockup)
│       │   │   ├── tanque.ts               # Cálculos de BPH, BPD, Netos, etc.
│       │   │   ├── aga3.ts                 # Cálculo de Qg con factores Fb, Fg, Ftf, Fpv
│       │   │   ├── validators.ts           # Validación de rangos normales de valores
│       │   │   └── index.ts                # Export barrel
│       │   ├── types/                      # 🧙‍♂️ Player 1 - Esquemas de BD y Tipos TypeScript
│       │   │   ├── database.ts             # IWell, IEvaluation, ILecture, ITank, IUser, IApproval
│       │   │   ├── ui.ts                   # DTOs para UI (diferente de database.ts)
│       │   │   ├── api.ts                  # Request/Response types para Cloud Functions
│       │   │   └── index.ts                # Export barrel
│       │   ├── constants/                  # 📜 Player 4 - Reglas de negocio y configuración
│       │   │   ├── roles.ts                # OPERADOR, SUP_CAMPO, SUP_MAYOR, COORDINADOR, GERENTE
│       │   │   ├── states.ts               # EN_CURSO, CERRADA, PENDIENTE_SUPERVISOR, APROBADA_SUPERVISOR, PENDIENTE_GERENTE, OFICIAL
│       │   │   ├── limits.ts               # Valores máximos de Presión (Resorte), Diferencial (Gamma)
│       │   │   ├── tank-factors.ts         # Factores de tanques por pozo (valores por defecto)
│       │   │   └── index.ts                # Export barrel
│       │   ├── utils/                      # 🛡️ Player 3 - Helpers reutilizables
│       │   │   ├── formatters.ts           # fmt(), san(), dateFormat(), sanitizeInput()
│       │   │   ├── validators.ts           # validatePozo(), validateLecture(), validateEmail()
│       │   │   └── index.ts                # Export barrel
│       │   └── index.ts                    # ⭐ Export principal (re-exporta todo)
│       ├── __tests__/                      # 🛡️ Player 3 - Tests unitarios contra datos reales
│       │   ├── tanque.test.ts              # Validar MFB-950: 133.10 Bls Netos/Día
│       │   ├── aga3.test.ts                # Validar MFB-919: 0.01 MPCGD
│       │   └── validators.test.ts
│       ├── package.json                    # 🛡️ Player 3 - Exportaciones del paquete (@core/calculos, @core/types)
│       ├── tsconfig.json                   # 🛡️ Player 3 - Configuración de compilación
│       ├── README.md                       # 📜 Player 4 - Cómo usar @core en otros paquetes
│       └── index.ts                        # ⭐ Punto de entrada principal
│
├── firebase/                               # 🧙‍♂️ Player 1 (Backend) - Infraestructura Cloud
│   ├── functions/                          # 🧙‍♂️ Player 1 - Cloud Functions (Node.js 20)
│   │   ├── src/
│   │   │   ├── index.ts                    # 🧙‍♂️ Player 1 - Punto de entrada (exports de todas las funciones)
│   │   │   ├── auth/                       # 🧙‍♂️ Player 1 - Funciones de autenticación y Custom Claims
│   │   │   │   ├── assignRole.ts           # Cloud Function: asignarRol(userId, rol)
│   │   │   │   └── setupUser.ts            # Trigger: crear usuario con valores por defecto
│   │   │   ├── approvals/                  # 🧙‍♂️ Player 1 - Workflow de aprobaciones
│   │   │   │   ├── onEvalSubmit.ts         # Trigger: cuando operador cierra evaluación
│   │   │   │   ├── onApprove.ts            # Trigger: cuando supervisor aprueba
│   │   │   │   └── onReject.ts             # Trigger: cuando supervisor rechaza
│   │   │   ├── notifications/              # 🧙‍♂️ Player 1 - Notificaciones (ready para futuro)
│   │   │   │   ├── notifyMgr.ts            # Trigger: gerente recibe notificación de aprobación
│   │   │   │   └── notifyOperator.ts       # Trigger: operador recibe feedback
│   │   │   ├── utils/                      # 🧙‍♂️ Player 1 - Helpers de servidor
│   │   │   │   ├── logger.ts               # Logging centralizado
│   │   │   │   ├── errors.ts               # Custom error classes
│   │   │   │   └── validators.ts           # Validaciones server-side
│   │   │   └── types.ts                    # 🧙‍♂️ Player 1 - Tipos TypeScript para functions (importados de @core)
│   │   ├── tests/                          # 🛡️ Player 3 - Tests de Cloud Functions
│   │   │   ├── assignRole.test.ts
│   │   │   └── approvals.test.ts
│   │   ├── .env.example                    # 🛡️ Player 3 - Variables de entorno para functions
│   │   ├── .eslintrc.json                  # 🛡️ Player 3 - Reglas ESLint para functions
│   │   ├── tsconfig.json                   # 🛡️ Player 3 - TypeScript para functions
│   │   ├── package.json                    # 🛡️ Player 3 - Dependencias de Cloud Functions
│   │   └── README.md                       # 📜 Player 4 - Cómo deployar functions
│   ├── firestore.rules                     # 🧙‍♂️ Player 1 - Reglas de seguridad Firestore (producción)
│   ├── firestore.emulator.rules             # 🧙‍♂️ Player 1 - Reglas para emulator local (más permisivas)
│   ├── storage.rules                       # 🧙‍♂️ Player 1 - Permisos de Firebase Storage (Logos, PDFs)
│   ├── .firebaserc                         # 🧙‍♂️ Player 1 - Alias de proyectos Firebase (dev, staging, prod)
│   └── firebase.json                       # 🛡️ Player 3 - Configuración de hosting, emulators y deploy
│
├── docs/                                   # 📜 Player 4 (Product Manager) - Documentación centralizada
│   ├── design/                             # 🎨 Player 2 + 📜 Player 4 - Activos visuales
│   │   ├── mockups/                        # Screenshots o exports HTML del mockup v4
│   │   │   └── v4-supervisor-dashboard.html
│   │   ├── colors.md                       # Paleta de colores (Tailwind + custom)
│   │   ├── typography.md                   # Fuentes, tamaños, line-heights
│   │   └── icons.md                        # Guía de íconos (emoji o svg)
│   ├── business/                           # 📜 Player 4 - Requerimientos funcionales
│   │   ├── FRD.md                          # Functional Requirement Document
│   │   ├── TRD.md                          # Technical Requirement Document
│   │   ├── use-cases.md                    # Casos de uso detallados (Login, Registro, Aprobación)
│   │   ├── glossary.md                     # Glosario (BBL, MPCGD, AyS, Resorte, Gamma, etc.)
│   │   └── business-rules.md               # Reglas de negocio (campos persistentes, flujo de aprobación)
│   ├── technical/                          # 🧙‍♂️ Player 1 + 📜 Player 4 - Especificaciones técnicas
│   │   ├── firestore-schema.md             # 🧙‍♂️ Player 1 - Schema de la BD en Markdown + diagramas
│   │   ├── api.md                          # 🧙‍♂️ Player 1 - Especificación de Cloud Functions
│   │   ├── security.md                     # 🧙‍♂️ Player 1 - Estrategia de seguridad (Custom Claims, Firestore Rules)
│   │   ├── offline-strategy.md             # 🛡️ Player 3 - Cómo funciona el sync offline
│   │   └── architecture.md                 # 🛡️ Player 3 - Diagrama de componentes y flujos de datos
│   ├── manuals/                            # 📜 Player 4 - Guías de usuario
│   │   ├── operator-guide.md               # Guía paso a paso para operador (con capturas)
│   │   ├── supervisor-guide.md             # Guía para supervisor (aprobaciones, reportes)
│   │   └── admin-setup.md                  # Setup inicial (Firebase, Custom Claims, usuarios)
│   └── decisions/                          # 📜 Player 4 - Architecture Decision Records (ADRs)
│       ├── 001-use-firestore-offline-persistence.md
│       ├── 002-monorepo-structure.md
│       └── 003-capacitor-over-native.md
│
├── .github/
│   ├── workflows/
│   │   ├── test.yml                        # 🛡️ Player 3 - Tests en push a cualquier rama
│   │   ├── build.yml                       # 🛡️ Player 3 - Build en push a main/staging
│   │   └── deploy.yml                      # 🛡️ Player 3 - Deploy automático a Firebase
│   └── CODEOWNERS                          # 🛡️ Player 3 - Quién revisa qué (code review assignments)
│
├── .firebaserc                             # 🧙‍♂️ Player 1 - Alias del proyecto Firebase (dev/staging/prod)
├── .gitignore                              # 🛡️ Player 3 - Ignorar node_modules, builds, .env, etc.
├── .prettierrc                             # 🛡️ Player 3 - Reglas de formato de código compartidas
├── .env.example                            # 🛡️ Player 3 - Plantilla de variables de entorno
├── eslint.config.js                        # 🛡️ Player 3 - Reglas de calidad de código compartidas
├── tsconfig.base.json                      # 🛡️ Player 3 - Configuración base de TypeScript con path mappings
├── pnpm-workspace.yaml                     # 🛡️ Player 3 - Configuración del monorepo (packages y apps)
├── firebase.json                           # 🧙‍♂️ Player 1 - Configuración de Firebase (hosting, emulators, functions)
├── package.json                            # 🛡️ Player 3 - Scripts globales (dev, build, test, lint, firebase:emulate)
└── README.md                               # 📜 Player 4 - Documentación técnica de proyecto y onboarding

💎 Al final del dia vamos a cobrar por objetivos 💎
tienes lo que necesitas dentro de las carpetas para cumplir tu funcion
muy buena suerte!!!