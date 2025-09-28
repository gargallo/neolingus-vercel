# 🏪 MARKETING FRONTEND - ACQUISITION & CONVERSION

## 🎯 **CUSTOMER JOURNEY OPTIMIZADO**

```
Visitor → Trial → Test Nivel → Compra → Academia → Éxito Examen
   ↓        ↓         ↓         ↓        ↓          ↓
Landing   Hook   Positioning  Payment  Learning   Retention
```

## 📄 **PÁGINAS PRINCIPALES**

### **Landing Page Strategy**
```
/                               # Landing con hooks específicos
├── /trial                      # Simulacro gratuito (lead gen)
├── /test-nivel                 # Test de nivel automático  
├── /producto                   # Info detallada por idioma
│   ├── /valenciano            
│   ├── /ingles
│   └── /catalan
├── /pricing                    # Planes y precios dinámicos
├── /login                      # Gateway a academia
└── /register                   # Registro con trial inmediato
```

### **Landing Page Components**
```typescript
// /app/page.tsx - Landing Principal
export default function HomePage() {
  return (
    <div className="landing-page">
      <HeroSection />
      <ProblemAgitation />
      <SolutionReveal />
      <SocialProof />
      <TrialCTA />
      <HowItWorks />
      <Testimonials />
      <PricingPreview />
      <FAQ />
      <FinalCTA />
    </div>
  )
}

// /components/landing/HeroSection.tsx
export function HeroSection() {
  return (
    <section className="hero bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">
            Aprueba tu Examen Oficial de Idiomas
            <span className="text-primary"> con 95% de Garantía</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            La única academia que usa <strong>exámenes oficiales reales</strong> + 
            IA que predice tu aprobación. 12,547 estudiantes ya aprobaron.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/trial">
                🎯 Haz un Simulacro Gratis
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" className="text-lg px-8" asChild>
              <Link href="/test-nivel">
                📊 Test de Nivel Gratuito
              </Link>
            </Button>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>7 días gratis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Cancela cuando quieras</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```
## 🎯 **TRIAL SYSTEM - LEAD GENERATION**

### **Trial Strategy**
```typescript
// /app/trial/page.tsx
export default function TrialPage() {
  return (
    <div className="trial-page">
      <TrialHeader />
      <CourseSelector />
      <FreeSimulator />
      <ConversionPrompt />
    </div>
  )
}

// /components/trial/CourseSelector.tsx
export function CourseSelector() {
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  
  const availableCourses = [
    {
      id: 'valenciano_c1',
      name: 'Valenciano C1',
      description: 'Prepárate para EOI y CIEACOVA',
      nextExam: '18 octubre 2025',
      difficulty: 'Avanzado',
      price: '€29.99/mes'
    },
    {
      id: 'ingles_b2',
      name: 'Inglés B2',
      description: 'Cambridge First Certificate',
      nextExam: '15 marzo 2025', 
      difficulty: 'Intermedio Alto',
      price: '€29.99/mes'
    }
  ]
  
  return (
    <section className="course-selector py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          Elige tu curso para probar gratis
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {availableCourses.map(course => (
            <Card 
              key={course.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedCourse === course.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCourse(course.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {course.name}
                  <Badge variant="outline">{course.difficulty}</Badge>
                </CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Próximo examen:</span>
                    <span className="font-medium">{course.nextExam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio después:</span>
                    <span className="font-medium">{course.price}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4"
                  variant={selectedCourse === course.id ? "default" : "outline"}
                >
                  {selectedCourse === course.id ? 'Empezar Trial' : 'Seleccionar'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
```

## 📊 **TEST DE NIVEL AUTOMÁTICO**

### **Level Test Implementation**
```typescript
// /app/test-nivel/page.tsx
export default function LevelTestPage() {
  return (
    <div className="level-test-page">
      <TestIntro />
      <TestInterface />
      <ResultsAndConversion />
    </div>
  )
}

// /components/level-test/TestInterface.tsx
interface LevelTestQuestion {
  id: string
  text: string
  options: string[]
  correctAnswer: string
  level: 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  skill: 'grammar' | 'vocabulary' | 'reading'
}

export function TestInterface() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes
  
  const questions: LevelTestQuestion[] = [
    {
      id: 'q1',
      text: 'I _____ to the cinema last night.',
      options: ['go', 'went', 'have gone', 'had gone'],
      correctAnswer: 'went',
      level: 'A2',
      skill: 'grammar'
    },
    // ... más preguntas graduadas por nivel
  ]
  
  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }
  
  const calculateLevel = (): TestResult => {
    const correctAnswers = questions.filter(q => 
      answers[q.id] === q.correctAnswer
    )
    
    // Algorithm para determinar nivel basado en respuestas correctas
    const levelScores = {
      'A2': correctAnswers.filter(q => q.level === 'A2').length,
      'B1': correctAnswers.filter(q => q.level === 'B1').length,
      'B2': correctAnswers.filter(q => q.level === 'B2').length,
      'C1': correctAnswers.filter(q => q.level === 'C1').length,
      'C2': correctAnswers.filter(q => q.level === 'C2').length
    }
    
    // Determinar nivel recomendado
    const recommendedLevel = Object.entries(levelScores)
      .reduce((a, b) => levelScores[a[0]] > levelScores[b[0]] ? a : b)[0]
    
    return {
      level: recommendedLevel,
      scores: levelScores,
      weakAreas: analyzeWeakAreas(answers, questions),
      recommendedCourse: getRecommendedCourse(recommendedLevel),
      confidence: calculateConfidence(levelScores)
    }
  }
  
  return (
    <div className="test-interface max-w-2xl mx-auto">
      <TestProgress current={currentQuestion} total={questions.length} timeLeft={timeLeft} />
      <QuestionCard 
        question={questions[currentQuestion]}
        onAnswer={handleAnswer}
        selectedAnswer={answers[questions[currentQuestion].id]}
      />
      <TestNavigation 
        onNext={() => setCurrentQuestion(prev => prev + 1)}
        onPrevious={() => setCurrentQuestion(prev => prev - 1)}
        canGoNext={!!answers[questions[currentQuestion].id]}
        isLastQuestion={currentQuestion === questions.length - 1}
      />
    </div>
  )
}
```
## 💰 **PRICING PAGE - CONVERSIÓN OPTIMIZADA**

### **Dynamic Pricing Strategy**
```typescript
// /app/pricing/page.tsx
export default function PricingPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  
  return (
    <div className="pricing-page">
      <PricingHeader />
      <LanguageLevelSelector 
        onLanguageChange={setSelectedLanguage}
        onLevelChange={setSelectedLevel}
      />
      <PricingTiers 
        selectedCourse={`${selectedLanguage}_${selectedLevel}`}
      />
      <FrequentlyAskedQuestions />
      <MoneyBackGuarantee />
    </div>
  )
}

// /components/pricing/PricingTiers.tsx
interface PricingTier {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  popular?: boolean
  discount?: string
}

export function PricingTiers({ selectedCourse }: { selectedCourse: string }) {
  const tiers: PricingTier[] = [
    {
      id: 'single',
      name: 'Curso Individual',
      price: 29.99,
      period: 'mes',
      description: 'Acceso completo a un curso específico',
      features: [
        'Simuladores oficiales reales',
        'AI tutor personalizado',
        'Writing & Speaking practice',
        'Juegos específicos del nivel',
        'Estadísticas detalladas',
        'Predicción de aprobación',
        'Soporte por email'
      ]
    },
    {
      id: 'bundle',
      name: 'Bundle Idioma',
      price: 49.99,
      period: 'mes',
      description: 'Todos los niveles de un idioma',
      features: [
        'Todo del plan individual',
        'Acceso a todos los niveles',
        'Progresión automática B1→B2→C1',
        'Descuento 33% vs individual',
        'Soporte prioritario',
        'Planificación personalizada'
      ],
      popular: true,
      discount: '33% descuento'
    },
    {
      id: 'premium',
      name: 'Acceso Completo',
      price: 79.99,
      period: 'mes', 
      description: 'Todos los idiomas y niveles',
      features: [
        'Acceso a TODOS los cursos',
        'Nuevos idiomas incluidos',
        'IA de predicción avanzada',
        'Exportar progreso',
        'Soporte premium 24/7',
        'Acceso beta features',
        'Sesiones 1:1 mensuales'
      ]
    }
  ]
  
  return (
    <section className="pricing-tiers py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map(tier => (
            <PricingCard key={tier.id} tier={tier} selectedCourse={selectedCourse} />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-green-800">Garantía 30 días</span>
            </div>
            <p className="text-green-700">
              Si no apruebas tu examen oficial, te devolvemos el 100% del dinero.
              Sin preguntas, sin complicaciones.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
```

## 🛒 **PURCHASE FLOW INTEGRATION**

### **Checkout with Update.dev + Stripe**
```typescript
// /components/pricing/PricingCard.tsx
export function PricingCard({ tier, selectedCourse }: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useUpdate()
  
  const handlePurchase = async () => {
    if (!user) {
      toast.error('Inicia sesión para comprar')
      return
    }
    
    setLoading(true)
    
    try {
      // Determine product based on tier and selected course
      const productConfig = getProductConfig(tier.id, selectedCourse)
      
      const response = await fetch('/api/purchase/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: productConfig.stripePrice,
          courseAccess: productConfig.entitlements,
          userId: user.id,
          successUrl: `/dashboard/welcome?course=${selectedCourse}`,
          cancelUrl: '/pricing'
        })
      })
      
      const { url, error } = await response.json()
      
      if (error) {
        throw new Error(error)
      }
      
      if (url) {
        window.location.href = url
      }
      
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Error al procesar la compra')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card className={`pricing-card ${tier.popular ? 'ring-2 ring-primary' : ''}`}>
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-white px-6 py-1">
            Más Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{tier.name}</CardTitle>
        <CardDescription>{tier.description}</CardDescription>
        
        <div className="pt-4">
          <span className="text-4xl font-bold">€{tier.price}</span>
          <span className="text-muted-foreground">/{tier.period}</span>
          {tier.discount && (
            <div className="text-sm text-green-600 font-medium">
              {tier.discount}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3 mb-6">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          onClick={handlePurchase}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            'Empezar Ahora'
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground mt-3">
          Facturación mensual. Cancela en cualquier momento.
        </p>
      </CardContent>
    </Card>
  )
}
```