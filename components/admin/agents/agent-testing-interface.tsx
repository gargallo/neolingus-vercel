"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RefreshCw,
  Save,
  Download,
  Clock,
  Zap,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  TestTube,
  BarChart3,
  Settings,
  MessageSquare,
  FileText,
  Mic,
  Eye,
  Ear,
  Copy,
  Share,
  Trash2
} from "lucide-react";
import { useCompletion } from "ai/react";

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

interface TestResult {
  id: string;
  test_type: string;
  input_text: string;
  expected_output: string | null;
  actual_output: string | null;
  success: boolean;
  error_message: string | null;
  processing_time_ms: number;
  tokens_used: number;
  confidence_score: number | null;
  created_at: string;
}

interface TestTemplate {
  id: string;
  name: string;
  description: string;
  test_type: string;
  input_template: string;
  expected_criteria: any;
  difficulty_level: string;
}

interface AgentTestingInterfaceProps {
  agent: Agent;
  recentTests: TestResult[];
  testTemplates: TestTemplate[];
}

interface TestSession {
  id: string;
  startTime: Date;
  tests: TestExecution[];
  metrics: SessionMetrics;
}

interface TestExecution {
  id: string;
  type: string;
  inputText: string;
  expectedOutput?: string;
  actualOutput?: string;
  processingTime: number;
  tokensUsed: number;
  confidence: number;
  success: boolean;
  timestamp: Date;
  error?: string;
  streaming?: boolean;
}

interface SessionMetrics {
  totalTests: number;
  successRate: number;
  averageProcessingTime: number;
  totalTokens: number;
  averageConfidence: number;
  totalCost: number;
}

// Predefined test cases for different agent types and languages
const TEST_CASES = {
  writing: {
    english: [
      {
        name: "Grammar Correction",
        description: "Test basic grammar error detection and correction",
        input: "I goes to the store yesterday and buy some apples. The apples was very delicious.",
        expectedCriteria: ["subject-verb agreement", "tense consistency", "article usage"]
      },
      {
        name: "Formal Essay Structure",
        description: "Test academic writing structure and coherence",
        input: "Technology is good. It helps people. But sometimes technology is bad. People use phones too much. This is a problem.",
        expectedCriteria: ["coherence", "academic style", "paragraph structure", "transitions"]
      },
      {
        name: "Advanced Vocabulary",
        description: "Test vocabulary enhancement suggestions",
        input: "The movie was very good. The actors were good too. The story was interesting and the ending was good.",
        expectedCriteria: ["vocabulary variety", "word choice", "sophistication"]
      }
    ],
    valenciano: [
      {
        name: "Correcció Gramatical",
        description: "Detectar errors bàsics de gramàtica valenciana",
        input: "Vaig anar al mercat ahir i vaig comprar unes pomes. Les pomes estava molt bones.",
        expectedCriteria: ["concordança", "temps verbals", "articles"]
      },
      {
        name: "Registre Formal",
        description: "Avaluar l'ús del registre formal en valencià",
        input: "Estic escrivint per demanar-te si pots vindre a ma casa demà per sopar.",
        expectedCriteria: ["registre formal", "cortesia", "estructura"]
      }
    ]
  },
  speaking: {
    english: [
      {
        name: "Fluency Assessment",
        description: "Evaluate speech fluency and coherence",
        input: "Well, um, I think that, you know, the weather today is, like, really nice and, uh, I want to go outside but, well, I have work to do.",
        expectedCriteria: ["fluency", "hesitation markers", "coherence"]
      },
      {
        name: "Pronunciation Guide",
        description: "Test pronunciation feedback capability",
        input: "[AUDIO TRANSCRIPTION] I sank ze chip was wery expansiv and ze qualidy was not gud.",
        expectedCriteria: ["pronunciation", "phonetic accuracy", "intelligibility"]
      }
    ],
    valenciano: [
      {
        name: "Pronunciació",
        description: "Avaluar la pronunciació en valencià",
        input: "[TRANSCRIPCIÓ] Bon dia, me dic Joan i estic estudiant valencià des de fa dos anys.",
        expectedCriteria: ["pronunciació", "accent", "naturalitat"]
      }
    ]
  },
  reading: {
    english: [
      {
        name: "Comprehension Check",
        description: "Test reading comprehension analysis",
        input: "Text: 'The Industrial Revolution marked a major turning point in history.' Question: What was the main impact of the Industrial Revolution?",
        expectedCriteria: ["comprehension", "inference", "context understanding"]
      }
    ],
    valenciano: [
      {
        name: "Comprensió Lectora",
        description: "Avaluar la comprensió de textos en valencià",
        input: "Text: 'València és una ciutat amb una rica història cultural.' Pregunta: Què caracteritza València segons el text?",
        expectedCriteria: ["comprensió", "interpretació", "vocabulari"]
      }
    ]
  },
  listening: {
    english: [
      {
        name: "Audio Comprehension",
        description: "Test listening comprehension feedback",
        input: "[AUDIO TRANSCRIPT] The meeting will be held next Tuesday at 3 PM in the conference room.",
        expectedCriteria: ["comprehension", "detail extraction", "context"]
      }
    ],
    valenciano: [
      {
        name: "Comprensió Auditiva",
        description: "Avaluar la comprensió auditiva",
        input: "[TRANSCRIPCIÓ ÀUDIO] La reunió serà dimarts que ve a les tres de la vesprada.",
        expectedCriteria: ["comprensió", "detalls", "context"]
      }
    ]
  }
};

export default function AgentTestingInterface({ 
  agent, 
  recentTests, 
  testTemplates 
}: AgentTestingInterfaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("live-test");
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  
  // Live testing state
  const [inputText, setInputText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TestTemplate | null>(null);
  const [customTestType, setCustomTestType] = useState(agent.type);
  const [currentExecution, setCurrentExecution] = useState<TestExecution | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalTests: 0,
    successRate: 0,
    averageProcessingTime: 0,
    totalTokens: 0,
    averageConfidence: 0,
    totalCost: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Get predefined test cases for this agent
  const predefinedTests = TEST_CASES[agent.type as keyof typeof TEST_CASES]?.[agent.language as keyof typeof TEST_CASES[keyof typeof TEST_CASES]] || [];

  // Initialize new session
  const initializeSession = useCallback(() => {
    const newSession: TestSession = {
      id: `session_${Date.now()}`,
      startTime: new Date(),
      tests: [],
      metrics: {
        totalTests: 0,
        successRate: 0,
        averageProcessingTime: 0,
        totalTokens: 0,
        averageConfidence: 0,
        totalCost: 0
      }
    };
    setCurrentSession(newSession);
  }, []);

  // Update session metrics
  const updateSessionMetrics = useCallback((tests: TestExecution[]) => {
    if (tests.length === 0) return;

    const totalTests = tests.length;
    const successfulTests = tests.filter(t => t.success).length;
    const totalProcessingTime = tests.reduce((sum, t) => sum + t.processingTime, 0);
    const totalTokens = tests.reduce((sum, t) => sum + t.tokensUsed, 0);
    const confidenceScores = tests.filter(t => t.confidence > 0);
    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, t) => sum + t.confidence, 0) / confidenceScores.length 
      : 0;
    
    // Estimate cost based on model and tokens (rough estimation)
    const costPerToken = agent.model_provider === 'openai' ? 0.00001 : 0.000008;
    const totalCost = totalTokens * costPerToken;

    const metrics: SessionMetrics = {
      totalTests,
      successRate: (successfulTests / totalTests) * 100,
      averageProcessingTime: totalProcessingTime / totalTests,
      totalTokens,
      averageConfidence,
      totalCost
    };

    setSessionMetrics(metrics);
  }, [agent.model_provider]);

  // Run a single test
  const runTest = async (testInput: string, testType: string, expectedOutput?: string) => {
    if (!currentSession) {
      initializeSession();
    }

    setIsRunning(true);
    abortControllerRef.current = new AbortController();

    const executionId = `test_${Date.now()}`;
    const startTime = Date.now();

    const newExecution: TestExecution = {
      id: executionId,
      type: testType,
      inputText: testInput,
      expectedOutput,
      processingTime: 0,
      tokensUsed: 0,
      confidence: 0,
      success: false,
      timestamp: new Date(),
      streaming: streamingEnabled
    };

    setCurrentExecution(newExecution);
    setStreamedContent("");

    try {
      const response = await fetch(`/api/admin/agents/${agent.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText: testInput,
          testType: testType,
          expectedOutput,
          sessionId: currentSession?.id,
          context: {
            language: agent.language,
            level: agent.level,
            type: agent.type
          }
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const processingTime = Date.now() - startTime;

      if (streamingEnabled && response.body) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let metadata = {};

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    setStreamedContent(fullContent);
                  }
                  if (parsed.metadata) {
                    metadata = { ...metadata, ...parsed.metadata };
                  }
                } catch (e) {
                  // Handle non-JSON chunks
                  fullContent += data;
                  setStreamedContent(fullContent);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Finalize execution
        const finalExecution: TestExecution = {
          ...newExecution,
          actualOutput: fullContent,
          processingTime,
          tokensUsed: (metadata as any).tokensUsed || 0,
          confidence: (metadata as any).confidence || 0,
          success: true
        };

        setCurrentExecution(finalExecution);

        // Add to session
        if (currentSession) {
          const updatedTests = [...currentSession.tests, finalExecution];
          setCurrentSession({
            ...currentSession,
            tests: updatedTests
          });
          updateSessionMetrics(updatedTests);
        }

        // Auto-save if enabled
        if (autoSave) {
          await saveTestResult(finalExecution);
        }

      } else {
        // Handle non-streaming response
        const result = await response.json();
        
        const finalExecution: TestExecution = {
          ...newExecution,
          actualOutput: result.output,
          processingTime: result.processingTime || processingTime,
          tokensUsed: result.tokensUsed || 0,
          confidence: result.confidenceScore || 0,
          success: result.success !== false,
          toolResults: result.toolResults || [],
          steps: result.steps || 0
        };

        setCurrentExecution(finalExecution);

        // Add to session
        if (currentSession) {
          const updatedTests = [...currentSession.tests, finalExecution];
          setCurrentSession({
            ...currentSession,
            tests: updatedTests
          });
          updateSessionMetrics(updatedTests);
        }

        // Auto-save if enabled
        if (autoSave) {
          await saveTestResult(finalExecution);
        }
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        // Test was cancelled
        return;
      }

      const errorExecution: TestExecution = {
        ...newExecution,
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };

      setCurrentExecution(errorExecution);

      if (currentSession) {
        const updatedTests = [...currentSession.tests, errorExecution];
        setCurrentSession({
          ...currentSession,
          tests: updatedTests
        });
        updateSessionMetrics(updatedTests);
      }

    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  // Save test result to database
  const saveTestResult = async (execution: TestExecution) => {
    try {
      await fetch('/api/admin/agents/test/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          testType: execution.type,
          inputText: execution.inputText,
          expectedOutput: execution.expectedOutput,
          actualOutput: execution.actualOutput,
          success: execution.success,
          errorMessage: execution.error,
          processingTimeMs: execution.processingTime,
          tokensUsed: execution.tokensUsed,
          confidenceScore: execution.confidence
        })
      });
    } catch (error) {
      console.error('Failed to save test result:', error);
    }
  };

  // Cancel current test
  const cancelTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsRunning(false);
      setCurrentExecution(null);
      setStreamedContent("");
    }
  };

  // Load template
  const loadTemplate = (template: TestTemplate) => {
    setSelectedTemplate(template);
    setInputText(template.input_template);
    setCustomTestType(template.test_type);
  };

  // Load predefined test
  const loadPredefinedTest = (test: any) => {
    setInputText(test.input);
    setCustomTestType(agent.type);
    setSelectedTemplate(null);
  };

  // Export session results
  const exportSession = () => {
    if (!currentSession) return;

    const exportData = {
      sessionId: currentSession.id,
      agentId: agent.id,
      agentName: agent.name,
      startTime: currentSession.startTime,
      metrics: sessionMetrics,
      tests: currentSession.tests,
      exportedAt: new Date()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-test-session-${currentSession.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear session
  const clearSession = () => {
    setCurrentSession(null);
    setCurrentExecution(null);
    setStreamedContent("");
    setSessionMetrics({
      totalTests: 0,
      successRate: 0,
      averageProcessingTime: 0,
      totalTokens: 0,
      averageConfidence: 0,
      totalCost: 0
    });
  };

  // Initialize session on component mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'writing': return <FileText className="h-4 w-4" />;
      case 'speaking': return <Mic className="h-4 w-4" />;
      case 'reading': return <Eye className="h-4 w-4" />;
      case 'listening': return <Ear className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="admin-spacing-section">
      {/* Quick Actions Bar */}
      <div className="admin-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button variant="outline" onClick={() => router.back()} className="admin-button-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agent
          </Button>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch
                checked={streamingEnabled}
                onCheckedChange={setStreamingEnabled}
                disabled={isRunning}
              />
              <span className="text-body admin-text-secondary">Real-time streaming</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
              <span className="text-body admin-text-secondary">Auto-save results</span>
            </div>

            {currentSession && currentSession.tests.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={exportSession} className="admin-button-secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Export Session
                </Button>
                
                <Button variant="outline" size="sm" onClick={clearSession} className="admin-button-secondary">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Session
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Session Metrics */}
      {sessionMetrics.totalTests > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <TestTube className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-caption admin-text-secondary font-medium">Tests Run</p>
                <p className="text-heading-2 admin-text-primary font-bold">{sessionMetrics.totalTests}</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-caption admin-text-secondary font-medium">Success Rate</p>
                <p className="text-heading-2 admin-text-primary font-bold">{sessionMetrics.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-caption admin-text-secondary font-medium">Avg Time</p>
                <p className="text-heading-2 admin-text-primary font-bold">{Math.round(sessionMetrics.averageProcessingTime)}ms</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-caption admin-text-secondary font-medium">Tokens</p>
                <p className="text-heading-2 admin-text-primary font-bold">{sessionMetrics.totalTokens.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-caption admin-text-secondary font-medium">Confidence</p>
                <p className="text-heading-2 admin-text-primary font-bold">{(sessionMetrics.averageConfidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <span className="text-lg">💰</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-caption admin-text-secondary font-medium">Est. Cost</p>
                <p className="text-heading-2 admin-text-primary font-bold">${sessionMetrics.totalCost.toFixed(4)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Testing Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live-test">Live Testing</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="batch">Batch Testing</TabsTrigger>
          <TabsTrigger value="results">Results History</TabsTrigger>
        </TabsList>

        {/* Live Testing Tab */}
        <TabsContent value="live-test" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Input</CardTitle>
                  <CardDescription>
                    Enter text for the agent to analyze and provide corrections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Test Type</label>
                    <select 
                      value={customTestType} 
                      onChange={(e) => setCustomTestType(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      disabled={isRunning}
                    >
                      <option value="writing">Writing</option>
                      <option value="speaking">Speaking</option>
                      <option value="reading">Reading</option>
                      <option value="listening">Listening</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Input Text</label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Enter the text you want the agent to analyze and correct..."
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={6}
                      disabled={isRunning}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => runTest(inputText, customTestType)}
                      disabled={isRunning || !inputText.trim()}
                      className="flex-1"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {streamingEnabled ? 'Streaming...' : 'Testing...'}
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Test
                        </>
                      )}
                    </Button>

                    {isRunning && (
                      <Button variant="outline" onClick={cancelTest}>
                        <Pause className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Predefined Test Cases */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Test Cases</CardTitle>
                  <CardDescription>
                    Common test scenarios for {agent.type} in {agent.language}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {predefinedTests.map((test, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => loadPredefinedTest(test)}
                        disabled={isRunning}
                        className="justify-start text-left h-auto p-3"
                      >
                        <div>
                          <p className="font-medium">{test.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {test.description}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="space-y-4">
              {/* Current Test Output */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {currentExecution && getTestTypeIcon(currentExecution.type)}
                    Test Output
                    {isRunning && streamingEnabled && (
                      <Badge variant="secondary" className="ml-auto">
                        <div className="animate-pulse">●</div>
                        <span className="ml-1">Live</span>
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {streamingEnabled ? 'Real-time' : 'Complete'} agent response and analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentExecution ? (
                    <div className="space-y-4">
                      {/* Response Content */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Correction & Feedback:</h4>
                        <div className="text-sm whitespace-pre-wrap">
                          {streamingEnabled && isRunning ? 
                            streamedContent || <div className="animate-pulse">Analyzing...</div> :
                            currentExecution.actualOutput || 
                            (currentExecution.error && (
                              <div className="text-red-600">
                                <AlertCircle className="h-4 w-4 inline mr-1" />
                                Error: {currentExecution.error}
                              </div>
                            )) ||
                            <div className="text-muted-foreground">No output yet...</div>
                          }
                        </div>
                      </div>

                      {/* Metrics */}
                      {(currentExecution.processingTime > 0 || isRunning) && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Processing Time:</span>
                            <span className="ml-2 font-medium">
                              {isRunning ? (
                                <span className="animate-pulse">Running...</span>
                              ) : (
                                `${currentExecution.processingTime}ms`
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tokens Used:</span>
                            <span className="ml-2 font-medium">
                              {currentExecution.tokensUsed || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className="ml-2 font-medium">
                              {currentExecution.confidence > 0 ? 
                                `${(currentExecution.confidence * 100).toFixed(0)}%` : 
                                '—'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <span className="ml-2">
                              {isRunning ? (
                                <Badge variant="secondary">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Running
                                </Badge>
                              ) : currentExecution.success ? (
                                <Badge variant="default">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Success
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Ready to Test</h3>
                      <p className="text-sm">
                        Enter some text and click "Run Test" to see the agent's response
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session Tests History */}
              {currentSession && currentSession.tests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Session Tests</CardTitle>
                    <CardDescription>
                      Tests run in current session ({currentSession.tests.length})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {currentSession.tests.slice().reverse().map((test, index) => (
                        <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            {test.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <div>
                              <span className="font-medium">{test.type}</span>
                              <p className="text-xs text-muted-foreground truncate max-w-48">
                                {test.inputText}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {test.processingTime}ms • {test.tokensUsed} tokens
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Templates</CardTitle>
              <CardDescription>
                Pre-configured test scenarios for systematic agent evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Templates Available</h3>
                  <p className="text-sm">
                    No test templates found for {agent.type} ({agent.language})
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testTemplates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="secondary" className="text-xs">
                                {template.test_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {template.difficulty_level}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                              {template.input_template}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm" 
                            onClick={() => loadTemplate(template)}
                            className="flex-1"
                          >
                            Load Template
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => runTest(template.input_template, template.test_type)}
                            disabled={isRunning}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Run Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Testing Tab */}
        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch Testing</CardTitle>
              <CardDescription>
                Run multiple tests automatically for comprehensive agent evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Batch Testing Coming Soon</h3>
                <p className="text-sm">
                  Automated test suite execution will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results History Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Results History</CardTitle>
              <CardDescription>
                Previous test results and performance history for this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Test History</h3>
                  <p className="text-sm">
                    Run some tests to see the history here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {test.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium">{test.test_type}</span>
                          <Badge variant={test.success ? "default" : "destructive"}>
                            {test.success ? "Passed" : "Failed"}
                          </Badge>
                          {test.confidence_score && (
                            <Badge variant="outline">
                              {(test.confidence_score * 100).toFixed(0)}% confidence
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(test.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium mb-1">Input:</h5>
                          <p className="text-muted-foreground bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                            {test.input_text}
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-1">Output:</h5>
                          <p className="text-muted-foreground bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                            {test.actual_output || (test.error_message && (
                              <span className="text-red-600">Error: {test.error_message}</span>
                            )) || "No output"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>Processing Time: {test.processing_time_ms}ms</span>
                        <span>Tokens Used: {test.tokens_used}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}