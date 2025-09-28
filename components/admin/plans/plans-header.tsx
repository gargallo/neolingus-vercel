"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Download, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface PlansStats {
  total: number;
  active: number;
  inactive: number;
  totalSubscribers: number;
  monthlyRevenue: number;
}

interface PlansHeaderProps {
  stats: PlansStats;
  onCreatePlan?: () => void;
  onExport?: () => void;
}

export default function PlansHeader({ stats, onCreatePlan, onExport }: PlansHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [tierFilter, setTierFilter] = useState(searchParams.get('tier') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    params.delete('page'); // Reset to first page
    router.push(`/admin/plans?${params.toString()}`);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete(filterType);
    } else {
      params.set(filterType, value);
    }
    params.delete('page'); // Reset to first page
    router.push(`/admin/plans?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTierFilter('all');
    setStatusFilter('all');
    router.push('/admin/plans');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const hasActiveFilters = searchQuery || tierFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Plan Management</h1>
          <p className="text-muted-foreground">
            Manage subscription plans, pricing, and features
          </p>
        </div>
        <div className="flex gap-2">
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          {onCreatePlan && (
            <Button onClick={onCreatePlan}>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          )}
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.total}</div>
            <Badge variant="secondary">Total Plans</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.active} active, {stats.inactive} inactive
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Currently available plans
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-blue-600">{stats.totalSubscribers}</div>
            <Badge className="bg-blue-100 text-blue-800">Subscribers</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Total active subscribers
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly recurring revenue
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalSubscribers > 0 ? formatCurrency(stats.monthlyRevenue / stats.totalSubscribers) : '€0'}
            </div>
            <Badge className="bg-orange-100 text-orange-800">ARPU</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Average revenue per user
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search plans by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery);
              }
            }}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={tierFilter} onValueChange={(value) => {
            setTierFilter(value);
            handleFilterChange('tier', value);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            handleFilterChange('status', value);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}