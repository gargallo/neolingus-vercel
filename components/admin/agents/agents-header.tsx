"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Bot, Zap, TestTube, Settings, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AgentsHeaderProps {
  adminRole?: string;
}

export default function AgentsHeader({ adminRole }: AgentsHeaderProps) {
  const router = useRouter();
  
  const canCreateAgent = ['super_admin', 'admin', 'course_manager'].includes(adminRole || '');
  const canManageTemplates = ['super_admin', 'admin'].includes(adminRole || '');

  return (
    <div className="space-y-4">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Bot className="w-7 h-7 text-blue-600" />
            AI Agents Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage AI-powered exam correction agents
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          {canManageTemplates && (
            <Link href="/admin/agents/templates">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </Link>
          )}
          
          <Link href="/admin/agents/analytics">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </Link>

          {canCreateAgent && (
            <Button onClick={() => router.push('/admin/agents/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          )}
        </div>
      </div>

      {/* Quick Create Buttons */}
      {canCreateAgent && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Zap className="w-4 h-4" />
            <span className="font-medium">Quick Create:</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white hover:bg-blue-100"
              onClick={() => router.push('/admin/agents/create?template=valenciano_c1_writing')}
            >
              Valenciano C1 Writing
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white hover:bg-blue-100"
              onClick={() => router.push('/admin/agents/create?template=english_b2_speaking')}
            >
              English B2 Speaking
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white hover:bg-blue-100"
              onClick={() => router.push('/admin/agents/create?template=custom')}
            >
              <TestTube className="w-3 h-3 mr-1" />
              Custom Agent
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}