"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Star, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  Gift,
  Zap
} from "lucide-react";

interface TrialData {
  is_trial: boolean;
  trial_ends_at: string;
  days_remaining: number;
  plan_name: string;
  plan_tier: string;
  features_available: string[];
  course_info: {
    id: string;
    language: string;
    level: string;
    title: string;
  };
}

interface TrialStatusProps {
  trialData: TrialData | null;
  onUpgrade: () => void;
  onViewPlans: () => void;
  loading?: boolean;
}

export default function TrialStatus({ 
  trialData, 
  onUpgrade, 
  onViewPlans, 
  loading = false 
}: TrialStatusProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!trialData?.is_trial) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const trialEnd = new Date(trialData.trial_ends_at);
      const timeDiff = trialEnd.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeRemaining('Trial expired');
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [trialData]);

  if (!trialData?.is_trial) {
    return null;
  }

  const trialProgress = trialData.days_remaining <= 0 ? 100 : 
    ((7 - trialData.days_remaining) / 7) * 100;

  const isExpiringSoon = trialData.days_remaining <= 2;
  const isExpired = trialData.days_remaining <= 0;

  const formatFeatureName = (feature: string) => {
    return feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  return (
    <Card className={`p-6 ${isExpiringSoon ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full bg-gradient-to-r ${getTierColor(trialData.plan_tier)} text-white`}>
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold">Free Trial Active</h3>
                <p className="text-sm text-muted-foreground">
                  {trialData.plan_name} • {trialData.course_info.title}
                </p>
              </div>
            </div>
          </div>
          
          <Badge 
            className={
              isExpired ? 'bg-red-100 text-red-800' :
              isExpiringSoon ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }
          >
            {isExpired ? 'Expired' : `${trialData.days_remaining} days left`}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Trial progress</span>
            <span className="font-medium">{timeRemaining}</span>
          </div>
          <Progress 
            value={trialProgress} 
            className={`h-2 ${isExpiringSoon ? '[&>div]:bg-orange-500' : '[&>div]:bg-blue-500'}`}
          />
        </div>

        {/* Status message */}
        <div className={`p-4 rounded-lg ${
          isExpired ? 'bg-red-100 border border-red-200' :
          isExpiringSoon ? 'bg-orange-100 border border-orange-200' :
          'bg-blue-100 border border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            {isExpired ? (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            ) : isExpiringSoon ? (
              <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            
            <div className="space-y-1">
              <p className={`font-medium ${
                isExpired ? 'text-red-800' :
                isExpiringSoon ? 'text-orange-800' :
                'text-blue-800'
              }`}>
                {isExpired ? 'Your trial has expired' :
                 isExpiringSoon ? 'Your trial is ending soon!' :
                 'Your trial is active'}
              </p>
              <p className={`text-sm ${
                isExpired ? 'text-red-700' :
                isExpiringSoon ? 'text-orange-700' :
                'text-blue-700'
              }`}>
                {isExpired 
                  ? 'Upgrade now to continue accessing premium features and content.'
                  : isExpiringSoon 
                  ? 'Upgrade now to avoid losing access to your premium features.'
                  : 'You have full access to all premium features during your trial period.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Features showcase */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Premium Features You're Enjoying
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {trialData.features_available.slice(0, 6).map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span>{formatFeatureName(feature)}</span>
              </div>
            ))}
          </div>
          {trialData.features_available.length > 6 && (
            <p className="text-sm text-muted-foreground">
              +{trialData.features_available.length - 6} more premium features
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onUpgrade} 
            disabled={loading}
            className="flex-1"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Upgrade Now'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onViewPlans}
            disabled={loading}
            className="flex-1"
          >
            <Star className="w-4 h-4 mr-2" />
            View All Plans
          </Button>
        </div>

        {/* Footer note */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            No credit card required during trial • Cancel anytime
          </p>
        </div>
      </div>
    </Card>
  );
}