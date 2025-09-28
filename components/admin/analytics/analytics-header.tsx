"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, RefreshCw } from "lucide-react";
import { useState } from "react";

interface AnalyticsHeaderProps {
  adminRole?: string;
}

export default function AnalyticsHeader({ adminRole }: AnalyticsHeaderProps) {
  const [dateRange, setDateRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dateRange,
          includeUserData: true,
          includeCourseData: true,
          includeRevenueData: adminRole === 'super_admin' || adminRole === 'admin'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Refresh the page to get latest data
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Platform insights and performance metrics
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        {/* Export Button */}
        {(adminRole === 'admin' || adminRole === 'super_admin') && (
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>
    </div>
  );
}