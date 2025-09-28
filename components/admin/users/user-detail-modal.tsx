'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  User,
  Mail,
  Calendar,
  Shield,
  GraduationCap,
  Clock,
  MapPin,
  Phone,
  Globe,
  BookOpen,
  Activity,
  Edit,
  X,
} from 'lucide-react';
import type { AdminUser, UserEnrollment, LoginHistory, ActionHistory } from '@/lib/admin/users/types';

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onEdit?: (user: AdminUser) => void;
}

export function UserDetailModal({
  open,
  onClose,
  user,
  onEdit,
}: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [actionHistory, setActionHistory] = useState<ActionHistory[]>([]);

  useEffect(() => {
    if (open && user?.id) {
      loadUserDetails(user.id);
    }
  }, [open, user?.id]);

  const loadUserDetails = async (userId: string) => {
    setLoading(true);
    try {
      const [enrollmentsRes, loginRes, actionsRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}/enrollments`),
        fetch(`/api/admin/users/${userId}/login-history`),
        fetch(`/api/admin/users/${userId}/action-history`),
      ]);

      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json();
        setEnrollments(data.enrollments || []);
      }

      if (loginRes.ok) {
        const data = await loginRes.json();
        setLoginHistory(data.history || []);
      }

      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setActionHistory(data.actions || []);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'teacher':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'teacher':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-2xl font-bold">User Details</DialogTitle>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(user)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit User
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {user.full_name
                      ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : user.email.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold">
                      {user.full_name || 'No name provided'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{user.email}</span>
                    </div>
                    
                    {user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined {format(new Date(user.created_at), 'PPP')}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Last active:{' '}
                        {user.last_sign_in_at
                          ? format(new Date(user.last_sign_in_at), 'PPP')
                          : 'Never'}
                      </span>
                    </div>
                    
                    {user.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    
                    {user.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={user.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {user.website.replace(/https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {user.bio && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="enrollments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="enrollments" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Course Enrollments
              </TabsTrigger>
              <TabsTrigger value="login" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Login History
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enrollments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Enrollments
                    <Badge variant="outline">{enrollments.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : enrollments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Enrolled</TableHead>
                          <TableHead>Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{enrollment.course_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {enrollment.course_description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  enrollment.status === 'completed'
                                    ? 'default'
                                    : enrollment.status === 'active'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {enrollment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${enrollment.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm">{enrollment.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(enrollment.enrolled_at), 'PPP')}
                            </TableCell>
                            <TableCell className="text-sm">
                              {enrollment.completed_at
                                ? format(new Date(enrollment.completed_at), 'PPP')
                                : 'In progress'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No enrollments</h3>
                      <p className="text-muted-foreground">
                        This user is not enrolled in any courses yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="login" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Login History
                    <Badge variant="outline">{loginHistory.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : loginHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loginHistory.map((login) => (
                          <TableRow key={login.id}>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(login.created_at), 'PPP p')}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {login.ip_address}
                            </TableCell>
                            <TableCell className="text-sm">
                              {login.user_agent ? (
                                <div>
                                  <div>{login.user_agent.split(' ')[0]}</div>
                                  <div className="text-muted-foreground">
                                    {login.user_agent.includes('Mobile') ? 'Mobile' : 'Desktop'}
                                  </div>
                                </div>
                              ) : (
                                'Unknown'
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {login.location || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={login.success ? 'default' : 'destructive'}
                              >
                                {login.success ? 'Success' : 'Failed'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No login history</h3>
                      <p className="text-muted-foreground">
                        No login attempts recorded for this user.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Log
                    <Badge variant="outline">{actionHistory.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex space-x-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                          <div className="flex-1 space-y-1">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : actionHistory.length > 0 ? (
                    <div className="space-y-4">
                      {actionHistory.map((action) => (
                        <div key={action.id} className="flex space-x-3 pb-3 border-b last:border-b-0">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Activity className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {action.action}
                            </div>
                            <div className="text-sm text-gray-500">
                              {action.description}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {format(new Date(action.created_at), 'PPP p')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No activity</h3>
                      <p className="text-muted-foreground">
                        No actions recorded for this user.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}