import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "@/utils/supabase/server";
import type { UpdateExamTemplateForm } from "@/types/exam-system";

// GET /api/admin/exams/[id] - Get exam template by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Get exam template with content and statistics
    const { data: template, error } = await supabase
      .from('exam_templates')
      .select(`
        *,
        exam_content(*),
        user_exam_attempts(count)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Exam template not found" }, { status: 404 });
      }
      console.error('Error fetching exam template:', error);
      return NextResponse.json({ error: "Failed to fetch exam template" }, { status: 500 });
    }

    // Process template data
    const processedTemplate = {
      ...template,
      contentCount: Array.isArray(template.exam_content) ? template.exam_content.length : 0,
      attemptsCount: Array.isArray(template.user_exam_attempts) ? template.user_exam_attempts.length : 0,
      content: template.exam_content || []
    };

    return NextResponse.json({
      success: true,
      data: processedTemplate
    });

  } catch (error) {
    console.error('Error in GET /api/admin/exams/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/exams/[id] - Update exam template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body: Partial<UpdateExamTemplateForm> = await request.json();

    // Verify template exists
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('exam_templates')
      .select('id, language, level, provider, skill')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: "Exam template not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch exam template" }, { status: 500 });
    }

    // Check for duplicate if key fields are being changed
    if (body.language || body.level || body.provider || body.skill) {
      const newLanguage = body.language || existingTemplate.language;
      const newLevel = body.level || existingTemplate.level;
      const newProvider = body.provider || existingTemplate.provider;
      const newSkill = body.skill || existingTemplate.skill;

      // Only check if something actually changed
      if (
        newLanguage !== existingTemplate.language ||
        newLevel !== existingTemplate.level ||
        newProvider !== existingTemplate.provider ||
        newSkill !== existingTemplate.skill
      ) {
        const { data: duplicateTemplate } = await supabase
          .from('exam_templates')
          .select('id')
          .eq('language', newLanguage)
          .eq('level', newLevel)
          .eq('provider', newProvider)
          .eq('skill', newSkill)
          .neq('id', id)
          .single();

        if (duplicateTemplate) {
          return NextResponse.json({ error: "Exam template already exists for this combination" }, { status: 409 });
        }
      }
    }

    // Prepare update data
    const updateData: any = {};

    // Only include fields that are provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.language !== undefined) updateData.language = body.language;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.provider !== undefined) updateData.provider = body.provider;
    if (body.skill !== undefined) updateData.skill = body.skill;
    if (body.difficulty_level !== undefined) updateData.difficulty_level = body.difficulty_level;
    if (body.estimated_duration !== undefined) updateData.estimated_duration = body.estimated_duration;
    if (body.official_source_path !== undefined) updateData.official_source_path = body.official_source_path;
    if (body.pdf_path !== undefined) updateData.pdf_path = body.pdf_path;
    if (body.audio_paths !== undefined) updateData.audio_paths = body.audio_paths;
    if (body.html_simulator_path !== undefined) updateData.html_simulator_path = body.html_simulator_path;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_published !== undefined) updateData.is_published = body.is_published;
    if (body.version !== undefined) updateData.version = body.version;

    // Only proceed if there's something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Update template
    const { data: template, error } = await supabase
      .from('exam_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating exam template:', error);
      return NextResponse.json({ error: "Failed to update exam template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: template,
      message: "Exam template updated successfully"
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/exams/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/exams/[id] - Delete exam template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions - only super_admin and admin can delete
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, active')
      .eq('user_id', user.id)
      .single();

    if (!adminUser || !adminUser.active || !['super_admin', 'admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    // Check if template exists and get attempt count
    const { data: template, error: fetchError } = await supabase
      .from('exam_templates')
      .select(`
        id,
        name,
        user_exam_attempts(count)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: "Exam template not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch exam template" }, { status: 500 });
    }

    // Check if there are any user attempts
    const attemptsCount = Array.isArray(template.user_exam_attempts) ? template.user_exam_attempts.length : 0;

    if (attemptsCount > 0) {
      return NextResponse.json({
        error: `Cannot delete exam template with ${attemptsCount} user attempts. Consider deactivating instead.`
      }, { status: 409 });
    }

    // Delete template (this will cascade to exam_content due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('exam_templates')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting exam template:', deleteError);
      return NextResponse.json({ error: "Failed to delete exam template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Exam template "${template.name}" deleted successfully`
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/exams/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}