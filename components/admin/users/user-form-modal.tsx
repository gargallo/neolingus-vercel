'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  GraduationCap,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { AdminUser, CreateUserRequest, UpdateUserRequest } from '@/lib/admin/users/types';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: AdminUser | null;
  mode: 'create' | 'edit';
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
}

interface FormData {
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  send_welcome_email?: boolean;
  course_assignments?: string[];
}

const roles = [
  { value: 'student', label: 'Student', icon: UserCheck },
  { value: 'teacher', label: 'Teacher', icon: GraduationCap },
  { value: 'admin', label: 'Administrator', icon: Shield },
];

const statuses = [
  { value: 'active', label: 'Active', description: 'User can access the system' },
  { value: 'inactive', label: 'Inactive', description: 'User account is disabled' },
  { value: 'suspended', label: 'Suspended', description: 'User access is temporarily blocked' },
];

// Mock courses data - in real app this would come from an API
const mockCourses = [
  { id: '1', name: 'Spanish Fundamentals', level: 'Beginner' },
  { id: '2', name: 'Advanced Spanish Grammar', level: 'Advanced' },
  { id: '3', name: 'Spanish Conversation', level: 'Intermediate' },
  { id: '4', name: 'Business Spanish', level: 'Advanced' },
];

export function UserFormModal({
  open,
  onClose,
  user,
  mode,
  onSubmit,
}: UserFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      full_name: '',
      role: 'student',
      status: 'active',
      send_welcome_email: true,
      course_assignments: [],
    },
  });

  const watchedRole = watch('role');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && user) {
        // Pre-fill form with existing user data
        reset({
          email: user.email,
          full_name: user.full_name || '',
          role: user.role as any,
          status: user.status as any,
          phone: user.phone || '',
          bio: user.bio || '',
          location: user.location || '',
          website: user.website || '',
          send_welcome_email: false,
          course_assignments: selectedCourses,
        });
      } else {
        // Reset form for create mode
        reset({
          email: '',
          full_name: '',
          role: 'student',
          status: 'active',
          send_welcome_email: true,
          course_assignments: [],
        });
        setSelectedCourses([]);
      }
      setError(null);
    }
  }, [open, mode, user, reset]);

  const handleFormSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...data,
        course_assignments: selectedCourses,
      };

      await onSubmit(submitData as CreateUserRequest | UpdateUserRequest);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const getRoleIcon = (role: string) => {
    const roleData = roles.find(r => r.value === role);
    if (!roleData) return <UserCheck className="h-4 w-4" />;
    const Icon = roleData.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  {...register('full_name', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  })}
                  className={errors.full_name ? 'border-destructive' : ''}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {getRoleIcon(watchedRole)}
                  User Role *
                </Label>
                <Select
                  value={watch('role')}
                  onValueChange={(value) => setValue('role', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => {
                      const Icon = role.icon;
                      return (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {role.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Account Status *</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div>
                          <div className="font-medium">{status.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {status.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Input
                id="website"
                type="url"
                {...register('website', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL (include http:// or https://)',
                  },
                })}
                placeholder="https://example.com"
                className={errors.website ? 'border-destructive' : ''}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Course Assignments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Course Assignments</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mockCourses.map((course) => (
                <div
                  key={course.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCourses.includes(course.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleCourse(course.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{course.name}</div>
                      <div className="text-sm text-muted-foreground">{course.level}</div>
                    </div>
                    {selectedCourses.includes(course.id) && (
                      <Badge variant="default" className="text-xs">
                        Assigned
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {selectedCourses.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Options */}
          {mode === 'create' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Options</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Send Welcome Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Send a welcome email with login instructions to the new user
                    </p>
                  </div>
                  <Switch
                    checked={watch('send_welcome_email')}
                    onCheckedChange={(checked) => setValue('send_welcome_email', checked)}
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? 'Create User' : 'Update User'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}