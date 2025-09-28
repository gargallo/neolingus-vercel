## T-02 · API Endpoints Scoring

### Objetivo

Implementar `/api/v1/score`, `/api/v1/score/[id]`, `/api/v1/rubrics`, `/api/v1/rubrics/[id]`, `/api/v1/webhooks`, `/api/v1/health`.

### Pasos

1. Validación input con Zod/AJV (usar `json-schemas.md`).
2. Auth JWT + scopes; Idempotency-Key en `POST /score`.
3. MCQ sync; Writing/Speaking → enqueue job.
4. Guardar `scoring_attempts` + `scoring_attempt_events`.
5. `GET /score/:id` retorna estado/resultado.
6. CRUD básico rúbricas (POST/GET) con validación.
7. Registrar webhooks con firma HMAC.

### Criterios de aceptación

- Status codes correctos (200/202/4xx/5xx).
- Idempotencia probada.
- Esquemas validados.

### DoD

- Tests de integración verdes.
- Logs estructurados.
