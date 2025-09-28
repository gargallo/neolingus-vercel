"use client";

import { useEffect, useState } from "react";

interface StatItem {
  value: string;
  label: string;
  delay: number;
}

interface AnimatedStatsProps {
  stats: StatItem[];
  className?: string;
}

export function AnimatedStats({ stats, className = "" }: AnimatedStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`grid grid-cols-3 gap-4 text-center ${className}`}>
        {stats.map((_, index) => (
          <div key={index} className="text-white/60">
            <div className="text-2xl font-bold text-white">--</div>
            <div className="text-xs">--</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-3 gap-4 text-center ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="text-white/60 animate-fade-in-up"
          style={{ animationDelay: `${stat.delay}ms` }}
        >
          <div className="text-2xl font-bold text-white">{stat.value}</div>
          <div className="text-xs">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
