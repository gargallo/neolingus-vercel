"use client";

import InPageSidebar from "@/components/in-page-sidebar";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Settings,
  BarChart3,
  Shield,
  Flag,
  Bell,
  FileQuestion
} from "lucide-react";

interface AdminSidebarProps {
  role: string;
}

export default function AdminSidebar({ role }: AdminSidebarProps) {
  // Define navigation items based on role
  const getNavItems = () => {
    const baseItems = [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard
      }
    ];

    // Admin and super_admin get full access
    if (role === 'admin' || role === 'super_admin') {
      baseItems.push(
        {
          label: "Users",
          href: "/users",
          icon: Users
        },
        {
          label: "Courses",
          href: "/courses",
          icon: BookOpen
        },
        {
          label: "Exams",
          href: "/exams",
          icon: FileQuestion
        },
        {
          label: "Payments",
          href: "/payments",
          icon: CreditCard
        },
        {
          label: "Analytics",
          href: "/analytics",
          icon: BarChart3
        },
        {
          label: "Settings",
          href: "/settings",
          icon: Settings
        }
      );
    }

    // Course managers get limited access
    if (role === 'course_manager') {
      baseItems.push(
        {
          label: "Courses",
          href: "/courses",
          icon: BookOpen
        },
        {
          label: "Exams",
          href: "/exams",
          icon: FileQuestion
        },
        {
          label: "Users",
          href: "/users",
          icon: Users,
          disabled: false
        }
      );
    }

    // Support gets user and payment access
    if (role === 'support') {
      baseItems.push(
        {
          label: "Users",
          href: "/users",
          icon: Users
        },
        {
          label: "Payments",
          href: "/payments",
          icon: CreditCard
        }
      );
    }

    // Super admin gets additional items
    if (role === 'super_admin') {
      baseItems.push(
        {
          label: "Admin Users",
          href: "/admin-users",
          icon: Shield
        },
        {
          label: "Feature Flags",
          href: "/feature-flags",
          icon: Flag
        },
        {
          label: "Audit Logs",
          href: "/audit-logs",
          icon: Bell
        }
      );
    }

    return baseItems;
  };

  return (
    <InPageSidebar
      basePath="/admin"
      items={getNavItems()}
    />
  );
}