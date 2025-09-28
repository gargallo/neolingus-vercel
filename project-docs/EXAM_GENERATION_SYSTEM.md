# Sistema de Generación de Exámenes - NEOLINGUS

## 🎯 Concepto: IA que Aprende y Genera Exámenes

### **Funcionamiento Base:**
```
1. NEOLINGUS analiza exámenes de ejemplo oficiales
                    ↓
2. Extrae patrones, estructura, dificultad, tipos de preguntas
                    ↓
3. Genera infinitos exámenes similares en base de datos
                    ↓
4. Trackea todo el progreso del usuario para personalización
```

## 📊 Sistema de Análisis de Exámenes Ejemplo

### **Input: Exámenes Oficiales de Referencia**
```
Ejemplos necesarios por certificación:
- EOI B2 Inglés: 10-15 exámenes ejemplo
- Cambridge B2 First: 5-10 exámenes ejemplo  
- CIEACOVA C1 Valenciano: 8-12 exámenes ejemplo
- JQCV B2 Valenciano: 6-10 exámenes ejemplo
```

### **Extracción Automática de Patrones**
```python
class ExamAnalyzer:
    def analyze_official_exams(self, exam_files):
        patterns = {}
        
        for exam_file in exam_files:
            # 1. Estructura del examen
            structure = self.extract_structure(exam_file)
            patterns['structure'] = structure
            
            # 2. Tipos de preguntas
            question_types = self.extract_question_types(exam_file)
            patterns['question_types'] = question_types
            
            # 3. Nivel de dificultad por sección
            difficulty_levels = self.analyze_difficulty(exam_file)
            patterns['difficulty'] = difficulty_levels
            
            # 4. Temas y vocabulario frecuente
            topics = self.extract_topics_and_vocab(exam_file)
            patterns['content'] = topics
            
            # 5. Criterios de evaluación
            scoring_criteria = self.extract_scoring_criteria(exam_file)
            patterns['scoring'] = scoring_criteria
            
        return patterns

# Ejemplo de patrones extraídos:
cambridge_b2_patterns = {
    "structure": {
        "reading_writing": {
            "duration": 75,
            "parts": 7,
            "questions": 52
        },
        "listening": {
            "duration": 40,
            "parts": 4,
            "questions": 30
        },
        "speaking": {
            "duration": 14,
            "parts": 4
        }
    },
    "question_types": {
        "part1": "multiple_choice_cloze",
        "part2": "open_cloze",
        "part3": "word_formation",
        "part4": "key_word_transformation"
    },
    "difficulty": {
        "vocabulary": "upper_intermediate",
        "grammar": ["past_perfect", "conditionals", "reported_speech"],
        "topics": ["work", "travel", "technology", "environment"]
    }
}
```

## 🤖 Generador de Exámenes Infinitos

### **Motor de Generación IA**
```python
class ExamGenerator:
    def __init__(self, patterns, openai_client):
        self.patterns = patterns
        self.ai = openai_client
        self.content_database = ContentDatabase()
        
    async def generate_new_exam(self, certification, user_level=None):
        # 1. Seleccionar template basado en patrones
        template = self.patterns[certification]['structure']
        
        # 2. Generar contenido para cada sección
        exam_sections = []
        
        for section_id, section_config in template.items():
            section_content = await self.generate_section(
                section_config, 
                certification,
                user_level
            )
            exam_sections.append(section_content)
            
        # 3. Ensamblar examen completo
        full_exam = self.assemble_exam(exam_sections, template)
        
        # 4. Validar dificultad y calidad
        validated_exam = await self.validate_exam_quality(full_exam)
        
        # 5. Guardar en base de datos
        exam_id = await self.save_to_database(validated_exam)
        
        return exam_id, validated_exam

    async def generate_section(self, section_config, certification, user_level):
        section_parts = []
        
        for part in section_config['parts']:
            # Generar según tipo de pregunta
            if part['type'] == 'multiple_choice_cloze':
                content = await self.generate_cloze_text(
                    topics=self.patterns[certification]['content']['topics'],
                    difficulty=user_level or 'B2',
                    question_count=part['questions']
                )
            elif part['type'] == 'reading_comprehension':
                content = await self.generate_reading_passage(
                    length=part['word_count'],
                    difficulty=user_level or 'B2',
                    topic=self.select_random_topic(certification)
                )
            # ... más tipos
            
            section_parts.append(content)
            
        return section_parts
```

### **Generación Inteligente por Tipos**

#### **Multiple Choice Cloze**
```python
async def generate_cloze_text(self, topics, difficulty, question_count):
    prompt = f"""
    Crea un texto de nivel {difficulty} sobre {random.choice(topics)} con exactamente {question_count} huecos para completar.
    
    Formato: Texto con (1) ____, (2) ____, etc.
    
    Cada hueco debe tener 4 opciones (A, B, C, D) donde:
    - Una respuesta es claramente correcta
    - Las otras 3 son plausibles pero incorrectas
    - Dificultad apropiada para {difficulty}
    
    Incluye:
    1. Texto completo con huecos numerados
    2. Opciones A,B,C,D para cada hueco
    3. Respuesta correcta
    4. Explicación breve de por qué es correcta
    """
    
    response = await self.ai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    
    return self.parse_cloze_response(response.choices[0].message.content)
```

#### **Reading Comprehension**
```python
async def generate_reading_passage(self, length, difficulty, topic):
    prompt = f"""
    Crea un texto de exactamente {length} palabras sobre {topic} para nivel {difficulty}.
    
    El texto debe:
    1. Ser interesante y actual
    2. Usar vocabulario apropiado para {difficulty}
    3. Tener estructura clara (introducción, desarrollo, conclusión)
    4. Incluir datos específicos, nombres, fechas
    
    Después del texto, crea 6 preguntas de comprensión:
    - 3 preguntas de detalle específico
    - 2 preguntas de inferencia
    - 1 pregunta de opinión del autor
    
    Cada pregunta con 4 opciones múltiples.
    """
    
    response = await self.ai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8
    )
    
    return self.parse_reading_response(response.choices[0].message.content)
```

#### **Listening Generation**
```python
async def generate_listening_content(self, section_config):
    # 1. Generar script del diálogo
    script = await self.generate_dialogue_script(section_config)
    
    # 2. Convertir texto a audio con TTS
    audio_file = await self.text_to_speech(
        text=script['dialogue'],
        voices=script['speakers'],
        accent='british' if 'cambridge' in section_config else 'neutral'
    )
    
    # 3. Generar preguntas sobre el audio
    questions = await self.generate_listening_questions(script)
    
    return {
        'audio_file': audio_file,
        'transcript': script['dialogue'],
        'questions': questions,
        'duration': script['duration']
    }
```

## 📊 Sistema de Tracking Completo

### **Base de Datos de Progreso**
```sql
-- Tabla principal de tracking
CREATE TABLE user_progress_tracking (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES exam_sessions(id),
    question_id VARCHAR(100),
    question_type VARCHAR(50),
    topic VARCHAR(50),
    difficulty_level VARCHAR(10),
    
    -- Respuesta del usuario
    user_answer JSONB,
    correct_answer JSONB,
    is_correct BOOLEAN,
    
    -- Métricas de tiempo
    time_started TIMESTAMP,
    time_submitted TIMESTAMP,
    time_spent_seconds INTEGER,
    
    -- Métricas de comportamiento
    attempts_count INTEGER DEFAULT 1,
    changed_answer BOOLEAN DEFAULT FALSE,
    time_before_first_answer INTEGER,
    
    -- Métricas de rendimiento
    confidence_level DECIMAL(3,2), -- 0.00 to 1.00
    difficulty_score DECIMAL(3,2),
    
    -- Contexto adicional
    device_type VARCHAR(20),
    browser_info JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX idx_user_progress_user_topic ON user_progress_tracking(user_id, topic);
CREATE INDEX idx_user_progress_difficulty ON user_progress_tracking(user_id, difficulty_level);
CREATE INDEX idx_user_progress_question_type ON user_progress_tracking(user_id, question_type);
```

### **Análisis de Patrones de Usuario**
```python
class UserProgressAnalyzer:
    def __init__(self, user_id):
        self.user_id = user_id
        self.db = DatabaseService()
        
    async def get_comprehensive_analysis(self):
        # 1. Rendimiento por temas
        topic_performance = await self.analyze_topic_performance()
        
        # 2. Dificultades por tipo de pregunta
        question_type_analysis = await self.analyze_question_types()
        
        # 3. Patrones de tiempo
        time_patterns = await self.analyze_time_patterns()
        
        # 4. Curva de aprendizaje
        learning_curve = await self.analyze_learning_curve()
        
        # 5. Predicción de resultado
        exam_prediction = await self.predict_exam_result()
        
        return {
            'topic_performance': topic_performance,
            'question_analysis': question_type_analysis,
            'time_patterns': time_patterns,
            'learning_curve': learning_curve,
            'exam_prediction': exam_prediction,
            'recommendations': self.generate_recommendations()
        }

    async def analyze_topic_performance(self):
        query = """
        SELECT 
            topic,
            COUNT(*) as total_questions,
            AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) as success_rate,
            AVG(time_spent_seconds) as avg_time,
            AVG(confidence_level) as avg_confidence,
            COUNT(CASE WHEN changed_answer THEN 1 END) as changed_answers
        FROM user_progress_tracking 
        WHERE user_id = $1 
        GROUP BY topic
        ORDER BY success_rate ASC
        """
        
        results = await self.db.query(query, [self.user_id])
        
        return [
            {
                'topic': row['topic'],
                'mastery_level': self.calculate_mastery(row),
                'weak_areas': await self.identify_weak_areas(row['topic']),
                'improvement_trend': await self.calculate_trend(row['topic']),
                'recommendations': self.topic_recommendations(row)
            }
            for row in results
        ]

    async def predict_exam_result(self):
        # Modelo ML para predicción
        user_features = await self.extract_user_features()
        
        prediction_model = await self.load_prediction_model()
        
        predicted_score = prediction_model.predict(user_features)
        confidence_interval = prediction_model.predict_confidence(user_features)
        
        return {
            'predicted_score': predicted_score,
            'confidence_range': confidence_interval,
            'pass_probability': self.calculate_pass_probability(predicted_score),
            'readiness_assessment': self.assess_readiness(predicted_score),
            'study_plan': await self.generate_study_plan(user_features)
        }
```

### **Personalización de Exámenes**
```python
class PersonalizedExamGenerator:
    def __init__(self, user_id):
        self.user_id = user_id
        self.progress_analyzer = UserProgressAnalyzer(user_id)
        self.exam_generator = ExamGenerator()
        
    async def generate_personalized_exam(self, certification):
        # 1. Análizar debilidades del usuario
        user_analysis = await self.progress_analyzer.get_comprehensive_analysis()
        
        # 2. Identificar áreas que necesitan más práctica
        weak_areas = self.identify_priority_areas(user_analysis)
        
        # 3. Generar examen enfocado en debilidades
        personalized_exam = await self.exam_generator.generate_targeted_exam(
            certification=certification,
            focus_areas=weak_areas,
            difficulty_adjustment=user_analysis['learning_curve']['suggested_level']
        )
        
        # 4. Ajustar dificultad según progreso
        adjusted_exam = self.adjust_difficulty_dynamically(
            personalized_exam,
            user_analysis['exam_prediction']['readiness_assessment']
        )
        
        return adjusted_exam

    def identify_priority_areas(self, user_analysis):
        priority_areas = []
        
        # Temas con <70% de éxito
        for topic in user_analysis['topic_performance']:
            if topic['mastery_level'] < 0.7:
                priority_areas.append({
                    'type': 'topic',
                    'value': topic['topic'],
                    'priority': 1.0 - topic['mastery_level'],  # Más débil = mayor prioridad
                    'focus_type': 'remedial'
                })
        
        # Tipos de pregunta problemáticos
        for q_type in user_analysis['question_analysis']:
            if q_type['success_rate'] < 0.6:
                priority_areas.append({
                    'type': 'question_type',
                    'value': q_type['type'],
                    'priority': 1.0 - q_type['success_rate'],
                    'focus_type': 'skill_building'
                })
        
        # Ordenar por prioridad
        return sorted(priority_areas, key=lambda x: x['priority'], reverse=True)
```

### **Dashboard de Progreso en Tiempo Real**
```python
class ProgressDashboard:
    def __init__(self, user_id):
        self.user_id = user_id
        self.real_time_tracker = RealTimeTracker(user_id)
        
    async def get_dashboard_data(self):
        return {
            # Estadísticas generales
            'overall_stats': await self.get_overall_stats(),
            
            # Progreso por sección
            'section_progress': await self.get_section_progress(),
            
            # Tendencias semanales
            'weekly_trends': await self.get_weekly_trends(),
            
            # Objetivos y metas
            'goals_tracking': await self.get_goals_tracking(),
            
            # Recomendaciones AI
            'ai_recommendations': await self.get_ai_recommendations(),
            
            # Predicción de examen
            'exam_readiness': await self.get_exam_readiness()
        }

    async def get_overall_stats(self):
        query = """
        SELECT 
            COUNT(*) as total_questions_attempted,
            AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) as overall_accuracy,
            SUM(time_spent_seconds) as total_study_time,
            COUNT(DISTINCT DATE(created_at)) as study_days,
            AVG(confidence_level) as avg_confidence
        FROM user_progress_tracking 
        WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
        """
        
        result = await self.db.query(query, [self.user_id])
        stats = result[0]
        
        return {
            'questions_attempted': stats['total_questions_attempted'],
            'accuracy_percentage': round(stats['overall_accuracy'] * 100, 1),
            'study_hours': round(stats['total_study_time'] / 3600, 1),
            'study_streak': await self.calculate_study_streak(),
            'improvement_rate': await self.calculate_improvement_rate(),
            'estimated_exam_score': await self.estimate_current_exam_score()
        }
```

## 🎯 Algoritmo de Adaptación Inteligente

### **Sistema de Dificultad Dinámica**
```python
class AdaptiveDifficultyEngine:
    def __init__(self):
        self.difficulty_weights = {
            'success_rate': 0.4,      # Más importante
            'time_efficiency': 0.3,    # Importante  
            'confidence_level': 0.2,   # Moderado
            'learning_velocity': 0.1   # Menos importante
        }
    
    def calculate_optimal_difficulty(self, user_metrics):
        # Algoritmo que balancea desafío vs frustración
        base_difficulty = user_metrics['current_level']
        
        # Ajustes basados en rendimiento
        if user_metrics['recent_success_rate'] > 0.85:
            # Usuario domina el nivel, incrementar dificultad
            difficulty_adjustment = +0.1
        elif user_metrics['recent_success_rate'] < 0.6:
            # Usuario lucha, reducir dificultad
            difficulty_adjustment = -0.1
        else:
            # Usuario en zona óptima de desafío
            difficulty_adjustment = 0
            
        # Ajuste por velocidad de aprendizaje
        if user_metrics['learning_velocity'] > 0.8:
            # Aprende rápido, acelerar progresión
            difficulty_adjustment += 0.05
            
        # Ajuste por confianza
        if user_metrics['confidence_level'] < 0.5:
            # Baja confianza, no incrementar dificultad
            difficulty_adjustment = min(difficulty_adjustment, 0)
            
        optimal_difficulty = base_difficulty + difficulty_adjustment
        
        return max(0.1, min(1.0, optimal_difficulty))  # Clamp entre 0.1 y 1.0
```

### **Gamificación del Progreso**
```python
class GamificationEngine:
    def __init__(self, user_id):
        self.user_id = user_id
        
    async def update_achievements(self, session_data):
        achievements = []
        
        # Achievement: Racha de respuestas correctas
        if session_data['consecutive_correct'] >= 10:
            achievements.append({
                'type': 'streak',
                'title': 'En racha! 🔥',
                'description': f"{session_data['consecutive_correct']} respuestas correctas seguidas",
                'points': session_data['consecutive_correct'] * 10
            })
        
        # Achievement: Mejora en tema específico
        if session_data['topic_improvement'] > 0.2:
            achievements.append({
                'type': 'improvement',
                'title': 'Progreso notable! 📈',
                'description': f"20% mejora en {session_data['improved_topic']}",
                'points': 100
            })
            
        # Achievement: Tiempo de estudio
        daily_time = await self.get_daily_study_time()
        if daily_time >= 3600:  # 1 hora
            achievements.append({
                'type': 'dedication',
                'title': 'Dedicación diaria! ⏰',
                'description': 'Has estudiado más de 1 hora hoy',
                'points': 50
            })
            
        await self.save_achievements(achievements)
        return achievements
```

## 🚀 Ventajas del Sistema

### **Para el Usuario:**
- 📊 **Progreso visual**: Ve exactamente qué domina y qué necesita mejorar
- 🎯 **Práctica dirigida**: Exámenes personalizados según sus debilidades
- 📈 **Mejora constante**: Algoritmo adapta dificultad para máximo aprendizaje
- 🎮 **Motivación**: Gamificación mantiene engagement
- 🔮 **Predicción**: Sabe cuándo está listo para el examen real

### **Para NEOLINGUS:**
- 🤖 **Escalabilidad infinita**: Genera contenido automáticamente
- 📊 **Data intelligence**: Cada usuario mejora el sistema para todos
- 💰 **Coste eficiente**: No necesita crear contenido manualmente
- 🎯 **Personalización**: Cada usuario tiene experiencia única
- 📈 **Mejora continua**: Sistema aprende y se optimiza constantemente

---

**El resultado: Un sistema que nunca se queda sin contenido, que conoce al usuario mejor que él mismo, y que garantiza la máxima eficiencia en la preparación para aprobar el examen oficial.**