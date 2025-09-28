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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Star, Clock } from "lucide-react";

interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  included: boolean;
  limit?: number | null;
}

interface PlanFormData {
  id?: string;
  name: string;
  tier: 'basic' | 'standard' | 'premium';
  description: string;
  monthly_price: number;
  yearly_price?: number;
  currency: string;
  trial_enabled: boolean;
  trial_duration_days: number;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  features: PlanFeature[];
  limits: {
    max_courses?: number;
    max_exams_per_month?: number;
    ai_tutoring_sessions?: number;
    storage_gb?: number;
    concurrent_sessions?: number;
  };
}

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: PlanFormData) => Promise<void>;
  initialData?: Partial<PlanFormData>;
  isEditing?: boolean;
}

const defaultFeatures: PlanFeature[] = [
  { id: 'ai_tutor', name: 'AI Tutoring Sessions', description: 'Access to AI-powered tutoring', included: false },
  { id: 'custom_plans', name: 'Custom Study Plans', description: 'Personalized learning paths', included: false },
  { id: 'progress_analytics', name: 'Progress Analytics', description: 'Detailed learning analytics', included: false },
  { id: 'offline_access', name: 'Offline Access', description: 'Download content for offline study', included: false },
  { id: 'priority_support', name: 'Priority Support', description: '24/7 priority customer support', included: false },
  { id: 'certificates', name: 'Certificates', description: 'Official completion certificates', included: false },
];

export default function PlanFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  isEditing = false 
}: PlanFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    tier: 'basic',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    currency: 'EUR',
    trial_enabled: true,
    trial_duration_days: 7,
    is_active: true,
    is_featured: false,
    display_order: 1,
    features: defaultFeatures,
    limits: {
      max_courses: 1,
      max_exams_per_month: 10,
      ai_tutoring_sessions: 5,
      storage_gb: 1,
      concurrent_sessions: 1,
    }
  });

  const [customFeature, setCustomFeature] = useState({ name: '', description: '' });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        features: initialData.features || defaultFeatures,
        limits: { ...prev.limits, ...initialData.limits }
      }));
    }
  }, [initialData]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (featureId: string, included: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map(feature =>
        feature.id === featureId ? { ...feature, included } : feature
      )
    }));
  };

  const addCustomFeature = () => {
    if (!customFeature.name.trim()) return;
    
    const newFeature: PlanFeature = {
      id: customFeature.name.toLowerCase().replace(/\s+/g, '_'),
      name: customFeature.name,
      description: customFeature.description,
      included: true
    };

    setFormData(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));

    setCustomFeature({ name: '', description: '' });
  };

  const removeFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature.id !== featureId)
    }));
  };

  const calculateYearlyDiscount = () => {
    if (!formData.yearly_price || !formData.monthly_price) return 0;
    const monthlyTotal = formData.monthly_price * 12;
    const discount = ((monthlyTotal - formData.yearly_price) / monthlyTotal) * 100;
    return Math.round(discount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Plan' : 'Create New Plan'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Professional Plan"
                />
              </div>
              <div>
                <Label htmlFor="tier">Tier</Label>
                <Select value={formData.tier} onValueChange={(value: any) => setFormData(prev => ({ ...prev, tier: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the plan benefits"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
                min="1"
              />
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_price">Monthly Price (cents)</Label>
                <Input
                  id="monthly_price"
                  type="number"
                  value={formData.monthly_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_price: parseInt(e.target.value) || 0 }))}
                  placeholder="1999 for €19.99"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Display: {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(formData.monthly_price / 100)}
                </p>
              </div>
              <div>
                <Label htmlFor="yearly_price">Yearly Price (cents)</Label>
                <Input
                  id="yearly_price"
                  type="number"
                  value={formData.yearly_price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearly_price: parseInt(e.target.value) || undefined }))}
                  placeholder="19999 for €199.99"
                />
                {formData.yearly_price && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Display: {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(formData.yearly_price / 100)}
                    {calculateYearlyDiscount() > 0 && (
                      <Badge className="ml-2 bg-green-100 text-green-800">
                        {calculateYearlyDiscount()}% off
                      </Badge>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Usage Limits</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_courses">Max Courses</Label>
                  <Input
                    id="max_courses"
                    type="number"
                    value={formData.limits.max_courses || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      limits: { ...prev.limits, max_courses: parseInt(e.target.value) || undefined }
                    }))}
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="max_exams_per_month">Max Exams/Month</Label>
                  <Input
                    id="max_exams_per_month"
                    type="number"
                    value={formData.limits.max_exams_per_month || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      limits: { ...prev.limits, max_exams_per_month: parseInt(e.target.value) || undefined }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ai_tutoring_sessions">AI Tutoring Sessions</Label>
                  <Input
                    id="ai_tutoring_sessions"
                    type="number"
                    value={formData.limits.ai_tutoring_sessions || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      limits: { ...prev.limits, ai_tutoring_sessions: parseInt(e.target.value) || undefined }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="storage_gb">Storage (GB)</Label>
                  <Input
                    id="storage_gb"
                    type="number"
                    value={formData.limits.storage_gb || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      limits: { ...prev.limits, storage_gb: parseInt(e.target.value) || undefined }
                    }))}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Plan Features</h4>
              <div className="space-y-2">
                {formData.features.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={feature.included}
                          onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                        />
                        <span className="font-medium">{feature.name}</span>
                      </div>
                      {feature.description && (
                        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                      )}
                    </div>
                    {!defaultFeatures.find(f => f.id === feature.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(feature.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Add Custom Feature</h4>
              <div className="space-y-3">
                <Input
                  placeholder="Feature name"
                  value={customFeature.name}
                  onChange={(e) => setCustomFeature(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Feature description (optional)"
                  value={customFeature.description}
                  onChange={(e) => setCustomFeature(prev => ({ ...prev, description: e.target.value }))}
                />
                <Button onClick={addCustomFeature} disabled={!customFeature.name.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Active Plan</Label>
                  <p className="text-sm text-muted-foreground">Plan is available for subscription</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <div>
                    <Label htmlFor="is_featured">Featured Plan</Label>
                    <p className="text-sm text-muted-foreground">Highlight as recommended option</p>
                  </div>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div>
                    <Label htmlFor="trial_enabled">Enable Trial</Label>
                    <p className="text-sm text-muted-foreground">Allow users to start a free trial</p>
                  </div>
                </div>
                <Switch
                  id="trial_enabled"
                  checked={formData.trial_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trial_enabled: checked }))}
                />
              </div>

              {formData.trial_enabled && (
                <div>
                  <Label htmlFor="trial_duration_days">Trial Duration (days)</Label>
                  <Input
                    id="trial_duration_days"
                    type="number"
                    value={formData.trial_duration_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, trial_duration_days: parseInt(e.target.value) || 7 }))}
                    min="1"
                    max="30"
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !formData.name.trim()}>
            {loading ? 'Saving...' : (isEditing ? 'Update Plan' : 'Create Plan')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}