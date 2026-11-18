# Control de errores de captura — informe de funcionamiento

Versión de la app: **1.0.9 (acumulada, aún no publicada)**. Fecha: 2026-11-19.
Para explicar al cliente cómo la app evita que un error humano en una lectura comprometa la fiabilidad de los datos.

## 1. Idea general

Antes, una lectura equivocada se guardaba tal cual y el Operador no podía deshacerla. Ahora hay **tres defensas
encadenadas**, de la más temprana a la más tardía:

| # | Cuándo actúa | Qué hace | ¿Impide guardar? |
|---|---|---|---|
| 1 | Mientras se escribe | **Rangos plausibles por pozo**: marca en amarillo o rojo el campo y explica por qué | No |
| 2 | Al pulsar *Guardar Lectura* | **Confirmación**: si hay algo que parece error, pide una segunda pulsación consciente | No (exige confirmar) |
| 3 | Después de guardar | **Anular o corregir la última lectura**: nada se borra; queda como constancia | — |

Además, ya existían (y siguen igual): la alerta de balance de masas, el aviso de salto de producción y el aviso de
medida final menor que la inicial. Ver `alerta-balance-masas.md`.

Principio común: **nunca se pierde un dato medido**. Lo que se corrige o se anula queda guardado con quién, cuándo y por qué.

## 2. Rangos plausibles por pozo

Avisan de un valor fuera de lo razonable (típicamente un decimal de más o de menos: 540 psig escrito como 5400 o 54).
Cada regla es un cálculo a la vista:

**Físicamente imposible → ROJO**
- Cualquier valor negativo (presiones, diferencial, medida del tanque).
- Diferencial mayor que la presión estática. La presión diferencial en psi es `inH₂O ÷ 27.707` y no puede superar la
  presión estática; la fórmula de gas (AGA-3) deja de ser válida. Ej.: 100 inH₂O ≈ 3.6 psi no cabe en 2 psig.

**Fuera de lo esperado → AMARILLO**
- Presión estática por encima del resorte del registrador del pozo, o diferencial por encima de su gamma.
- Temperatura del gas fuera de −20 … 300 °F, gravedad específica fuera de 0.4 … 1.5, medida de tanque mayor de 500 pulg.
- P. Cabezal menor que P. Separador (normalmente el cabezal tiene más presión).
- **Rango habitual del propio pozo**: el valor se aparta más de **3 veces** (por encima o por debajo) de la mediana de las
  últimas lecturas del pozo (hasta 10; las de este ciclo o, si aún no hay, las del anterior). Si el cociente es cercano a
  10 (o a 0.1) el aviso sugiere *«¿se omitió o sobra un decimal?»*.

Ejemplo real de pantalla: con lecturas de P. Cabezal 540, 540, 540, al escribir 5400 el campo se marca en amarillo y dice
*«P. Cabezal (5400) es 10 veces mayor que lo habitual de este pozo (mediana 540…): ¿se omitió o sobra un decimal?»*.

Notas:
- Los **0 no se evalúan aquí**: los cubre el aviso de «lectura vacía» (sección 3).
- Un pozo **nuevo** (menos de 2 lecturas de referencia) no tiene «rango habitual»: solo cuentan las reglas físicas.
- Temperatura y gravedad solo se revisan si el pozo tiene Placa y Meter Run (si no, el gas no se guarda).

## 3. Confirmación antes de guardar

Al pulsar *Guardar Lectura*, si hay **cualquiera** de estos motivos, la lectura **no se guarda todavía**: aparece un cuadro
rojo «¿Guardar de todos modos?» con la lista de motivos y dos botones, **Revisar** y **Guardar de todos modos**.

1. **Datos críticos en 0**: Medida Final, Presión Estática, Diferencial, P. Cabezal o P. Separador.
   - Un tanque **sin uso** (siempre en 0) no cuenta mientras otro tanque tenga medida; así un pozo con un solo tanque en
     uso no recibe el aviso en cada lectura. Cuenta si el tanque tenía fluido (medida inicial > 0) o si *ningún* tanque
     tiene medida (entonces la lectura se llama «vacía»).
   - Presión Estática y Diferencial solo cuentan si el pozo tiene Placa y Meter Run.
2. **Un valor fuera de rango** (sección 2), amarillo o rojo.
3. **Discrepancia ROJA del balance de masas** (más de una pulgada de nivel sin cuadrar).

Las alertas **amarillas** del balance y los saltos de producción **no** piden confirmar: siguen siendo solo avisos.
Si el operador cambia un dato mientras el cuadro está abierto, el cuadro se cierra y se vuelve a evaluar.

La confirmación **no impide** guardar: un 0 puede ser real (pozo sin gas, tanque recién vaciado). Solo evita que un error
entre por un toque distraído. Si se guarda con datos críticos en 0, la pantalla muestra un aviso rojo («Lectura #N guardada,
pero con datos críticos en 0») y la lectura lleva una **constancia interna** en `alertas` (no sale en los Excel).

## 4. Anular o corregir la última lectura

En *Registro* aparece el panel **«Última lectura · #N»** con las medidas y presiones guardadas y dos botones.

- **Anular**: pide un **motivo obligatorio** (mínimo 3 letras). La lectura **no se borra**: se marca como anulada con
  quién, cuándo y por qué. Deja de contar en el promedio, la tabla, el reporte, el WhatsApp y los dos Excel. Se resta su
  hora a las horas evaluadas. La numeración vuelve a la del número anterior (la siguiente lectura será otra vez #N).
- **Corregir**: hace lo mismo y además **carga el contenido de la lectura en el formulario** (medidas, AyS %, gas,
  presiones) para capturar los valores correctos. Al guardar, la lectura nueva queda **enlazada** a la anulada (`corrigeA`).

Reglas de funcionamiento:
- Solo la **última** lectura: la medida final de cada lectura es la inicial de la siguiente, así que tocar una intermedia
  descuadraría las que vienen después. Para deshacer varias se anula de la última hacia atrás.
- Solo mientras la evaluación está **EN_CURSO** (antes de enviarla a supervisión). Después, la corrige el Supervisor.
- Si no hay red, la anulación se encola y se envía al volver la señal (igual que guardar).

**Permisos (reglas de Firestore):** el Operador solo puede escribir cuatro campos (`anulada`, `anuladaEn`, `anuladaPor`,
`anuladaMotivo`) en lecturas de **su** evaluación EN_CURSO, firmando con su propio uid y con motivo; no puede cambiar ningún
valor medido, no puede «desanular», no puede borrar. Borrar sigue siendo solo de ROOT.

## 5. Corrección por el Supervisor (panel) — qué se verificó y qué cambió

Se revisó el código y los datos de staging para responder dos preguntas:

**¿Guardaba el valor original?** **No.** La corrección sobrescribía `tanques` y las presiones de la lectura sin dejar copia;
en staging las lecturas solo tienen `hora, timestamp, tanques, gas, operativos, alertas` y la colección `logs` (auditoría)
está vacía: nadie la escribe. **Ahora sí:** cada corrección añade a `lectura.correcciones` lo que había **antes**
(tanques, P. Cabezal, P. Separador), quién y cuándo. Las reglas de Firestore **exigen** ese historial: si falta, si el
«antes» no coincide con lo guardado, si lo firma otra persona o si se reescribe una entrada anterior, la corrección se
rechaza (14 pruebas nuevas de reglas). La tabla del panel muestra «Corregida N veces (el valor original se conserva)».

**¿Al corregir una Medida Final se recalcula la medida inicial de la lectura siguiente?** **No, y además el panel no permite
corregir la Medida Final:** su formulario edita Bph, Bpd, Netos y las dos presiones. Cada lectura guarda su propia medida
inicial como copia, así que la siguiente no se altera. Consecuencia: tras una corrección de Bph/Bpd la lectura queda con un
valor derivado que ya no sale de `(mf − mi) × kk ÷ horas`. **No se cambió en esta ronda** (ver sección 7).

**Hallazgo corregido (trigger `onLecturaEdit`):** al recalcular promedios reemplazaba todo el mapa `resultados` y borraba la
marca «quién y cuándo recalculó» (`recalculadoPor`, `recalculadoEn`) que escribe el panel. Ahora actualiza solo los
promedios con rutas anidadas. También ignora las lecturas anuladas.

**El panel y las anuladas:** las lecturas anuladas no cuentan en los promedios ni en el informe oficial; el drill-down las
lista aparte («El Operador anuló N lecturas…») con su motivo, como constancia.

## 6. Qué queda guardado (resumen de datos)

| Dónde | Campo | Contenido |
|---|---|---|
| `lectura` | `anulada`, `anuladaEn`, `anuladaPor`, `anuladaMotivo` | Anulación por el Operador |
| `lectura` | `corrigeA` | Id de la lectura anulada que esta corrige |
| `lectura` | `correcciones[]` | Historial de correcciones del Supervisor: `{ en, por, antes: { tanques, pCab, pSep } }` |
| `lectura.tanques[]` | `aysPct` | AyS % usado (las lecturas anteriores a la 1.0.9 no lo guardaron; al corregirlas se deduce de AyS ÷ Bpd) |
| `lectura` | `alertas[]` | Constancia interna de datos críticos en 0 (junto a las del balance); no sale en los Excel |

## 7. Límites y decisiones a ratificar

- **Los umbrales son propuesta de ingeniería, no una norma del cliente**: 3× la mediana, 500 pulg, −20…300 °F, 0.4…1.5.
  Están en una sola constante cada uno (`packages/core/src/utils/rangos.ts`). No encontré una política de rangos escrita en
  la documentación del proyecto; conviene que el cliente los valide.
- **No bloquea**: la confirmación exige una segunda pulsación pero permite guardar. Si el cliente quiere impedirlo del todo
  (por ejemplo, rechazar valores negativos), es un cambio pequeño.
- **Solo la última lectura** se anula/corrige. Quitar una lectura intermedia obliga a anular desde la última hacia atrás.
- **Corrección del Supervisor**: sigue editando valores derivados (Bph/Bpd/Netos), no la Medida Final; no recalcula la
  cadena de medidas. Si se quiere que corrija la medida y recalcule, es una mejora aparte.
- **Dato huérfano visto en staging**: cuando un Supervisor rechaza una evaluación (vuelve a EN_CURSO), el candado del pozo
  vuelve a esa evaluación aunque ya exista otra EN_CURSO más nueva; esta queda sin dueño (ocurrió con 6 lecturas de prueba
  en SBC-61L). No se tocó; requiere una decisión de producto.
- **No verificado en teléfono ni con datos reales de campo.**
