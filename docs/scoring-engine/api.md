## API v1 del Scoring Engine

### Autenticación

- JWT con scopes: `score:write`, `score:read`, `rubric:admin`
- Idempotencia: header `Idempotency-Key` en `POST /score`

### Endpoints

#### POST `/api/v1/score`

Body:

```json
{
  "provider": "EOI|Cambridge|Cervantes|JQCV",
  "level": "B2|C1|C2|...",
  "task": "reading|listening|use_of_english|writing|speaking|mediation",
  "payload": {
    "answers": [],
    "text": "...",
    "audioUrl": "...",
    "sourceText": "..."
  },
  "examId": "...",
  "attemptId": "..."
}
```

Respuestas:

- 202 Accepted (async) → `{ "attemptId": "A1", "status": "queued" }`
- 200 OK (sync para MCQ) → resultado completo

#### GET `/api/v1/score/{attemptId}`

- Devuelve estado o resultado final `scoreJson`

#### POST `/api/v1/rubrics`

- Crea/actualiza una rúbrica (valida `json-schemas.md`)

#### GET `/api/v1/rubrics/{id}`

- Devuelve rúbrica por id

#### POST `/api/v1/webhooks`

- Registra listener para `attempt.scored` (firma HMAC con `secret`)

#### GET `/api/v1/health`

- Señales de liveness/readiness, conectividad DB/colas/modelos

### Errores comunes

- 400 Validación de esquema
- 401/403 Auth/Scopes insuficientes
- 409 Idempotencia en conflicto
- 422 Rúbrica incompatible
- 500 Fallos internos/modelos/colas

### Notas de implementación

- Writing/Speaking → async + Workers
- Reading/Listening/UoE → sync o batch
- Guardar `AttemptEvent` por transición de estado
