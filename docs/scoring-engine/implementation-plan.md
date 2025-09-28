## Plan Maestro de Implementación

### Fase 1 (MVP)

- Tablas `scoring_*`
- Endpoints `/api/v1/score`, `/api/v1/rubrics`, `/api/v1/health`
- Pipeline objetivo (Reading/UoE) sync
- Workers Writing (1 modelo)
- Admin `/admin/scoring/attempts`, `/admin/scoring/rubrics`

### Fase 2

- Comité de modelos + consenso
- Speaking (ASR + señales)
- Webhooks + Settings
- Analytics básicas

### Fase 3

- Mediación con grounding
- Psicometría avanzada
- Panel QC y calibración
- Borderline policy

### Dependencias

- Upstash Redis / Supabase
- Model providers (OpenAI/DeepSeek)
- Whisper/ASR
