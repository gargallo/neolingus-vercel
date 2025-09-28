## Perfiles de Correctores (Corrector Profiles)

### Objetivo

Permitir crear, versionar y activar perfiles de correctores por combinación `provider/level/task`, seleccionando comité de modelos, configuración y rúbrica asociada.

### Esquema

- Tabla `scoring_correctors` (ver `database-schema.md`)
- Relación opcional con `scoring_rubrics` para override de rúbrica base

### Selección de Comité

- Lista de modelos: `[ { provider: 'openai', name: 'gpt-4o-mini', temperature: 0, seed: 42 }, ... ]`
- Regla de consenso: median/trimmed mean

### Versionado

- `prompt_version` enlazado a `prompts.md`
- Cambios mayores → nuevo perfil y soft‑disable del anterior (`active=false`)

### UI

- En `/admin/scoring/settings` → pestaña "Correctores"
- Crear/editar perfil: provider, level, task, comité, prompt_version, rubric override
- Botón "Probar" (dry‑run) con dataset ancla

### DoD

- Crear, editar, activar/desactivar y probar perfiles
- Validación de comité y compatibilidad con task
- Trazabilidad de cambios (audit log)
