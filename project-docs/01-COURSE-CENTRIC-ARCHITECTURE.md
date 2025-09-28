# 🏗️ ARQUITECTURA COURSE-CENTRIC - PARADIGMA FUNDAMENTAL

## 🎯 **CONCEPTO CORE: ECOSISTEMAS INDEPENDIENTES**

**Cada curso no es una "sección" de la app - ES LA APP COMPLETA** funcionando en modo nativo del idioma/nivel.

### **Paradigma Mental**
```
❌ INCORRECTO: App global con secciones por curso
✅ CORRECTO: Apps nativas independientes por curso

Valenciano C1 ≠ Inglés B2 ≠ Catalán C2
     ↓             ↓          ↓
App valenciana   App inglesa  App catalana
100% nativa     100% nativa  100% nativa
```

## 📁 **ARQUITECTURA DE DIRECTORIOS**

### **Estructura Course-Centric**
```
/app/dashboard/[idioma]/[nivel]/
├── dashboard/                    # Home específico del curso
│   ├── page.tsx                 # Dashboard principal en idioma nativo
│   ├── components/              # Componentes específicos del curso
│   └── layout.tsx               # Layout en idioma curso
├── examens/                     # Simuladores específicos
│   ├── [proveedor]/            # EOI, CIEACOVA, Cambridge
│   │   ├── page.tsx            # Lista exámenes del provider
│   │   ├── [tipoExamen]/       # listening, writing, etc.
│   │   └── simulador/[sessionId]/ # Simulacro en curso
├── aprende/                     # Curriculum del nivel específico
│   ├── page.tsx                # Overview curriculum en idioma nativo
│   ├── [semana]/               # Semana específica del curriculum
│   ├── gramatica/              # Grammar específico del nivel
│   └── vocabulario/            # Vocab específico del nivel
├── practica/                    # Herramientas práctica nivel
│   ├── writing/                # Writing simulator específico
│   ├── speaking/               # Speaking simulator específico
│   └── pronunciacion/          # Pronunciation específico
├── juegos/                      # Gamificación específica nivel
│   ├── page.tsx                # Lista juegos del nivel
│   ├── [juegoId]/              # Juego específico
│   └── ranking/                # Leaderboard del curso
├── estadisticas/               # Analytics aisladas del curso
│   ├── page.tsx                # Dashboard stats del curso
│   ├── progreso/               # Progress específico del curso
│   └── prediccion/             # Prediction específica del curso
├── components/                  # Componentes SOLO del curso
└── lib/                        # Lógica SOLO del curso
```

### **Ejemplo Real: Valenciano C1**
```
/app/dashboard/valenciano/c1/
├── dashboard/
│   └── page.tsx                # "Benvingut al curs de Valencià C1"
├── examens/
│   ├── eoi/
│   │   ├── page.tsx           # "Exàmens EOI Valencià C1"
│   │   ├── oral/              # "Prova Oral EOI"
│   │   └── escrit/            # "Prova Escrita EOI"
│   └── cieacova/
│       └── page.tsx           # "Exàmens CIEACOVA C1"
├── aprende/
│   ├── page.tsx               # "Curriculum Valencià C1"
│   ├── gramatica/
│   │   ├── subjuntius/        # "Subjuntius avançats"
│   │   └── perifrasis/        # "Perífrasis verbals C1"
│   └── literatura/            # "Literatura valenciana"
├── juegos/
│   ├── escape-room-gramatical/ # "Sala dels Subjuntius"
│   └── batalla-sinonims/      # "Sinònims C1"
└── components/
    ├── ValencianoC1Header.tsx  # Header específico valenciano
    ├── EOIExamCard.tsx        # Card específica examen EOI
    └── CulturalReferences.tsx # Referencias culturales valencianes
```
## 🔄 **CONTEXT SWITCHING SYSTEM**

### **Context Switch Completo**
```typescript
// Al seleccionar "Valenciano C1" desde dashboard personal
interface CourseContext {
  courseId: "valenciano_c1"
  language: "valenciano"          # UI language switch
  level: "C1"                     # Content filtering
  providers: ["EOI", "CIEACOVA"]  # Available exam providers
  currency: "EUR"                 # Localization
  timeZone: "Europe/Madrid"       # Date/time display
  culturalContext: "Valencia"     # Examples and references
  
  // UI completamente transformada
  navigation: ["Exàmens", "Aprén", "Pràctica", "Jocs", "Estadístiques"]
  content: "100% valencià"
  examples: "València-specific cultural references"
  examPrep: "EOI + CIEACOVA specific strategies"
}
```

### **Implementation del Context Switch**
```typescript
// /lib/dashboard/context-manager.ts
export class CourseContextManager {
  static async switchToCourse(courseId: string): Promise<CourseContext> {
    // 1. Verificar acceso al curso
    const hasAccess = await checkCourseAccess(courseId, userId)
    if (!hasAccess) throw new Error('No access to course')
    
    // 2. Cargar contexto específico del curso
    const context = await loadCourseContext(courseId)
    
    // 3. Aplicar transformación UI completa
    await applyUITransformation(context)
    
    // 4. Cargar datos aislados del curso
    const courseData = await loadIsolatedCourseData(courseId)
    
    // 5. Activar modo específico
    return {
      ...context,
      data: courseData,
      active: true
    }
  }
  
  private static async applyUITransformation(context: CourseContext) {
    // Cambiar idioma UI
    i18n.changeLanguage(context.language)
    
    // Aplicar theme específico
    themeManager.applyTheme(context.theme)
    
    // Configurar providers disponibles
    examManager.setAvailableProviders(context.providers)
    
    // Configurar contexto cultural
    culturalManager.setContext(context.culturalContext)
  }
}
```

## 🎨 **THEMING POR CURSO**

### **Design System Course-Specific**
```typescript
interface CourseThemes {
  valenciano_c1: {
    colors: {
      primary: "#D97706",       # Taronja València
      accent: "#DC2626",        # Roig senyera  
      success: "#059669",       # Verd valencià
      background: "#FEF3C7",    # Crema mediterrani
      text: "#1F2937"
    },
    
    typography: {
      headers: "Playfair Display",  # Elegant serif
      body: "Inter",
      accent: "Montserrat"
    },
    
    culturalElements: {
      patterns: "senyera_stripes",
      icons: "valencian_cultural_icons",
      imagery: "valencia_landmarks",
      references: "literatura_valenciana"
    }
  },
  
  ingles_b2: {
    colors: {
      primary: "#1E40AF",       # Cambridge blue
      accent: "#059669",        # British racing green
      success: "#10B981",
      background: "#F8FAFC",    # Clean British grey
      text: "#1F2937"
    },
    
    typography: {
      headers: "Crimson Text",     # British academic
      body: "Inter", 
      accent: "Roboto"
    },
    
    culturalElements: {
      patterns: "subtle_union_jack",
      icons: "british_cultural_icons",
      imagery: "uk_landmarks", 
      references: "british_culture"
    }
  }
}
```
## 🗄️ **DATABASE ISOLATION**

### **Schema Course-Partitioned**
```sql
-- Progress completamente aislado por curso
CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id TEXT NOT NULL,           -- 'valenciano_c1', 'ingles_b2'
  
  -- Datos SOLO del curso específico
  skill_levels JSONB,               -- Solo skills del curso
  cultural_knowledge JSONB,         -- Solo cultura del curso  
  exam_readiness DECIMAL,           -- Solo preparación del curso
  learning_path_progress JSONB,     -- Solo curriculum del curso
  
  -- NO referencias cruzadas
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, course_id)
);

-- Exam attempts aislados por curso
CREATE TABLE course_exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id TEXT NOT NULL,
  provider TEXT NOT NULL,           -- 'EOI', 'CIEACOVA', 'Cambridge'
  
  -- Resultados SOLO del curso/provider
  score DECIMAL NOT NULL,
  breakdown JSONB,                  -- Skills específicas del curso
  passed BOOLEAN,
  exam_date TIMESTAMP DEFAULT NOW(),
  
  -- NO comparación con otros cursos
  INDEX(user_id, course_id, exam_date)
);

-- Actividades aisladas por curso
CREATE TABLE course_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,      -- 'lesson', 'game', 'practice'
  
  -- Datos específicos del curso
  activity_data JSONB,
  score DECIMAL,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎮 **COMPONENTES COURSE-SPECIFIC**

### **Anti-Pattern: Componentes Genéricos**
```typescript
// ❌ NUNCA hacer esto:
<GenericProgressChart 
  data={courseData} 
  language={currentLanguage}
/>

<UniversalExamCard 
  exam={examData}
  provider={provider}
  locale={locale}
/>
```

### **Pattern Correcto: Componentes Nativos**
```typescript
// ✅ SIEMPRE hacer esto:
<ValencianoC1ProgressChart 
  progressValencia={progressData}
  skillsInValencian={true}
  culturalContext="valencia"
/>

<EOIValencianoExamCard
  examEOI={examData}
  providerSpecific="eoi_valencia"
  nativeLanguage="valenciano"
/>

<InglesB2CambridgeCard
  examCambridge={examData}
  britishContext={true}
  nativeLanguage="english"
/>
```

### **Component Factory Pattern**
```typescript
// /lib/dashboard/component-factory.ts
export class CourseComponentFactory {
  static createProgressChart(courseId: string): React.ComponentType {
    switch (courseId) {
      case 'valenciano_c1':
        return ValencianoC1ProgressChart
      case 'ingles_b2':
        return InglesB2ProgressChart
      case 'catalan_c2':
        return CatalanC2ProgressChart
      default:
        throw new Error(`No component for course: ${courseId}`)
    }
  }
  
  static createExamCard(courseId: string, provider: string): React.ComponentType {
    const key = `${courseId}_${provider}`
    
    const components = {
      'valenciano_c1_eoi': EOIValencianoExamCard,
      'valenciano_c1_cieacova': CIEACOVAValencianoExamCard,
      'ingles_b2_cambridge': CambridgeInglesExamCard,
      'ingles_c1_cambridge': CambridgeInglesC1ExamCard
    }
    
    return components[key] || DefaultExamCard
  }
}
```

---

**CRITICAL**: Esta arquitectura elimina completamente la "contaminación cruzada" entre cursos. Cada curso es un mundo independiente que funciona de manera nativa.

**NEXT**: Ver `02-MARKETING-FRONTEND.md` para el frontend comercial.