import { Card } from "@/components/ui/card";
import { Users, BookOpen, CreditCard, TrendingUp, Target, Activity } from "lucide-react";

interface OverviewData {
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  totalCourses: number;
  activeCourses: number;
  totalExamSessions: number;
  activeExamSessions: number;
  completedExamSessions: number;
  totalPayments: number;
  monthlyRevenue: number;
  conversionRate: string;
}

interface OverviewStatsProps {
  data: OverviewData;
}

export default function OverviewStats({ data }: OverviewStatsProps) {
  const stats = [
    {
      title: "Total Users",
      value: data.totalUsers,
      change: data.newUsersThisMonth,
      changeLabel: "new this month",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Courses",
      value: data.activeCourses,
      change: data.totalCourses - data.activeCourses,
      changeLabel: "inactive",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Exam Sessions",
      value: data.totalExamSessions,
      change: data.activeExamSessions,
      changeLabel: "currently active",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Completed Exams",
      value: data.completedExamSessions,
      change: data.totalExamSessions > 0 ? 
        Math.round((data.completedExamSessions / data.totalExamSessions) * 100) : 0,
      changeLabel: "completion rate",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Monthly Revenue",
      value: `€${data.monthlyRevenue.toFixed(2)}`,
      change: data.totalPayments,
      changeLabel: "total transactions",
      icon: CreditCard,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      isRevenue: true
    },
    {
      title: "Conversion Rate",
      value: `${data.conversionRate}%`,
      change: data.newUsersThisWeek,
      changeLabel: "new users this week",
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      isPercentage: true
    }
  ];

  const formatValue = (value: any, isRevenue?: boolean, isPercentage?: boolean) => {
    if (isRevenue && typeof value === 'string') return value;
    if (isPercentage && typeof value === 'string') return value;
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-2xl font-bold">
                {formatValue(stat.value, stat.isRevenue, stat.isPercentage)}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">
                  {stat.changeLabel === "completion rate" ? `${stat.change}%` : stat.change.toLocaleString()}
                </span>{" "}
                {stat.changeLabel}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}