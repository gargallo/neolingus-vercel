"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TestTube, 
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  Info,
  Copy,
  RefreshCw
} from "lucide-react";
import { toast } from "@/lib/toast";

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
}

interface TestResult {
  success: boolean;
  agentId?: string;
  agentName?: string;
  input?: string;
  output?: string;
  processingTime?: number;
  tokensUsed?: number;
  confidenceScore?: number;
  accuracyScore?: number;
  steps?: number;
  toolResults?: Array<{
    toolName: string;
    result: unknown;
  }>;
  metadata?: {
    model: string;
    language: string;
    level: string;
    type: string;
    timestamp: string;
  };
  error?: string;
  code?: string;
}

interface AgentTesterProps {
  agent: Agent;
  onClose?: () => void;
}

const TEST_SAMPLES = {
  english: {
    writing: [
      "I go to the store yesterday and buy some bread.",
      "She don't like pizza, but her brother love it very much.",
      "The weather is very good today, I think we should go to park."
    ],
    speaking: [
      "Hello, how are you? I am fine, thank you very much for asking me.",
      "I would like to make a reservation for dinner tonight at 8 PM.",
      "Excuse me, could you please tell me where is the nearest subway station?"
    ]
  },
  spanish: {
    writing: [
      "Yo fui a la tienda ayer y compré un pan.",
      "A ella no le gusta la pizza, pero a su hermano le encanta mucho.",
      "El tiempo está muy bueno hoy, creo que deberíamos ir al parque."
    ]
  },
  valencian: {
    writing: [
      "Ahir vaig anar a la botiga i vaig comprar pa.",
      "A ella no li agrada la pizza, però al seu germà li encanta molt.",
      "El temps està molt bo avui, crec que hauríem d'anar al parc."
    ]
  }
};

export default function AgentTester({ agent, onClose }: AgentTesterProps) {
  const [testInput, setTestInput] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [testType, setTestType] = useState<string>("writing");
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [activeTab, setActiveTab] = useState("manual");

  const handleTest = useCallback(async () => {
    if (!testInput.trim()) {
      toast.error("Please enter text to test");
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/admin/agents/${agent.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText: testInput,
          testType,
          expectedOutput: expectedOutput || undefined
        }),
      });

      const result = await response.json();
      
      // Debug logging to see what we actually receive
      console.log('Agent test result:', result);
      console.log('Output field:', result.output);
      console.log('Output length:', result.output?.length);

      if (result.success) {
        setTestResult(result);
        toast.success(`Test completed with ${result.confidenceScore}% confidence`);
      } else {
        toast.error(result.error || 'Test failed');
        setTestResult(result);
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to connect to agent');
      setTestResult({
        success: false,
        error: 'Network error',
        code: 'NETWORK_ERROR'
      } as TestResult);
    } finally {
      setIsLoading(false);
    }
  }, [agent.id, testInput, testType, expectedOutput]);

  const handleSampleTest = useCallback((sample: string) => {
    setTestInput(sample);
    setActiveTab("manual");
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }, []);

  const getStatusColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = (success: boolean, score?: number) => {
    if (!success) return <XCircle className="h-5 w-5 text-red-500" />;
    if (score && score >= 85) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (score && score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const samples = TEST_SAMPLES[agent.language.toLowerCase() as keyof typeof TEST_SAMPLES];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TestTube className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Test Agent: {agent.name}</CardTitle>
                <CardDescription>
                  {agent.language} {agent.level} • {agent.type} • {agent.model_name}
                </CardDescription>
              </div>
            </div>
            <Badge variant={agent.deployment_status === 'active' ? 'default' : 'secondary'}>
              {agent.deployment_status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual">Manual Test</TabsTrigger>
              <TabsTrigger value="samples">Sample Tests</TabsTrigger>
              <TabsTrigger value="batch">Batch Testing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="testType">Test Type</Label>
                    <Select value={testType} onValueChange={setTestType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="writing">Writing</SelectItem>
                        <SelectItem value="speaking">Speaking</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="listening">Listening</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="testInput">Input Text</Label>
                    <Textarea
                      id="testInput"
                      placeholder={`Enter ${agent.language} text to test...`}
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      className="min-h-32 resize-vertical"
                      maxLength={10000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {testInput.length}/10,000 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="expectedOutput">Expected Output (Optional)</Label>
                    <Textarea
                      id="expectedOutput"
                      placeholder="Enter expected correction/output for accuracy comparison..."
                      value={expectedOutput}
                      onChange={(e) => setExpectedOutput(e.target.value)}
                      className="min-h-24"
                    />
                  </div>

                  <Button 
                    onClick={handleTest} 
                    disabled={isLoading || !testInput.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing Agent...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Test Agent
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Agent Information</Label>
                    <Card className="p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Language:</span>
                          <span>{agent.language}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Level:</span>
                          <span>{agent.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{agent.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Model:</span>
                          <span>{agent.model_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={agent.deployment_status === 'active' ? 'default' : 'secondary'}>
                            {agent.deployment_status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div>
                    <Label>Quick Tips</Label>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        • Try texts with common grammar errors<br/>
                        • Test various difficulty levels<br/>
                        • Include cultural context when relevant<br/>
                        • Add expected output for accuracy scoring
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="samples" className="space-y-4 mt-6">
              <div>
                <Label>Sample Test Cases</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a sample to test common language learning scenarios
                </p>
              </div>

              {samples ? (
                <div className="space-y-4">
                  {Object.entries(samples).map(([type, texts]) => (
                    <Card key={type} className="p-4">
                      <h4 className="font-medium mb-3 capitalize">{type} Samples</h4>
                      <div className="space-y-2">
                        {texts.map((text, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm flex-1">{text}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSampleTest(text)}
                            >
                              Use Sample
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No sample tests available for {agent.language}. You can contribute samples!
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="batch" className="space-y-4 mt-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Batch testing allows you to test multiple inputs at once. Coming soon!
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResult.success, testResult.confidenceScore)}
                <CardTitle>Test Results</CardTitle>
              </div>
              {testResult.success && (
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    <Target className="h-3 w-3 mr-1" />
                    {testResult.confidenceScore}% confidence
                  </Badge>
                  {testResult.accuracyScore && (
                    <Badge variant="outline">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {testResult.accuracyScore}% accuracy
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Processing Time</p>
                        <p className="text-lg font-semibold">{testResult.processingTime}ms</p>
                      </div>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                  
                  <Card className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Tokens Used</p>
                        <p className="text-lg font-semibold">{testResult.tokensUsed}</p>
                      </div>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                  
                  <Card className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Tool Steps</p>
                        <p className="text-lg font-semibold">{testResult.steps}</p>
                      </div>
                      <TestTube className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                  
                  <Card className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className={`text-lg font-semibold ${getStatusColor(testResult.confidenceScore)}`}>
                          {testResult.confidenceScore}%
                        </p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                </div>

                {/* Input/Output */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Input Text</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(testResult.input)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Card className="p-4 bg-muted/50">
                      <pre className="text-sm whitespace-pre-wrap">{testResult.input}</pre>
                    </Card>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Agent Output</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(testResult.output || 'No output generated')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Card className="p-4">
                      {testResult.output ? (
                        <pre className="text-sm whitespace-pre-wrap">{testResult.output}</pre>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          No output generated. The agent may be experiencing configuration issues.
                        </div>
                      )}
                    </Card>
                  </div>
                </div>

                {/* Tool Results */}
                {testResult.toolResults && testResult.toolResults.length > 0 && (
                  <div>
                    <Label className="mb-3 block">Tool Execution Results</Label>
                    <div className="space-y-3">
                      {testResult.toolResults.map((tool, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TestTube className="h-4 w-4" />
                            <span className="font-medium">{tool.toolName}</span>
                          </div>
                          <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                            {JSON.stringify(tool.result, null, 2)}
                          </pre>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Error:</strong> {testResult.error}</p>
                    {testResult.code && <p><strong>Code:</strong> {testResult.code}</p>}
                    <p className="text-xs">
                      Try checking your input text, agent configuration, or API keys.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}