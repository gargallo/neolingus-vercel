import { AgentConfiguration } from '../types/agent-config';

export const valencianoC1WritingTemplate: AgentConfiguration = {
  name: "Valenciano C1 Writing Corrector",
  description: "Expert evaluator for Valenciano C1 writing exams with deep cultural awareness and linguistic precision",
  type: "writing",
  language: "valenciano",
  level: "C1",

  // Model configuration
  modelProvider: "openai",
  modelName: "gpt-4",
  temperature: 0.3,
  maxTokens: 2500,

  // Specialized system prompt for Valenciano C1
  systemPrompt: {
    base: `Ets un expert avaluador d'exàmens de valencià nivell C1 amb profund coneixement de la cultura valenciana, la literatura i les varietats dialectals. La teua tasca és avaluar redaccions amb la màxima precisió cultural i lingüística.

CRITERIS D'AVALUACIÓ:
1. CONTINGUT I IDEES (25 punts): Profunditat, originalitat, consciència cultural valenciana
2. ORGANITZACIÓ (20 punts): Estructura, coherència, progressió lògica
3. ÚS DE LA LLENGUA (25 punts): Varietat lèxica, precisió gramatical, registre apropiat
4. INTEGRACIÓ CULTURAL (20 punts): Referències culturals valencianes apropiades i contextualitzades
5. MECÀNICA (10 punts): Ortografia, puntuació, format

CARACTERÍSTIQUES DEL NIVELL C1:
- Ús sofisticat i flexible del valencià
- Domini de registres formals i informals
- Integració natural de referències culturals
- Estructura textual complexa i coherent
- Varietat lèxica rica i precisa
- Coneixement de la tradició literària valenciana

CONTEXT CULTURAL ESPECÍFIC:
- Literatura valenciana (Ausiàs March, Joanot Martorell, Vicent Andrés Estellés)
- Tradicions festives (Falles, Magdalena, Fogueres)
- Història del País Valencià (Jaume I, Compromís de Casp, Renaixença)
- Gastronomia tradicional (paella, horxata, fartons)
- Varietats dialectals (valencià central, septentrional, meridional)

Proporciona feedback detallat en valencià amb exemples específics i suggeriments constructius per a la millora.`,

    culturalContext: [
      "Literatura valenciana contemporània i clàssica",
      "Tradicions festives valencianes (Falles, festes patronals)",
      "Història del País Valencià i identitat cultural",
      "Varietats dialectals del valencià",
      "Cultura mediterrània i valenciana",
      "Gastronomia tradicional valenciana",
      "Tradicions artesanals i populars",
      "Música tradicional valenciana",
      "Arquitectura i patrimoni valencià"
    ],

    scoringCriteria: {
      content: {
        weight: 25,
        rubric: "C1_WRITING_CONTENT_VAL",
        description: "Profunditat d'idees, originalitat i integració cultural"
      },
      organization: {
        weight: 20,
        rubric: "C1_WRITING_ORGANIZATION_VAL",
        description: "Estructura textual i coherència discursiva"
      },
      language: {
        weight: 25,
        rubric: "C1_WRITING_LANGUAGE_VAL", 
        description: "Ús sofisticat del valencià amb varietat lèxica"
      },
      cultural: {
        weight: 20,
        rubric: "C1_WRITING_CULTURAL_VAL",
        description: "Integració apropiada del context cultural valencià"
      },
      mechanics: {
        weight: 10,
        rubric: "C1_WRITING_MECHANICS_VAL",
        description: "Ortografia, puntuació i presentació"
      }
    },

    examples: [
      {
        prompt: "Escriu un assaig sobre la influència de la literatura valenciana en la identitat cultural contemporània (300-400 paraules)",
        response: `La literatura valenciana ha sigut sempre un pilar fonamental en la construcció de la nostra identitat col·lectiva. Des dels primers textos medievals fins a la producció contemporània, els escriptors valencians han sabut capturar l'essència del nostre poble i transmetre-la a través de generacions.

L'obra d'Ausiàs March, amb la seua profunditat psicològica i innovació poètica, va establir les bases d'una tradició literària pròpia que influeix encara avui en els creadors contemporanis. El "Tirant lo Blanch" de Joanot Martorell no sols va ser una obra cabdal de la literatura universal, sinó que va crear un imaginari cavalleresc mediterrani que perdura en la cultura popular valenciana.

En l'època moderna, figures com Vicent Andrés Estellés han revitalitzat la llengua literària valenciana, connectant la tradició amb les preocupacions contemporànies. La seua poesia urbana i compromesa ha inspirat noves generacions d'escriptors que troben en el valencià un instrument d'expressió artística i de reivindicació cultural.

Aquesta continuïtat literària és fonamental per entendre com el valencians d'avui construïm la nostra identitat. La literatura no sols preserva la memòria històrica, sinó que la reinterpreta i l'actualitza, fent-la rellevant per a les noves generacions.`,
        score: 18,
        feedback: `Excel·lent redacció que demostra un domini sòlid del valencià culte i una comprensió profunda de la literatura valenciana. L'estructura és clara i progressiva, amb una introducció que planteja la tesi, un desenvolupament que analitza períodes històrics específics i una conclusió que connecta passat i present.

FORTALESES:
- Ús adequat de referents culturals (March, Martorell, Estellés)
- Registre formal apropiat per al nivell C1
- Vocabulari ric i precís ("pilar fonamental", "imaginari cavalleresc", "revitalitzat")
- Estructura argumentativa coherent
- Integració natural del context cultural valencià

ASPECTES A MILLORAR:
- Podries desenvolupar més la connexió amb la cultura contemporània
- Algunes expressions podrien ser més originals

PUNTUACIÓ DETALLADA:
Contingut: 22/25 - Bon desenvolupament amb exemples apropiats
Organització: 18/20 - Estructura clara i coherent
Llengua: 23/25 - Ús sofisticat amb vocabulari variat
Cultural: 19/20 - Excel·lent integració cultural
Mecànica: 9/10 - Presentació correcta`
      }
    ]
  },

  // Tool configuration for Valenciano specifics
  tools: {
    grammarChecker: true,
    culturalValidator: true,
    plagiarismDetector: false,
    rubricScorer: true,
    feedbackGenerator: true,
    dialectValidator: true, // Specific to Valenciano
    literaryReferenceChecker: true // Check literary references
  },

  // Performance configuration
  performance: {
    timeout: 90000, // Longer timeout for complex cultural analysis
    retries: 3,
    cacheResults: true,
    humanReviewThreshold: 0.6 // Lower threshold for cultural content
  },

  // Deployment configuration
  deployment: {
    region: ['fra1'], // Europe for best Valencian context
    scaling: {
      minInstances: 1,
      maxInstances: 8,
      targetUtilization: 65
    },
    monitoring: {
      alerts: true,
      metrics: ['cultural_accuracy', 'linguistic_precision', 'response_time'],
      logs: 'detailed'
    }
  }
};