# Monagas - well Testing MVP 

## Estructura del Proyecto

- **apps/mobile-operator** — App Android para operadores en campo
- **apps/web-supervisor** — Panel web para supervisores y gerentes
- **packages/core** — Tipos, cálculos y constantes compartidas
- **firebase/** — Cloud Functions, reglas de seguridad

## Iniciando

### Prerequisites
- Node.js 18+
- pnpm 8+
- Firebase CLI
- Android SDK (para compilar APK)

### Dev setup

\`\`\`bash
pnpm install
pnpm firebase:emulate    # En otra terminal
pnpm dev                 # Arranca todas las apps
\`\`\`

### Deploy a Staging

\`\`\`bash
pnpm build
firebase deploy --only functions,hosting --project=well-testing-staging
\`\`\`

## Personas y Roles

- **Player 1 (🧙‍♂️)** — Backend, Firebase, Cloud Functions
- **Player 2 (🎨)** — Frontend móvil y web, UI/UX
- **Player 3 (🛡️)** — Fullstack, DevOps, CI/CD, optimización
- **Player 4 (📜)** — PM, documentación, validación con cliente

## Testing

\`\`\`bash
pnpm test              # Todos los tests
pnpm test:core         # Solo package/core
\`\`\`

## Documentación

Ver `/docs` para:
- FRD, TRD (requerimientos)
- Schema de Firestore
- Guías de usuario
<!-- TODO: Documentación del proyecto - Player 4 (Product Manager) -->
<!-- Paso 1: Escribir overview del proyecto -->
<!-- Paso 2: Documentar setup inicial (pnpm install, pnpm dev) -->
<!-- Paso 3: Documentar estructura de carpetas -->
<!-- Paso 4: Documentar roles del equipo -->
<!-- Entregable: Nuevo desarrollador puede hacer setup en <15 min -->


