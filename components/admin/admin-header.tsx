'use client';

import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, User as UserIcon, Settings, LogOut, Home, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { signOutAction } from '@/app/actions';

interface AdminHeaderProps {
  user: User;
  adminUser: {
    id: string;
    role: string;
    active: boolean;
  };
}

export default function AdminHeader({ user, adminUser }: AdminHeaderProps) {
  const userInitials = user.email?.charAt(0).toUpperCase() || 'A';
  const roleDisplay = adminUser.role.replace('_', ' ').toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/admin" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">NEOLINGUS</h1>
              <p className="text-xs text-slate-500">Panel de Administración</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/admin" 
              className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/admin/agents" 
              className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Agentes IA
            </Link>
            <Link 
              href="/admin/users" 
              className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Usuarios
            </Link>
            <Link 
              href="/admin/analytics" 
              className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Analytics
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              {roleDisplay}
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-red-600 text-white text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin Panel</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground font-medium">
                      {roleDisplay}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Ir a Academia</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => signOutAction()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}