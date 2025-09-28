'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

interface RegionalAnalyticsProps {
  data: {
    region: string;
    user_course_enrollments: any[];
  }[];
}

export default function RegionalAnalytics({ data }: RegionalAnalyticsProps) {
  const regionStats = data?.map(item => ({
    region: item.region,
    count: Array.isArray(item.user_course_enrollments) ? item.user_course_enrollments.length : 0
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Regional Analytics
        </CardTitle>
        <CardDescription>
          Course enrollment by region
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {regionStats.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground capitalize">{item.region}</span>
              <div className="flex items-center space-x-2">
                <div 
                  className="bg-orange-500 h-2 rounded"
                  style={{ width: `${Math.max((item.count / Math.max(...regionStats.map(d => d.count))) * 100, 5)}px` }}
                />
                <span className="text-sm font-medium">{item.count}</span>
              </div>
            </div>
          ))}
          {regionStats.length === 0 && (
            <div className="text-sm text-muted-foreground">No data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}