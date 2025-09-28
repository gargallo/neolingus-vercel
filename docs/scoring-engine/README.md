## NeoLingus Scoring Engine

Documento maestro del sistema de corrección automática multi‑proveedor (EOI/JQCV/Cambridge/Cervantes). Esta carpeta define especificaciones completas para implementar un motor de scoring robusto, trazable y controlable desde el panel admin de NeoLingus.

### Objetivos

- Fidelidad a rúbricas oficiales y CEFR
- Trazabilidad total (criterios, evidencias, versión de rúbrica/modelo)
- Reproducibilidad (temp=0, prompts versionados, semillas fijas)
- Modularidad (API/Workers/UI desacoplados)
- Privacidad y RGPD
- Mejora continua (calibración, comité de modelos, métricas psicométricas)

### Índice

- Arquitectura: `architecture.md`
- Esquema BD y migraciones: `database-schema.md`
- Esquemas JSON (rúbrica y salida): `json-schemas.md`
- API v1: `api.md`
- Pipelines por destreza: `pipelines.md`
- Colas y Workers: `workers-queues.md`
- Admin UI (rutas /admin/scoring/\*): `admin-ui.md`
- Perfiles de correctores: `correctors-profiles.md`
- Dashboards y analítica: `analytics-dashboards.md`
- Seguridad y privacidad: `security-privacy.md`
- Observabilidad y costes: `observability-costs.md`
- Calibración y calidad: `calibration-quality.md`
- Seed de rúbricas: `seed-rubrics.md`
- Plan de testing: `testing-plan.md`
- Migraciones y rollout: `migrations-rollout.md`
- Plan de implementación: `implementation-plan.md`
- Prompts patrón (Writing/Speaking): `prompts.md`
- RBAC y permisos: `rbac.md`

### Tareas detalladas

- Ver carpeta `tasks/` con un `.md` por tarea (pasos, criterios de aceptación, DoD)

### Convenciones

- Versionado semántico de rúbricas: `PROV-NIV-DEST-vX`
- Versionado de prompts: `PROMPT_WR_vX`, `PROMPT_SP_vX`
- Semillas fijas por comité: `seed=42` (configurable)
- JSON estable y validado por JSON Schema

### Entregables de esta carpeta

Esta carpeta contiene documentación ejecutable por equipos de backend, frontend y datos. Cada archivo `.md` describe tareas accionables, criterios de aceptación y referencias a endpoints/DB/UI para que la IA/Equipo implemente sin ambigüedades.
