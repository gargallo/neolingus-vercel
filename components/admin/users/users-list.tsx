"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  user_metadata: any;
  user_course_enrollments: Array<{
    subscription_status: string;
    access_expires_at: string | null;
    courses: {
      title: string;
      language: string;
      level: string;
    };
  }>;
  admin_users: Array<{
    role: string;
    active: boolean;
  }> | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UsersListProps {
  users: User[];
  pagination: Pagination;
  adminRole?: string;
  currentFilters: {
    search: string;
    status: string;
  };
}

export default function UsersList({ users, pagination, adminRole, currentFilters }: UsersListProps) {
  const router = useRouter();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getUserStatus = (user: User) => {
    if (user.admin_users && user.admin_users.length > 0) {
      return {
        label: `Admin (${user.admin_users[0].role})`,
        variant: 'default' as const,
        color: 'bg-purple-100 text-purple-800'
      };
    }
    if (!user.email_confirmed_at) {
      return {
        label: 'Unconfirmed',
        variant: 'secondary' as const,
        color: 'bg-yellow-100 text-yellow-800'
      };
    }
    if (user.user_course_enrollments.some(course => course.subscription_status === 'active')) {
      return {
        label: 'Active Subscriber',
        variant: 'default' as const,
        color: 'bg-green-100 text-green-800'
      };
    }
    return {
      label: 'Free User',
      variant: 'secondary' as const,
      color: 'bg-gray-100 text-gray-800'
    };
  };

  const canEdit = adminRole === 'super_admin' || adminRole === 'admin';
  const canDelete = adminRole === 'super_admin';

  const handleAction = async (action: string, userId: string) => {
    switch (action) {
      case 'view':
        router.push(`/admin/users/${userId}`);
        break;
      case 'edit':
        router.push(`/admin/users/${userId}/edit`);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          // Implement delete logic
          console.log('Delete user:', userId);
        }
        break;
      case 'email':
        router.push(`/admin/users/${userId}/email`);
        break;
      case 'make_admin':
        router.push(`/admin/users/${userId}/admin`);
        break;
    }
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={pagination.page === 1}
          onClick={() => {
            const params = new URLSearchParams();
            if (currentFilters.search) params.set('search', currentFilters.search);
            if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
            params.set('page', (pagination.page - 1).toString());
            router.push(`/admin/users?${params.toString()}`);
          }}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {pagination.page} of {pagination.pages}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={pagination.page === pagination.pages}
          onClick={() => {
            const params = new URLSearchParams();
            if (currentFilters.search) params.set('search', currentFilters.search);
            if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
            params.set('page', (pagination.page + 1).toString());
            router.push(`/admin/users?${params.toString()}`);
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {users.map((user) => {
        const status = getUserStatus(user);
        const activeCourses = user.user_course_enrollments.filter(course => course.subscription_status === 'active');
        
        return (
          <Card key={user.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="font-medium">{user.email}</h3>
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                  {user.admin_users && (
                    <Shield className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Joined:</span> {formatDate(user.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">Last Login:</span> {formatDate(user.last_sign_in_at)}
                  </div>
                  <div>
                    <span className="font-medium">Courses:</span> {activeCourses.length}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                  </div>
                </div>

                {activeCourses.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-muted-foreground">Active Courses:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeCourses.map((course, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {course.courses.title} ({course.courses.level})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAction('view', user.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  
                  {canEdit && (
                    <DropdownMenuItem onClick={() => handleAction('edit', user.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={() => handleAction('email', user.id)}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </DropdownMenuItem>
                  
                  {adminRole === 'super_admin' && !user.admin_users && (
                    <DropdownMenuItem onClick={() => handleAction('make_admin', user.id)}>
                      <Shield className="w-4 h-4 mr-2" />
                      Make Admin
                    </DropdownMenuItem>
                  )}
                  
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={() => handleAction('delete', user.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        );
      })}

      {users.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No users found matching your criteria.</p>
        </Card>
      )}

      <PaginationControls />
    </div>
  );
}