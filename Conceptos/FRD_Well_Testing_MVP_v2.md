# Documento de Requerimientos Funcionales (FRD)
## Well Testing MVP — Digitalización de Evaluaciones de Pozos Petroleros

**Versión:** 2.0  
**Fecha:** Mayo 2026  
**Estado:** Validado con Cliente  
**Alcance:** Fases 0→1 (Setup + App Operador)

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Objetivos del Proyecto](#objetivos-del-proyecto)
3. [Alcance (Fases 0-1)](#alcance-fases-0-1)
4. [Usuarios y Roles](#usuarios-y-roles)
5. [Requerimientos Funcionales](#requerimientos-funcionales)
6. [Flujos de Usuario](#flujos-de-usuario)
7. [Reglas de Negocio](#reglas-de-negocio)
8. [Datos y Cálculos](#datos-y-cálculos)
9. [Restricciones No-Funcionales](#restricciones-no-funcionales)
10. [Casos de Uso Críticos](#casos-de-uso-críticos)

---

## Visión General

**Well Testing MVP** es una aplicación móvil + web que reemplaza el proceso manual de evaluación de pozos petroleros (actualmente en documentos Word/Excel) por un sistema digital, offline-first, con sincronización automática y cálculos en tiempo real.

**Problema:** Los operadores en campo (Faja del Orinoco, Norte de Monagas) no tienen conectividad confiable. Las evaluaciones se capturan a mano, se digitalizan luego, se pierden datos, no hay validación en tiempo real de límites críticos.

**Solución:** App Android nativa (PWA) que:
- Funciona sin internet (offline-first)
- Valida datos en tiempo real contra límites de seguridad (Resorte, Gamma)
- Calcula producción neta con motor AGA-3 validado contra pozos reales
- Sincroniza automáticamente cuando hay conexión
- Genera reportes en PDF conformes a informes existentes

**Usuarios primarios Fase 1:**
- **Operadores de Campo**: capturan lecturas cada hora durante 5-24 horas de evaluación
- **Supervisores** (Fase 2): aprueban y coordinan evaluaciones de múltiples pozos

---

## Objetivos del Proyecto

### Corto Plazo (Fase 1 — 4 semanas)
1. ✅ Operador puede registrar evaluación completa sin internet
2. ✅ Motor de cálculo valida datos contra MFB-950/919 reales
3. ✅ Sincronización automática cuando hay conexión
4. ✅ Flujo de cierre y reporte básico funcional
5. ✅ APK compilado y testeable en Android real

### Mediano Plazo (Fases 2-3 — 5 semanas)
6. Supervisor puede aprobar/rechazar evaluaciones desde panel web
7. PDF/XLSX generados automáticamente
8. Notificaciones entre roles

### Largo Plazo (Fase 4 — 2 semanas)
9. Monitoreo y hardening para producción
10. Documentación de usuario y capacitación

---

## Alcance (Fases 0-1)

### ✅ Incluido

**Fase 0 — Fundaciones (Semana 1-2)**
- Monorepo configurado (pnpm workspace)
- Firebase proyecto (dev/staging)
- CI/CD básico (tests, build, deploy)
- Motor de cálculo con tests contra datos reales
- Tipos y constantes compartidas

**Fase 1 — App Operador Completa (Semana 3-6)**
- **5 pantallas funcionales:**
  1. Login — autenticación con email/contraseña
  2. Dashboard — lista de pozos asignados
  3. Nuevo Pozo — configuración de pozo (multi-tanque)
  4. Registro — formulario principal con 3 tabs (Tanque/Gas/Operativos)
  5. Tabla — historial de lecturas + mini-gráfica
  6. Reporte — resumen de evaluación + deeplink WhatsApp

- **Funcionalidad offline:**
  - Todos los datos se guardan en IndexedDB
  - Sincronización automática con Firestore cuando hay internet
  - Indicador visual de estado de conexión

- **Cálculos en tiempo real:**
  - BPH, BPD, Netos/Día (validados contra MFB-950)
  - Qg con factores AGA-3 (Fb, Fg, Ftf, Fpv)
  - Validación de límites Resorte y Gamma

- **Persistencia entre horas:**
  - Medida Final de hora N → Medida Inicial de hora N+1
  - Campos que se mantienen entre horas (API, AyS%, Dil/H)
  - Campos que se borran (P.Cabezal, Torque, RPM, Amp)

### ❌ Excluido (Fase 2+)

- Panel web de supervisor (para Fase 2)
- Aprobaciones multi-step (para Fase 2)
- Exportación PDF/XLSX (para Fase 3)
- Notificaciones Push (para Fase 3)
- Gestión de usuarios desde UI (solamente API)
- Soporte iOS
- Modo alto contraste para campo con sol directo

---

## Usuarios y Roles

### Fase 1 (MVP) — Solo OPERADOR

| Rol | Descripción | Permisos Fase 1 | Acceso |
|---|---|---|---|
| **OPERADOR** | Técnico de campo que captura datos durante evaluaciones | • Ver pozos asignados • Crear evaluaciones • Ver sus evaluaciones • No puede aprobar | App móvil Android |
| **ADMIN** | Gestor del sistema (futuro — Fase 2) | • Crear usuarios • Asignar roles • Ver auditoría | Firebase Console |

### Roles Adicionales (definidos pero no activos en Fase 1)

| Rol | Descripción | Activo |
|---|---|:---:|
| **SUP_CAMPO** | Supervisa 1 pozo, aprueba evaluaciones | Fase 2 |
| **SUP_MAYOR** | Supervisa 3+ pozos | Fase 2 |
| **COORDINADOR** | Acceso a todos los pozos, configura pozos | Fase 2 |
| **GERENTE** | Aprobación final de evaluaciones | Fase 2 |

### Permisos por Rol (Firestore Rules)

**Fase 1 — Solo OPERADOR:**
```
- Leer: /usuarios/{uid}, /pozos/{id asignados}, /evaluaciones/{propias}
- Escribir: /evaluaciones/{nuevas}, /lecturas/{propias}
- NO puede: crear pozos, aprobar evaluaciones, ver otros operadores
```

---

## Requerimientos Funcionales

### RF1 — Autenticación y Autorización

**RF1.1** El operador puede iniciar sesión con email y contraseña
- **Criterio:** Login se autentica contra Firebase Auth
- **Validaciones:** Email válido (formato), contraseña ≥8 caracteres
- **Resultado:** JWT guardado localmente, redirección a Dashboard

**RF1.2** El sistema asigna automáticamente el rol OPERADOR al crear el usuario
- **Método:** Cloud Function en Firestore (trigger onCreate en /usuarios)
- **Custom Claim:** auth.rol = "OPERADOR"
- **Restricción:** Solo ADMIN puede crear usuarios

**RF1.3** El operador se desconecta y borra datos locales al cerrar sesión
- **Datos borrados:** JWT, cache de Firestore, evaluaciones no sincronizadas
- **Confirmación:** "¿Estás seguro? Se borrarán datos no guardados"

**RF1.4** El sistema redirige automáticamente por rol
- **OPERADOR** → Dashboard (lista de pozos)
- **Roles futuros** (SUP_CAMPO, etc.) → Redirige a /supervisor (Fase 2)

---

### RF2 — Dashboard del Operador

**RF2.1** El operador ve una lista de pozos asignados
- **Datos mostrados:**
  - Nombre del pozo (ej: MFB-950)
  - Campo y zona (ej: Bare, FAJA)
  - Estado actual (EN_CURSO, CERRADA, PENDIENTE_APROBACIÓN, OFICIAL)
  - Última lectura: netos/día, P.Cabezal, Amperaje
- **Origen:** Firestore collection `/pozos` filtrada por `asignados: [uid]`
- **Orden:** Por estado (EN_CURSO primero) luego por nombre

**RF2.2** El operador puede tocar un pozo y ver su detalle
- **Detalle incluye:**
  - Número de evaluaciones completadas
  - Última lectura (timestamp, valores)
  - Factor de tanque configurado
  - Botón "Continuar Evaluación" o "Nueva Evaluación"

**RF2.3** El operador puede crear una nueva evaluación desde Dashboard
- **Flujo:** Toca "Nueva Evaluación" → Pantalla Nuevo Pozo

**RF2.4** Indicador visual de sincronización
- **Verde (✓):** Datos sincronizados, online
- **Naranja (⚠️):** Datos en cache, esperando conexión
- **Texto:** "4 cambios pendientes" si hay datos sin sincronizar

**RF2.5** Pull-to-refresh para forzar sincronización
- **Acción:** Deslizar hacia abajo en la lista
- **Resultado:** Se syncan datos locales con Firestore, se actualizan KPIs

---

### RF3 — Configuración de Pozo (Nuevo Pozo)

**RF3.1** El operador ve un formulario para configurar un pozo antes de evaluación
- **Campo obligatorio:** Nombre del pozo (ej: MFB-1025)
- **Campo obligatorio:** Campo (ej: Bare, Norte)
- **Campo obligatorio:** Zona (dropdown: FAJA, MONAGAS)
- **Campo obligatorio:** Factor de tanque (ej: 2.40 BBL/pulg) — compartido entre todos los tanques

**RF3.2** El operador puede agregar múltiples tanques
- **Para cada tanque:**
  - Nombre (ej: Tanque 1, Tanque 2)
  - Medida Inicial en pulg (remanente/intransegable antes de operar)
  - Editable por operador (NO bloqueado como antes)
- **Botón:** "+ Agregar Tanque" (máximo 5)
- **Botón:** "✕" para eliminar tanque (min 1)

**RF3.3** El operador configura límites de alerta
- **Resorte (psi):** límite máximo de Presión de Cabezal (ej: 300 psi)
- **Gamma (inH₂O):** límite máximo de Diferencial Barton (ej: 60 inH₂O)
- **Validación:** Valores deben ser >0
- **Uso:** Para alertar si se cruzan durante registro

**RF3.4** El operador especifica duración esperada de evaluación
- **Campo:** Horas de Evaluación (ej: 5, 12, 24)
- **Uso:** Informativo, no afecta cálculos

**RF3.5** Medida Inicial puede ser editada por el operador
- **Antes:** Estaba bloqueada
- **Ahora:** Es editable en el formulario Nuevo Pozo
- **Hint:** "Remanente inicial antes de operar"
- **Persistencia:** Una vez guardada, se bloquea en el formulario de Registro (pero puede editarse nuevamente desde Nuevo Pozo)

---

### RF4 — Formulario de Registro (Lectura Horaria)

**RF4.1** El operador accede al formulario después de seleccionar un pozo
- **Navegación:** Dashboard → Toca pozo → "Continuar Evaluación" o "Nueva Lectura"
- **Vista:** Formulario principal con 3 pestañas: Tanque / Gas AGA-3 / Operativos

**RF4.2** El foco del usuario se mantiene en el campo que está editando
- **Problema resuelto:** Antes, cada keystroke re-renderizaba la pantalla y perdía el foco
- **Solución:** Actualización quirúrgica de DOM — solo se actualizan las cajas de cálculo, no los inputs
- **Resultado:** El usuario puede escribir sin que la página salte

**RF4.3** La página NO desplaza al inicio a menos que el usuario lo solicite
- **Validación:** Solo scroll manual o tap en botones — no scroll automático por keystroke
- **UX:** El operador en campo con una mano puede escribir números sin perder su posición en el formulario

#### Pestaña TANQUES

**RF4.4** Para cada tanque, el operador captura:
- **Medida Inicial:** bloqueada (del Nuevo Pozo), no editable aquí
- **Medida Final (pulg):** input numérico — medida en el tanque al terminar la hora
- **Tiempo (H):** duración de la medición (ej: 1 hora, 2 horas)
- **Reductor (Bls):** factor de corrección manual, bloqueado hasta primer clic ("Toque para editar"), hint: "Auto:0"
- **API XP (°API):** gravedad del crudo inicial, persistente entre horas
- **API Dil (°API):** gravedad del diluyente, persistente entre horas (solo en FAJA)
- **AyS (%):** porcentaje de agua y sedimentos, persistente entre horas
- **Cont. Dil/H (Bls/H):** inyección de diluyente por hora, persistente
- **Factor Espuma (Bls):** corrección por espuma, defecto 0

**RF4.5** Cálculos en tiempo real (Tanque)
- **BPH:** (Medida Final - Medida Inicial) × Factor / Tiempo
- **BPD:** BPH × 24
- **Netos:** BPD - Cont.Dil - (BPD × AyS%)
- **Validación:** Si API XP = 9.8 y se inyecta diluyente, el API Dil debe ser válido (≠0)
- **Mostrado:** En cajas de cálculo en tiempo real (sin re-renderizar el formulario)

**RF4.6** Si hay múltiples tanques, toggle "Suma de tanques"
- **Estado "Tanque 1":** muestra BPH, BPD, Netos solo del tanque 1
- **Estado "Suma":** totaliza BPH, BPD, Netos de todos los tanques

#### Pestaña GAS (AGA-3)

**RF4.7** El operador captura parámetros de gas para cálculo AGA-3
- **Presión de Flujo (psig):** presión del flujo en la línea de meditción
- **Diferencial hw (inH₂O):** diferencial del manómetro Barton — con alerta si cruza Gamma
- **Temperatura Gas (°F):** temperatura del gas (defecto 60°F)
- **Gravedad Específica:** densidad relativa del gas (defecto 0.65)
- **Diámetro Placa Orificio (pulg):** tamaño del orificio (defecto 2", se mantiene entre horas)

**RF4.8** Cálculos AGA-3 en tiempo real
- **Fb:** 218.527 × d²
- **Fg:** √(1 / Gg)
- **Ftf:** √(520 / (T + 460))
- **Qg (MPCGD):** Fb × Fpv × Fg × Ftf × √(hw × Pf) / 1000
- **Mostrado:** Valores calculados en cajas (solo lectura)

**RF4.9** Validación de hw contra Gamma
- **Si hw > limGamma:** campo se colorea en rojo, alert banner aparece

#### Pestaña OPERATIVOS

**RF4.10** El operador captura parámetros operativos
- **P. Cabezal (psi):** presión de cabezal de pozo
  - Validación: si > limResorte, colorea en rojo
  - Hint: "Resorte máx: 300 psi"
- **P. Separación (psi):** presión del separador
- **Torque:** torsión de la bomba
- **RPM:** revoluciones por minuto
- **Amperaje (A):** consumo eléctrico de la bomba

**RF4.11** Alert banner en la parte superior si se cruzan límites
- **Condición 1:** P.Cabezal > limResorte → "⚠️ Resorte (psi) CRÍTICO: 320 > 300"
- **Condición 2:** hw > limGamma → "⚠️ Gamma (inH₂O) CRÍTICO: 65 > 60"
- **Color:** Naranja/Rojo, dismiss con X

---

### RF5 — Persistencia al Guardar Lectura

**RF5.1** Cuando el operador toca "Guardar Lectura Hora N", el sistema:
1. Valida que MF ≥ 0 (medida final válida)
2. Guarda la lectura en Firestore
3. Prepara la hora siguiente automáticamente:
   - `mf_hora_N` → `mi_hora_N+1` (la medida final se vuelve inicial)
   - Mantiene: API XP, API Dil, AyS%, Cont. Dil/H, Reductor, Factor Espuma, Temperatura Gas
   - Borra: P.Cabezal, P. Separación, Torque, RPM, Amperaje, P. Flujo, hw, Factor Espuma
   - Reinicia para nueva entrada horaria

**RF5.2** La evaluación cambia de estado
- **Inicio:** EN_CURSO
- **Cada lectura guardada:** sigue EN_CURSO
- **Cuando operador toca "Cerrar Evaluación":** cambia a CERRADA → PENDIENTE_SUPERVISOR (Fase 2)

---

### RF6 — Tabla de Lecturas

**RF6.1** El operador ve un historial de todas las lecturas de la evaluación actual
- **Columnas:**
  - Hora (H1, H2, ... H24)
  - Timestamp de lectura
  - BPH, BPD, Netos
  - P. Cabezal, Qg
  - AyS%, Diluyente
- **Orden:** Cronológico (H1 → H24)

**RF6.2** Gráfica mini de tendencia
- **Eje X:** Hora (H1-H24)
- **Eje Y:** Netos/Día
- **Tipo:** Línea con puntos
- **Interactivo:** Toque en un punto → muestra detalles en tooltip

**RF6.3** Proyección a 24 horas en la tabla
- **Si evaluación va 5H:** "(Proyectado a 24H: 133.10 Bls/D)"
- **Cálculo:** Promedio BPH × 24

---

### RF7 — Reporte y Cierre

**RF7.1** El operador ve resumen final de evaluación
- **Datos:**
  - Nombre del pozo
  - Fecha y hora de inicio/fin
  - Número de horas evaluadas
  - Producción final neta
  - Estado (EN_CURSO, CERRADA, PENDIENTE_SUPERVISOR)
- **Botones:**
  - "Guardar Reporte" → guarda en Firestore, estado CERRADA
  - "Generar WhatsApp" → abre wa.me con texto pre-formateado
  - "Volver al Dashboard"

**RF7.2** Texto WhatsApp pre-formateado
```
🛢️ EVALUACIÓN POZO MFB-950
📅 30/07/25 22:00 - 31/07/25 03:00 (5H)
✅ Netos: 133.10 Bls/D
⚡ Bruto: 160.80 Bls/D
🔥 Gas: 110.63 MPCGD
👤 Operador: Carlos Pérez
```
- **Botón:** "Enviar por WhatsApp" → deeplink wa.me/?text=...

**RF7.3** El operador puede descargar reporte como PDF (Fase 3)
- **Para Fase 1:** Solamente texto WhatsApp

---

### RF8 — Sincronización Offline

**RF8.1** Todos los datos se guardan primero en IndexedDB local
- **Schema:** tables: usuarios, pozos, evaluaciones, lecturas
- **Triggers:** cada input cambia, cada lectura guardada

**RF8.2** Cuando hay conectividad, sincronización automática
- **Detección:** navigator.onLine
- **Frecuencia:** cada 5 segundos si hay cambios pendientes
- **Orden:** usuarios → pozos → evaluaciones → lecturas (dependencias)

**RF8.3** Conflictos: last-write-wins con timestamp honesto
- **Si hay conflicto en una lectura:** timestamps locales vs remotos, gana el más reciente
- **Logging:** todos los conflictos se registran en Firestore `/logs`

**RF8.4** Indicador visual de sincronización
- **Badge en topbar:** "✓ Sincronizado" (verde), "⚠️ 3 cambios pendientes" (naranja)
- **Tap en badge:** fuerza sincronización inmediata

**RF8.5** Modo offline confirmado
- **Escenario:** sin internet 48H
- **Resultado:** Todos los datos se guardan localmente, al conectar se syncan sin pérdida

---

### RF9 — Validaciones

**RF9.1** Validaciones en el lado del cliente
- **Medida Final:** debe ser > 0 (si BPH se calcula)
- **Tiempo:** debe ser > 0
- **Presión cabezal:** si es negativa → error
- **Diferencial hw:** si es negativo → error
- **API:** deben ser > 0 si se usa diluyente

**RF9.2** Validaciones en el lado del servidor (Cloud Functions)
- **Rango de BPH:** debe estar entre 0.1 y 100 Bls/H (fuera = warning)
- **Rango de AyS:** debe estar entre 0% y 100%
- **Rango de API:** debe estar entre 0° y 50° (fuera = warning)
- **Firestore Rule:** solo OPERADOR puede escribir en /evaluaciones/{propias}

---

### RF10 — Modo Offline Persistente

**RF10.1** La app funciona 48 horas sin internet
- **Datos almacenados:** evaluaciones completas (5-24 horas de capturas)
- **Almacenamiento:** IndexedDB con límite de 50MB
- **Cleanup:** después de sync exitoso, se limpian datos de 7 días atrás

**RF10.2** Indicador de "almacenamiento bajo"
- **Si > 80% lleno:** alert "Se está quedando sin espacio" sugerir sync

**RF10.3** El usuario puede ver qué datos están pendientes de sincronizar
- **Pantalla:** "⬆️ Pendiente de Sync"
  - Listado de evaluaciones, lecturas, cambios por enviar
  - Tamaño en MB
  - Botón "Forzar Sync Ahora"

---

## Flujos de Usuario

### Flujo 1: Nuevo Operador — Evaluación Completa (5H)

```
1. INICIO
   └─ App abierta, sin evaluación activa

2. LOGIN (si no está autenticado)
   └─ Email: operador@arco.com
   └─ Contraseña: ••••••
   └─ ✓ OK → Dashboard

3. DASHBOARD
   └─ Ve "MFB-950 · Bare · FAJA · Netos: 133.10"
   └─ Toca pozo

4. DETALLE POZO
   └─ Ve: última evaluación, estado, botón "Continuar"
   └─ Toca "Nueva Evaluación"

5. NUEVO POZO (configuración)
   └─ Campo: Bare
   └─ Zona: FAJA
   └─ Factor: 2.40 BBL/pulg
   └─ Tanques: Tanque 1 (MI: 12.50), Tanque 2 (MI: 8.20)
   └─ Resorte: 300 psi
   └─ Gamma: 60 inH₂O
   └─ Horas: 5
   └─ Toca "Guardar" → REGISTRO

6. REGISTRO — Hora 1 de 5
   Pestaña TANQUES:
   └─ Medida Inicial (bloqueada): 12.50, 8.20
   └─ Medida Final: [22:00] "14.80", "9.40"
   └─ Tiempo: 1
   └─ API XP: "9.8"
   └─ API Dil: "18.4"
   └─ AyS%: "2.4"
   └─ Cont.Dil/H: "25.20"
   ✓ Cálculo en tiempo real:
     └─ BPH: 4.60
     └─ BPD: 110.40
     └─ Netos: 85.20

   Pestaña GAS:
   └─ Presión Flujo: "145"
   └─ Diferencial hw: "33.67"
   └─ Temp Gas: "60" (default)
   └─ Gravedad Esp: "0.65" (default)
   ✓ Qg (AGA-3): 110.63 MPCGD

   Pestaña OPERATIVOS:
   └─ P.Cabezal: "190"
   └─ P.Separación: "110"
   └─ Torque: "632"
   └─ RPM: "160"
   └─ Amperaje: "67"

   └─ Toca "Guardar Lectura Hora 1"

7. REGISTRO — Horas 2-5
   └─ Medida Inicial (auto): 14.80, 9.40 (de la hora anterior)
   └─ Repite entrada de datos x4
   └─ Cada hora: MI se actualiza de MF anterior

8. TABLA
   └─ Ve 5 lecturas en historial
   └─ Gráfica de Netos/Día 22:00-03:00
   └─ Proyección: "Proyectado 24H: 133.10 Bls/D"

9. REPORTE
   └─ Resumen: MFB-950, 5H, 133.10 Bls/D
   └─ Estado: CERRADA
   └─ Toca "Enviar por WhatsApp"
   └─ Abre wa.me con texto pre-formateado
   └─ Envía a supervisor

10. DASHBOARD
    └─ Vuelve al inicio
    └─ MFB-950 ahora muestra estado "CERRADA"
    └─ Puede crear nueva evaluación o ver otro pozo
```

### Flujo 2: Sincronización en Campo con Internet Intermitente

```
1. OPERADOR EN CAMPO (sin internet)
   └─ Captura 3 lecturas horarias offline
   └─ Datos guardados en IndexedDB
   └─ Badge: "⚠️ 3 cambios pendientes"

2. OPERADOR SE ACERCA A TORRE/CENTRO (conecta 4G)
   └─ App detecta conectividad
   └─ Automáticamente empieza sync en background
   └─ Badge cambia a "✓ Sincronizando..."

3. SYNC EN PROGRESS
   └─ Envía: evaluación, 3 lecturas
   └─ Firestore recibe y valida
   └─ IndexedDB se limpia

4. SYNC COMPLETADO
   └─ Badge: "✓ Sincronizado"
   └─ Toast: "3 cambios sincronizados"
   └─ Operador puede continuar capturando

5. OPERADOR PIERDE CONEXIÓN (regresa a pozo)
   └─ App sigue funcionando
   └─ Nueva lectura se guarda en IndexedDB
   └─ Badge vuelve a "⚠️ 1 cambio pendiente"

6. OPERADOR CONECTA DE NUEVO
   └─ Repite ciclo de sync automático
```

### Flujo 3: Validación de Límites Críticos

```
1. OPERADOR EN REGISTRO
   └─ Ingresa P.Cabezal: "320"
   └─ Límite configurado: "300"

2. VALIDACIÓN
   └─ Campo se colorea en ROJO
   └─ Alert banner aparece: "⚠️ Resorte (psi) CRÍTICO: 320 > 300"

3. OPCIONES
   a) Operador corrige el valor: "290" → alert desaparece
   b) Operador ignora warning: puede seguir, pero se registra en logs
   c) Operador toca "Consultar Supervisor" (Fase 2)

4. SI ENVÍA LA LECTURA CON VALOR CRÍTICO
   └─ Se guarda de todas formas (no bloquea)
   └─ Pero se marca como "REVISADO_ADVERTENCIA"
   └─ Supervisor verá el flag en Fase 2
```

---

## Reglas de Negocio

### RN1 — Cálculos Base

| Cálculo | Fórmula | Validación |
|---|---|---|
| **BPH** | (MF - MI) × FT / Tiempo | MF > 0, Tiempo > 0 |
| **BPD** | BPH × 24 | Rango: 0.1-600 Bls/D (warning si fuera) |
| **Diluyente Diario** | Cont.Dil/H × 24 | Rango: 0-200 Bls/D |
| **Netos** | BPD - DilDía - (BPD × AyS%) | Debe ser > 0 |
| **Qg (AGA-3)** | Fb × Fpv × Fg × Ftf × √(hw × Pf) / 1000 | Rango: 0-10,000 MPCGD (warning si > 500) |

**Donde:**
- FT = Factor de Tanque (ej 2.40)
- Fb = 218.527 × d²  (d = diámetro placa)
- Fg = √(1 / Gravedad Específica)
- Ftf = √(520 / (T + 460))  (T = temperatura °F)

### RN2 — Persistencia Entre Horas

**Campo que se MANTIENE:**
- API XP (gravedad crudo)
- API Dil (gravedad diluyente)
- AyS% (porcentaje agua y sedimentos)
- Cont. Dil/H (inyección diluyente)
- Reductor (factor manual si aplica)
- Temperatura Gas
- Diámetro Placa Orificio
- Gravedad Específica

**Campos que se BORRAN:**
- Medida Final → se vuelve MI (propósito: continuidad)
- P. Cabezal
- P. Separación
- Torque
- RPM
- Amperaje
- P. Flujo (es hora-específica)
- Diferencial hw (es hora-específica)
- Factor Espuma

### RN3 — Alertas

| Condición | Trigger | Acción |
|---|---|---|
| P.Cabezal > limResorte | En tiempo real mientras tipea | Colorea rojo, alert banner |
| hw > limGamma | En tiempo real | Colorea rojo, alert banner |
| BPH fuera de rango | Al guardar lectura | Warning en logs, se guarda igual |
| AyS% > 100% | En validación | Rechaza entrada |

### RN4 — Estados de Evaluación

```
EN_CURSO (inicial)
     ↓ [Operador toca "Guardar Reporte"]
CERRADA (lista para revisión)
     ↓ [Fase 2 — Supervisor aprueba]
PENDIENTE_SUPERVISOR → APROBADA_SUPERVISOR → PENDIENTE_GERENTE → OFICIAL
```

**Fase 1 solo llega hasta CERRADA.**

### RN5 — Restricciones de Acceso

**OPERADOR puede:**
- ✅ Ver los pozos asignados a él
- ✅ Crear nuevas evaluaciones en esos pozos
- ✅ Ver solo sus propias evaluaciones
- ✅ Editar evaluaciones EN_CURSO
- ❌ Ver evaluaciones de otros operadores
- ❌ Aprobar evaluaciones
- ❌ Crear pozos

**Implementado en:** Firestore Rules + Cloud Functions validación

---

## Datos y Cálculos

### Estructuras de Datos — Firestore Collections

```
/usuarios/{uid}
  ├─ nombre: "Carlos Pérez"
  ├─ email: "carlos@arco.com"
  ├─ rol: "OPERADOR"
  ├─ zona: "FAJA"
  ├─ pozosAsignados: ["p1", "p2"]
  └─ activo: true

/pozos/{id}
  ├─ nombre: "MFB-950"
  ├─ campo: "Bare"
  ├─ zona: "FAJA"
  ├─ factorTanque: 2.40
  ├─ horasEvaluacion: 5
  ├─ limResorte: 300 (psi)
  ├─ limGamma: 60 (inH₂O)
  ├─ asignados: ["u1", "u2"]
  └─ creadoPor: "admin"

/evaluaciones/{id}
  ├─ pozoId: "p1"
  ├─ operadorId: "u1"
  ├─ estado: "EN_CURSO"
  ├─ fechaInicio: timestamp
  ├─ tanques: [
  │   { id: "t1", nombre: "Tanque 1", miInicial: 12.50 }
  │ ]
  ├─ config: {
  │   apiXp: 9.8,
  │   apiDil: 18.4,
  │   aysPct: 2.4,
  │   contDilHora: 25.20
  │ }
  └─ ultimaLecturaId: "lec5"

/evaluaciones/{evalId}/lecturas/{lecId}
  ├─ hora: 1
  ├─ timestamp: "2025-07-30T22:30Z"
  ├─ tanques: [
  │   { id: "t1", mf: 14.80, bph: 4.60, bpd: 110.40 }
  │ ]
  ├─ operativos: {
  │   pCabezal: 190,
  │   pSep: 110,
  │   torque: 632,
  │   rpm: 160,
  │   amp: 67
  │ }
  ├─ gas: {
  │   pf: 145,
  │   hw: 33.67,
  │   tGas: 60,
  │   gg: 0.65,
  │   qg: 110.63
  │ }
  └─ netos: 85.20
```

### Validación Contra Datos Reales

Todos los cálculos están validados contra 3 evaluaciones reales:

| Pozo | Horas | Netos Esperado | Netos Calculado | ✅ |
|---|:---:|:---:|:---:|:---:|
| MFB-950 Eval 1 | 5 | 133.10 | 133.10 | ✓ |
| MFB-950 Eval 2 | 10 | 59.68 | 59.68 | ✓ |
| MFB-919 | 12 | 57.05 | 57.05 | ✓ |

**Qg también validado contra MFB-919:** 0.01 MPCGD ✓

---

## Restricciones No-Funcionales

### RNF1 — Rendimiento

- **Login:** < 2 segundos
- **Apertura Dashboard:** < 1 segundo (datos locales)
- **Cálculos en tiempo real:** < 100ms (sin lag visible)
- **Sync:** < 5 segundos para 10 lecturas

### RNF2 — Disponibilidad Offline

- **Funcionamiento sin internet:** ✓ 100% (excepto login inicial)
- **Sync automático:** cada 5 segundos si hay cambios y conectividad
- **Persistencia:** 48 horas mínimo sin sincronizar

### RNF3 — Almacenamiento

- **IndexedDB local:** 50MB máximo
- **Una evaluación completa:** ~500KB (24 horas de datos)
- **Caben:** ~100 evaluaciones antes de limpiar

### RNF4 — Seguridad

- **Contraseña:** ≥8 caracteres, validado en Firebase Auth
- **JWT:** se guarda en localStorage, se borra al logout
- **Firestore Rules:** solo OPERADOR lee/escribe datos propios
- **Data en tránsito:** HTTPS sempre

### RNF5 — Compatibilidad

- **Android:** 8.0+ (SDK 26+)
- **Dispositivos:** teléfonos con pantalla 4.5"-6.5" (no tablets)
- **RAM mínima:** 2GB
- **Espacio libre:** 100MB mínimo
- **iOS:** No soportado en Fase 1

### RNF6 — Accesibilidad

- **Contraste:** WCAG AA (4.5:1 para texto)
- **Tamaño de fuente:** ≥12px base (zoom en campo es permitido)
- **Teclado:** todas las funciones por teclado + touch
- **No aplicar:** alto contraste para sol directo (Fase 4)

---

## Casos de Uso Críticos

### CU1 — Evaluación Completa sin Internet (CRÍTICO)

**Actor:** Operador en campo, sin 4G/WiFi

**Precondición:** App cargada, pozo configurado

**Flujo:**
1. Operador captura 5 lecturas horarias (BPH, parámetros operativos)
2. Cada lectura se guarda en IndexedDB
3. Sin acceso a Firestore (offline)
4. Cálculos AGA-3 funcionan (no necesitan servidor)
5. Después de 48H, conecta en base
6. Sync automático envía todas las 5 lecturas
7. No hay pérdida de datos

**Criterio de Aceptación:**
- ✓ 5 lecturas guardadas localmente
- ✓ Netos calculados correctamente offline
- ✓ Sync después de 48H completa sin errores
- ✓ 0 lecturas perdidas

### CU2 — Validación de Límite Crítico (CRÍTICO)

**Actor:** Operador

**Precondición:** Límite Resorte = 300 psi

**Flujo:**
1. Ingresa P.Cabezal: 310
2. Campo se colorea rojo
3. Alert: "⚠️ Resorte CRÍTICO: 310 > 300"
4. Toca "Guardar Lectura Hora 1"

**Criterio de Aceptación:**
- ✓ Alert aparece EN TIEMPO REAL (sin esperar a guardar)
- ✓ No bloquea el guardado (permite sobrepasar si operador lo elige)
- ✓ Se registra el override en logs para auditoría

### CU3 — Persistencia Entre Horas (CRÍTICO)

**Actor:** Operador capturando 5 horas

**Flujo:**
1. Hora 1: MI=12.50, MF=14.80, API=9.8, AyS=2.4, Dil=25.20
2. Guarda lectura 1
3. Hora 2 aparece: MI=14.80 (automático), AyS=2.4 (conservado), API=9.8 (conservado)
4. Ingresa MF=17.10, guarda lectura 2
5. Hora 3 aparece: MI=17.10 (automático)

**Criterio de Aceptación:**
- ✓ MI se actualiza automáticamente de MF anterior
- ✓ API, AyS, Dil se mantienen sin pedirlos de nuevo
- ✓ P.Cabezal, RPM, Torque se borran (campo vacío)

---

## Matriz de Trazabilidad

| ID | Descripción | Prioridad | Fase | Owner | Estado |
|:---|---|:---:|:---:|:---:|:---:|
| RF1 | Autenticación | CRÍTICO | 0 | P1 | ✓ |
| RF2 | Dashboard | CRÍTICO | 1 | P2 | ✓ |
| RF3 | Nuevo Pozo | CRÍTICO | 1 | P2 | ✓ |
| RF4 | Registro + Cálculos | CRÍTICO | 1 | P2/P3 | ✓ |
| RF5 | Persistencia | CRÍTICO | 1 | P3 | ✓ |
| RF6 | Tabla | ALTO | 1 | P2 | ✓ |
| RF7 | Reporte | ALTO | 1 | P2 | ✓ |
| RF8 | Offline Sync | CRÍTICO | 1 | P3 | ✓ |
| RF9 | Validaciones | ALTO | 1 | P3 | ✓ |
| RF10 | Offline 48H | CRÍTICO | 1 | P3 | ✓ |

---

## Glosario de Términos

| Término | Definición |
|---|---|
| **BBL / Bls** | Barril = 159 litros de crudo |
| **BPH** | Barriles por Hora |
| **BPD** | Barriles por Día |
| **AyS** | Agua y Sedimentos (porcentaje) |
| **API** | American Petroleum Institute — medida de densidad del crudo |
| **Qg** | Caudal de gas (MPCGD) |
| **MPCGD** | Millones de Pies Cúbicos por Día |
| **Resorte** | Límite de Presión de Cabezal (psi) |
| **Gamma** | Límite de Diferencial Barton (inH₂O) |
| **hw** | Diferencial del manómetro Barton (inH₂O) |
| **FT** | Factor de Tanque (BBL/pulg) |
| **Fb, Fg, Ftf** | Factores del cálculo AGA-3 |

---

---

*Documento FRD v2.0 — Well Testing MVP · Estructurado para Fase 0-1 · Validado contra datos reales MFB-950/919*
