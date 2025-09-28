## T-01 · Migraciones BD Scoring

### Objetivo

Crear tablas `scoring_rubrics`, `scoring_attempts`, `scoring_attempt_events`, `scoring_correctors`, `scoring_webhooks`, `scoring_settings` con índices.

### Pasos

1. Crear migración `supabase/migrations/2025XXXX_scoring_engine.sql` con SQL de `database-schema.md`.
2. Añadir índices e invariantes (UNIQUE y CHECKs).
3. Actualizar `setup-database.sql` para incluir el nuevo bloque.
4. Ejecutar en local y en CI `npm run verify-db`.

### Criterios de aceptación

- Las tablas existen con constraints e índices.
- `EXPLAIN` en consultas críticas muestra índices en uso.
- Permite FK opcional a `exam_sessions`.

### DoD

- Migración idempotente y rollback seguro.
- Documentación actualizada.
