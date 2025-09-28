## Esquemas JSON

### 1) Rúbrica (JSON Schema draft-07)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ScoringRubric",
  "type": "object",
  "required": ["provider", "level", "task", "version", "criteria", "scoring"],
  "properties": {
    "provider": {
      "type": "string",
      "enum": ["EOI", "JQCV", "Cambridge", "Cervantes"]
    },
    "level": { "type": "string", "enum": ["A1", "A2", "B1", "B2", "C1", "C2"] },
    "task": {
      "type": "string",
      "enum": [
        "reading",
        "listening",
        "use_of_english",
        "writing",
        "speaking",
        "mediation"
      ]
    },
    "version": { "type": "string" },
    "criteria": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "label", "weight", "bands"],
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "weight": { "type": "number", "minimum": 0, "maximum": 1 },
          "bands": { "type": "array", "items": { "type": "number" } }
        }
      }
    },
    "scoring": {
      "type": "object",
      "required": ["band_min", "band_max", "normalize_to"],
      "properties": {
        "band_min": { "type": "number" },
        "band_max": { "type": "number" },
        "normalize_to": { "type": "number" },
        "equating": { "type": "object" }
      }
    }
  }
}
```

### 2) Salida unificada de scoring (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ScoringResult",
  "type": "object",
  "required": [
    "attemptId",
    "provider",
    "level",
    "task",
    "rubric",
    "model",
    "scores",
    "weights",
    "final"
  ],
  "properties": {
    "attemptId": { "type": "string" },
    "provider": { "type": "string" },
    "level": { "type": "string" },
    "task": { "type": "string" },
    "rubric": { "type": "string" },
    "model": { "type": "object" },
    "committee": { "type": "array", "items": { "type": "string" } },
    "consensus": { "type": "object" },
    "features": { "type": "object" },
    "scores": { "type": "object" },
    "weights": { "type": "object" },
    "final": {
      "type": "object",
      "required": ["raw", "scale100"],
      "properties": {
        "raw": { "type": "number" },
        "scale100": { "type": "number" },
        "decision": { "type": "string" },
        "borderline": { "type": "boolean" }
      }
    },
    "evidence": { "type": "array", "items": { "type": "object" } },
    "qc": { "type": "object" }
  }
}
```

### 3) Validación y versionado

- Validar JSON con `ajv` en runtime y en CI
- Versionar cambios de esquema con `schemaVersion` dentro de rúbrica si procede
