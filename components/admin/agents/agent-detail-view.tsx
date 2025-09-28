"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Bot, 
  Edit, 
  TestTube, 
  BarChart3,
  Settings,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Activity,
  Clock,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";

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
  created_at: string;
  updated_at: string;
  deployed_at: string | null;
  last_tested_at: string | null;
  cultural_context: any;
  scoring_criteria: any;
  tools_config: any;
  performance_config: any;
}

interface PerformanceMetric {
  id: string;
  accuracy_score: number | null;
  processing_time_ms: number;
  tokens_used: number;
  cost_cents: number | null;
  student_satisfaction: number | null;
  human_review_required: boolean;
  test_case_results: any;
  created_at: string;
}

interface DeploymentStat {
  id: string;
  status: string;
  deployment_url: string | null;
  total_corrections: number;
  avg_response_time_ms: number | null;
  error_rate: number | null;
  deployed_at: string | null;
  activated_at: string | null;
  last_health_check: string | null;
  health_status: string | null;
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
  created_at: string;
}

interface AgentDetailViewProps {
  agent: Agent;
  performanceMetrics: PerformanceMetric[];
  deploymentStats: DeploymentStat | null;
  testResults: TestResult[];
  userRole?: string;
  showCreatedAlert?: boolean;
  showUpdatedAlert?: boolean;
}

export default function AgentDetailView({
  agent,
  performanceMetrics,
  deploymentStats,
  testResults,
  userRole,
  showCreatedAlert,
  showUpdatedAlert
}: AgentDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const canEdit = ['super_admin', 'admin'].includes(userRole || '');
  const canTest = ['super_admin', 'admin', 'course_manager'].includes(userRole || '');

  // Calculate performance statistics
  const performanceStats = React.useMemo(() => {
    if (performanceMetrics.length === 0) {
      return {
        avgAccuracy: 0,
        avgProcessingTime: 0,
        totalTests: 0,
        avgSatisfaction: 0,
        totalCost: 0,
        successRate: 0
      };
    }

    const total = performanceMetrics.length;
    const avgAccuracy = performanceMetrics.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / total;
    const avgProcessingTime = performanceMetrics.reduce((sum, m) => sum + m.processing_time_ms, 0) / total;
    const satisfactionMetrics = performanceMetrics.filter(m => m.student_satisfaction);
    const avgSatisfaction = satisfactionMetrics.length > 0 
      ? satisfactionMetrics.reduce((sum, m) => sum + (m.student_satisfaction || 0), 0) / satisfactionMetrics.length
      : 0;
    const totalCost = performanceMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / 100;

    return {
      avgAccuracy: Number(avgAccuracy.toFixed(1)),
      avgProcessingTime: Math.round(avgProcessingTime),
      totalTests: total,
      avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
      totalCost: Number(totalCost.toFixed(2)),
      successRate: Number(((testResults.filter(t => t.success).length / Math.max(testResults.length, 1)) * 100).toFixed(1))
    };
  }, [performanceMetrics, testResults]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'testing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'deploying': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <XCircle className="h-4 w-4" />;
      case 'testing': return <TestTube className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'deploying': return <Loader2 className="h-4 w-4 animate-spin" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const toggleDeployment = async () => {
    setLoading(true);
    try {
      // Simulate deployment toggle
      await new Promise(resolve => setTimeout(resolve, 2000));
      window.location.reload();
    } catch (error) {
      console.error('Error toggling deployment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Alerts */}
      {showCreatedAlert && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Agent created successfully! You can now test and deploy it.
          </AlertDescription>
        </Alert>
      )}
      
      {showUpdatedAlert && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Agent updated successfully! Changes are now active.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <Badge className={getStatusColor(agent.deployment_status)}>
                {getStatusIcon(agent.deployment_status)}
                <span className="ml-1">{agent.deployment_status}</span>
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {agent.description || "No description available"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{agent.language} {agent.level}</span>
              <span>•</span>
              <span>{agent.type.replace('_', ' ')}</span>
              <span>•</span>
              <span>Version {agent.version}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canTest && (
            <Button variant="outline" asChild>
              <Link href={`/admin/agents/${agent.id}/test`}>
                <TestTube className="h-4 w-4 mr-2" />
                Test Agent
              </Link>
            </Button>
          )}
          
          <Button variant="outline" asChild>
            <Link href={`/admin/agents/${agent.id}/analytics`}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
          </Button>

          {canEdit && (
            <>
              {agent.deployment_status === 'active' ? (
                <Button
                  variant="outline"
                  onClick={toggleDeployment}
                  disabled={loading}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  Deactivate
                </Button>
              ) : (
                <Button
                  onClick={toggleDeployment}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Activate
                </Button>
              )}

              <Button asChild>
                <Link href={`/admin/agents/${agent.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceStats.totalTests}</div>
            <p className="text-xs text-muted-foreground">
              {performanceStats.successRate}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceStats.avgAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              {performanceStats.avgSatisfaction > 0 && `${performanceStats.avgSatisfaction}/5 satisfaction`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceStats.avgProcessingTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {deploymentStats?.total_corrections || 0} corrections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${performanceStats.totalCost}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Agent Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Agent Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Type</p>
                      <p>{agent.type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Language & Level</p>
                      <p>{agent.language} {agent.level}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Model</p>
                      <p>{agent.model_provider} {agent.model_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(agent.deployment_status)}>
                        {agent.deployment_status}
                      </Badge>
                    </div>
                  </div>
                  
                  {agent.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                      <p className="text-sm">{agent.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Test Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Test Results</CardTitle>
                  <CardDescription>Latest testing activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {testResults.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No test results available. Run some tests to see results here.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {testResults.slice(0, 5).map((test) => (
                        <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {test.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <p className="font-medium">{test.test_type}</p>
                              <p className="text-sm text-muted-foreground">
                                {test.processing_time_ms}ms • {test.tokens_used} tokens
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {new Date(test.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canTest && (
                    <Button className="w-full" asChild>
                      <Link href={`/admin/agents/${agent.id}/test`}>
                        <TestTube className="h-4 w-4 mr-2" />
                        Run Test
                      </Link>
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/admin/agents/${agent.id}/analytics`}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Link>
                  </Button>

                  {canEdit && (
                    <>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/admin/agents/${agent.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Configuration
                        </Link>
                      </Button>
                      
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Export Config
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Created {new Date(agent.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {agent.updated_at !== agent.created_at && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                        <span>Updated {new Date(agent.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {agent.deployed_at && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span>Deployed {new Date(agent.deployed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {agent.last_tested_at && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <span>Tested {new Date(agent.last_tested_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance analysis and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Performance Charts Coming Soon</h3>
                <p className="text-sm">
                  Detailed performance analytics and trend visualization will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Comprehensive test result history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Test Results</h3>
                  <p className="text-sm mb-4">
                    Run some tests to see detailed results here.
                  </p>
                  {canTest && (
                    <Button asChild>
                      <Link href={`/admin/agents/${agent.id}/test`}>
                        <TestTube className="h-4 w-4 mr-2" />
                        Run Test
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {testResults.map((test) => (
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
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(test.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Processing Time:</span>
                          <span className="ml-2">{test.processing_time_ms}ms</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tokens Used:</span>
                          <span className="ml-2">{test.tokens_used}</span>
                        </div>
                      </div>
                      
                      {test.error_message && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-red-700 text-sm">{test.error_message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Provider:</span>
                  <span className="ml-2">{agent.model_provider}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Model:</span>
                  <span className="ml-2">{agent.model_name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Max Tokens:</span>
                  <span className="ml-2">{agent.performance_config?.max_tokens || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Temperature:</span>
                  <span className="ml-2">{agent.performance_config?.temperature || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Timeout:</span>
                  <span className="ml-2">{agent.performance_config?.timeout_seconds || 'Not set'}s</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scoring Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                {agent.scoring_criteria && Object.keys(agent.scoring_criteria).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(agent.scoring_criteria).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace('_', ' ')}:</span>
                        <span>{(value.weight * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No scoring criteria defined</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Information</CardTitle>
              <CardDescription>
                Current deployment status and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(agent.deployment_status)}>
                    {getStatusIcon(agent.deployment_status)}
                    <span className="ml-1">{agent.deployment_status}</span>
                  </Badge>
                </div>
                {deploymentStats?.deployment_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">URL</p>
                    <a 
                      href={deploymentStats.deployment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {deploymentStats.deployment_url}
                    </a>
                  </div>
                )}
                {deploymentStats?.total_corrections !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Corrections</p>
                    <p>{deploymentStats.total_corrections.toLocaleString()}</p>
                  </div>
                )}
                {deploymentStats?.error_rate !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                    <p>{(deploymentStats.error_rate * 100).toFixed(2)}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}