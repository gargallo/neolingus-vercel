"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Database,
  Bot,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Server,
  Wifi,
  WifiOff
} from "lucide-react";
import { toast } from "@/lib/toast";

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  components: {
    database: {
      status: string;
      latency: string;
      error?: string;
    };
    agents: {
      status: string;
      active_count: number;
      total_agents: number;
    };
    performance: {
      status: string;
      avg_processing_time: string;
      avg_accuracy: string;
      recent_requests: number;
    };
  };
  metrics: {
    requests_24h: number;
    avg_response_time: string;
    success_rate: string;
  };
}

interface AgentStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'testing';
  lastSeen: string;
  responseTime: number;
  errorRate: number;
}

export default function AgentStatusMonitor() {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      setHealthData(data);
      setLastUpdate(new Date());
      
      if (data.status === 'error') {
        toast.error("System health check failed");
      }
      
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthData({
        status: 'error',
        timestamp: new Date().toISOString(),
        version: 'unknown',
        environment: 'unknown',
        uptime: 0,
        components: {
          database: { status: 'error', latency: 'N/A', error: 'Connection failed' },
          agents: { status: 'error', active_count: 0, total_agents: 0 },
          performance: { status: 'error', avg_processing_time: 'N/A', avg_accuracy: 'N/A', recent_requests: 0 }
        },
        metrics: {
          requests_24h: 0,
          avg_response_time: 'N/A',
          success_rate: 'N/A'
        }
      });
      toast.error("Failed to fetch system health");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAgentStatuses = useCallback(async () => {
    try {
      // This would be a real endpoint in production
      const mockStatuses: AgentStatus[] = [
        {
          id: '1',
          name: 'English B2 Grammar Checker',
          status: 'online',
          lastSeen: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
          responseTime: 450,
          errorRate: 0.02
        },
        {
          id: '2', 
          name: 'Valenciano C1 Writing Corrector',
          status: 'online',
          lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          responseTime: 680,
          errorRate: 0.01
        }
      ];
      
      setAgentStatuses(mockStatuses);
    } catch (error) {
      console.error('Failed to fetch agent statuses:', error);
    }
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    Promise.all([fetchHealthStatus(), fetchAgentStatuses()]);
  }, [fetchHealthStatus, fetchAgentStatuses]);

  useEffect(() => {
    fetchHealthStatus();
    fetchAgentStatuses();
  }, [fetchHealthStatus, fetchAgentStatuses]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealthStatus();
      fetchAgentStatuses();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealthStatus, fetchAgentStatuses]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'degraded':
        return <Minus className="h-4 w-4 text-orange-500" />;
      case 'testing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'degraded':
        return 'bg-orange-100 text-orange-800';
      case 'testing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getResponseTimeStatus = (time: number) => {
    if (time < 500) return 'excellent';
    if (time < 1000) return 'good';
    if (time < 2000) return 'fair';
    return 'poor';
  };

  if (isLoading && !healthData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-3" />
            <span>Loading system status...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Status</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of agents and system health
            {lastUpdate && (
              <span className="ml-2">
                • Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      {healthData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthData.status)}
                <div>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>
                    Version {healthData.version} • {healthData.environment} • 
                    Uptime: {formatUptime(healthData.uptime)}
                  </CardDescription>
                </div>
              </div>
              <Badge className={getStatusColor(healthData.status)}>
                {healthData.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Database Status */}
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Database</span>
                  {getStatusIcon(healthData.components.database.status)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency:</span>
                    <span>{healthData.components.database.latency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className={getStatusColor(healthData.components.database.status)}>
                      {healthData.components.database.status}
                    </Badge>
                  </div>
                  {healthData.components.database.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription className="text-xs">
                        {healthData.components.database.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </Card>

              {/* Agents Status */}
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Bot className="h-5 w-5 text-green-600" />
                  <span className="font-medium">AI Agents</span>
                  {getStatusIcon(healthData.components.agents.status)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active:</span>
                    <span>{healthData.components.agents.active_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span>{healthData.components.agents.total_agents}</span>
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={(healthData.components.agents.active_count / Math.max(1, healthData.components.agents.total_agents)) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </Card>

              {/* Performance Status */}
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Performance</span>
                  {getStatusIcon(healthData.components.performance.status)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Time:</span>
                    <span>{healthData.components.performance.avg_processing_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accuracy:</span>
                    <span>{healthData.components.performance.avg_accuracy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requests:</span>
                    <span>{healthData.components.performance.recent_requests}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* System Metrics */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-4">24-Hour Metrics</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {healthData.metrics.requests_24h.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Requests</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {healthData.metrics.avg_response_time}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Response Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {healthData.metrics.success_rate}
                  </div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
          <CardDescription>
            Individual agent health and performance monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentStatuses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No agents found or monitoring data unavailable</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agentStatuses.map((agent) => (
                <Card key={agent.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(agent.status)}
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Last seen: {new Date(agent.lastSeen).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {agent.responseTime}ms
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Response time
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {(agent.errorRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Error rate
                        </div>
                      </div>
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}