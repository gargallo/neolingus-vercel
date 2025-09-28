-- Function to calculate overall course progress for a user
CREATE OR REPLACE FUNCTION calculate_course_progress(user_id UUID, course_id UUID)
RETURNS TABLE(
    completed_exams INTEGER,
    total_exams INTEGER,
    avg_exam_score NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN es.status = 'completed' THEN 1 END) AS completed_exams,
        COUNT(es.id)::INTEGER AS total_exams,
        COALESCE(ROUND(AVG(es.score)::NUMERIC, 2), 0)::NUMERIC AS avg_exam_score,
        NOW() AS last_updated
    FROM exam_sessions es
    WHERE es.user_id = calculate_course_progress.user_id
      AND es.course_id = calculate_course_progress.course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed course analytics
CREATE OR REPLACE FUNCTION get_course_analytics(user_id UUID, course_id UUID)
RETURNS JSONB AS $$
DECLARE
    progress_data JSONB;
    exam_breakdown JSONB;
    strength_areas TEXT[];
    improvement_areas TEXT[];
    estimated_completion DATE;
BEGIN
    -- Get overall progress
    SELECT jsonb_build_object(
        'overall_progress', 
        ROUND(
            (COUNT(CASE WHEN es.status = 'completed' THEN 1 END)::DECIMAL / 
             GREATEST(COUNT(es.id), 1)) * 100, 
            2
        ),
        'completed_exams', COUNT(CASE WHEN es.status = 'completed' THEN 1 END),
        'total_exams', COUNT(es.id)
    )
    INTO progress_data
    FROM exam_sessions es
    WHERE es.user_id = get_course_analytics.user_id
      AND es.course_id = get_course_analytics.course_id;

    -- Get exam breakdown
    SELECT jsonb_object_agg(
        es.exam_type,
        jsonb_build_object(
            'progress', 
            ROUND(
                (COUNT(CASE WHEN es.status = 'completed' THEN 1 END)::DECIMAL / 
                 GREATEST(COUNT(es.id), 1)) * 100, 
                2
            ),
            'score', COALESCE(ROUND(AVG(es.score)::NUMERIC, 2), 0)
        )
    )
    INTO exam_breakdown
    FROM exam_sessions es
    WHERE es.user_id = get_course_analytics.user_id
      AND es.course_id = get_course_analytics.course_id
    GROUP BY es.exam_type;

    -- Determine strength and improvement areas
    SELECT 
        ARRAY(
            SELECT es.exam_type
            FROM exam_sessions es
            WHERE es.user_id = get_course_analytics.user_id
              AND es.course_id = get_course_analytics.course_id
            GROUP BY es.exam_type
            HAVING COALESCE(AVG(es.score), 0) > 80
        ),
        ARRAY(
            SELECT es.exam_type
            FROM exam_sessions es
            WHERE es.user_id = get_course_analytics.user_id
              AND es.course_id = get_course_analytics.course_id
            GROUP BY es.exam_type
            HAVING COALESCE(AVG(es.score), 0) < 70
        )
    INTO strength_areas, improvement_areas;

    -- Estimate completion date (simplified)
    estimated_completion := CURRENT_DATE + 
        ((100 - (progress_data->>'overall_progress')::NUMERIC) * 7)::INTEGER;

    RETURN jsonb_build_object(
        'overall_progress', progress_data->>'overall_progress',
        'exam_breakdown', exam_breakdown,
        'strength_areas', strength_areas,
        'improvement_areas', improvement_areas,
        'estimated_completion', estimated_completion,
        'last_updated', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get learning recommendations
CREATE OR REPLACE FUNCTION get_learning_recommendations(user_id UUID, course_id UUID)
RETURNS JSONB AS $$
DECLARE
    focus_areas JSONB;
    next_steps TEXT[];
    resources JSONB;
BEGIN
    -- Identify focus areas based on low scores
    SELECT jsonb_agg(
        jsonb_build_object(
            'area', es.exam_type,
            'reason', 'Low scores in ' || es.exam_type || ' exams',
            'recommended_activity', 'Practice ' || es.exam_type || ' with AI tutor'
        )
    )
    INTO focus_areas
    FROM exam_sessions es
    WHERE es.user_id = get_learning_recommendations.user_id
      AND es.course_id = get_learning_recommendations.course_id
      AND es.status = 'completed'
    GROUP BY es.exam_type
    HAVING COALESCE(AVG(es.score), 0) < 70;

    -- Define next steps
    next_steps := ARRAY[
        'Take a full practice exam',
        'Review grammar rules for weak areas'
    ];

    -- Suggest resources
    SELECT jsonb_agg(
        jsonb_build_object(
            'title', 'Practice Guide for ' || INITCAP(es.exam_type),
            'url', '/resources/' || REPLACE(es.exam_type, '_', '-') || '-guide',
            'type', 'pdf'
        )
    )
    INTO resources
    FROM (
        SELECT DISTINCT exam_type
        FROM exam_sessions
        WHERE user_id = get_learning_recommendations.user_id
          AND course_id = get_learning_recommendations.course_id
    ) es;

    RETURN jsonb_build_object(
        'focus_areas', COALESCE(focus_areas, '[]'::JSONB),
        'next_steps', next_steps,
        'resources', COALESCE(resources, '[]'::JSONB)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get progress comparison with course averages
CREATE OR REPLACE FUNCTION get_progress_comparison(user_id UUID, course_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_progress NUMERIC;
    course_average NUMERIC;
    user_ranking TEXT;
    comparison_data JSONB;
BEGIN
    -- Get user's overall progress
    SELECT 
        ROUND(
            (COUNT(CASE WHEN es.status = 'completed' THEN 1 END)::DECIMAL / 
             GREATEST(COUNT(es.id), 1)) * 100, 
            2
        )
    INTO user_progress
    FROM exam_sessions es
    WHERE es.user_id = get_progress_comparison.user_id
      AND es.course_id = get_progress_comparison.course_id;

    -- Get course average progress
    SELECT 
        ROUND(
            AVG(
                (COUNT(CASE WHEN es.status = 'completed' THEN 1 END)::DECIMAL / 
                 GREATEST(COUNT(es.id), 1)) * 100
            ), 
            2
        )
    INTO course_average
    FROM exam_sessions es
    WHERE es.course_id = get_progress_comparison.course_id
    GROUP BY es.user_id;

    -- Determine user ranking
    IF user_progress >= 90 THEN
        user_ranking := 'top_10_percent';
    ELSIF user_progress >= 75 THEN
        user_ranking := 'top_25_percent';
    ELSIF user_progress >= 50 THEN
        user_ranking := 'average';
    ELSE
        user_ranking := 'below_average';
    END IF;

    -- Get detailed comparison by exam type
    SELECT jsonb_object_agg(
        es.exam_type,
        jsonb_build_object(
            'user', ROUND(AVG(CASE WHEN es.user_id = get_progress_comparison.user_id THEN es.score END)::NUMERIC, 2),
            'average', ROUND(AVG(CASE WHEN es.user_id != get_progress_comparison.user_id THEN es.score END)::NUMERIC, 2)
        )
    )
    INTO comparison_data
    FROM exam_sessions es
    WHERE es.course_id = get_progress_comparison.course_id
    GROUP BY es.exam_type;

    RETURN jsonb_build_object(
        'user_progress', user_progress,
        'course_average', course_average,
        'user_ranking', user_ranking,
        'comparison_data', comparison_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;