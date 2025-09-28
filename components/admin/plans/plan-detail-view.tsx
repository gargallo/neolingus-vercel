"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  Users, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Euro, 
  Settings, 
  Edit,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  tier: 'basic' | 'standard' | 'premium';
  description: string;
  pricing: {
    monthly_price: number;
    yearly_price?: number;
    currency: string;
  };
  features: Record<string, any>;
  limits: Record<string, number>;
  trial_enabled: boolean;
  trial_duration_days: number;
  is_active: boolean;
  is_featured: boolean;
  subscriber_count: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

interface PlanStats {
  totalRevenue: number;
  monthlyRevenue: number;
  averageRevenue: number;
  conversionRate: number;
  trialConversions: number;
  churnRate: number;
}

interface PlanDetailViewProps {
  plan: Plan;
  stats?: PlanStats;
  onEdit?: () => void;
  onViewSubscribers?: () => void;
  onToggleStatus?: () => void;
}

export default function PlanDetailView({ 
  plan, 
  stats, 
  onEdit, 
  onViewSubscribers, 
  onToggleStatus 
}: PlanDetailViewProps) {
  
  const formatCurrency = (amount: number, currency = plan.pricing.currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'standard':
        return 'bg-green-100 text-green-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateYearlyDiscount = () => {
    if (!plan.pricing.yearly_price || !plan.pricing.monthly_price) return 0;
    const monthlyTotal = plan.pricing.monthly_price * 12;
    const discount = ((monthlyTotal - plan.pricing.yearly_price) / monthlyTotal) * 100;
    return Math.round(discount);
  };

  const getActiveFeatures = () => {
    if (!plan.features || typeof plan.features !== 'object') return [];
    return Object.entries(plan.features)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => key);
  };

  const getInactiveFeatures = () => {
    if (!plan.features || typeof plan.features !== 'object') return [];
    return Object.entries(plan.features)
      .filter(([_, enabled]) => !enabled)
      .map(([key, _]) => key);
  };

  const formatFeatureName = (feature: string) => {
    return feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const activeFeatures = getActiveFeatures();
  const inactiveFeatures = getInactiveFeatures();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{plan.name}</h1>
            <Badge className={getTierColor(plan.tier)}>
              {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
            </Badge>
            {plan.is_featured && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            <Badge className={plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {plan.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">{plan.description}</p>
          <p className="text-sm text-muted-foreground">Plan ID: {plan.id}</p>
        </div>
        
        <div className="flex gap-2">
          {onViewSubscribers && (
            <Button variant="outline" onClick={onViewSubscribers}>
              <Users className="w-4 h-4 mr-2" />
              View Subscribers
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Plan
            </Button>
          )}
          {onToggleStatus && (
            <Button 
              variant={plan.is_active ? "destructive" : "default"}
              onClick={onToggleStatus}
            >
              {plan.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Limits</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          {stats && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Subscribers</span>
              </div>
              <div className="text-2xl font-bold">{plan.subscriber_count}</div>
              <p className="text-sm text-muted-foreground">Active subscriptions</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="w-5 h-5 text-green-600" />
                <span className="font-medium">Monthly Price</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(plan.pricing.monthly_price)}
              </div>
              <p className="text-sm text-muted-foreground">Per subscriber</p>
            </Card>

            {plan.pricing.yearly_price && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Yearly Price</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(plan.pricing.yearly_price)}
                </div>
                <div className="flex items-center gap-1">
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    {calculateYearlyDiscount()}% off
                  </Badge>
                </div>
              </Card>
            )}

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Display Order</span>
              </div>
              <div className="text-2xl font-bold">{plan.display_order}</div>
              <p className="text-sm text-muted-foreground">Sort position</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Plan Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="font-mono text-sm">{plan.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier:</span>
                  <Badge className={getTierColor(plan.tier)}>
                    {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Features:</span>
                  <span>{activeFeatures.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial Enabled:</span>
                  <div className="flex items-center gap-2">
                    {plan.trial_enabled ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{plan.trial_duration_days} days</span>
                      </>
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Timestamps</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm">Created:</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(plan.created_at)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Last Updated:</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(plan.updated_at)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Pricing Structure</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Monthly Price:</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(plan.pricing.monthly_price)}
                  </span>
                </div>
                
                {plan.pricing.yearly_price && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span>Yearly Price:</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(plan.pricing.yearly_price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Monthly equivalent:</span>
                      <span>{formatCurrency(plan.pricing.yearly_price / 12)}</span>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-green-100 text-green-800">
                        Save {calculateYearlyDiscount()}% with yearly billing
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Usage Limits</h3>
              <div className="space-y-3">
                {Object.entries(plan.limits || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {formatFeatureName(key)}:
                    </span>
                    <span className="font-medium">
                      {value === null || value === undefined ? 'Unlimited' : value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Included Features ({activeFeatures.length})</h3>
              </div>
              <div className="space-y-2">
                {activeFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{formatFeatureName(feature)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {inactiveFeatures.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold">Not Included ({inactiveFeatures.length})</h3>
                </div>
                <div className="space-y-2">
                  {inactiveFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>{formatFeatureName(feature)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {stats && (
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.monthlyRevenue)}
                </div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              </Card>
              
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.conversionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </Card>
              
              <Card className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.churnRate.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Plan Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Plan Status</span>
                  <p className="text-sm text-muted-foreground">
                    {plan.is_active ? 'Plan is available for new subscriptions' : 'Plan is hidden from users'}
                  </p>
                </div>
                <Badge className={plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Featured Plan</span>
                  <p className="text-sm text-muted-foreground">
                    {plan.is_featured ? 'Highlighted as recommended option' : 'Standard display'}
                  </p>
                </div>
                <Badge className={plan.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                  {plan.is_featured ? 'Featured' : 'Standard'}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Trial Period</span>
                  <p className="text-sm text-muted-foreground">
                    {plan.trial_enabled 
                      ? `${plan.trial_duration_days} day free trial available`
                      : 'No trial period offered'
                    }
                  </p>
                </div>
                <Badge className={plan.trial_enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                  {plan.trial_enabled ? `${plan.trial_duration_days} days` : 'Disabled'}
                </Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}