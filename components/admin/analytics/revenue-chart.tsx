'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface RevenueChartProps {
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}

export default function RevenueChart({ monthlyRevenue }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Revenue Chart
        </CardTitle>
        <CardDescription>
          Monthly revenue trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monthlyRevenue?.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.month}</span>
              <div className="flex items-center space-x-2">
                <div 
                  className="bg-purple-500 h-2 rounded"
                  style={{ width: `${Math.max((item.revenue / Math.max(...monthlyRevenue.map(d => d.revenue))) * 100, 5)}px` }}
                />
                <span className="text-sm font-medium">${item.revenue}</span>
              </div>
            </div>
          )) || (
            <div className="text-sm text-muted-foreground">No data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}