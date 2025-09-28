'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface UserGrowthChartProps {
  data: {
    month: string;
    users: number;
  }[];
}

export default function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          User Growth
        </CardTitle>
        <CardDescription>
          Monthly user registration trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data?.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.month}</span>
              <div className="flex items-center space-x-2">
                <div 
                  className="bg-blue-500 h-2 rounded"
                  style={{ width: `${Math.max((item.users / Math.max(...data.map(d => d.users))) * 100, 5)}px` }}
                />
                <span className="text-sm font-medium">{item.users}</span>
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