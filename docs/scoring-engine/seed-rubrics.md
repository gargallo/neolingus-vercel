## Seed Inicial de Rúbricas y Versionado

### Rúbricas base

- EOI‑C1‑WR (`EOI-C1-WR-v1`)
- EOI‑C1‑SP (`EOI-C1-SP-v1`)
- Cambridge‑B2‑WR (`CAM-B2-WR-v1`)
- JQCV‑C1‑EIO Mediación (`JQCV-C1-MED-v1`)

### Estrategia de versionado

- `PROV-NIV-DEST-vX`
- Cambios mayores requieren nueva versión (inmutable)
- Mantener `is_active` y `archived_at`

### Script de seed

- Insertar en `scoring_rubrics` con validación AJV previa
