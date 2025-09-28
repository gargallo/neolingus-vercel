## T-03 · Colas y Workers (Upstash + BullMQ)

### Objetivo

Implementar colas y workers para Writing/Speaking (async) y objetivo en batch.

### Pasos

1. Configurar Upstash Redis (env vars, cliente).
2. Crear colas `scoring:writing`, `scoring:speaking`, `scoring:objective`.
3. Definir payload de job (attemptId, rubricId, committee, seed).
4. Implementar worker Writing: prechecks → prompt → modelos paralelos → consenso → persistir.
5. Implementar worker Speaking: ASR → señales → prompt → consenso → persistir.
6. Implementar batch objetivo (Reading/UoE): corrección por clave con partial credit.
7. Reintentos exponenciales y DLQ.
8. Webhook `attempt.scored` con firma HMAC.

### Criterios de aceptación

- Jobs se encolan y procesan con trazabilidad.
- Consenso calculado y `disagreement` registrado.
- Reintentos y DLQ funcionales.

### DoD

- Métricas básicas expuestas (procesados/min, fallos).
- Tests de integración de workers.
