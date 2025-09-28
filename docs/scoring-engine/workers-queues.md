## Colas y Workers

### Tecnología

- Upstash Redis (serverless) + BullMQ
- Alternativa: Supabase queues (Functions + cron)

### Colas

- `scoring:writing`
- `scoring:speaking`
- `scoring:objective` (reading/listening/UoE batch)

### Payload de job

```json
{
  "attemptId": "...",
  "rubricId": "...",
  "model": "gpt-4o-mini",
  "committee": ["gpt-4o-mini", "deepseek-r1"],
  "seed": 42
}
```

### Reintentos y DLQ

- Reintentos exponenciales (max 3)
- DLQ `scoring:failed` con causa

### Consenso

- Ejecutar modelos en paralelo → recoger bands por criterio → consenso (median/trimmed)
- `disagreement` como std/iqr entre modelos

### Webhooks

- Emitir `attempt.scored` firmado (HMAC)
