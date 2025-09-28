import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "@/utils/supabase/server";
import { z } from "zod";

// Validation schemas
const analyticsQuerySchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', '365d']).default('30d'),
  metrics: z.array(z.enum(['engagement', 'performance', 'progress', 'streaks', 'xp'])).optional()
});

const analyticsUpdateSchema = z.object({
  engagement: z.object({
    session_completed: z.boolean().optional(),
    study_minutes: z.number().min(0).optional(),
    xp_earned: z.number().min(0).optional()
  }).optional(),
  achievement: z.object({
    badge_earned: z.string().optional(),
    milestone_reached: z.string().optional(),
    xp_bonus: z.number().min(0).optional()
  }).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = id;
    const isOwnData = user.id === userId;
    
    // Verify access permissions
    if (!isOwnData) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = analyticsQuerySchema.parse({
      timeframe: searchParams.get('timeframe') || '30d',
      metrics: searchParams.get('metrics')?.split(',')
    });

    // Calculate date range
    const now = new Date();
    const days = parseInt(queryParams.timeframe.replace('d', ''));
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    // Get user analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (analyticsError && analyticsError.code !== 'PGRST116') {
      console.error('Analytics query error:', analyticsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }

    // Get engagement trend data from exam sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('exam_sessions')
      .select(`
        id,
        started_at,
        completed_at,
        score,
        xp_earned,
        duration_minutes:duration,
        skills_practiced
      `)
      .eq('user_id', userId)
      .gte('started_at', startDate.toISOString())
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: true });

    if (sessionsError) {
      console.error('Sessions query error:', sessionsError);
    }

    // Process engagement trend
    const engagementTrend = processEngagementTrend(sessions || [], queryParams.timeframe);
    
    // Process skill progress
    const skillProgress = await getSkillProgress(supabase, userId, startDate);
    
    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(sessions || [], analytics);

    // Build response based on requested metrics
    const responseData: any = {};

    if (!queryParams.metrics || queryParams.metrics.includes('engagement')) {
      responseData.engagement_trend = engagementTrend;
    }

    if (!queryParams.metrics || queryParams.metrics.includes('performance')) {
      responseData.performance_metrics = performanceMetrics;
    }

    if (!queryParams.metrics || queryParams.metrics.includes('progress')) {
      responseData.skill_progress = skillProgress;
    }

    if (!queryParams.metrics || queryParams.metrics.includes('streaks')) {
      responseData.streak_data = {
        current_streak: analytics?.engagement?.current_streak || 0,
        longest_streak: analytics?.engagement?.longest_streak || 0,
        streak_history: generateStreakHistory(sessions || [])
      };
    }

    if (!queryParams.metrics || queryParams.metrics.includes('xp')) {
      responseData.xp_data = {
        total_xp: analytics?.achievements?.total_xp || 0,
        current_level: analytics?.achievements?.current_level || 1,
        xp_this_period: sessions?.reduce((sum, s) => sum + (s.xp_earned || 0), 0) || 0,
        xp_history: sessions?.map(s => ({
          date: s.started_at,
          xp_earned: s.xp_earned || 0,
          session_id: s.id
        })) || []
      };
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        user_id: userId,
        timeframe: queryParams.timeframe,
        date_range: {
          start: startDate.toISOString(),
          end: now.toISOString()
        },
        session_count: sessions?.length || 0,
        last_updated: analytics?.updated_at || null
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid query parameters",
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = id;
    
    // Only allow users to update their own analytics or system updates
    if (user.id !== userId) {
      // Check for system/admin updates
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['admin', 'super_admin', 'system'].includes(profile.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validatedData = analyticsUpdateSchema.parse(body);

    // Get current analytics
    const { data: currentAnalytics } = await supabase
      .from('user_analytics')
      .select('engagement, achievements')
      .eq('user_id', userId)
      .single();

    // Build updates
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // Update engagement data
    if (validatedData.engagement) {
      const currentEngagement = currentAnalytics?.engagement || {};
      const newEngagement = { ...currentEngagement };

      if (validatedData.engagement.session_completed) {
        newEngagement.session_count_today = (newEngagement.session_count_today || 0) + 1;
        newEngagement.last_activity_at = new Date().toISOString();
      }

      if (validatedData.engagement.study_minutes) {
        newEngagement.total_study_minutes = (newEngagement.total_study_minutes || 0) + validatedData.engagement.study_minutes;
        
        // Update weekly study minutes
        const weeklyMinutes = newEngagement.weekly_study_minutes || [0, 0, 0, 0, 0, 0, 0];
        const today = new Date().getDay();
        weeklyMinutes[today] = (weeklyMinutes[today] || 0) + validatedData.engagement.study_minutes;
        newEngagement.weekly_study_minutes = weeklyMinutes;
      }

      updates.engagement = newEngagement;
    }

    // Update achievements
    if (validatedData.achievement) {
      const currentAchievements = currentAnalytics?.achievements || {};
      const newAchievements = { ...currentAchievements };

      if (validatedData.achievement.xp_bonus) {
        newAchievements.total_xp = (newAchievements.total_xp || 0) + validatedData.achievement.xp_bonus;
        
        // Recalculate level
        newAchievements.current_level = calculateLevelFromXP(newAchievements.total_xp);
      }

      if (validatedData.achievement.badge_earned) {
        const badges = newAchievements.badges_earned || [];
        badges.push({
          id: validatedData.achievement.badge_earned,
          earned_at: new Date().toISOString()
        });
        newAchievements.badges_earned = badges;
      }

      if (validatedData.achievement.milestone_reached) {
        const milestones = newAchievements.milestones_reached || [];
        if (!milestones.includes(validatedData.achievement.milestone_reached)) {
          milestones.push(validatedData.achievement.milestone_reached);
          newAchievements.milestones_reached = milestones;
        }
      }

      updates.achievements = newAchievements;
    }

    // Perform update
    const { data, error } = await supabase
      .from('user_analytics')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Analytics update error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to update analytics" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      meta: {
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Analytics PATCH error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request data",
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function processEngagementTrend(sessions: any[], timeframe: string) {
  const days = parseInt(timeframe.replace('d', ''));
  const now = new Date();
  const trend = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const dateStr = date.toISOString().split('T')[0];
    
    const daySessions = sessions.filter(s => 
      s.started_at.startsWith(dateStr)
    );

    trend.push({
      date: dateStr,
      sessions: daySessions.length,
      total_minutes: daySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
      avg_score: daySessions.length > 0 
        ? daySessions.reduce((sum, s) => sum + (s.score || 0), 0) / daySessions.length 
        : 0
    });
  }

  return trend;
}

async function getSkillProgress(supabase: any, userId: string, startDate: Date) {
  // Get skill-specific session data
  const { data: skillSessions, error } = await supabase
    .from('exam_sessions')
    .select('skills_practiced, score, started_at')
    .eq('user_id', userId)
    .gte('started_at', startDate.toISOString())
    .not('completed_at', 'is', null);

  if (error) {
    console.error('Skill sessions error:', error);
    return [];
  }

  // Aggregate skill performance
  const skillMap = new Map();

  skillSessions?.forEach((session: any) => {
    if (session.skills_practiced) {
      const skills = Array.isArray(session.skills_practiced) 
        ? session.skills_practiced 
        : JSON.parse(session.skills_practiced || '[]');
      
      skills.forEach((skill: string) => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, {
            skill_name: skill,
            skill_display_name: skill.charAt(0).toUpperCase() + skill.slice(1),
            sessions_practiced: 0,
            total_score: 0,
            last_practiced_at: null,
            improvement_sessions: []
          });
        }

        const skillData = skillMap.get(skill);
        skillData.sessions_practiced++;
        skillData.total_score += session.score || 0;
        skillData.last_practiced_at = session.started_at;
        skillData.improvement_sessions.push({
          date: session.started_at,
          score: session.score || 0
        });
      });
    }
  });

  // Calculate improvement rates and confidence scores
  return Array.from(skillMap.values()).map((skill: any) => {
    const sessions = skill.improvement_sessions.sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const currentLevel = skill.total_score / skill.sessions_practiced;
    const improvementRate = sessions.length > 1 
      ? calculateImprovementRate(sessions)
      : 0;
    
    return {
      skill_name: skill.skill_name,
      skill_display_name: skill.skill_display_name,
      current_level: Math.round(currentLevel),
      target_level: Math.min(100, Math.round(currentLevel + 15)),
      improvement_rate: improvementRate,
      sessions_practiced: skill.sessions_practiced,
      last_practiced_at: skill.last_practiced_at,
      confidence_score: calculateConfidenceScore(sessions)
    };
  });
}

function calculatePerformanceMetrics(sessions: any[], analytics: any) {
  if (!sessions.length) {
    return {
      average_score: 0,
      improvement_rate: 0,
      weak_areas: [],
      strong_areas: []
    };
  }

  const averageScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length;
  
  // Calculate improvement rate over time
  const sortedSessions = sessions.sort((a, b) => 
    new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );
  
  const improvementRate = calculateImprovementRate(
    sortedSessions.map(s => ({ score: s.score, date: s.started_at }))
  );

  return {
    average_score: Math.round(averageScore * 10) / 10,
    improvement_rate: Math.round(improvementRate * 1000) / 1000,
    weak_areas: analytics?.performance?.weak_areas || [],
    strong_areas: analytics?.performance?.strong_areas || []
  };
}

function generateStreakHistory(sessions: any[]) {
  // Generate a simple streak visualization for the last 30 days
  const now = new Date();
  const history = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const dateStr = date.toISOString().split('T')[0];
    
    const hasActivity = sessions.some(s => s.started_at.startsWith(dateStr));
    
    history.push({
      date: dateStr,
      has_activity: hasActivity
    });
  }

  return history;
}

function calculateImprovementRate(sessions: { score: number; date: string }[]) {
  if (sessions.length < 2) return 0;
  
  // Simple linear regression to calculate improvement trend
  const n = sessions.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  sessions.forEach((session, index) => {
    const x = index;
    const y = session.score;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

function calculateConfidenceScore(sessions: { score: number }[]) {
  if (sessions.length === 0) return 0;
  
  const scores = sessions.map(s => s.score);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Lower standard deviation = higher confidence
  const maxStdDev = 30; // Assuming scores range 0-100
  const confidence = Math.max(0, 1 - (standardDeviation / maxStdDev));
  
  return Math.round(confidence * 1000) / 1000;
}

function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpForNextLevel = 100;
  let remainingXP = totalXP;

  while (remainingXP >= xpForNextLevel && level < 100) {
    remainingXP -= xpForNextLevel;
    level++;
    xpForNextLevel = Math.floor(xpForNextLevel * 1.2);
  }

  return level;
}