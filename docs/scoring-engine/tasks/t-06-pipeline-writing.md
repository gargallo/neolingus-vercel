## T-06 · Pipeline Writing

### Objetivo

Corregir Writing con rúbrica analítica CEFR por proveedor con comité de modelos.

### Pasos

1. Prechecks: wordcount (± margen), TTR, heurística plantillas IA.
2. Construcción de prompt con rúbrica versionada y contexto.
3. Llamadas paralelas a modelos del comité (temp=0, seed fija).
4. Consenso bands por criterio, cálculo `disagreement`.
5. Normalización con pesos y equivalencias; decisión final.
6. Guardar evidencias (spans/notas) y features objetivas.

### Criterios de aceptación

- JSON válido contra `ScoringResult`.
- Reproducibilidad (seed, temp=0) en CI.

### DoD

- Tests de regresión con dataset ancla.
