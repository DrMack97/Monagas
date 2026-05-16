# 🛠️ Flujo de Trabajo en el Monorepo por Roles
Para coordinar las iteraciones sin interferir en los archivos de otros desarrolladores, el equipo seguirá un flujo síncrono basado en automatización.

1. Cómo se Asignan las Tareas
El ciclo comienza en el Tablero Kanban de GitHub Projects:

📜 Player 4 (Product Manager): Crea los Issues (tareas) detallando las reglas de negocio en base a los documentos de la carpeta docs/business/. Aplica etiquetas (labels) críticas del monorepo para identificar el alcance: scope:core, scope:mobile o scope:web.

Asignación: Mueve la tarea a la columna To Do y asigna al Player correspondiente. Por ejemplo, una tarea de "Cálculo de factor de corrección de tanque" se asigna al 🛡️ Player 3 (Fullstack) y se etiqueta como scope:core.

2. Coordinación de Iteraciones entre Roles
El desarrollo en un monorepo requiere que los cambios de lógica se hagan de manera ordenada para que el Front-end pueda consumirlos:

[📜 Player 4: Define límites] 
       │
       ▼
[🧙‍♂️ Player 1: Modifica types/database.ts] ──► [🛡️ Player 3: Crea cálculo en tanque.ts]
                                                                  │
                                                                  ▼
                                                   [🎨 Player 2: Construye UI TankInputSection.tsx]

Iteración Base: El 📜 Player 4 ajusta las constantes en packages/core/src/constants/limits.ts.

Bloque de Datos: El 🧙‍♂️ Player 1 actualiza los tipos en packages/core/src/types/database.ts.

Lógica: El 🛡️ Player 3 toma esos tipos y escribe la función matemática en packages/core/src/calculos/tanque.ts.

Consumo Visual: El 🎨 Player 2 importa la función y los tipos directamente en la aplicación móvil (apps/mobile-operator/src/components/TankInputSection.tsx), garantizando que la interfaz use la última versión del "cerebro" del proyecto.

3. Validación de Cambios antes del Merge (Pull Requests y CODEOWNERS)
Nadie puede hacer push directo a la rama principal (main). Todo cambio debe proponerse mediante una Pull Request (PR).

Para asegurar que cada rol revise lo que le corresponde, configuramos el archivo .github/CODEOWNERS. Este archivo automatiza quién debe dar el visto bueno (approve) según la carpeta modificada:


# Monagas/.github/CODEOWNERS
# El orden importa: las reglas de abajo tienen prioridad.

# El Player 3 (DevOps) revisa configuraciones globales de la raíz
package.json @player3_github
pnpm-workspace.yaml @player3_github

# El Player 1 (Back-end) es dueño de la base de datos e infraestructura
packages/core/src/types/ @player1_github
firebase/ @player1_github

# El Player 2 (Front-end) es dueño exclusivo de las interfaces de usuario
apps/mobile-operator/src/components/ @player2_github
apps/web-supervisor/src/components/ @player2_github

# El Player 3 valida los algoritmos de ingeniería
packages/core/src/calculos/ @player3_github
Cuando el 🎨 Player 2 termine una interfaz en la app móvil y abra una PR, GitHub etiquetará automáticamente al 🛡️ Player 3 o al 🧙‍♂️ Player 1 si detecta cambios en las carpetas protegidas, bloqueando el merge hasta que su revisión sea aprobada.

4. Mecanismos para Evitar que se Rompa el Código (CI/CD y Branch Protection)
Para garantizar la estabilidad del software, se configuran reglas estrictas en el repositorio que actúan como escudos de protección.

Reglas de Branch Protection (Protección de Ramas)
En la configuración de GitHub, se activa la protección para la rama main:

Require a pull request before merging: Obliga a usar PRs.

Require approvals: Exige como mínimo 1 aprobación de los usuarios definidos en CODEOWNERS.

Require status checks to pass before merging: Impide el merge si los tests automáticos fallan.

Canalización de CI/CD (GitHub Actions)
Cada vez que se abre o actualiza una PR, el archivo .github/workflows/test.yml ejecuta de forma transparente una serie de comandos en la nube para verificar la salud del código:

*ejemplo*
YAML
# fragmento de .github/workflows/test.yml
name: Verificación de Código

on:
  pull_request:
    branches: [ main ]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - name: Instalar Dependencias
        run: pnpm install
        
      - name: Validar Tipos de TypeScript (No any corruptos)
        run: pnpm --filter core check-types
        
      - name: Ejecutar Tests Unitarios (AGA3 y Tanques)
        run: pnpm --filter core test
        
🛡️ Garantía técnica: Si el 🛡️ Player 3 modifica un cálculo en aga3.ts y rompe accidentalmente un caso de prueba del pozo MFB-950, la herramienta de CI/CD fallará, el botón de Merge se volverá gris y se notificará inmediatamente al equipo por un hilo de Discord. El código defectuoso nunca llegará a producción.