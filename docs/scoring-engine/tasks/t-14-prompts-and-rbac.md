## T-14 · Prompts y RBAC

### Objetivo

Definir prompts patrón Writing/Speaking y aplicar RBAC en UI/API.

### Pasos

1. Especificar prompts en `prompts.md` con variables {PROVIDER, LEVEL, RUBRIC}.
2. Integrar `prompt_version` con perfiles de corrector.
3. Aplicar scopes `score:write`, `score:read`, `rubric:admin` en endpoints.
4. UI condicionada por roles (admin/teacher/auditor).

### Criterios de aceptación

- Prompt resuelve JSON válido y estable.
- Accesos restringidos según rol.

### DoD

- Tests de autorización y snapshot de prompts.
