## Plan de Tests

### Unit (Vitest)

- Validación de esquemas JSON (rúbricas, resultados)
- Normalización de puntuaciones y pesos
- Cálculo de consenso y `disagreement`

### Integration

- `POST /score` sync (MCQ)
- `POST /score` async (Writing/Speaking) + Workers
- Webhooks firmados

### E2E (Playwright)

- Flujos admin `/admin/scoring/*`
- Subida de intento y visualización de resultado

### Regresión de prompts

- Dataset ancla + snapshot de salidas
- Tolerancias y alertas en CI
