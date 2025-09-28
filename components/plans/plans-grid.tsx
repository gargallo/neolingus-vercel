"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Check, 
  Star, 
  Clock, 
  Users, 
  Zap,
  Trophy,
  Sparkles
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  tier: 'basic' | 'standard' | 'premium';
  description: string;
  pricing: {
    monthly_price: number;
    yearly_price?: number;
    currency: string;
  };
  features: Record<string, any>;
  trial_enabled: boolean;
  trial_duration_days: number;
  is_featured: boolean;
}

interface PlansGridProps {
  plans: Plan[];
  billingCycle: 'monthly' | 'yearly';
  onBillingCycleChange: (cycle: 'monthly' | 'yearly') => void;
  onSelectPlan: (planId: string, trial?: boolean) => void;
  currentUserPlan?: string;
  loading?: boolean;
}

export default function PlansGrid({
  plans,
  billingCycle,
  onBillingCycleChange,
  onSelectPlan,
  currentUserPlan,
  loading = false
}: PlansGridProps) {
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getPrice = (plan: Plan) => {
    if (billingCycle === 'yearly' && plan.pricing.yearly_price) {
      return plan.pricing.yearly_price;
    }
    return plan.pricing.monthly_price;
  };

  const getMonthlyEquivalent = (plan: Plan) => {
    if (billingCycle === 'yearly' && plan.pricing.yearly_price) {
      return plan.pricing.yearly_price / 12;
    }
    return plan.pricing.monthly_price;
  };

  const calculateSavings = (plan: Plan) => {
    if (!plan.pricing.yearly_price || billingCycle !== 'yearly') return 0;
    const monthlyTotal = plan.pricing.monthly_price * 12;
    const savings = monthlyTotal - plan.pricing.yearly_price;
    return Math.round((savings / monthlyTotal) * 100);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Users className="w-5 h-5" />;
      case 'standard':
        return <Zap className="w-5 h-5" />;
      case 'premium':
        return <Trophy className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic':
        return 'from-blue-500 to-blue-600';
      case 'standard':
        return 'from-green-500 to-green-600';
      case 'premium':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatFeatureName = (feature: string) => {
    return feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActiveFeatures = (plan: Plan) => {
    if (!plan.features || typeof plan.features !== 'object') return [];
    return Object.entries(plan.features)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => key);
  };

  // Sort plans by display order and tier
  const sortedPlans = [...plans].sort((a, b) => {
    const tierOrder = { basic: 1, standard: 2, premium: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  return (
    <div className="space-y-8">
      {/* Billing cycle toggle */}
      <div className="flex justify-center">
        <Tabs value={billingCycle} onValueChange={onBillingCycleChange as any} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="relative">
              Yearly
              {plans.some(p => p.pricing.yearly_price) && (
                <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                  Save up to 20%
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {sortedPlans.map((plan) => {
          const price = getPrice(plan);
          const monthlyEquivalent = getMonthlyEquivalent(plan);
          const savings = calculateSavings(plan);
          const activeFeatures = getActiveFeatures(plan);
          const isCurrentPlan = currentUserPlan === plan.id;

          return (
            <Card 
              key={plan.id} 
              className={`relative p-6 ${plan.is_featured ? 'ring-2 ring-primary border-primary scale-105' : ''}`}
            >
              {/* Featured badge */}
              {plan.is_featured && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${getTierColor(plan.tier)} text-white mb-4`}>
                  {getTierIcon(plan.tier)}
                </div>
                
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                
                {/* Pricing */}
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">
                      {formatCurrency(price, plan.pricing.currency)}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  
                  {billingCycle === 'yearly' && plan.pricing.yearly_price && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(monthlyEquivalent, plan.pricing.currency)}/month
                      </p>
                      {savings > 0 && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Save {savings}%
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Features list */}
              <div className="space-y-3 mb-6">
                {activeFeatures.slice(0, 6).map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{formatFeatureName(feature)}</span>
                  </div>
                ))}
                
                {activeFeatures.length > 6 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">+{activeFeatures.length - 6} more features</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <>
                    <Button 
                      className="w-full" 
                      variant={plan.is_featured ? "default" : "outline"}
                      onClick={() => onSelectPlan(plan.id)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Choose Plan'}
                    </Button>
                    
                    {plan.trial_enabled && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-sm"
                        onClick={() => onSelectPlan(plan.id, true)}
                        disabled={loading}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Start {plan.trial_duration_days}-Day Free Trial
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Trial info */}
              {plan.trial_enabled && !isCurrentPlan && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-center text-blue-700">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {plan.trial_duration_days} days free, then {formatCurrency(monthlyEquivalent, plan.pricing.currency)}/month
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Trust indicators */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>14-day money-back guarantee</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>Secure payment</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          All plans include access to our full course library and community features.
          <br />
          Prices are in {plans[0]?.pricing.currency || 'EUR'} and exclude applicable taxes.
        </p>
      </div>
    </div>
  );
}