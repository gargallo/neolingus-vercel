"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Play, Pause, TestTube, BarChart3, Bot, Zap, Target, Clock, Users, AlertTriangle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  deployment_url: string | null;
  version: number;
  created_at: string;
  deployed_at: string | null;
  performance: {
    totalCorrections: number;
    avgAccuracy: number;
    avgProcessingTime: number;
    avgSatisfaction: number;
    humanReviewRate: number;
  };
  activeDeployment?: any;
}

interface AgentsListProps {
  agents: Agent[];
  adminRole?: string;
}

export default function AgentsList({ agents, adminRole }: AgentsListProps) {
  const router = useRouter();
  const [updatingAgent, setUpdatingAgent] = useState<string | null>(null);
  
  const canEdit = ['super_admin', 'admin', 'course_manager'].includes(adminRole || '');
  const canDelete = ['super_admin', 'admin'].includes(adminRole || '');

  const handleStatusToggle = async (agentId: string, currentStatus: string) => {
    setUpdatingAgent(agentId);
    
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await fetch(`/api/admin/agents/${agentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Failed to update agent status');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
    } finally {
      setUpdatingAgent(null);
    }
  };

  const handleAction = async (action: string, agent: Agent) => {
    switch (action) {
      case 'view':
        router.push(`/admin/agents/${agent.id}`);
        break;
      case 'edit':
        router.push(`/admin/agents/${agent.id}/edit`);
        break;
      case 'test':
        router.push(`/admin/agents/${agent.id}/test`);
        break;
      case 'analytics':
        router.push(`/admin/agents/${agent.id}/analytics`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
          try {
            const response = await fetch(`/api/admin/agents/${agent.id}`, {
              method: 'DELETE'
            });
            if (response.ok) {
              window.location.reload();
            }
          } catch (error) {
            console.error('Error deleting agent:', error);
          }
        }
        break;
      case 'deploy':
        router.push(`/admin/agents/${agent.id}/deploy`);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'deploying': 'bg-blue-100 text-blue-800',
      'error': 'bg-red-100 text-red-800',
      'testing': 'bg-yellow-100 text-yellow-800',
      'draft': 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      'writing': '✍️',
      'speaking': '🎤',
      'reading': '📖',
      'listening': '👂',
      'general': '🤖'
    };
    return icons[type] || '🤖';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {agents.length === 0 ? (
        <Card className="p-8 text-center">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">No agents created yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first AI agent to start automated exam correction.
          </p>
          {canEdit && (
            <Button onClick={() => router.push('/admin/agents/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{getTypeIcon(agent.type)}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {agent.language} • {agent.level} • v{agent.version}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(agent.deployment_status)}>
                      {agent.deployment_status.charAt(0).toUpperCase() + agent.deployment_status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {agent.model_provider} • {agent.model_name}
                    </Badge>
                  </div>
                  
                  {agent.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {agent.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={agent.deployment_status === 'active'}
                    onCheckedChange={() => handleStatusToggle(agent.id, agent.deployment_status)}
                    disabled={updatingAgent === agent.id || !canEdit}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAction('view', agent)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      
                      {canEdit && (
                        <DropdownMenuItem onClick={() => handleAction('edit', agent)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Agent
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem onClick={() => handleAction('test', agent)}>
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Agent
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => handleAction('analytics', agent)}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </DropdownMenuItem>
                      
                      {agent.deployment_status === 'draft' && canEdit && (
                        <DropdownMenuItem onClick={() => handleAction('deploy', agent)}>
                          <Play className="w-4 h-4 mr-2" />
                          Deploy Agent
                        </DropdownMenuItem>
                      )}
                      
                      {canDelete && (
                        <DropdownMenuItem 
                          onClick={() => handleAction('delete', agent)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Agent
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Performance Metrics */}
              {agent.performance.totalCorrections > 0 && (
                <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700">Performance Metrics</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className={`text-sm font-medium ${getPerformanceColor(agent.performance.avgAccuracy)}`}>
                          {agent.performance.avgAccuracy}%
                        </p>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">
                          {agent.performance.avgProcessingTime}ms
                        </p>
                        <p className="text-xs text-muted-foreground">Avg Time</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">
                          {agent.performance.avgSatisfaction}/5
                        </p>
                        <p className="text-xs text-muted-foreground">Satisfaction</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium">
                          {agent.performance.humanReviewRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">Review Rate</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    Total corrections: {agent.performance.totalCorrections.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Status Footer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                <span>
                  Created: {new Date(agent.created_at).toLocaleDateString()}
                </span>
                {agent.deployed_at && (
                  <span>
                    Deployed: {new Date(agent.deployed_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Warning for inactive agents with high performance */}
              {agent.deployment_status === 'inactive' && 
               agent.performance.totalCorrections > 100 && 
               agent.performance.avgAccuracy > 85 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  High-performing agent is inactive. Consider reactivating.
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}