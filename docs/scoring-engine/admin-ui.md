## Admin UI (/admin/scoring/\*)

### Rutas

- `/admin/scoring/attempts` – tabla con filtros, exportaciones CSV/JSON
- `/admin/scoring/attempts/[id]` – detalle, JSON, evidencias, comparar versiones
- `/admin/scoring/rubrics` – editor JSON + validación y versionado
- `/admin/scoring/settings` – modelos, pesos, webhooks, equivalencias
- `/admin/scoring/qc` – anclas, calibración, umbrales re‑score

### Componentes clave

- Tabla virtualizada (10k+) con filtros por `provider/level/task/status`
- Viewer de `scoreJson` con resaltado de evidencias
- Editor de rúbricas con validación AJV y previsualización de bandas
- Panel de `committee` y `disagreement`

### Criterios de aceptación

- Validación de rúbricas antes de guardar
- Rollback de versiones
- Re‑score manual con comentario
- RBAC: admin/teacher/auditor
