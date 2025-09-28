import { Card } from "@/components/ui/card";
import { Bot, Zap, Target, TrendingUp } from "lucide-react";

interface AgentsStatsProps {
  stats: {
    totalAgents: number;
    activeAgents: number;
    totalCorrections: number;
    avgSystemAccuracy: number;
  };
}

export default function AgentsStats({ stats }: AgentsStatsProps) {
  const statItems = [
    {
      title: "Total Agents",
      value: stats.totalAgents,
      description: "AI agents created",
      icon: Bot,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Agents",
      value: stats.activeAgents,
      description: "Currently deployed",
      icon: Zap,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total Corrections",
      value: stats.totalCorrections.toLocaleString(),
      description: "Exams processed",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "System Accuracy",
      value: `${stats.avgSystemAccuracy}%`,
      description: "Average accuracy score",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`w-6 h-6 ${stat.color}`} />
              </div>
              {index === 3 && stats.avgSystemAccuracy >= 85 && (
                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Excellent
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-2xl font-bold">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}