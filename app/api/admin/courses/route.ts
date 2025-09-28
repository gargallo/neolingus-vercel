import { createSupabaseClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/courses - List all courses
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseClient();
  
  // Check admin authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .single();

  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get courses with enrollment statistics
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        user_course_enrollments(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action_type: 'view',
      resource_type_param: 'courses',
      resource_id_param: null
    });

    return NextResponse.json({ courses: courses || [] });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/courses - Create new course
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseClient();
  
  // Check admin authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role (admin, super_admin, course_manager can create courses)
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .single();

  if (!adminUser || !['admin', 'super_admin', 'course_manager'].includes(adminUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      course_id,
      title,
      language,
      level,
      institution,
      region,
      description,
      cultural_context,
      image_url,
      available = true
    } = body;

    // Validate required fields
    if (!course_id || !title || !language || !level || !institution || !region) {
      return NextResponse.json({ 
        error: "Missing required fields: course_id, title, language, level, institution, region" 
      }, { status: 400 });
    }

    // Check if course_id already exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('course_id')
      .eq('course_id', course_id)
      .single();

    if (existingCourse) {
      return NextResponse.json({ error: "Course ID already exists" }, { status: 409 });
    }

    // Create course
    const { data: newCourse, error } = await supabase
      .from('courses')
      .insert({
        course_id,
        title,
        language,
        level,
        institution,
        region,
        description,
        cultural_context: cultural_context || [],
        image_url,
        available
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action_type: 'create',
      resource_type_param: 'course',
      resource_id_param: course_id,
      new_data_param: body
    });

    return NextResponse.json({ course: newCourse }, { status: 201 });

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}