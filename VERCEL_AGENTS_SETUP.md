# Vercel AI Agents - Configuración Oficial

Este documento describe la implementación de agentes AI siguiendo la documentación oficial de Vercel: https://vercel.com/docs/agents#creating-an-agent

## 📋 Configuración Requerida

### 1. Variables de Entorno
```bash
# Requerido - OpenAI API Key
OPENAI_API_KEY=sk-...

# Opcional - Otros proveedores
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...

# Base de datos
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. Configuración de Vercel Functions

Los agentes están configurados con:
```typescript
// En cada API route
export const runtime = 'nodejs';
export const maxDuration = 60; // Para tareas complejas
```

## 🎯 Estructura de Agentes Implementada

### API Routes (Siguiendo patrones oficiales)

1. **Testing Endpoint**: `/api/admin/agents/[id]/test`
   - Usa `generateText()` con `tools` y `maxSteps`
   - Implementa herramientas con `tool()` y esquemas Zod
   - Maneja múltiples pasos de decisión del agente

2. **Production Endpoint**: `/api/admin/agents/[id]/invoke`
   - Endpoint optimizado para uso en producción
   - Tracking completo de uso y costos
   - Solo agentes con `deployment_status: 'active'`

### Herramientas (Tools) Implementadas

```typescript
// Siguiendo patrón oficial Vercel
const grammarChecker = tool({
  description: 'Check grammar and provide corrections',
  parameters: z.object({
    text: z.string().describe('Text to check'),
    language: z.string().describe('Target language'),
    level: z.string().describe('Proficiency level'),
  }),
  execute: async ({ text, language, level }) => {
    // Lógica de corrección
    return { corrections, score, feedback };
  },
});
```

### Configuración del Agente

```typescript
const result = await generateText({
  model: openai('gpt-4'),
  system: systemPrompt,
  prompt: userPrompt,
  tools: {
    grammarChecker,
    vocabularyEnhancer,
    culturalContextAnalyzer,
  },
  maxSteps: 5, // Permite múltiples interacciones con herramientas
  temperature: 0.3,
  maxTokens: 2500,
});
```

## 🚀 Uso del SDK Cliente

### Instalación
```bash
# Las dependencias ya están instaladas
npm install ai @ai-sdk/openai zod
```

### Uso Básico
```typescript
import { VercelAgentClient } from '@/lib/ai-agents/vercel-agent-client';

// Crear cliente
const client = new VercelAgentClient();

// Invocar agente en producción
const response = await client.invoke('agent-id', {
  input: 'Texto a corregir',
  context: {
    situation: 'formal',
    audience: 'academic'
  }
});

console.log(response.response); // Respuesta del agente
console.log(response.analysis); // Métricas y análisis
```

### Uso con React Hook
```typescript
import { useAgent } from '@/lib/ai-agents/vercel-agent-client';

function MyComponent() {
  const { invoke, test } = useAgent('agent-id');
  
  const handleCorrection = async (text: string) => {
    const result = await invoke(text, {
      situation: 'formal'
    });
    return result.response;
  };
  
  // Testing durante desarrollo
  const runTest = async () => {
    const testResult = await test('Texto de prueba', {
      testType: 'writing',
      expectedOutput: 'Corrección esperada'
    });
    console.log(testResult.confidenceScore);
  };
}
```

## 🔧 Características Implementadas

### ✅ Siguiendo Documentación Oficial
- ✅ Uso de `generateText()` con herramientas
- ✅ Definición de tools con `tool()` y esquemas Zod
- ✅ Configuración `maxSteps` para decisiones multi-paso
- ✅ Configuración de `runtime` y `maxDuration`
- ✅ Manejo adecuado de errores y timeouts

### ✅ Funcionalidades Avanzadas
- ✅ **Multi-Provider**: OpenAI, Anthropic, Google
- ✅ **Tools Especializadas**: Corrección gramatical, mejora vocabulario, análisis cultural
- ✅ **Tracking Completo**: Tokens, costos, tiempo de procesamiento
- ✅ **Testing Interface**: UI completa para probar agentes
- ✅ **Production Ready**: Endpoints optimizados para producción
- ✅ **SDK Cliente**: JavaScript/TypeScript SDK completo

### ✅ Seguridad y Rendimiento
- ✅ **RLS Policies**: Control de acceso a nivel de base de datos
- ✅ **Rate Limiting**: Configuración de límites
- ✅ **Error Handling**: Manejo robusto de errores
- ✅ **Observability**: Logging y métricas completas

## 🧪 Testing

### Probar Agentes en Admin Panel
1. Ve a `/admin/agents`
2. Selecciona un agente
3. Haz clic en "Test Agent"
4. Usa la interfaz de testing en tiempo real

### Probar con cURL
```bash
# Test endpoint
curl -X POST http://localhost:3000/api/admin/agents/AGENT_ID/test \
  -H "Content-Type: application/json" \
  -d '{
    "inputText": "Texto para corregir",
    "testType": "writing"
  }'

# Production endpoint
curl -X POST http://localhost:3000/api/admin/agents/AGENT_ID/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Texto para corregir",
    "context": {
      "situation": "formal"
    }
  }'
```

## 📊 Monitoreo y Métricas

Los agentes registran automáticamente:
- **Tokens usados** y costos estimados
- **Tiempo de procesamiento**
- **Herramientas utilizadas**
- **Pasos de decisión** del agente
- **Ratings de confianza**

Ver métricas en:
- Admin Panel: `/admin/agents/[id]/analytics`
- Base de datos: tabla `agent_performance_metrics`

## 🚢 Despliegue en Vercel

```bash
# Desplegar a Vercel
vercel deploy

# Con variables de entorno
vercel env add OPENAI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

Los agentes están optimizados para Vercel Functions con:
- **Cold start** minimizado
- **Serverless** scaling automático
- **Edge runtime** cuando sea posible

## 📚 Recursos Adicionales

- [Documentación oficial Vercel AI Agents](https://vercel.com/docs/agents)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [OpenAI API](https://platform.openai.com/docs)
- [Zod Schema Validation](https://zod.dev/)

---

**Estado**: ✅ Implementación completa siguiendo patrones oficiales de Vercel AI Agents
**Última actualización**: Enero 2025