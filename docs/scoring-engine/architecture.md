## Arquitectura del Scoring Engine

### Capas

1. Frontend NeoLingus (Next.js): simuladores + paneles admin
2. Scoring Engine API: `/api/v1/*` (Next.js route handlers) con opción microservicio externo
3. Workers: colas para Writing/Speaking (ASR + LLM), consensos y normalización
4. Almacenamiento: Supabase (Postgres), Blob/S3 para archivos, Vector DB opcional para RAG
5. Observabilidad: logs estructurados, métricas, trazas y auditoría

### Flujo estándar

1. Front sube materiales → crea `Attempt`
2. API resuelve y fija rúbrica → encola trabajo si asíncrono
3. Workers corrigen (LLM/ASR) → consenso → normalización
4. Guarda `scoreJson` y `qcJson` → emite evento/webhook
5. UI/Admin consulta `GET /score/:id` y muestra evidencias

### Decisiones clave

- Reproducibilidad: `temperature=0`, prompts versionados, `seed` fija por modelo/comité
- Idempotencia: header `Idempotency-Key` en `POST /score`
- Multi‑proveedor: rúbricas versionadas y pesadas por `provider/level/task`
- Comité de modelos: `median`/`trimmed mean` con `disagreement` como señal de incertidumbre
- Seguridad: `JWT` con scopes; mínimos datos; RGPD; auditoría de cambios de rúbricas

### Endpoints principales

- `POST /api/v1/score` → crea/encola intento (async para Writing/Speaking)
- `GET /api/v1/score/{attemptId}` → estado/resultado
- `POST /api/v1/rubrics` → alta/actualización de rúbricas
- `GET /api/v1/rubrics/{id}` → lectura de rúbrica
- `POST /api/v1/webhooks` → registrar listeners para `attempt.scored`
- `GET /api/v1/health` → liveness/readiness

### Compatibilidad con NeoLingus

- Mapea `Attempt` con `exam_sessions` y/o tabla dedicada `scoring_attempts`
- Reutiliza `ai_agents` para plantillas de prompts y modelos
- Admin panel bajo `/admin/scoring/*`

### Despliegue

- Opción A (monolito): Next.js routes + cron/queues gestionadas (Upstash/QStash)
- Opción B (microservicio): servicio Node con la misma API; Next.js actúa de gateway
