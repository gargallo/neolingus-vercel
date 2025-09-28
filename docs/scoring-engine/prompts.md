## Prompts Patrón (Writing/Speaking)

### Sistema (Writing)

"Eres un examinador de {{PROVIDER}} nivel {{LEVEL}}. Usa ÚNICAMENTE la rúbrica JSON adjunta. Devuelve JSON válido según el esquema de salida. temperature=0, no inventes datos."

### Usuario

- Texto del alumno
- Contexto de tarea (instrucciones, límites de palabras)

### Salida

- Bands por criterio
- Evidencias (citas/localización)
- Comentarios accionables (2–3)
- Nota final normalizada

### Speaking (ASR + LLM)

- Transcript + timestamps
- Señales objetivas incorporadas al contexto
