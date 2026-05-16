# Lista de Archivos Indispensables para Fase 0

Monagas/
│
├── 🟢 ARCHIVOS RAÍZ (Configuración del monorepo)
│   ├── package.json                # Scripts globales y dependencias raíz
│   ├── pnpm-workspace.yaml         # Configuración de workspaces
│   ├── tsconfig.base.json          # Configuración base de TypeScript
│   ├── tsconfig.json               # Tsconfig raíz (extiende base)
│   ├── .gitignore                  # Archivos a ignorar en Git
│   ├── .prettierrc                 # Formato de código compartido
│   ├── eslint.config.js            # Reglas de linting compartidas
│   ├── .env.example                # Plantilla de variables de entorno
│   └── README.md                   # Onboarding y documentación principal
│
├── 🟢 APPS (Aplicaciones finales)
│   ├── apps/mobile-operator/
│   │   ├── package.json            # Dependencias móviles
│   │   ├── tsconfig.json           # TypeScript móvil
│   │   ├── vite.config.ts          # Build móvil
│   │   ├── capacitor.config.ts     # Configuración Capacitor/Android
│   │   └── src/App.tsx             # Punto de entrada móvil
│   │
│   └── apps/web-supervisor/
│       ├── package.json            # Dependencias web
│       │   ├── tsconfig.json       # TypeScript web
│       │   ├── vite.config.ts      # Build web
│       │   └── src/App.tsx         # Punto de entrada web
│
├── 🟢 PACKAGES (Lógica compartida)
│   └── packages/core/
│       ├── package.json            # Exportaciones del paquete @core
│       ├── tsconfig.json           # TypeScript para core
│       ├── index.ts                # Punto de entrada principal
│       └── src/
│           ├── index.ts            # Export barrel
│           ├── calculos/index.ts   # Export de cálculos
│           ├── types/index.ts      # Export de tipos
│           ├── constants/index.ts  # Export de constantes
│           └── utils/index.ts      # Export de utilidades
│
├── 🟢 FIREBASE (Backend/Infraestructura)
│   ├── firebase/
│   │   ├── package.json            # Dependencias de Cloud Functions
│   │   ├── tsconfig.json           # TypeScript para functions
│   │   ├── .firebaserc             # Alias de proyectos (dev/staging/prod)
│   │   ├── firebase.json           # Configuración Firebase
│   │   ├── firestore.rules         # Reglas de seguridad Firestore
│   │   ├── storage.rules           # Reglas de Storage
│   │   └── functions/src/index.ts  # Punto de entrada Cloud Functions
│
└── 🟢 GITHUB (CI/CD)
    └── .github/
        └── workflows/
            ├── test.yml            # Tests en push
            ├── build.yml           # Build en push a main
            └── deploy.yml          # Deploy automático a Firebase

