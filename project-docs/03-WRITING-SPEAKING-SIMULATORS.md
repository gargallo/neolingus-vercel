# ✍️🎤 WRITING & SPEAKING SIMULATORS - CORE DIFFERENTIATORS

## 🎯 **OBJETIVO ESTRATÉGICO**

**Proporcionar práctica indistinguible de examen real** con feedback más detallado que examinadores humanos.

## ✍️ **WRITING SIMULATOR ARCHITECTURE**

### **Real-time Analysis Pipeline**
```typescript
// /lib/dashboard/writing/analysis-engine.ts
export class WritingAnalysisEngine {
  private openaiClient: OpenAI
  private courseContext: CourseContext
  
  constructor(courseId: string) {
    this.openaiClient = new OpenAI()
    this.courseContext = CourseContextManager.getContext(courseId)
  }
  
  async analyzeInRealTime(
    text: string, 
    taskType: WritingTaskType
  ): Promise<RealTimeAnalysis> {
    // Throttle requests to avoid rate limits
    if (text.length < 50) return { suggestions: [] }
    
    const prompt = this.buildAnalysisPrompt(text, taskType)
    
    const response = await this.openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt(taskType)
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
    
    return this.parseAnalysisResponse(response.choices[0].message.content)
  }
  
  private getSystemPrompt(taskType: WritingTaskType): string {
    switch (this.courseContext.courseId) {
      case 'valenciano_c1':
        return this.getValencianoC1SystemPrompt(taskType)
      case 'ingles_b2':
        return this.getCambridgeB2SystemPrompt(taskType)
      default:
        throw new Error(`No system prompt for course: ${this.courseContext.courseId}`)
    }
  }
  
  private getValencianoC1SystemPrompt(taskType: WritingTaskType): string {
    return `Eres un examinador oficial d'EOI especialitzat en valencià C1. 
    
    Analitza aquest text segons els criteris oficials:
    - Adequació (25%): Registre apropiat, coherència amb el context
    - Cohesió i coherència (25%): Estructura clara, connectors apropiats  
    - Riquesa i correcció lingüística (25%): Vocabulari variat, precisió gramatical
    - Coneixement cultural (25%): Referències culturals valencianes apropiades
    
    Respon SEMPRE en valencià. Proporciona feedback constructiu i específic.`
  }
  
  private getCambridgeB2SystemPrompt(taskType: WritingTaskType): string {
    return `You are a certified Cambridge B2 First examiner. 
    
    Evaluate this writing using exact Cambridge criteria:
    - Content (25%): Task completion, relevant ideas, clear position
    - Communicative Achievement (25%): Appropriate register, natural language
    - Organisation (25%): Clear structure, logical sequencing, cohesive devices
    - Language (25%): Vocabulary range, grammatical accuracy, appropriate register
    
    Provide specific, actionable feedback. Be encouraging but precise.`
  }
}
```

### **Task-Specific Configurations**
```typescript
// /lib/dashboard/writing/task-configs.ts
interface WritingTaskConfig {
  courseId: string
  taskType: string
  requirements: TaskRequirements
  assessmentCriteria: AssessmentCriteria
  aiPrompt: string
}

export const WRITING_TASK_CONFIGS: Record<string, WritingTaskConfig> = {
  // Cambridge B2 Essay
  'ingles_b2_essay': {
    courseId: 'ingles_b2',
    taskType: 'essay',
    requirements: {
      wordCount: { min: 140, max: 190 },
      timeLimit: 40, // minutes
      structure: {
        introduction: "State topic and position clearly",
        body1: "First viewpoint with examples",
        body2: "Opposing viewpoint with examples", 
        conclusion: "Summarize and restate opinion"
      },
      mustInclude: [
        "Address all parts of the question",
        "Give relevant examples",
        "Use appropriate linking words",
        "Maintain consistent register"
      ]
    },
    assessmentCriteria: {
      content: {
        weight: 25,
        bands: {
          5: "All content relevant, ideas well-developed, position clear",
          4: "Minor omissions, generally well-developed",
          3: "Some irrelevant content, adequate development",
          2: "Limited development, some content irrelevant",
          1: "Little relevant content, minimal development"
        }
      },
      // ... más criterios
    },
    aiPrompt: `Evaluate this Cambridge B2 essay using official criteria...`
  },
  
  // Valenciano C1 Formal Text
  'valenciano_c1_formal': {
    courseId: 'valenciano_c1',
    taskType: 'formal_text',
    requirements: {
      wordCount: { min: 200, max: 250 },
      timeLimit: 60,
      register: "formal_academic",
      culturalContext: {
        examples: "Referències específiques valencianes",
        knowledge: "Cultura i tradicions de la Comunitat Valenciana",
        language: "Registre culte i formal del valencià"
      }
    },
    assessmentCriteria: {
      adequacio: {
        weight: 25,
        description: "Registre apropiat, coherència contextual"
      },
      cohesio: {
        weight: 25, 
        description: "Estructura clara, connectors apropiats"
      }
      // ... más criterios en valenciano
    },
    aiPrompt: `Avalua aquest text en valencià C1 segons criteris EOI...`
  }
}
```
### **Writing Simulator UI Implementation**
```typescript
// /components/dashboard/writing/WritingSimulator.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { WritingAnalysisEngine } from '@/lib/academia/writing/analysis-engine'
import { WritingEditor } from './WritingEditor'
import { FeedbackPanel } from './FeedbackPanel'
import { TaskInstructions } from './TaskInstructions'

interface WritingSimulatorProps {
  courseId: string
  taskConfig: WritingTaskConfig
  examMode?: boolean
}

export function WritingSimulator({ 
  courseId, 
  taskConfig, 
  examMode = false 
}: WritingSimulatorProps) {
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null)
  const [timeLeft, setTimeLeft] = useState(taskConfig.requirements.timeLimit * 60)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const analysisEngine = new WritingAnalysisEngine(courseId)
  
  // Real-time analysis with debouncing
  const analyzeText = useCallback(
    debounce(async (currentText: string) => {
      if (currentText.length < 50) return
      
      setIsAnalyzing(true)
      try {
        const result = await analysisEngine.analyzeInRealTime(
          currentText, 
          taskConfig.taskType
        )
        setAnalysis(result)
      } catch (error) {
        console.error('Analysis error:', error)
      } finally {
        setIsAnalyzing(false)
      }
    }, 1000),
    [courseId, taskConfig.taskType]
  )
  
  useEffect(() => {
    if (text.length > 0) {
      analyzeText(text)
    }
  }, [text, analyzeText])
  
  // Timer countdown
  useEffect(() => {
    if (examMode && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [examMode, timeLeft])
  
  const handleSubmit = async () => {
    const finalAnalysis = await analysisEngine.getFinalScore(text, taskConfig)
    // Handle submission and show results
  }
  
  return (
    <div className="writing-simulator h-screen flex">
      {/* Task Instructions Panel */}
      <div className="w-80 bg-muted/50 p-6 overflow-y-auto">
        <TaskInstructions 
          config={taskConfig}
          timeLeft={timeLeft}
          wordCount={text.split(' ').length}
          examMode={examMode}
        />
      </div>
      
      {/* Main Writing Area */}
      <div className="flex-1 flex flex-col">
        <WritingEditor
          value={text}
          onChange={setText}
          analysis={analysis}
          isAnalyzing={isAnalyzing}
          examMode={examMode}
          taskConfig={taskConfig}
        />
        
        <div className="border-t p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <WordCounter 
              current={text.split(' ').length}
              target={taskConfig.requirements.wordCount}
            />
            <TimeDisplay timeLeft={timeLeft} examMode={examMode} />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setText('')}>
              Reiniciar
            </Button>
            <Button onClick={handleSubmit}>
              {examMode ? 'Entregar Examen' : 'Obtener Feedback'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Live Feedback Panel */}
      {!examMode && (
        <div className="w-80 bg-muted/50 p-6 overflow-y-auto">
          <FeedbackPanel 
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            courseId={courseId}
          />
        </div>
      )}
    </div>
  )
}

// /components/dashboard/writing/WritingEditor.tsx
export function WritingEditor({ 
  value, 
  onChange, 
  analysis, 
  isAnalyzing,
  examMode,
  taskConfig 
}: WritingEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  
  // Highlight suggestions in text
  const highlightText = useCallback((text: string, analysis: WritingAnalysis) => {
    if (!analysis?.suggestions) return text
    
    let highlightedText = text
    
    analysis.suggestions.forEach(suggestion => {
      if (suggestion.type === 'grammar') {
        highlightedText = highlightedText.replace(
          suggestion.text,
          `<mark class="grammar-error">${suggestion.text}</mark>`
        )
      }
    })
    
    return highlightedText
  }, [])
  
  return (
    <div className="flex-1 relative">
      <textarea
        ref={editorRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full p-6 text-lg leading-relaxed resize-none border-none outline-none"
        placeholder={getPlaceholderText(taskConfig, courseId)}
        spellCheck={!examMode} // Disable spellcheck in exam mode
        autoFocus
      />
      
      {/* Real-time feedback overlay */}
      {!examMode && analysis && (
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analizando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Análisis actualizado</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

## 🎤 **SPEAKING SIMULATOR ARCHITECTURE**

### **AI Examiner Engine**
```typescript
// /lib/dashboard/speaking/ai-examiner.ts
export class AIExaminerEngine {
  private openaiClient: OpenAI
  private courseContext: CourseContext
  private conversationHistory: Message[]
  
  constructor(courseId: string) {
    this.openaiClient = new OpenAI()
    this.courseContext = CourseContextManager.getContext(courseId)
    this.conversationHistory = []
  }
  
  async generateQuestion(
    examPart: number,
    userResponse?: string
  ): Promise<ExaminerQuestion> {
    const systemPrompt = this.getExaminerSystemPrompt(examPart)
    const conversationContext = this.buildConversationContext()
    
    const response = await this.openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...this.conversationHistory,
        { 
          role: "user", 
          content: userResponse || "Start the exam part" 
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    })
    
    const question = this.parseQuestionResponse(response.choices[0].message.content)
    
    // Add to conversation history
    this.conversationHistory.push({
      role: "assistant",
      content: question.text
    })
    
    return question
  }
  
  private getExaminerSystemPrompt(examPart: number): string {
    switch (this.courseContext.courseId) {
      case 'valenciano_c1':
        return this.getValencianoExaminerPrompt(examPart)
      case 'ingles_b2':
        return this.getCambridgeExaminerPrompt(examPart)
      default:
        throw new Error(`No examiner prompt for course: ${this.courseContext.courseId}`)
    }
  }
  
  private getValencianoExaminerPrompt(examPart: number): string {
    return `Eres un examinador oficial d'EOI especialitzat en valencià C1.
    
    Part ${examPart} del examen oral:
    ${examPart === 1 ? 'Presentació personal i tema preparat (3 minuts)' : 
      'Diàleg i debat sobre tema cultural valencià (4 minuts)'}
    
    Comportament:
    - Mantén un to professional però cordial
    - Fes preguntes que demostren coneixement cultural valencià
    - Adapta la dificultat segons les respostes
    - Dona feedback constructiu quan calgui
    - Respecta els temps oficials de cada part
    
    Sempre respon en valencià. Crea un ambient d'examen realista però no estressant.`
  }
  
  private getCambridgeExaminerPrompt(examPart: number): string {
    const partDescriptions = {
      1: 'Interview (2 minutes): Personal questions about work, studies, interests',
      2: 'Long turn (4 minutes): Compare photos and answer related questions', 
      3: 'Collaborative task (4 minutes): Work together to complete a task',
      4: 'Discussion (4 minutes): Discuss topics related to the collaborative task'
    }
    
    return `You are a certified Cambridge B2 First speaking examiner.
    
    Current part: ${partDescriptions[examPart]}
    
    Examiner behavior:
    - Maintain professional but encouraging tone
    - Ask follow-up questions based on responses
    - Manage timing appropriately for each part
    - Use natural, clear British English
    - Give minimal prompting if candidate struggles
    - Stay within official Cambridge guidelines
    
    Create a realistic exam atmosphere while being supportive.`
  }
}
```