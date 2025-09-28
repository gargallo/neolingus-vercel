"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Plus, 
  Users, 
  BookOpen, 
  Settings,
  UserPlus,
  Eye,
  Flag
} from "lucide-react";

interface QuickActionsProps {
  role?: string;
}

export default function QuickActions({ role }: QuickActionsProps) {
  const getQuickActions = () => {
    const actions = [];

    // Actions for all admin roles
    actions.push(
      {
        label: "View Users",
        href: "/admin/users",
        icon: Users,
        description: "Manage platform users"
      },
      {
        label: "AI Agents",
        href: "/admin/agents", 
        icon: BookOpen,
        description: "Manage AI correction agents"
      }
    );

    // Actions for admin and super_admin
    if (role === 'admin' || role === 'super_admin') {
      actions.push(
        {
          label: "Course Management",
          href: "/admin/courses",
          icon: BookOpen,
          description: "Manage language courses"
        },
        {
          label: "Analytics",
          href: "/admin/analytics",
          icon: Eye,
          description: "View platform analytics"
        }
      );
    }

    // Super admin exclusive actions
    if (role === 'super_admin') {
      actions.push(
        {
          label: "System Settings",
          href: "#",
          icon: Settings,
          description: "Platform configuration (Coming soon)"
        },
        {
          label: "Feature Management",
          href: "#",
          icon: Flag,
          description: "Toggle features (Coming soon)"
        }
      );
    }

    return actions;
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {getQuickActions().map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Link key={index} href={action.href}>
              <Button variant="ghost" className="w-full justify-start h-auto p-3">
                <IconComponent className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}