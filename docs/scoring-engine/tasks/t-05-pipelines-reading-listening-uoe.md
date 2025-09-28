## T-05 · Pipelines Reading/Listening/Use of English

### Objetivo

Implementar corrección objetiva con clave, tolerancias y partial credit.

### Pasos

1. Definir esquema de clave por ítem con reglas de tolerancia.
2. Normalizar respuestas (case, trim, lemas/sinónimos si activo).
3. Cálculo de puntuación por ítem (incluye multi‑respuesta y cloze).
4. Agregación por sección y total, mapeo a escala 0–100.
5. Guardar breakdown y taxonomías.

### Criterios de aceptación

- Cobertura de tipos: MCQ, TF, gap‑fill, matching, drag‑drop.
- Partial credit configurable por ítem.

### DoD

- Tests unitarios con conjuntos de prueba.
- Performance aceptable en batch.
