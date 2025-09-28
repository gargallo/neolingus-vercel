## T-07 · Pipeline Speaking

### Objetivo

Corregir Speaking con ASR + señales objetivas + rúbrica oral CEFR.

### Pasos

1. Validar audio (16kHz mono PCM, duración, bitrate).
2. ASR (Whisper/alternativa) → transcript + timestamps.
3. Extraer señales: WPM, pausas, rellenos, self‑repair, coverage.
4. Prompt con rúbrica y señales → bands por criterio.
5. Consenso y normalización.
6. Guardar `features`, `evidence`, `qc`.

### Criterios de aceptación

- Manejo de audio corrupto y formatos no válidos.
- Señales verificables con timestamps.

### DoD

- Tests con muestras de audio cortas.
