# @monagas/core

<!-- TODO: Documentación de @core - Player 4 (Product Manager) -->
<!-- Paso 1: Explicar propósito del paquete (lógica compartida) -->
<!-- Paso 2: Documentar cómo usar desde apps (pnpm install @monagas/core) -->
<!-- Paso 3: Ejemplos de imports: @core/calculos, @core/types -->
<!-- Entregable: nuevo desarrollador sabe usar @core en <5 min -->

## 📦 Subpaquetes

- `@core/calculos` - Algoritmos de BPH, BPD, Qg
- `@core/types` - Tipado de BD y UI
- `@core/constants` - Roles, estados, límites
- `@core/utils` - Formateadores, validadores

## 🚀 Uso

```ts
import { calcularBPH } from '@core/calculos'
import { IWell } from '@core/types'
import { OPERADOR } from '@core/constants'
```
