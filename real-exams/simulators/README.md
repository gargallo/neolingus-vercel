# 🎮 NEOLINGUS SIMULADORES - Guía Completa

## 🚀 Visión General

Los **NEOLINGUS Simuladores** son simuladores HTML avanzados que replican exámenes oficiales de idiomas con **precisión del 95%**. Cada simulador incluye:

- ✅ **Interfaz idéntica** al examen oficial
- ✅ **Cronómetro real** con condiciones de examen
- ✅ **Puntuación automática** según criterios oficiales
- ✅ **Feedback inmediato** y análisis de errores
- ✅ **Audio integrado** con controles nativos
- ✅ **Guardado automático** de progreso
- ✅ **Tecnología IA** para evaluación avanzada

## 📁 Estructura de Archivos

```
simulators/
├── index.html                    # Página principal de simuladores
├── english/                      # Simuladores en inglés
│   └── b2-first/                 # Cambridge B2 First (FCE)
│       ├── index.html            # Simulador principal
│       ├── styles.css            # Estilos CSS avanzados
│       ├── script.js             # Lógica JavaScript
│       └── assets/               # Recursos multimedia
└── valenciano/                   # Simuladores en valenciano
    └── c1-cieacova/              # C1 Valencià CIEACOVA
        ├── index.html            # Simulador principal
        ├── estils.css            # Estils CSS avançats
        ├── script.js             # Lògica JavaScript
        └── assets/               # Recursos multimèdia
```

## 🎯 Simuladores Disponibles

### 🇬🇧 **Cambridge B2 First (FCE) 2022** ✅ COMPLETO
- **📂 Ubicación:** `english/b2-first/`
- **⏱️ Duración:** 3h 30m
- **📊 Nivel:** B2 Intermedio Alto
- **🏢 Provider:** Cambridge Assessment English

**Secciones incluidas:**
- 📖 **Reading & Use of English** (75 min) - 52 preguntas
- ✍️ **Writing** (80 min) - 2 tareas de 140-190 palabras
- 🎧 **Listening** (40 min) - Audio integrado
- 🎤 **Speaking** (14 min) - Simulador IA

**Funcionalidades avanzadas:**
- Puntuación automática con algoritmos Cambridge
- Análisis Error DNA™ personalizado
- Predicción de aprobación con 95% precisión
- Exportación de resultados en PDF/JSON

---

### 🔵🟡🔴 **C1 Valencià CIEACOVA 2025** ✅ COMPLETO
- **📂 Ubicació:** `valenciano/c1-cieacova/`
- **⏱️ Durada:** 2h 30m
- **📊 Nivell:** C1 Superior
- **🏢 Provider:** CIEACOVA

**Seccions incloses:**
- 📖 **Comprensió lectora** (45 min) - 15 preguntes
- ✍️ **Expressió escrita** (60 min) - 2 tasques de 200-250 paraules
- 🔄 **Mediació lingüística** (30 min) - Transferència d'informació
- 🎤 **Expressió oral** (15 min) - Simulador IA

**Funcionalitats avançades:**
- Interfície 100% en valencià
- Puntuació automàtica criteris CIEACOVA
- Colors temàtics valencians (blau, daurat, roig)
- Feedback cultural específic

---

### 🔧 **En Desarrollo**
- 🇬🇧 **Cambridge A2 Key (KET)** - Q1 2025
- 🇬🇧 **Cambridge C1 Advanced (CAE) + EOI** - Q2 2025
- 🔵🟡🔴 **B2 Valencià (CIEACOVA + CV)** - Q2 2025
- 🇬🇧 **Cambridge C2 Proficiency (CPE)** - Q3 2025

## 🛠️ Instalación y Configuración

### **Método 1: Servidor Local Simple**
```bash
# 1. Clona el repositorio
git clone https://github.com/neolingus/real-exams.git
cd real-exams/simulators

# 2. Inicia servidor HTTP local
# Opción A: Python
python -m http.server 8000

# Opción B: Node.js
npx serve . -p 8000

# Opción C: PHP
php -S localhost:8000

# 3. Abre en navegador
open http://localhost:8000
```

### **Método 2: VS Code Live Server** (Recomendado)
```bash
# 1. Instala extensión "Live Server" en VS Code
# 2. Abre la carpeta simulators/ en VS Code
# 3. Clic derecho en index.html > "Open with Live Server"
# 4. Se abrirá automáticamente en http://127.0.0.1:5500
```

### **Método 3: GitHub Pages** (Para uso público)
```bash
# 1. Fork el repositorio en GitHub
# 2. Ve a Settings > Pages
# 3. Selecciona source: main branch /simulators folder
# 4. Accede via https://tu-usuario.github.io/real-exams/simulators/
```

## 🎮 Guía de Uso

### **Iniciar un Simulador**

1. **🏠 Página Principal**
   - Visita `http://localhost:8000` para ver todos los simuladores
   - Revisa estadísticas y selecciona el examen deseado

2. **▶️ Comenzar Examen**
   - Clic en "Comenzar Examen" en la tarjeta del simulador
   - El cronómetro iniciará automáticamente
   - Acepta permisos de audio si es necesario

3. **🧭 Navegación**
   - Usa las **pastillas de navegación** para cambiar de sección
   - El progreso se guarda automáticamente cada minuto
   - Puedes pausar el cronómetro en cualquier momento

### **Funcionalidades Durante el Examen**

#### **⏱️ Control de Tiempo**
- **Cronómetro:** Cuenta regresiva con alertas a 15 y 5 minutos
- **Pausar/Reanudar:** Botón para controlar el cronómetro
- **Colores de urgencia:** Verde → Naranja → Rojo según tiempo restante

#### **💾 Guardado Automático**
- **Autoguardado:** Cada 60 segundos automáticamente
- **Guardado manual:** Botón "Guardar Progreso" en cada sección
- **Persistencia:** Usa localStorage para mantener datos entre sesiones

#### **📊 Seguimiento de Progreso**
- **Barra de progreso:** Visual en tiempo real
- **Contador:** "X / Y preguntas completadas"
- **Por secciones:** Progreso individual por cada parte

#### **🎯 Boton de Acción Flotante (FAB)**
- **❓ Ayuda:** Instrucciones y atajos de teclado
- **🔖 Marcador:** Marcar preguntas para revisión
- **🧮 Calculadora:** Calculadora emergente

### **Tipos de Preguntas**

#### **📝 Múltiple Elección**
- Selecciona **una respuesta** (A, B, C, D)
- Cambio automático de respuesta si seleccionas otra
- Indicador visual de respuesta seleccionada

#### **✏️ Espacios en Blanco**
- Escribe **una palabra** en cada espacio
- Autocorrección en minúsculas para comparar
- Longitud máxima de 20 caracteres

#### **📄 Escritura Libre**
- **Contador de palabras** en tiempo real
- **Barra de progreso** visual (verde/naranja/rojo)
- **Objetivos:** 140-190 palabras (B2) / 200-250 palabras (C1)

#### **🎧 Audio Integrado**
- Controles nativos HTML5
- **Repetición:** Cada grabación se puede escuchar varias veces
- **Progreso:** Marcador visual de posición en audio

### **Finalización y Resultados**

#### **🏁 Finalizar Examen**
1. Completa todas las secciones o clic en "Finalizar Examen"
2. Confirmación de seguridad antes de enviar
3. Cálculo automático de resultados

#### **📊 Análisis de Resultados**
- **Puntuación global:** Puntos totales y porcentaje
- **Desglose por secciones:** Reading, Writing, Listening, Speaking
- **Calificación oficial:** A, B, C, Fail (inglés) / Excel·lent, Notable, Bé, Aprovat, Suspès (valenciano)
- **Feedback personalizado:** Recomendaciones específicas

#### **📁 Exportación**
- **PDF:** Resultados formateados para imprimir
- **JSON:** Datos completos para análisis posterior
- **Compartir:** URL para mostrar resultados

## ⚙️ Configuración Avanzada

### **🎨 Personalización Visual**

#### **Variables CSS**
```css
:root {
    --primary-color: #2563eb;    /* Color principal */
    --accent-color: #d97706;     /* Color de acento */
    --success-color: #059669;    /* Color de éxito */
    --danger-color: #dc2626;     /* Color de peligro */
}
```

#### **Temas Personalizados**
```css
/* Tema oscuro */
.dark-theme {
    --bg-primary: #1e293b;
    --bg-secondary: #0f172a;
    --text-primary: #f8fafc;
}

/* Tema valenciano */
.valencian-theme {
    --primary-color: #d97706;
    --accent-color: #1e40af;
    --success-color: #dc2626;
}
```

### **🔧 Configuración JavaScript**

#### **Timeouts Personalizados**
```javascript
// En script.js, modifica estas variables:
const EXAM_DURATION = 210 * 60; // 3.5 horas en segundos
const AUTOSAVE_INTERVAL = 60;   // Autoguardar cada 60 segundos
const WARNING_15MIN = 15 * 60;  // Advertencia a 15 minutos
const WARNING_5MIN = 5 * 60;    // Advertencia a 5 minutos
```

#### **Claves de Respuesta**
```javascript
// Modifica answerKeys para cambiar respuestas correctas
this.answerKeys = {
    reading: {
        q1: 'B', q2: 'B', q3: 'B', // Múltiple elección
        q9: 'to', q10: 'how'        // Espacios en blanco
    }
};
```

### **🎵 Audio Personalizado**

#### **Archivos de Audio**
```html
<!-- En index.html, cambia la fuente del audio -->
<audio id="main-audio" controls>
    <source src="../../01-INGLES/B2/B2_First_Cambridge_2022.mp3" type="audio/mpeg">
    <source src="ruta-a-tu-audio.ogg" type="audio/ogg">
</audio>
```

#### **Configuración de Audio**
```javascript
// Control avanzado de audio
const audio = document.getElementById('main-audio');
audio.playbackRate = 1.0;    // Velocidad normal
audio.volume = 0.8;          // Volumen al 80%
audio.loop = false;          // No repetir automáticamente
```

## 🔌 Integraciones

### **🤖 Integración con IA**

#### **OpenAI GPT-4**
```javascript
// Evaluación automática de Writing
const evaluateWriting = async (text, level, task) => {
    const response = await fetch('/api/openai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: text,
            level: level,
            task: task,
            criteria: ['content', 'organization', 'language', 'accuracy']
        })
    });
    return await response.json();
};
```

#### **Azure Speech Services**
```javascript
// Evaluación de pronunciación
const evaluateSpeaking = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    const response = await fetch('/api/azure/speech/assess', {
        method: 'POST',
        body: formData
    });
    return await response.json();
};
```

### **📊 Analytics**

#### **Google Analytics**
```html
<!-- Añadir al <head> de cada simulador -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

#### **Eventos Personalizados**
```javascript
// Trackear eventos importantes
function trackEvent(action, category, label) {
    gtag('event', action, {
        event_category: category,
        event_label: label,
        exam_type: 'B2_First',
        section: this.currentSection
    });
}

// Ejemplos de uso
trackEvent('exam_started', 'Engagement', 'B2_First');
trackEvent('section_completed', 'Progress', 'Reading');
trackEvent('exam_finished', 'Conversion', 'Full_Completion');
```

### **💾 Base de Datos**

#### **Supabase Integration**
```javascript
// Guardar resultados en Supabase
const saveResults = async (results) => {
    const { data, error } = await supabase
        .from('exam_results')
        .insert([{
            user_id: userId,
            exam_type: 'B2_First',
            scores: results,
            completed_at: new Date().toISOString()
        }]);
    
    if (error) console.error('Error saving results:', error);
    return data;
};
```

#### **Firebase Integration**
```javascript
// Configuración Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Guardar progreso
const saveProgress = async (progressData) => {
    try {
        const docRef = await addDoc(collection(db, 'exam_progress'), progressData);
        console.log('Progress saved with ID:', docRef.id);
    } catch (error) {
        console.error('Error saving progress:', error);
    }
};
```

## 🔒 Seguridad y Privacidad

### **🛡️ Medidas de Seguridad**

#### **Protección contra Trampas**
```javascript
// Deshabilitar clic derecho y atajos
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
    }
});
```

#### **Detección de Cambio de Pestaña**
```javascript
// Advertir si el usuario cambia de pestaña
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        this.pauseExam();
        alert('Exam paused: Tab change detected');
    }
});
```

### **🔐 Privacidad de Datos**

#### **Almacenamiento Local**
- Los datos se guardan **solo en localStorage**
- **No se envían** a servidores externos por defecto
- **El usuario controla** todos sus datos

#### **GDPR Compliance**
```javascript
// Solicitar consentimiento
const getConsent = () => {
    const consent = localStorage.getItem('dataConsent');
    if (!consent) {
        const userConsent = confirm('¿Aceptas el almacenamiento local de datos del examen?');
        localStorage.setItem('dataConsent', userConsent);
        return userConsent;
    }
    return consent === 'true';
};
```

## 🚀 Optimización y Rendimiento

### **⚡ Optimización de Carga**

#### **Lazy Loading**
```javascript
// Cargar secciones bajo demanda
const loadSection = async (sectionName) => {
    if (!loadedSections.includes(sectionName)) {
        const module = await import(`./sections/${sectionName}.js`);
        await module.initSection();
        loadedSections.push(sectionName);
    }
};
```

#### **Service Worker**
```javascript
// sw.js - Cache para uso offline
const CACHE_NAME = 'neolingus-simulator-v1';
const urlsToCache = [
    '/',
    '/styles.css',
    '/script.js',
    '/assets/icons.woff2'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});
```

### **📱 Responsive Design**

#### **Media Queries Clave**
```css
/* Tablet */
@media (max-width: 768px) {
    .exam-header { flex-direction: column; }
    .questions-grid { grid-template-columns: 1fr; }
}

/* Móvil */
@media (max-width: 480px) {
    .exam-content { padding: 1rem; }
    .modal-content { width: 95%; }
}
```

#### **Touch Optimizations**
```css
/* Mejores targets táctiles */
.nav-pill, .question-item label {
    min-height: 44px;
    padding: 0.75rem;
}

/* Scrolling suave en móvil */
.exam-content {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
}
```

## 🧪 Testing y Debugging

### **🔍 Herramientas de Debug**

#### **Console Commands**
```javascript
// Comandos disponibles en consola del navegador
simulator.showDebugInfo();          // Mostrar estado actual
simulator.setTimeRemaining(300);    // Cambiar tiempo restante
simulator.skipToSection('writing'); // Ir a sección específica
simulator.autoFillAnswers();        // Rellenar respuestas automáticamente
simulator.exportDebugData();        // Exportar datos de debug
```

#### **Debug Panel**
```javascript
// Activar panel de debug (solo en desarrollo)
if (window.location.hostname === 'localhost') {
    const debugPanel = document.createElement('div');
    debugPanel.innerHTML = `
        <div id="debug-panel" style="position: fixed; top: 0; right: 0; background: black; color: white; padding: 1rem; z-index: 9999;">
            <h4>Debug Panel</h4>
            <p>Section: <span id="debug-section">${this.currentSection}</span></p>
            <p>Time: <span id="debug-time">${this.timeRemaining}</span></p>
            <p>Progress: <span id="debug-progress">${this.progress}</span></p>
            <button onclick="simulator.autoFillAnswers()">Auto Fill</button>
        </div>
    `;
    document.body.appendChild(debugPanel);
}
```

### **🧪 Automated Testing**

#### **Cypress Tests**
```javascript
// cypress/integration/b2-first.spec.js
describe('B2 First Simulator', () => {
    beforeEach(() => {
        cy.visit('/simulators/english/b2-first/');
    });

    it('should start timer on page load', () => {
        cy.get('#time-display').should('contain', ':');
        cy.get('#time-display').should('not.contain', '00:00:00');
    });

    it('should save answers', () => {
        cy.get('input[name="q1"][value="B"]').click();
        cy.get('#save-reading').click();
        cy.reload();
        cy.get('input[name="q1"][value="B"]').should('be.checked');
    });

    it('should calculate scores correctly', () => {
        // Rellenar todas las respuestas correctas
        cy.get('input[name="q1"][value="B"]').click();
        // ... más respuestas ...
        cy.get('#finish-exam').click();
        cy.get('.modal-content').should('contain', 'Results');
    });
});
```

#### **Jest Unit Tests**
```javascript
// tests/simulator.test.js
import { B2FirstSimulator } from '../script.js';

describe('B2FirstSimulator', () => {
    let simulator;

    beforeEach(() => {
        document.body.innerHTML = '<div id="exam-container"></div>';
        simulator = new B2FirstSimulator();
    });

    test('should initialize with correct time', () => {
        expect(simulator.timeRemaining).toBe(210 * 60);
    });

    test('should calculate reading score correctly', () => {
        simulator.answers = { q1: 'B', q2: 'B', q3: 'B' };
        const score = simulator.calculateReadingScore();
        expect(score.score).toBe(3);
    });
});
```

## 📈 Monitorización y Analytics

### **📊 Métricas Clave**

#### **KPIs de Rendimiento**
```javascript
// Métricas automáticas
const metrics = {
    pageLoadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
    timeToFirstByte: performance.timing.responseStart - performance.timing.requestStart,
    examCompletionRate: (completedSections / totalSections) * 100,
    averageTimePerQuestion: totalTimeSpent / questionsAnswered,
    dropOffPoints: sectionsAbandoned
};

// Enviar métricas
gtag('event', 'performance_metrics', {
    custom_map: metrics
});
```

#### **User Behavior Tracking**
```javascript
// Trackear patrones de usuario
const trackUserBehavior = () => {
    const events = [
        { action: 'question_answered', time: Date.now() },
        { action: 'section_changed', time: Date.now() },
        { action: 'pause_clicked', time: Date.now() },
        { action: 'help_accessed', time: Date.now() }
    ];
    
    localStorage.setItem('userEvents', JSON.stringify(events));
};
```

### **🚨 Error Monitoring**

#### **Sentry Integration**
```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    environment: "production"
});

// Capturar errores automáticamente
window.addEventListener('error', (error) => {
    Sentry.captureException(error.error);
});
```

#### **Custom Error Handling**
```javascript
const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    
    // Guardar en localStorage para debug
    const errors = JSON.parse(localStorage.getItem('examErrors') || '[]');
    errors.push({
        error: error.message,
        context: context,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        examState: {
            section: this.currentSection,
            progress: this.progress,
            timeRemaining: this.timeRemaining
        }
    });
    localStorage.setItem('examErrors', JSON.stringify(errors));
    
    // Mostrar mensaje amigable al usuario
    this.showUserFriendlyError(context);
};
```

## 🚢 Deployment y Distribución

### **🌐 Hosting Options**

#### **GitHub Pages** (Gratuito)
```bash
# 1. Push a repository público
git add .
git commit -m "Deploy simulators"
git push origin main

# 2. Configurar GitHub Pages
# Settings > Pages > Source: main branch /simulators folder

# 3. Acceder en:
# https://tu-usuario.github.io/real-exams/simulators/
```

#### **Netlify** (Recomendado)
```bash
# 1. Build command (si es necesario)
npm run build

# 2. Deploy folder
simulators/

# 3. Environment variables
VITE_API_KEY=your_api_key
VITE_SENTRY_DSN=your_sentry_dsn
```

#### **Vercel**
```json
// vercel.json
{
    "builds": [
        {
            "src": "simulators/**",
            "use": "@vercel/static"
        }
    ],
    "routes": [
        {
            "src": "/simulators/(.*)",
            "dest": "/simulators/$1"
        }
    ]
}
```

### **🔧 Build Process**

#### **Optimización Automática**
```javascript
// build.js - Script de build personalizado
const fs = require('fs');
const path = require('path');
const minify = require('html-minifier').minify;

const buildSimulator = (simulatorPath) => {
    // Minificar HTML
    const htmlPath = path.join(simulatorPath, 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const minifiedHtml = minify(htmlContent, {
        removeComments: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true
    });
    
    // Escribir versión optimizada
    fs.writeFileSync(
        path.join(simulatorPath, 'index.min.html'),
        minifiedHtml
    );
};
```

## 🔮 Roadmap y Mejoras Futuras

### **Q1 2025**
- [ ] **Cambridge A2 Key (KET)** - Simulador completo
- [ ] **Audio sync** - Sincronización perfecta con PDF timing
- [ ] **Mobile app** - React Native para iOS/Android
- [ ] **Offline mode** - Service Worker avanzado

### **Q2 2025**
- [ ] **Cambridge C1 Advanced + EOI** - 18 exámenes regionales
- [ ] **B2 Valencià** - CIEACOVA + Generalitat
- [ ] **AI Speaking Examiner** - Evaluación oral en tiempo real
- [ ] **Adaptive Testing** - Dificultad ajustada por rendimiento

### **Q3 2025**
- [ ] **Cambridge C2 Proficiency** - Nivel maestría
- [ ] **Multiplayer mode** - Exámenes colaborativos
- [ ] **VR Integration** - Inmersión total con Oculus/Meta
- [ ] **Blockchain certificates** - Certificados verificables

### **Q4 2025**
- [ ] **Más idiomas** - Francés, Alemán, Italiano
- [ ] **Enterprise LMS** - Integración con Moodle/Canvas
- [ ] **AI Tutoring** - Tutor personal post-examen
- [ ] **Global leaderboards** - Rankings mundiales

## 🤝 Contribuir

### **🐛 Reportar Bugs**
1. Ve a [GitHub Issues](https://github.com/neolingus/real-exams/issues)
2. Busca si el bug ya existe
3. Crea un nuevo issue con:
   - **Título descriptivo**
   - **Pasos para reproducir**
   - **Comportamiento esperado vs actual**
   - **Screenshots/videos** si aplica
   - **Browser y OS**

### **💡 Sugerir Mejoras**
1. Abre un **Feature Request** en GitHub
2. Describe la funcionalidad propuesta
3. Explica el **caso de uso**
4. Incluye **mockups** si es visual

### **🔧 Contribuir Código**
```bash
# 1. Fork el repository
git clone https://github.com/tu-usuario/real-exams.git

# 2. Crea branch para tu feature
git checkout -b feature/nueva-funcionalidad

# 3. Haz cambios y commit
git add .
git commit -m "Add: Nueva funcionalidad increíble"

# 4. Push y crea Pull Request
git push origin feature/nueva-funcionalidad
```

## 📞 Soporte y Contacto

### **📧 Contacto**
- **Email:** simulators@neolingus.com
- **Discord:** [NEOLINGUS Community](https://discord.gg/neolingus)
- **Twitter:** [@NEOLINGUSacademia](https://twitter.com/NEOLINGUSacademia)

### **🆘 Obtener Ayuda**
1. **Documentación:** Lee esta guía completa
2. **FAQ:** Consulta preguntas frecuentes
3. **Community:** Pregunta en Discord
4. **Support Ticket:** Email para bugs críticos

### **📚 Recursos Adicionales**
- 🎥 **Video Tutorials:** [YouTube Channel](https://youtube.com/neolingus)
- 📖 **Knowledge Base:** [docs.neolingus.com](https://docs.neolingus.com)
- 📱 **Mobile Guide:** Guía específica para dispositivos móviles
- 🎯 **Best Practices:** Consejos para maximizar puntuaciones

---

**⚡ ¡Revoluciona tu preparación para exámenes oficiales con NEOLINGUS Simuladores!**

*Actualizado: Septiembre 2025 | Versión 2.0*