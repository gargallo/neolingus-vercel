## T-04 · Admin UI Scoring

### Objetivo

Crear interfaz admin `/admin/scoring/*` con intentos, detalle, rúbricas, settings y QC.

### Pasos

1. Ruta `/admin/scoring/attempts`: tabla con filtros y exportación CSV/JSON.
2. Ruta `/admin/scoring/attempts/[id]`: detalle con `scoreJson`, evidencias y comparación.
3. Ruta `/admin/scoring/rubrics`: editor JSON con validación AJV y preview de bandas.
4. Ruta `/admin/scoring/settings`: modelos, pesos, webhooks, equivalencias y correctores.
5. Ruta `/admin/scoring/qc`: anclas, resultados de calibración, umbrales de re‑score.

### Criterios de aceptación

- Validación visual de rúbrica antes de guardar.
- Rollback de versiones.
- Re‑score manual con comentario y auditoría.

### DoD

- RBAC aplicado (admin/teacher/auditor).
- Tests e2e de navegación básica.
