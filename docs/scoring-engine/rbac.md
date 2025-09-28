## RBAC y Capacidades

### Roles

- admin: acceso total
- teacher: re‑score misma rúbrica, comentarios humanos, descargar informes
- auditor: solo lectura + trazas

### Capacidades

- `score:write` – crear intentos
- `score:read` – leer resultados
- `rubric:admin` – CRUD de rúbricas y settings

### Controles UI

- Acceso a `/admin/scoring/*` según rol
- Botón Re‑score visible para `admin|teacher`
