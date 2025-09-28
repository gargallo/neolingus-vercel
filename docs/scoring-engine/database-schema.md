## Esquema de Base de Datos (Supabase/Postgres)

Objetivo: tablas explícitas para scoring, separadas pero compatibles con `exam_sessions`/`user_answers` existentes.

### Tablas nuevas

#### 1) `scoring_rubrics`

```
id UUID PK DEFAULT uuid_generate_v4()
provider TEXT NOT NULL CHECK (provider IN ('EOI','JQCV','Cambridge','Cervantes'))
level TEXT NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2'))
task TEXT NOT NULL CHECK (task IN ('reading','listening','use_of_english','writing','speaking','mediation'))
version TEXT NOT NULL, -- p.ej. EOI-C1-WR-v3
json JSONB NOT NULL, -- rúbrica completa
is_active BOOLEAN DEFAULT true
archived_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(provider, level, task, version)
```

Índices sugeridos: `(provider, level, task)`, `is_active`.

#### 2) `scoring_attempts`

```
id UUID PK DEFAULT uuid_generate_v4()
tenant_id TEXT NOT NULL
user_id UUID NULL
exam_session_id UUID NULL REFERENCES exam_sessions(id) ON DELETE SET NULL
exam_id TEXT NULL
provider TEXT NOT NULL
level TEXT NOT NULL
task TEXT NOT NULL
payload JSONB NOT NULL DEFAULT '{}' -- answers|text|audioUrl|sourceText
status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','scored','failed'))
rubric_id UUID NOT NULL REFERENCES scoring_rubrics(id)
rubric_ver TEXT NOT NULL
model_name TEXT NOT NULL
committee JSONB DEFAULT '[]' -- modelos participantes
score_json JSONB NULL -- salida normalizada
qc_json JSONB NULL -- latencias, desacuerdo, señales, costes
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

Índices: `(status)`, `(provider, level, task)`, `(created_at)`, `(exam_session_id)`.

#### 3) `scoring_attempt_events`

```
id UUID PK DEFAULT uuid_generate_v4()
attempt_id UUID NOT NULL REFERENCES scoring_attempts(id) ON DELETE CASCADE
type TEXT NOT NULL CHECK (type IN ('created','queued','started','scored','failed','re_scored','appeal'))
data JSONB NOT NULL DEFAULT '{}'
at TIMESTAMPTZ DEFAULT NOW()
INDEX (attempt_id, at)
```

#### 4) `scoring_correctors`

```
id UUID PK DEFAULT uuid_generate_v4()
name TEXT NOT NULL
description TEXT
provider TEXT NOT NULL
level TEXT NOT NULL
task TEXT NOT NULL
committee JSONB NOT NULL DEFAULT '[]' -- lista de modelos: [{provider,name,temperature,seed}]
model_config JSONB NOT NULL DEFAULT '{}' -- límites, max_tokens, top_p, etc.
prompt_version TEXT NOT NULL DEFAULT 'PROMPT_WR_v1' -- o SP
rubric_id UUID NULL REFERENCES scoring_rubrics(id) ON DELETE SET NULL -- override por perfil
active BOOLEAN DEFAULT true
created_by UUID NULL REFERENCES admin_users(id)
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(provider, level, task, name)
```

Índices: `(provider, level, task, active)`.

Relación propuesta: se puede mapear 1..N correctores por combinación proveedor/nivel/destreza.

#### 5) `scoring_webhooks`

```
id UUID PK DEFAULT uuid_generate_v4()
tenant_id TEXT NOT NULL
url TEXT NOT NULL
events TEXT[] NOT NULL DEFAULT ARRAY['attempt.scored']::TEXT[]
secret TEXT NOT NULL
active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### 6) `scoring_settings`

```
tenant_id TEXT PK
defaults JSONB NOT NULL DEFAULT '{"model":"gpt-4o-mini","committee":["gpt-4o-mini","deepseek-r1"]}'
weights JSONB NOT NULL DEFAULT '{}' -- overrides por proveedor
equivalences JSONB NOT NULL DEFAULT '{}' -- escalas/umbrales
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### Migraciones (sketch SQL)

```sql
-- 2025XXXX_scoring_engine.sql
CREATE TABLE IF NOT EXISTS scoring_rubrics (...);
CREATE TABLE IF NOT EXISTS scoring_attempts (...);
CREATE TABLE IF NOT EXISTS scoring_attempt_events (...);
CREATE TABLE IF NOT EXISTS scoring_webhooks (...);
CREATE TABLE IF NOT EXISTS scoring_settings (...);

CREATE INDEX IF NOT EXISTS idx_sc_attempts_status ON scoring_attempts(status);
CREATE INDEX IF NOT EXISTS idx_sc_attempts_plt ON scoring_attempts(provider, level, task);
CREATE INDEX IF NOT EXISTS idx_sc_attempts_created ON scoring_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_sc_correctors_active ON scoring_correctors(provider, level, task, active);
```

### Compatibilidad con tablas existentes

- `exam_sessions` → enlazar opcionalmente vía `exam_session_id` para trazabilidad con simuladores
- `ai_agents` → aprovechar como plantillas/modelos por rúbrica

### Retención y privacidad

- Minimizar PII en `payload`; almacenar `audioUrl`/blobs con TTL configurable
- Seudonimizar `user_id` cuando sea posible; auditoría de accesos a rúbricas y resultados
