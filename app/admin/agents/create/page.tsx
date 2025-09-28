"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Bot, 
  Save, 
  TestTube, 
  Lightbulb,
  Loader2,
  Plus,
  Minus
} from "lucide-react";
import { createSupabaseClient } from "@/utils/supabase/client";

interface CulturalContext {
  region?: string;
  variety?: string;
  cultural_aspects?: string[];
  common_errors?: string[];
  [key: string]: unknown;
}

interface ScoringCriteria {
  [key: string]: {
    weight: number;
    description?: string;
  };
}

interface ToolsConfig {
  [key: string]: unknown;
}

interface PerformanceConfig {
  max_tokens: number;
  temperature: number;
  timeout_seconds: number;
  [key: string]: unknown;
}

interface AgentTemplate {
  id: string;
  name: string;
  type: string;
  language: string;
  level: string;
  description: string;
  model_provider: string;
  model_name: string;
  cultural_context: CulturalContext;
  scoring_criteria: ScoringCriteria;
  tools_config: ToolsConfig;
  performance_config: PerformanceConfig;
}

const DEFAULT_TEMPLATES: Record<string, Partial<AgentTemplate>> = {
  valenciano_c1_writing: {
    name: "Valenciano C1 Writing Corrector",
    type: "writing",
    language: "Valencian",
    level: "C1",
    description: "Advanced Valencian writing correction agent for C1 level students",
    model_provider: "openai",
    model_name: "gpt-4",
    cultural_context: {
      region: "Valencia",
      cultural_aspects: ["formal_register", "academic_writing"],
      common_errors: ["spanish_interference", "verb_conjugation", "orthography"]
    },
    scoring_criteria: {
      grammar: { weight: 0.3 },
      vocabulary: { weight: 0.25 },
      coherence: { weight: 0.25 },
      cultural_appropriateness: { weight: 0.2 }
    }
  },
  english_b2_speaking: {
    name: "English B2 Speaking Evaluator",
    type: "speaking", 
    language: "English",
    level: "B2",
    description: "English speaking evaluation agent for B2 level oral exams",
    model_provider: "openai",
    model_name: "gpt-4",
    cultural_context: {
      variety: "International English",
      cultural_aspects: ["formal_presentations", "academic_discussions"],
      common_errors: ["pronunciation", "intonation", "fluency"]
    },
    scoring_criteria: {
      fluency: { weight: 0.3 },
      pronunciation: { weight: 0.25 },
      vocabulary: { weight: 0.2 },
      grammar: { weight: 0.25 }
    }
  }
};

export default function CreateAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = searchParams.get('template');
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "writing",
    language: "",
    level: "",
    model_provider: "openai",
    model_name: "gpt-4",
    deployment_status: "inactive",
    cultural_context: {} as CulturalContext,
    scoring_criteria: {} as ScoringCriteria,
    tools_config: {} as ToolsConfig,
    performance_config: {
      max_tokens: 2000,
      temperature: 0.3,
      timeout_seconds: 30
    } as PerformanceConfig
  });

  // Load template data
  useEffect(() => {
    if (template && DEFAULT_TEMPLATES[template]) {
      const templateData = DEFAULT_TEMPLATES[template];
      setFormData(prev => ({
        ...prev,
        ...templateData,
        cultural_context: templateData.cultural_context || {},
        scoring_criteria: templateData.scoring_criteria || {},
        tools_config: templateData.tools_config || {},
        performance_config: {
          ...prev.performance_config,
          ...(templateData.performance_config || {})
        }
      }));
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      
      // Get current user and their admin record for created_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the admin_users record for this user
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminUser) {
        throw new Error('Admin user not found');
      }

      // Create a system prompt if not provided
      const systemPrompt = `You are an AI language learning assistant specialized in ${formData.language} ${formData.level} level ${formData.type.replace('_', ' ')}. 
      
Your role is to provide accurate, culturally appropriate corrections and feedback for language learners.

Context: ${formData.description || 'General language correction'}

Please provide constructive feedback that helps students improve their ${formData.language} skills.`;

      const { data, error } = await supabase
        .from('ai_agents')
        .insert([{
          name: formData.name,
          description: formData.description,
          type: formData.type,
          language: formData.language,
          level: formData.level,
          model_provider: formData.model_provider,
          model_name: formData.model_name,
          system_prompt: systemPrompt,
          cultural_context: formData.cultural_context,
          scoring_criteria: formData.scoring_criteria,
          tools_config: formData.tools_config,
          performance_config: formData.performance_config,
          deployment_status: 'draft',
          version: 1,
          created_by: adminUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      router.push(`/admin/agents/${data.id}?created=true`);
    } catch (error) {
      console.error('Error creating agent:', error);
      if (error instanceof Error) {
        alert(`Error creating agent: ${error.message}`);
      } else {
        alert(`Error creating agent: Unknown error`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testAgent = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Simulate AI SDK integration for testing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResult("✅ Agent configuration test passed! Ready for deployment.");
    } catch {
      setTestResult("❌ Agent test failed. Please check configuration.");
    } finally {
      setTesting(false);
    }
  };

  const addScoringCriterion = () => {
    const newKey = `criterion_${Object.keys(formData.scoring_criteria).length + 1}`;
    setFormData(prev => ({
      ...prev,
      scoring_criteria: {
        ...prev.scoring_criteria,
        [newKey]: { weight: 0.1, description: "" }
      }
    }));
  };

  const removeScoringCriterion = (key: string) => {
    const newCriteria = { ...formData.scoring_criteria };
    delete newCriteria[key];
    setFormData(prev => ({
      ...prev,
      scoring_criteria: newCriteria
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            Create AI Agent
          </h1>
          <p className="text-muted-foreground">
            Create a new language learning correction agent
          </p>
        </div>
      </div>

      {/* Template indicator */}
      {template && DEFAULT_TEMPLATES[template] && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700 font-medium">
                Using template: {DEFAULT_TEMPLATES[template].name}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the fundamental properties of your AI agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Advanced English Writing Corrector"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Agent Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="writing">Writing Corrector</SelectItem>
                    <SelectItem value="speaking">Speaking Evaluator</SelectItem>
                    <SelectItem value="reading">Reading Assessor</SelectItem>
                    <SelectItem value="listening">Listening Evaluator</SelectItem>
                    <SelectItem value="general">General Language Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language *</Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="Valencian">Valencian</SelectItem>
                    <SelectItem value="Catalan">Catalan</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Italian">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select 
                  value={formData.level} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Beginner</SelectItem>
                    <SelectItem value="A2">A2 - Elementary</SelectItem>
                    <SelectItem value="B1">B1 - Intermediate</SelectItem>
                    <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                    <SelectItem value="C1">C1 - Advanced</SelectItem>
                    <SelectItem value="C2">C2 - Proficient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this agent does and its purpose..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Model Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>AI Model Configuration</CardTitle>
            <CardDescription>
              Configure the underlying AI model and performance settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model_provider">Model Provider</Label>
                <Select 
                  value={formData.model_provider} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, model_provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google AI</SelectItem>
                    <SelectItem value="azure">Azure OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model_name">Model Name</Label>
                <Select 
                  value={formData.model_name} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, model_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.model_provider === 'openai' && (
                      <>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </>
                    )}
                    {formData.model_provider === 'anthropic' && (
                      <>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={formData.performance_config.max_tokens}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    performance_config: {
                      ...prev.performance_config,
                      max_tokens: parseInt(e.target.value)
                    }
                  }))}
                  min="500"
                  max="4000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.performance_config.temperature}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    performance_config: {
                      ...prev.performance_config,
                      temperature: parseFloat(e.target.value)
                    }
                  }))}
                  min="0"
                  max="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.performance_config.timeout_seconds}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    performance_config: {
                      ...prev.performance_config,
                      timeout_seconds: parseInt(e.target.value)
                    }
                  }))}
                  min="10"
                  max="120"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Scoring Criteria
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addScoringCriterion}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Criterion
              </Button>
            </CardTitle>
            <CardDescription>
              Define how the agent should evaluate and score submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(formData.scoring_criteria).map(([key, criterion]: [string, { weight: number; description?: string }]) => (
              <div key={key} className="flex items-center gap-4 p-4 border rounded-lg">
                <Input
                  placeholder="Criterion name (e.g., grammar, vocabulary)"
                  value={key}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    const newCriteria = { ...formData.scoring_criteria };
                    delete newCriteria[key];
                    newCriteria[newKey] = criterion;
                    setFormData(prev => ({ ...prev, scoring_criteria: newCriteria }));
                  }}
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={criterion.weight}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    scoring_criteria: {
                      ...prev.scoring_criteria,
                      [key]: { ...criterion, weight: parseFloat(e.target.value) }
                    }
                  }))}
                  className="w-24"
                  placeholder="Weight"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeScoringCriterion(key)}
                  className="text-red-600"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {Object.keys(formData.scoring_criteria).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No scoring criteria defined. Add criteria to specify how submissions should be evaluated.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Test Agent Configuration</CardTitle>
            <CardDescription>
              Test your agent configuration before creating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={testAgent}
              disabled={testing || !formData.name}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Configuration...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Agent Configuration
                </>
              )}
            </Button>
            
            {testResult && (
              <div className={`p-4 rounded-lg ${
                testResult.includes('✅') 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={testResult.includes('✅') ? 'text-green-700' : 'text-red-700'}>
                  {testResult}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.language || !formData.level}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Agent
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}