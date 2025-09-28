"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, Gift, CreditCard, Clock } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface Plan {
  id: string;
  name: string;
  tier: string;
  pricing: {
    monthly_price: number;
    currency: string;
  };
  trial_enabled: boolean;
  trial_duration_days: number;
}

interface Course {
  id: string;
  title: string;
  language: string;
  level: string;
}

interface AssignmentFormData {
  user_id: string;
  plan_id: string;
  course_id: string;
  assignment_reason: string;
  billing_cycle: 'monthly' | 'yearly' | 'trial';
  auto_renew: boolean;
  start_trial: boolean;
  custom_period_start?: Date;
  custom_period_end?: Date;
}

interface PlanAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (assignmentData: AssignmentFormData) => Promise<void>;
  users: User[];
  plans: Plan[];
  courses: Course[];
  selectedUserId?: string;
  loading?: boolean;
}

export default function PlanAssignmentModal({
  isOpen,
  onClose,
  onAssign,
  users,
  plans,
  courses,
  selectedUserId,
  loading = false
}: PlanAssignmentModalProps) {
  const [formData, setFormData] = useState<AssignmentFormData>({
    user_id: selectedUserId || '',
    plan_id: '',
    course_id: '',
    assignment_reason: '',
    billing_cycle: 'monthly',
    auto_renew: true,
    start_trial: false
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setPlan] = useState<Plan | null>(null);
  const [selectedCourse, setCourse] = useState<Course | null>(null);
  const [showDatePickers, setShowDatePickers] = useState(false);

  useEffect(() => {
    if (selectedUserId) {
      setFormData(prev => ({ ...prev, user_id: selectedUserId }));
      const user = users.find(u => u.id === selectedUserId);
      setSelectedUser(user || null);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    const user = users.find(u => u.id === formData.user_id);
    setSelectedUser(user || null);
  }, [formData.user_id, users]);

  useEffect(() => {
    const plan = plans.find(p => p.id === formData.plan_id);
    setPlan(plan || null);
    
    // Auto-enable trial if available and no explicit billing cycle set
    if (plan?.trial_enabled && !formData.billing_cycle) {
      setFormData(prev => ({ 
        ...prev, 
        start_trial: true, 
        billing_cycle: 'trial' 
      }));
    }
  }, [formData.plan_id, plans]);

  useEffect(() => {
    const course = courses.find(c => c.id === formData.course_id);
    setCourse(course || null);
  }, [formData.course_id, courses]);

  const handleSubmit = async () => {
    try {
      await onAssign(formData);
      onClose();
      // Reset form
      setFormData({
        user_id: selectedUserId || '',
        plan_id: '',
        course_id: '',
        assignment_reason: '',
        billing_cycle: 'monthly',
        auto_renew: true,
        start_trial: false
      });
    } catch (error) {
      console.error('Error assigning plan:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const canSubmit = formData.user_id && formData.plan_id && formData.course_id && formData.assignment_reason.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Plan to User</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user_id">Select User</Label>
            <Select value={formData.user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <div>
                        <div>{user.email}</div>
                        {user.full_name && (
                          <div className="text-xs text-muted-foreground">{user.full_name}</div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedUser && (
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">{selectedUser.email}</div>
                    {selectedUser.full_name && (
                      <div className="text-sm text-muted-foreground">{selectedUser.full_name}</div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label htmlFor="plan_id">Select Plan</Label>
            <Select value={formData.plan_id} onValueChange={(value) => setFormData(prev => ({ ...prev, plan_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a plan..." />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <div>
                          <div>{plan.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(plan.pricing.monthly_price, plan.pricing.currency)}/month
                          </div>
                        </div>
                      </div>
                      <Badge>{plan.tier}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPlan && (
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium">{selectedPlan.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(selectedPlan.pricing.monthly_price, selectedPlan.pricing.currency)}/month
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{selectedPlan.tier}</Badge>
                    {selectedPlan.trial_enabled && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {selectedPlan.trial_duration_days}d trial
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course_id">Select Course</Label>
            <Select value={formData.course_id} onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div>
                      <div>{course.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {course.language} - {course.level}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCourse && (
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-600"></div>
                  <div>
                    <div className="font-medium">{selectedCourse.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedCourse.language} - {selectedCourse.level}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Assignment Reason */}
          <div className="space-y-2">
            <Label htmlFor="assignment_reason">Assignment Reason</Label>
            <Textarea
              id="assignment_reason"
              value={formData.assignment_reason}
              onChange={(e) => setFormData(prev => ({ ...prev, assignment_reason: e.target.value }))}
              placeholder="Explain why you're assigning this plan to the user..."
              rows={3}
            />
          </div>

          {/* Billing Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium">Billing Configuration</h4>
            
            {selectedPlan?.trial_enabled && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-blue-600" />
                  <div>
                    <Label htmlFor="start_trial">Start with Trial</Label>
                    <p className="text-sm text-muted-foreground">
                      Begin with {selectedPlan.trial_duration_days}-day free trial
                    </p>
                  </div>
                </div>
                <Switch
                  id="start_trial"
                  checked={formData.start_trial}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    start_trial: checked,
                    billing_cycle: checked ? 'trial' : 'monthly'
                  }))}
                />
              </div>
            )}

            {!formData.start_trial && (
              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Billing Cycle</Label>
                <Select 
                  value={formData.billing_cycle} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, billing_cycle: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_renew">Auto-Renewal</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically renew subscription when period ends
                </p>
              </div>
              <Switch
                id="auto_renew"
                checked={formData.auto_renew}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_renew: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="custom_dates">Custom Period Dates</Label>
                <p className="text-sm text-muted-foreground">
                  Set specific start and end dates for the subscription
                </p>
              </div>
              <Switch
                id="custom_dates"
                checked={showDatePickers}
                onCheckedChange={setShowDatePickers}
              />
            </div>

            {showDatePickers && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.custom_period_start 
                          ? format(formData.custom_period_start, "PPP")
                          : "Pick a date"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.custom_period_start}
                        onSelect={(date) => setFormData(prev => ({ ...prev, custom_period_start: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.custom_period_end 
                          ? format(formData.custom_period_end, "PPP")
                          : "Pick a date"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.custom_period_end}
                        onSelect={(date) => setFormData(prev => ({ ...prev, custom_period_end: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !canSubmit}
          >
            {loading ? 'Assigning...' : 'Assign Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}