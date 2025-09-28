import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "@/utils/supabase/server";
import type { ExamTemplate, CreateExamTemplateForm, ExamSearchFilters } from "@/types/exam-system";

// GET /api/admin/exams - List exam templates with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, active')
      .eq('user_id', user.id)
      .single();

    if (!adminUser || !adminUser.active || !['super_admin', 'admin', 'course_manager'].includes(adminUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const language = url.searchParams.get('language');
    const level = url.searchParams.get('level');
    const provider = url.searchParams.get('provider');
    const skill = url.searchParams.get('skill');
    const is_published = url.searchParams.get('is_published');
    const is_active = url.searchParams.get('is_active');

    // Build query
    let query = supabase
      .from('exam_templates')
      .select(`
        *,
        exam_content(count),
        user_exam_attempts(count)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (language && language !== 'all') {
      query = query.eq('language', language);
    }

    if (level && level !== 'all') {
      query = query.eq('level', level);
    }

    if (provider && provider !== 'all') {
      query = query.eq('provider', provider);
    }

    if (skill && skill !== 'all') {
      query = query.eq('skill', skill);
    }

    if (is_published !== null && is_published !== undefined) {
      query = query.eq('is_published', is_published === 'true');
    }

    if (is_active !== null && is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: templates, error, count } = await query;

    if (error) {
      console.error('Error fetching exam templates:', error);
      return NextResponse.json({ error: "Failed to fetch exam templates" }, { status: 500 });
    }

    // Process templates to include statistics
    const processedTemplates = templates?.map(template => ({
      ...template,
      contentCount: Array.isArray(template.exam_content) ? template.exam_content.length : 0,
      attemptsCount: Array.isArray(template.user_exam_attempts) ? template.user_exam_attempts.length : 0
    })) || [];

    return NextResponse.json({
      success: true,
      data: processedTemplates,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/exams:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/exams - Create new exam template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, active')
      .eq('user_id', user.id)
      .single();

    if (!adminUser || !adminUser.active || !['super_admin', 'admin', 'course_manager'].includes(adminUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: CreateExamTemplateForm = await request.json();

    // Validate required fields
    if (!body.language || !body.level || !body.provider || !body.skill || !body.name || !body.difficulty_level || !body.estimated_duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate template
    const { data: existingTemplate } = await supabase
      .from('exam_templates')
      .select('id')
      .eq('language', body.language)
      .eq('level', body.level)
      .eq('provider', body.provider)
      .eq('skill', body.skill)
      .single();

    if (existingTemplate) {
      return NextResponse.json({ error: "Exam template already exists for this combination" }, { status: 409 });
    }

    // Create exam template
    const newTemplate = {
      language: body.language,
      level: body.level,
      provider: body.provider,
      skill: body.skill,
      name: body.name,
      description: body.description || null,
      difficulty_level: body.difficulty_level,
      estimated_duration: body.estimated_duration,
      official_source_path: body.official_source_path || null,
      pdf_path: body.pdf_path || null,
      audio_paths: body.audio_paths || [],
      html_simulator_path: body.html_simulator_path || null,
      structure: {},
      sections: [],
      scoring_criteria: {
        passing_score: 60,
        partial_credit: true,
        negative_marking: false,
        section_weights: {}
      },
      instructions: {
        general: '',
        sections: {},
        technical: [],
        warnings: []
      },
      is_active: true,
      is_published: false,
      version: '1.0'
    };

    const { data: template, error } = await supabase
      .from('exam_templates')
      .insert(newTemplate)
      .select()
      .single();

    if (error) {
      console.error('Error creating exam template:', error);
      return NextResponse.json({ error: "Failed to create exam template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: template,
      message: "Exam template created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/exams:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}