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

            Rol por archivo

            
ARCHIVOS RAÍZ
package.json → Player 3

pnpm-workspace.yaml → Player 3

tsconfig.base.json → Player 3

tsconfig.json → Player 3

.gitignore → Player 4

.prettierrc → Player 4

eslint.config.js → Player 3

.env.example → Player 3

README.md → Player 4

APPS / MOBILE
apps/mobile-operator/package.json → Player 2

apps/mobile-operator/tsconfig.json → Player 2

apps/mobile-operator/vite.config.ts → Player 2

apps/mobile-operator/capacitor.config.ts → Player 2

apps/mobile-operator/src/App.tsx → Player 2

APPS / WEB
apps/web-supervisor/package.json → Player 2

apps/web-supervisor/tsconfig.json → Player 2

apps/web-supervisor/vite.config.ts → Player 2

apps/web-supervisor/src/App.tsx → Player 2

PACKAGES / CORE
packages/core/package.json → Player 3

packages/core/tsconfig.json → Player 3

packages/core/index.ts → Player 3

packages/core/src/index.ts → Player 3

packages/core/src/calculos/index.ts → Player 3

packages/core/src/types/index.ts → Player 3

packages/core/src/constants/index.ts → Player 3

packages/core/src/utils/index.ts → Player 3

FIREBASE
firebase/package.json → Player 1

firebase/tsconfig.json → Player 1

firebase/.firebaserc → Player 1

firebase/firebase.json → Player 1

firebase/firestore.rules → Player 1

firebase/storage.rules → Player 1

firebase/functions/src/index.ts → Player 1

GITHUB / CI-CD
.github/workflows/test.yml → Player 3

.github/workflows/build.yml → Player 3

.github/workflows/deploy.yml → Player 1

