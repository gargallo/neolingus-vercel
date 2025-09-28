"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Users, Settings, Star, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

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
  features: any;
  trial_enabled: boolean;
  trial_duration_days: number;
  is_active: boolean;
  is_featured: boolean;
  subscriber_count: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PlansListProps {
  plans: Plan[];
  pagination: Pagination;
  adminRole?: string;
  currentFilters: {
    search: string;
    tier: string;
    status: string;
  };
  onDeletePlan?: (planId: string) => void;
  onEditPlan?: (planId: string) => void;
}

export default function PlansList({ 
  plans, 
  pagination, 
  adminRole, 
  currentFilters, 
  onDeletePlan, 
  onEditPlan 
}: PlansListProps) {
  const router = useRouter();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTierBadgeColor = (tier: string) => {
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

  const getStatusBadge = (plan: Plan) => {
    if (!plan.is_active) {
      return {
        label: 'Inactive',
        color: 'bg-red-100 text-red-800'
      };
    }
    if (plan.is_featured) {
      return {
        label: 'Featured',
        color: 'bg-yellow-100 text-yellow-800'
      };
    }
    return {
      label: 'Active',
      color: 'bg-green-100 text-green-800'
    };
  };

  const canEdit = adminRole === 'super_admin' || adminRole === 'admin';
  const canDelete = adminRole === 'super_admin';

  const handleAction = async (action: string, planId: string) => {
    switch (action) {
      case 'view':
        router.push(`/admin/plans/${planId}`);
        break;
      case 'edit':
        if (onEditPlan) {
          onEditPlan(planId);
        } else {
          router.push(`/admin/plans/${planId}/edit`);
        }
        break;
      case 'subscribers':
        router.push(`/admin/plans/${planId}/subscribers`);
        break;
      case 'delete':
        if (onDeletePlan && confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
          onDeletePlan(planId);
        }
        break;
    }
  };

  const countActiveFeatures = (features: any) => {
    if (!features || typeof features !== 'object') return 0;
    return Object.values(features).filter(Boolean).length;
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} plans
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={pagination.page === 1}
          onClick={() => {
            const params = new URLSearchParams();
            if (currentFilters.search) params.set('search', currentFilters.search);
            if (currentFilters.tier !== 'all') params.set('tier', currentFilters.tier);
            if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
            params.set('page', (pagination.page - 1).toString());
            router.push(`/admin/plans?${params.toString()}`);
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
            if (currentFilters.tier !== 'all') params.set('tier', currentFilters.tier);
            if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
            params.set('page', (pagination.page + 1).toString());
            router.push(`/admin/plans?${params.toString()}`);
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {plans.map((plan) => {
        const status = getStatusBadge(plan);
        const activeFeatures = countActiveFeatures(plan.features);
        
        return (
          <Card key={plan.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="font-medium text-lg">{plan.name}</h3>
                  <Badge className={getTierBadgeColor(plan.tier)}>
                    {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                  </Badge>
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                  {plan.is_featured && (
                    <Star className="w-4 h-4 text-yellow-600" />
                  )}
                  {plan.trial_enabled && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {plan.trial_duration_days}d trial
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Monthly Price:</span>
                    <div className="text-lg font-semibold">
                      {formatCurrency(plan.pricing.monthly_price, plan.pricing.currency)}
                    </div>
                  </div>
                  
                  {plan.pricing.yearly_price && (
                    <div>
                      <span className="font-medium text-muted-foreground">Yearly Price:</span>
                      <div className="text-lg font-semibold">
                        {formatCurrency(plan.pricing.yearly_price, plan.pricing.currency)}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-muted-foreground">Subscribers:</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">{plan.subscriber_count}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-muted-foreground">Features:</span>
                    <div className="font-semibold">{activeFeatures} active</div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-muted-foreground">Created:</span>
                    <div>{formatDate(plan.created_at)}</div>
                  </div>
                </div>

                {activeFeatures > 0 && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-muted-foreground">Key Features:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(plan.features || {})
                        .filter(([_, enabled]) => enabled)
                        .slice(0, 3)
                        .map(([feature, _], index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        ))}
                      {activeFeatures > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{activeFeatures - 3} more
                        </Badge>
                      )}
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
                  <DropdownMenuItem onClick={() => handleAction('view', plan.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleAction('subscribers', plan.id)}>
                    <Users className="w-4 h-4 mr-2" />
                    View Subscribers ({plan.subscriber_count})
                  </DropdownMenuItem>
                  
                  {canEdit && (
                    <DropdownMenuItem onClick={() => handleAction('edit', plan.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Plan
                    </DropdownMenuItem>
                  )}
                  
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={() => handleAction('delete', plan.id)}
                      className="text-red-600"
                      disabled={plan.subscriber_count > 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Plan
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        );
      })}

      {plans.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No plans found matching your criteria.</p>
        </Card>
      )}

      <PaginationControls />
    </div>
  );
}