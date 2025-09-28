"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Play,
  Pause,
  Settings,
  BarChart3,
  TestTube,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AgentTester from "./agent-tester";
import AgentStatusMonitor from "./agent-status-monitor";

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
  agent_id: string;
  accuracy_score: number | null;
  processing_time_ms: number;
  tokens_used: number;
  cost_cents: number | null;
  student_satisfaction: number | null;
  human_review_required: boolean;
  created_at: string;
}

interface DeploymentStat {
  agent_id: string;
  status: string;
  deployment_url: string | null;
  total_corrections: number;
  avg_response_time_ms: number | null;
  error_rate: number | null;
  deployed_at: string | null;
  activated_at: string | null;
}

interface AgentsDashboardProps {
  agents: Agent[];
  performanceMetrics: PerformanceMetric[];
  deploymentStats: DeploymentStat[];
  userRole?: string;
}

export default function AgentsDashboard({
  agents,
  performanceMetrics,
  deploymentStats,
  userRole
}: AgentsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showStatusMonitor, setShowStatusMonitor] = useState(false);
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.deployment_status === 'active').length;
    const totalCorrections = deploymentStats.reduce((sum, stat) => sum + stat.total_corrections, 0);
    
    // Performance calculations
    const recentMetrics = performanceMetrics.filter(
      m => new Date(m.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    const avgAccuracy = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / recentMetrics.length
      : 0;
    
    const avgProcessingTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.processing_time_ms, 0) / recentMetrics.length
      : 0;
    
    const totalCost = recentMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / 100;
    
    const avgSatisfaction = recentMetrics.length > 0
      ? recentMetrics.filter(m => m.student_satisfaction).reduce((sum, m) => sum + (m.student_satisfaction || 0), 0) / recentMetrics.filter(m => m.student_satisfaction).length
      : 0;

    return {
      totalAgents,
      activeAgents,
      totalCorrections,
      avgAccuracy: Number(avgAccuracy.toFixed(1)),
      avgProcessingTime: Math.round(avgProcessingTime),
      totalCost,
      avgSatisfaction: Number(avgSatisfaction.toFixed(1))
    };
  }, [agents, performanceMetrics, deploymentStats]);

  // Enhanced filtering
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || agent.deployment_status === statusFilter;
      const matchesLanguage = languageFilter === 'all' || agent.language === languageFilter;
      const matchesType = typeFilter === 'all' || agent.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesLanguage && matchesType;
    });
  }, [agents, searchTerm, statusFilter, languageFilter, typeFilter]);

  // Get agent performance data
  const getAgentPerformance = (agentId: string) => {
    const agentMetrics = performanceMetrics.filter(m => m.agent_id === agentId);
    const agentDeployment = deploymentStats.find(d => d.agent_id === agentId);
    
    if (agentMetrics.length === 0) {
      return {
        totalCorrections: agentDeployment?.total_corrections || 0,
        avgAccuracy: 0,
        avgProcessingTime: 0,
        avgSatisfaction: 0,
        humanReviewRate: 0
      };
    }
    
    const avgAccuracy = agentMetrics.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / agentMetrics.length;
    const avgProcessingTime = agentMetrics.reduce((sum, m) => sum + m.processing_time_ms, 0) / agentMetrics.length;
    const satisfactionMetrics = agentMetrics.filter(m => m.student_satisfaction);
    const avgSatisfaction = satisfactionMetrics.length > 0 
      ? satisfactionMetrics.reduce((sum, m) => sum + (m.student_satisfaction || 0), 0) / satisfactionMetrics.length
      : 0;
    const humanReviewRate = (agentMetrics.filter(m => m.human_review_required).length / agentMetrics.length) * 100;
    
    return {
      totalCorrections: agentDeployment?.total_corrections || agentMetrics.length,
      avgAccuracy: Number(avgAccuracy.toFixed(1)),
      avgProcessingTime: Math.round(avgProcessingTime),
      avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
      humanReviewRate: Number(humanReviewRate.toFixed(1))
    };
  };

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
      case 'deploying': return <Clock className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  // Get unique values for filters
  const uniqueLanguages = [...new Set(agents.map(a => a.language))];
  const uniqueTypes = [...new Set(agents.map(a => a.type))];

  const handleTestAgent = (agent: Agent) => {
    setTestingAgent(agent);
  };

  const handleCloseTest = () => {
    setTestingAgent(null);
    setRefreshKey(prev => prev + 1); // Trigger refresh of stats
  };

  const toggleStatusMonitor = () => {
    setShowStatusMonitor(!showStatusMonitor);
  };

  // Show agent tester if testing an agent
  if (testingAgent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleCloseTest}
          >
            ← Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Testing Agent</h2>
          </div>
        </div>
        <AgentTester agent={testingAgent} onClose={handleCloseTest} />
      </div>
    );
  }

  // Show status monitor if toggled
  if (showStatusMonitor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={toggleStatusMonitor}
          >
            ← Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-xl font-semibold">System Status</h2>
          </div>
        </div>
        <AgentStatusMonitor />
      </div>
    );
  }

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAgents} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Corrections</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCorrections.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgSatisfaction}/5 satisfaction
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgProcessingTime}ms avg response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status Alert */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">System Online</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.activeAgents} of {stats.totalAgents} agents active
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleStatusMonitor}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            System Monitor
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey(prev => prev + 1)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {uniqueLanguages.map(lang => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {(userRole === 'super_admin' || userRole === 'admin') && (
          <Button onClick={() => router.push('/admin/agents/create')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        )}
      </div>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agents ({filteredAgents.length})</CardTitle>
          <CardDescription>
            Manage your language learning correction agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAgents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No agents found</h3>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' || languageFilter !== 'all' || typeFilter !== 'all'
                  ? "Try adjusting your filters"
                  : "Create your first AI agent to get started"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgents.map((agent) => {
                const performance = getAgentPerformance(agent.id);
                
                return (
                  <Card key={agent.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${getStatusColor(agent.deployment_status)}`}>
                          {getStatusIcon(agent.deployment_status)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{agent.name}</h3>
                            <Badge variant="outline">{agent.type}</Badge>
                            <Badge variant="secondary">
                              {agent.language} {agent.level}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {agent.description || "No description available"}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {performance.totalCorrections} corrections
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {performance.avgAccuracy}% accuracy
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {performance.avgProcessingTime}ms
                            </span>
                            {performance.avgSatisfaction > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {performance.avgSatisfaction}/5 satisfaction
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(agent.deployment_status)}>
                          {agent.deployment_status}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/agents/${agent.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTestAgent(agent)}>
                              <TestTube className="h-4 w-4 mr-2" />
                              Test Agent
                            </DropdownMenuItem>
                            {(userRole === 'super_admin' || userRole === 'admin') && (
                              <>
                                <DropdownMenuItem onClick={() => router.push(`/admin/agents/${agent.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/admin/agents/${agent.id}/analytics`)}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Analytics
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${agent.name}?`)) {
                                      // TODO: Implement delete functionality
                                      console.log('Delete agent:', agent.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}