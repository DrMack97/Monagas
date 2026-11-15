# Alerta de balance de masas — explicación para el cliente

## Qué es
Un aviso **preventivo y no bloqueante** que ayuda al operador a detectar a tiempo errores humanos de captura
(por ejemplo, omitir o añadir un decimal en una medida de tanque). **Nunca impide guardar ni interrumpe el trabajo**:
solo resalta los campos de entrada y explica qué revisar.

## La ecuación
Se comprueba, tanque por tanque:

> **Desplazamiento total − Total trasegado − Existente total = 0**

| Término | Qué es con los datos que captura la app |
|---|---|
| **Desplazamiento total** | Lo que ya había en el tanque al empezar el ciclo (medida inicial × factor del tanque) **más** la producción que la app registró en cada lectura (barriles/hora × horas). Es la misma producción que alimenta Bpd, Netos y el promedio que se aprueba. |
| **Total trasegado** | Barriles que los viajes de vacuum retiraron del tanque (campo "Trasegado (Bls)"). |
| **Existente total** | Lo que el tanque contiene ahora, según su última medida (medida final × factor del tanque). |

Si todo está bien capturado, la ecuación da cero. Cada tanque se revisa por separado para que un error en uno no se
compense con otro, y el resultado general es el del tanque en peor estado.

## Los dos avisos
La diferencia (residuo) se compara con **una pulgada de nivel del propio tanque** (el factor del tanque en barriles
por pulgada). Hasta **0,5 Bls** se considera redondeo y no se avisa.

| Aviso | Cuándo | Qué significa |
|---|---|---|
| 🟡 **Alerta amarilla** — desviación o incongruencia menor de datos | El balance se desvía **menos de una pulgada** de nivel; o un dato es incongruente con los anteriores (ver abajo). | Probable error pequeño de medida o de redondeo. Conviene revisar, pero no es grave. |
| 🔴 **Alerta roja** — discrepancia crítica en el balance de masas | El balance se desvía **más de una pulgada** de nivel de ese tanque; o un dato digitado es imposible. | Hay barriles que "aparecen o desaparecen". Casi siempre es un error de captura (decimal, cero de más o de menos, trasegado sin anotar). |

Un decimal omitido mueve el nivel muchas pulgadas, por eso cae en rojo.

## Qué desviaciones e incongruencias se toman en cuenta

### En la pantalla de Registro (al escribir cada lectura)
Se resaltan los campos **Medida Final (pulg)** y **Trasegado (Bls)** del tanque afectado.

| # | Situación detectada | Aviso | Ejemplo |
|---|---|---|---|
| 1 | **El nivel baja y no se declara trasegado.** El tanque se vació por un viaje de vacuum pero no se anotaron los barriles. | 🔴 si faltan más de una pulgada | Tanque 2 pasa de 14" a 1" sin trasegado: no cuadran 67,60 Bls. |
| 2 | **Trasegado mal digitado** (un cero o decimal de menos o de más). | 🔴 o 🟡 según cuánto falte | Se anotan 7 Bls en vez de 70: faltan 60,6 Bls. |
| 3 | **Trasegado que se queda corto** por menos de una pulgada. | 🟡 | Se anotan 65 Bls de 67,6: faltan 2,6 Bls. |
| 4 | **Medida con decimal omitido o sobrante que hace subir el nivel.** El balance sí cuadra (el nivel y el desplazamiento suben igual), así que se detecta comparando con las lecturas anteriores: la producción por hora es **5 o más veces** mayor o menor que la normal del ciclo. Si el salto es de unas 10 veces se sugiere "¿se omitió o sobra un decimal?". | 🟡 | Se esperaba 4" y se escribió 13": la producción sube 10 veces. |
| 5 | **Cadena de medidas rota o producción editada** (la medida inicial no es la final anterior, o un supervisor modificó valores). | 🔴 o 🟡 según magnitud | El desplazamiento ya no explica el nivel actual. |

Notas: el salto (#4) solo se evalúa cuando hay al menos **dos lecturas previas con producción** en el ciclo. Un tanque
que el operador aún no ha tocado en esa lectura no genera avisos.

### En la pantalla de Reporte (al cerrar el ciclo)
Se resaltan los campos **Existencia (Bls)** y **Total Trasegado Acumulado (Bls)** que digita el operador.

| # | Situación detectada | Aviso | Ejemplo |
|---|---|---|---|
| 6 | **Existencia digitada distinta de lo medido por nivel** (Σ medida final × factor del tanque). Menos de una pulgada de diferencia → amarilla; más → roja. Si es ≈10 o ≈100 veces mayor o menor se sugiere un decimal. | 🟡 / 🔴 | Medido 117 Bls, digitado 11,7. |
| 7 | **Total trasegado acumulado menor que lo trasegado en este ciclo.** El acumulado incluye lo anterior, así que no puede ser menor: es un dato imposible. | 🔴 | Acumulado 12,09 Bls cuando en el ciclo ya se trasegaron 120,90 Bls. |

## Cómo se ve
- El campo afectado se enmarca en **amarillo** o **rojo**.
- Bajo el tanque aparece el motivo en una frase, por ejemplo: *"Alerta roja: Discrepancia crítica en el balance de
  masas: no cuadran 67,60 Bls (más de una pulgada de nivel). Puedes seguir y guardar."*
- Un panel **"Balance de masas"** muestra la ecuación con sus tres cifras y el nivel
  (Cuadra / Alerta amarilla / Alerta roja).
- Al corregir el dato el aviso **desaparece solo**.
- Si el operador guarda con una alerta activa, queda registrada como **alerta interna** de esa lectura para que el
  supervisor la vea al aprobar. Esas alertas **no aparecen** en los reportes ni exportables al cliente.

## Lo que NO hace
- No bloquea el guardado ni exige justificación.
- No corrige datos ni cambia cálculos.
- No sustituye la revisión del supervisor: es una ayuda para que el error se corrija en el momento en que se comete.
- No detecta un error que cumpla a la vez la ecuación y el patrón normal de producción (por ejemplo, un error pequeño
  y consistente en todas las lecturas).

## Valores de referencia (ajustables)
Tolerancia de redondeo: 0,5 Bls · umbral rojo: una pulgada de nivel del tanque · salto de producción: 5 veces
la mediana de las lecturas anteriores. Están definidos en un solo lugar del código
(`packages/core/src/utils/balanceMasas.ts`) y pueden ajustarse si el cliente lo pide.
