# Guía del Supervisor

Para Supervisor de Campo, Supervisor de Área y Gerente, usando el panel web
(web-supervisor). Las tres cuentas comparten la misma pantalla de entrada,
pero lo que cada una puede ver y hacer es distinto — está marcado en cada
sección.

| Rol | Qué ve | Qué gestiona |
|---|---|---|
| **Supervisor de Campo** | Un (1) solo pozo, el suyo | Tanques y límites de alerta de ese pozo |
| **Supervisor de Área** | Todos los pozos de su zona | Todo lo de Campo + aprobaciones, personal, crear pozos, Analytics — dentro de su zona |
| **Gerente** | Todos los pozos del sistema | Igual que Área, sin restricción de zona |

## 1. Iniciar sesión

Con el correo y contraseña que te asignaron. Si sos Supervisor de Área o
Gerente, tu cuenta la crea otro Supervisor de Área/Gerente o el
administrador del sistema (ver Guía de Administración).

## 2. Pantalla principal

Ves la lista de pozos dentro de tu alcance (uno, los de tu zona, o todos,
según tu rol), con contador de pozos en curso, pendientes de aprobación, y
personal asignado. Si tu rol es Supervisor de Área o Gerente, también ves
un quinto indicador: **Total Netos Fiscalizado** — el acumulado de
producción de las evaluaciones ya oficiales dentro de tu alcance.

Solo Supervisor de Área y Gerente ven el botón **+ Crear Pozo**.

## 3. Detalle de un pozo

Al entrar a un pozo:

- **Tanques** (medida inicial y factor de tanque) y **Límites de Alerta**
  (Resorte, Gamma) — los edita cualquiera de los tres roles, siempre y
  cuando sea SU pozo (Campo) o esté dentro de tu zona/alcance (Área,
  Gerente).
- **Empresa y Equipo** (el encabezado del reporte PDVSA, ej. "Del Sur
  International, S.A." / "WT-DSI-01") — exclusivo de Supervisor de Área y
  Gerente. Supervisor de Campo no ve estos dos campos.
- **Evaluaciones Oficiales** — el historial de ciclos ya aprobados de ese
  pozo, con un botón "Exportar Excel" por cada uno (formato del reporte
  oficial de PDVSA, con las lecturas del ciclo completo).

## 4. Cola de Aprobaciones — exclusivo Área/Gerente

Supervisor de Campo no tiene esta pantalla. Aquí aparece cada evaluación
que un Operador cerró y está esperando revisión, dentro de tu zona (o
todas, si sos Gerente).

Por cada evaluación pendiente puedes:
- Ver el promedio calculado (Bpd, Netos, Horas).
- Abrir "Ver lecturas individuales" para revisar cada lectura por
  separado, y **corregir** valores puntuales (Bph/Bpd/Netos por tanque,
  presión de cabezal y separador) si detectas un error de captura — esto
  es una corrección administrativa de un valor que quedó mal cargado, no
  un recálculo automático.
- **Aprobar** — la evaluación pasa a Aprobada y, después, a Oficial.
- **Rechazar**, con un motivo obligatorio — vuelve al Operador como
  EN_CURSO para que la corrija y la vuelva a cerrar.

## 5. Personal — exclusivo Área/Gerente

Supervisor de Campo no tiene esta pantalla; no elige con quién trabaja.

- **+ Nuevo Personal** — crea un Operador o un Supervisor de Campo
  (nombre, correo, contraseña temporal, y el pozo al que queda asignado).
  Área solo puede crear dentro de su propia zona.
- **Reasignar** — mueve a alguien de un pozo a otro, o lo libera sin
  asignarle uno nuevo todavía.
- **Desactivar / Reactivar** — le quita (o devuelve) el acceso a la
  aplicación a alguien. Es inmediato y real: una persona desactivada no
  puede iniciar sesión, aunque tenga la contraseña correcta. No borra su
  cuenta ni su historial — reactivar lo devuelve exactamente a como
  estaba, con el mismo pozo asignado. No hace falta confirmar nada aparte
  porque es 100% reversible con el mismo botón.

## 6. Crear un pozo — exclusivo Área/Gerente

Desde "+ Crear Pozo": nombre, campo, empresa, equipo, zona (fija en la
tuya si sos Área), horas del ciclo de evaluación, límites de alerta
iniciales, y de 1 a 5 tanques con su medida inicial y factor de tanque.

## 7. Analytics — exclusivo Área/Gerente

KPIs reales de tu alcance: pozos visibles, producción oficial acumulada,
aprobaciones de hoy, tiempo promedio de aprobación, y las 5 evaluaciones
más recientes con su estado. Los gráficos de producción por día y
aprobaciones por supervisor todavía están pendientes de construir — el
panel lo dice explícitamente en vez de mostrar un gráfico inventado.

## Problemas frecuentes

| Lo que ves | Qué significa |
|---|---|
| "No tienes permiso para editar este pozo/lectura" | Ese pozo o esa evaluación no está dentro de tu zona/alcance. |
| "Solo lectura — no tienes permiso de edición sobre este pozo" | Estás viendo un pozo fuera de tu autoridad (ej. Campo mirando uno que no es el suyo). |
| El botón "+ Crear Pozo" / "Aprobaciones" / "Personal" / "Analytics" no aparece | Tu rol es Supervisor de Campo — esas pantallas son exclusivas de Área/Gerente. |
