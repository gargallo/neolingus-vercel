## Migraciones y Rollout

### Pasos

1. Crear tablas `scoring_*` (migración idempotente)
2. Integrar API `/api/v1/*` sin exponer en UI (feature flag)
3. Seed de rúbricas base
4. Workers en modo canary con tracing
5. Activar Admin UI para roles `admin`
6. Activar para `teacher`/`auditor`

### Backfill

- Mapear `exam_sessions` existentes → `scoring_attempts` si procede

### Plan de rollback

- Desactivar colas y feature flag
- Mantener tablas (no destructive)
