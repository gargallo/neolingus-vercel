/**
 * Optimized Skeleton Loading Components
 *
 * High-performance skeleton components with minimal DOM and CSS animations
 * for smooth loading states in the dashboard.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
  children?: React.ReactNode;
}

const Skeleton = memo(({ className, animate = true, ...props }: SkeletonProps) => {
  if (animate) {
    return (
      <motion.div
        className={cn(
          "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800",
          "bg-[length:400%_100%] rounded-md",
          className
        )}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse",
        className
      )}
      {...props}
    />
  );
});

Skeleton.displayName = "Skeleton";

// Dashboard Stats Skeleton
const DashboardStatsSkeleton = memo(() => (
  <div className="dashboard-grid--stats dashboard-stagger" data-testid="dashboard-stats-skeleton">
    {Array.from({ length: 4 }, (_, i) => (
      <motion.div
        key={i}
        className="dashboard-card p-6 space-y-3"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.05, duration: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="w-4 h-4" />
        </div>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-20" />
      </motion.div>
    ))}
  </div>
));

DashboardStatsSkeleton.displayName = "DashboardStatsSkeleton";

// Activity Timeline Skeleton
const ActivityTimelineSkeleton = memo(({ count = 3 }: { count?: number }) => (
  <div className="space-y-4" data-testid="activity-timeline-skeleton">
    {Array.from({ length: count }, (_, i) => (
      <motion.div
        key={i}
        className="dashboard-card p-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1, duration: 0.3 }}
      >
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-12 ml-2" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
        {i < count - 1 && (
          <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
        )}
      </motion.div>
    ))}
  </div>
));

ActivityTimelineSkeleton.displayName = "ActivityTimelineSkeleton";

// Quick Actions Skeleton
const QuickActionsSkeleton = memo(() => (
  <div className="space-y-4" data-testid="quick-actions-skeleton">
    {/* Primary Action */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Skeleton className="h-12 w-full rounded-lg" />
    </motion.div>

    {/* Secondary Actions */}
    <div className="flex gap-4">
      {Array.from({ length: 3 }, (_, i) => (
        <motion.div
          key={i}
          className="flex-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05, duration: 0.2 }}
        >
          <Skeleton className="h-10 w-full rounded-lg" />
        </motion.div>
      ))}
    </div>
  </div>
));

QuickActionsSkeleton.displayName = "QuickActionsSkeleton";

// Course Header Skeleton
const CourseHeaderSkeleton = memo(() => (
  <motion.div
    className="dashboard-card p-6 space-y-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    data-testid="course-header-skeleton"
  >
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="space-y-4 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </motion.div>
));

CourseHeaderSkeleton.displayName = "CourseHeaderSkeleton";

// Overview Stats Grid Skeleton
const OverviewStatsSkeleton = memo(() => (
  <div className="dashboard-grid--stats mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }, (_, i) => (
      <motion.div
        key={i}
        className="dashboard-card p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1, duration: 0.3 }}
      >
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </motion.div>
    ))}
  </div>
));

OverviewStatsSkeleton.displayName = "OverviewStatsSkeleton";

// Dashboard Grid Skeleton
const DashboardGridSkeleton = memo(() => (
  <div className="dashboard-grid dashboard-grid-standard">
    {/* Wide widget */}
    <div className="widget-wide">
      <motion.div
        className="dashboard-card p-6 h-64"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>

    {/* Large widget */}
    <div className="widget-large">
      <motion.div
        className="dashboard-card p-6 h-64"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>

    {/* Medium widget */}
    <div className="widget-medium">
      <motion.div
        className="dashboard-card p-6 h-64"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-5 w-24 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </motion.div>
    </div>
  </div>
));

DashboardGridSkeleton.displayName = "DashboardGridSkeleton";

// Full Dashboard Loading Skeleton
const FullDashboardSkeleton = memo(() => (
  <div className="space-y-8" data-testid="full-dashboard-skeleton">
    <CourseHeaderSkeleton />
    <OverviewStatsSkeleton />
    <DashboardGridSkeleton />
  </div>
));

FullDashboardSkeleton.displayName = "FullDashboardSkeleton";

export {
  Skeleton,
  DashboardStatsSkeleton,
  ActivityTimelineSkeleton,
  QuickActionsSkeleton,
  CourseHeaderSkeleton,
  OverviewStatsSkeleton,
  DashboardGridSkeleton,
  FullDashboardSkeleton
};