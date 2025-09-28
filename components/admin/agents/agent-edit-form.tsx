"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Bot, 
  Save, 
  TestTube, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  Minus,
  History
} from "lucide-react";
import { createSupabaseClient } from "@/utils/supabase/client";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  language: string;
  level: string;
  model_provider: string;
  model_name: string;
  deployment_status: string;
  version: number;
  cultural_context: any;
  scoring_criteria: any;
  tools_config: any;
  performance_config: any;
}

interface AgentEditFormProps {
  agent: Agent;
}

export default function AgentEditForm({ agent }: AgentEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || "",
    type: agent.type,
    language: agent.language,
    level: agent.level,
    model_provider: agent.model_provider,
    model_name: agent.model_name,
    cultural_context: agent.cultural_context || {},
    scoring_criteria: agent.scoring_criteria || {},
    tools_config: agent.tools_config || {},
    performance_config: agent.performance_config || {
      max_tokens: 2000,
      temperature: 0.3,
      timeout_seconds: 30
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  React.useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify({
      name: agent.name,
      description: agent.description || "",
      type: agent.type,
      language: agent.language,
      level: agent.level,
      model_provider: agent.model_provider,
      model_name: agent.model_name,
      cultural_context: agent.cultural_context || {},
      scoring_criteria: agent.scoring_criteria || {},
      tools_config: agent.tools_config || {},
      performance_config: agent.performance_config || {
        max_tokens: 2000,
        temperature: 0.3,
        timeout_seconds: 30
      }
    });
    setHasChanges(changed);
  }, [formData, agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createSupabaseClient();
      
      const { error: updateError } = await supabase
        .from('ai_agents')
        .update({
          ...formData,
          version: agent.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (updateError) throw updateError;

      setSuccess("Agent updated successfully!");
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/admin/agents/${agent.id}?updated=true`);
      }, 1500);

    } catch (error: any) {
      console.error('Error updating agent:', error);
      setError(`Error updating agent: ${error.message}`);
    } finally {
      setLoading(false);
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

  const addCulturalContext = () => {
    const newKey = `context_${Object.keys(formData.cultural_context).length + 1}`;
    setFormData(prev => ({
      ...prev,
      cultural_context: {
        ...prev.cultural_context,
        [newKey]: ""
      }
    }));
  };

  const removeCulturalContext = (key: string) => {
    const newContext = { ...formData.cultural_context };
    delete newContext[key];
    setFormData(prev => ({
      ...prev,
      cultural_context: newContext
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-600" />
              Edit Agent: {agent.name}
            </h1>
            <p className="text-muted-foreground">
              Version {agent.version} • {agent.deployment_status}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/agents/${agent.id}`)}>
            <History className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {hasChanges && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Unsaved Changes
            </Badge>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Warning for active agent */}
      {agent.deployment_status === 'active' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            This agent is currently active and processing corrections. Changes will be applied immediately upon saving.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the fundamental properties of your AI agent
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
                    <SelectItem value="writing_corrector">Writing Corrector</SelectItem>
                    <SelectItem value="speaking_evaluator">Speaking Evaluator</SelectItem>
                    <SelectItem value="reading_assessor">Reading Assessor</SelectItem>
                    <SelectItem value="listening_evaluator">Listening Evaluator</SelectItem>
                    <SelectItem value="grammar_checker">Grammar Checker</SelectItem>
                    <SelectItem value="vocabulary_assessor">Vocabulary Assessor</SelectItem>
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
                    <SelectValue />
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
                    <SelectValue />
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
              Update the underlying AI model and performance settings
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
            {Object.entries(formData.scoring_criteria).map(([key, criterion]: [string, any]) => (
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

        {/* Cultural Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Cultural Context
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addCulturalContext}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Context
              </Button>
            </CardTitle>
            <CardDescription>
              Define cultural and linguistic context for more accurate corrections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(formData.cultural_context).map(([key, value]: [string, any]) => (
              <div key={key} className="flex items-center gap-4 p-4 border rounded-lg">
                <Input
                  placeholder="Context type (e.g., region, variety, register)"
                  value={key}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    const newContext = { ...formData.cultural_context };
                    delete newContext[key];
                    newContext[newKey] = value;
                    setFormData(prev => ({ ...prev, cultural_context: newContext }));
                  }}
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={typeof value === 'string' ? value : JSON.stringify(value)}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cultural_context: {
                      ...prev.cultural_context,
                      [key]: e.target.value
                    }
                  }))}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeCulturalContext(key)}
                  className="text-red-600"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {Object.keys(formData.cultural_context).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No cultural context defined. Add context to improve correction accuracy.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/agents/${agent.id}/test`)}
              disabled={loading}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Changes
            </Button>
            
            <Button
              type="submit"
              disabled={loading || !hasChanges || !formData.name}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}