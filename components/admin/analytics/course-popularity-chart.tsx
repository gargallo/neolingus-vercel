'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface CoursePopularityChartProps {
  data: {
    course: string;
    students: number;
  }[];
}

export default function CoursePopularityChart({ data }: CoursePopularityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Course Popularity
        </CardTitle>
        <CardDescription>
          Most enrolled courses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data?.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.course}</span>
              <div className="flex items-center space-x-2">
                <div 
                  className="bg-green-500 h-2 rounded"
                  style={{ width: `${Math.max((item.students / Math.max(...data.map(d => d.students))) * 100, 5)}px` }}
                />
                <span className="text-sm font-medium">{item.students}</span>
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