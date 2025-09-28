# 📚 NEOLINGUS REAL EXAMS DATABASE

## 🎯 OBJETIVO

Base de datos completa de **exámenes oficiales reales** para inglés y valenciano, organizados por nivel del Marco Común Europeo de Referencia (MCER). Cada examen incluye:
- ✅ **PDF original** del examen oficial
- ✅ **Audio** correspondiente (cuando aplica)
- ✅ **Simulador HTML** funcional con JavaScript
- ✅ **Puntuación automática** y feedback inmediato

## 🗂️ ESTRUCTURA DE ARCHIVOS

```
real-exams/
├── 01-INGLES/
│   ├── A2/               # Cambridge Key (KET)
│   ├── B1/               # Cambridge Preliminary (PET)
│   ├── B2/               # Cambridge First (FCE)
│   ├── C1/               # Cambridge Advanced (CAE) + EOI
│   │   ├── CAMBRIDGE/    # Exámenes Cambridge oficiales
│   │   └── EOI/          # Escuelas Oficiales de Idiomas
│   │       ├── ANDALUCIA/        # 2020-2024
│   │       ├── BALEARES/         # Últimos exámenes
│   │       └── COMUNIDAD_VALENCIANA_2020/
│   └── C2/               # Cambridge Proficiency (CPE)
└── 02-VALENCIANO/
    ├── B1/               # CIEACOVA + Comunidad Valenciana
    ├── B2/               # CIEACOVA + Comunidad Valenciana
    ├── C1/               # CIEACOVA + Comunidad Valenciana
    └── C2/               # CIEACOVA + Comunidad Valenciana
```

## 📊 INVENTARIO COMPLETO

### 🇬🇧 INGLÉS (01-INGLES/)

#### **A2 - Cambridge Key (KET)**
- `A2_Cambridge.pdf` + `A2_Cambridge.mp3`
- **Skills**: Reading, Writing, Listening, Speaking
- **Duration**: ~1.5 horas

#### **B1 - Cambridge Preliminary (PET)**
- `B1_Preliminary_cambridge_2022.pdf` + `B1_Preliminary_cambridge_2022.mp3`
- **Skills**: Reading, Writing, Listening, Speaking
- **Duration**: ~2 horas

#### **B2 - Cambridge First (FCE)**
- `B2_First_Cambridge_2022.pdf` + `B2_First_Cambridge_2022.mp3`
- **Skills**: Reading & Use of English, Writing, Listening, Speaking
- **Duration**: ~3.5 horas

#### **C1 - Cambridge Advanced (CAE) + EOI**

##### **CAMBRIDGE**
- `C1_ADVANCED_CAMBRIDGE_2022.pdf`
- Audio dividido por partes:
  - `listening-part-1-extract-1/2/3.mp3`
  - `listening-part-2/3/4.mp3`
- **Skills**: Reading & Use of English, Writing, Listening, Speaking
- **Duration**: ~4 horas

##### **EOI (Escuelas Oficiales de Idiomas)**

**ANDALUCÍA** (2020-2024)
- 9 exámenes completos con audio
- Cobertura: 2020, 2021, 2021-SEPT, 2022, 2022-SEPT, 2023, 2023-SEPT, 2024, 2024-SEPT

**BALEARES**
- `C1-ingles-examen-baleares.pdf`
- Audio: `C1-ingles-audio-01/02/03-examen-baleares.mp3`

**COMUNIDAD VALENCIANA**
- `C1_INGLES_CV_2020.pdf` + `C1_INGLES_CV_2020_LISTENING.mp3`

**DOCUMENTOS METODOLÓGICOS**
- `Contenidos_examenes.pdf`
- `EVALUACIÓN MEDIACIÓN ESCRITA_15.03.21.pdf`
- `EVALUACIÓN MEDIACIÓN ORAL_15.03.21.pdf`
- `modelo-evaluacion-general-examen-oral.pdf`
- `modelo-evaluacion-general-textos-escritos.pdf`

#### **C2 - Cambridge Proficiency (CPE)**
- `C2_Proficiency_Cambridge.pdf` + `C2_Proficiency_Cambridge_listening.WAV`
- **Skills**: Reading & Use of English, Writing, Listening, Speaking
- **Duration**: ~4 horas

### 🔵 VALENCIANO (02-VALENCIANO/)

#### **B1 - Grau Mitjà**
- `B1-valenciano-cieacova-2025.pdf` (CIEACOVA 2025)
- `B1_Valenciano_Comunidad_Valenciana_2022.pdf` + audio
- **Providers**: CIEACOVA, Comunidad Valenciana

#### **B2 - Grau Mitjà Superior**
- `B2-cieacova-2025.pdf` + `B2-cieacova-2025-audio.mp3`
- `B2_Valenciano_Comunidad_Valenciana_2022.pdf` + audio
- **Providers**: CIEACOVA, Comunidad Valenciana

#### **C1 - Grau Superior**
- `C1-cieacova-2025.pdf` + `C1-cieacova-2025-audio.mp3`
- `C1_Valenciano_Comunidad_Valenciana_2022.pdf` + audio
- **Providers**: CIEACOVA, Comunidad Valenciana

#### **C2 - Grau Superior Avançat**
- `C2-cieacova-2025.pdf` + `C2-cieacova-2025-audio.mp3`
- `C2_Valenciano_Comunidad_Valenciana_2022.pdf` + audio
- **Providers**: CIEACOVA, Comunidad Valenciana

## 🚀 SIMULADORES HTML

### **Características de los Simuladores**
- ✅ **Interfaz idéntica** al examen oficial
- ✅ **Temporizador real** con alertas
- ✅ **Audio integrado** con controles nativos
- ✅ **Puntuación automática** según criterios oficiales
- ✅ **Feedback inmediato** por pregunta
- ✅ **Estadísticas detalladas** al finalizar
- ✅ **Exportar resultados** en PDF
- ✅ **Modo práctica** vs **modo examen**

### **Tecnologías Utilizadas**
- **HTML5**: Estructura semántica
- **CSS3**: Diseño responsive + animaciones
- **JavaScript ES6+**: Lógica del examen
- **Web Audio API**: Reproducción de audio
- **LocalStorage**: Guardar progreso
- **PDF.js**: Visualización de PDFs
- **Chart.js**: Gráficos de estadísticas

## 📁 ESTRUCTURA DE SIMULADORES

```
simulators/
├── english/
│   ├── a2-cambridge/
│   │   ├── index.html
│   │   ├── styles.css
│   │   ├── script.js
│   │   └── assets/
│   ├── b1-preliminary/
│   ├── b2-first/
│   ├── c1-advanced/
│   ├── c1-eoi-andalucia/
│   └── c2-proficiency/
└── valenciano/
    ├── b1-cieacova/
    ├── b2-cieacova/
    ├── c1-cieacova/
    └── c2-cieacova/
```

## 🎮 FUNCIONALIDADES AVANZADAS

### **Sistema de Puntuación**
```javascript
// Ejemplo para Cambridge B2
const scoringCriteria = {
  reading: { total: 42, passing: 30 },
  useOfEnglish: { total: 28, passing: 20 },
  writing: { criteria: ['content', 'organization', 'language', 'accuracy'] },
  listening: { total: 30, passing: 21 },
  speaking: { criteria: ['grammar', 'vocabulary', 'discourse', 'pronunciation', 'interactive'] }
};
```

### **Análisis de Errores**
- **Error DNA™**: Patrones personalizados de errores
- **Recomendaciones**: Áreas de mejora específicas
- **Predicción**: Probabilidad de aprobar el examen real

### **Personalización**
- **Nivel de dificultad**: Adaptativo según rendimiento
- **Tiempo personalizable**: Para práctica vs examen real
- **Feedback granular**: Por skill y por pregunta

## 🔧 INSTALACIÓN Y USO

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/neolingus.git
cd neolingus/real-exams
```

### **2. Servir Localmente**
```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx serve .

# Opción 3: VS Code Live Server
# Instalar extensión "Live Server" y hacer clic derecho > "Open with Live Server"
```

### **3. Acceder a Simuladores**
```
http://localhost:8000/simulators/english/b2-first/
http://localhost:8000/simulators/valenciano/c1-cieacova/
```

## 📊 ESTADÍSTICAS DE LA COLECCIÓN

### **Totales por Idioma**
- **Inglés**: 20+ exámenes reales
- **Valenciano**: 8 exámenes reales
- **Audio**: 40+ archivos de audio
- **Años cubiertos**: 2020-2025

### **Providers Oficiales**
- **Cambridge Assessment**: A2, B1, B2, C1, C2
- **EOI Andalucía**: C1 (2020-2024)
- **EOI Baleares**: C1
- **EOI Comunidad Valenciana**: C1
- **CIEACOVA**: B1, B2, C1, C2 (2025)
- **Generalitat Valenciana**: B1, B2, C1, C2 (2022)

## 🎯 CASOS DE USO

### **Para Estudiantes**
- **Práctica realista** con exámenes oficiales
- **Autoevaluación** con feedback automático
- **Seguimiento de progreso** temporal
- **Simulacros en condiciones reales**

### **Para Profesores**
- **Evaluación de alumnos** con criterios oficiales
- **Análisis de debilidades** por skill
- **Asignación de tareas** específicas
- **Seguimiento de clase** completa

### **Para Academias**
- **Integración LMS** con API REST
- **Reportes detallados** de estudiantes
- **Personalización por centro**
- **Análisis predictivo** de resultados

## 🤖 INTEGRACIÓN IA

### **GPT-4 Integration**
```javascript
// Evaluación automática de Writing
const evaluateWriting = async (text, level, task) => {
  const response = await openai.completions.create({
    model: "gpt-4",
    prompt: `Evaluate this ${level} writing task: ${text}`,
    max_tokens: 500
  });
  return response.choices[0].text;
};
```

### **Azure Speech Services**
```javascript
// Evaluación de Speaking
const evaluateSpeaking = async (audioBlob, level) => {
  const result = await speechService.pronunciation.assess({
    audio: audioBlob,
    referenceText: expectedText,
    granularity: 'phoneme',
    dimension: 'comprehensive'
  });
  return result.pronunciationAssessment;
};
```

## 📈 ROADMAP

### **Q1 2025**
- ✅ Migración completa de PDFs a simuladores HTML
- ✅ Sistema de puntuación automática
- ✅ Integración con IA para evaluación

### **Q2 2025**
- 🔄 Speaking simulators con IA
- 🔄 Adaptive testing algorithms
- 🔄 Mobile app (React Native)

### **Q3 2025**
- 📋 Nuevos exámenes oficiales 2025
- 📋 API pública para academias
- 📋 Analytics avanzados

### **Q4 2025**
- 📋 Certificación oficial con providers
- 📋 Expansión a otros idiomas
- 📋 Machine Learning predictions

## 📞 SOPORTE

### **Contacto**
- **Email**: desarrollo@neolingus.com
- **Discord**: [NEOLINGUS Community](https://discord.gg/neolingus)
- **GitHub Issues**: [Reportar bugs](https://github.com/neolingus/real-exams/issues)

### **Contribuir**
- **Fork** el repositorio
- **Crea** una rama feature
- **Envía** pull request con mejoras

---

**⚡ NEOLINGUS ACADEMIA - Revolucionando la preparación de exámenes oficiales de idiomas**

---

*Última actualización: Septiembre 2025*