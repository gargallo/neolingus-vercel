## Pipelines por destreza

### 1) Reading / Listening / Use of English (objetivo)

- Input: hoja de respuestas/JSON
- Corrección: clave + reglas (case-insensitive, lematización opcional, sinónimos)
- Partial credit: configurable por ítem
- Output: aciertos/errores, tiempo por ítem, nota total, mapa de taxonomías

Estados: `created → queued → processing → scored|failed`

### 2) Writing (analítico CEFR / proveedor)

- Prechecks: `wordcount`, TTR, detección plantilla IA, hints gramaticales
- LLM: prompt cerrado con rúbrica (temp=0) → bands por criterio + evidencias
- Comité: 2–3 modelos → consenso median/trimmed mean → `disagreement`
- Normalización: pesos y equivalencias a escala final

### 3) Speaking

- ASR: Whisper/alternativa → transcript + timestamps
- Señales: WPM, pausas >600ms, rellenos, self-repair, coverage
- LLM: rúbrica oral (fluency/coherence, pronunciation, lexis, grammar, interaction)

### 4) Mediación (JQCV/EOI)

- Grounding: textos fuente → verificación de trasvase de info
- LLM: evalúa exactitud, selección, reformulación, registro; penaliza copia literal

### Datos capturados

- `features`: métricas objetivas por destreza
- `evidence`: citas/localizaciones
- `qc`: latencia/costes/disagreement/gold_match
