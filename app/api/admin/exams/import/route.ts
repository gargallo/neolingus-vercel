import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "@/utils/supabase/server";
import { ExamLoaderService } from "@/lib/services/exam-loader.service";

// POST /api/admin/exams/import - Import exams from real-exams directory
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions - only super_admin and admin can import
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, active')
      .eq('user_id', user.id)
      .single();

    if (!adminUser || !adminUser.active || !['super_admin', 'admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type = 'full_import', source_path } = body;

    // Validate import type
    if (!['full_import', 'incremental', 'single_exam'].includes(type)) {
      return NextResponse.json({ error: "Invalid import type" }, { status: 400 });
    }

    // For single exam import, source_path is required
    if (type === 'single_exam' && !source_path) {
      return NextResponse.json({ error: "source_path is required for single exam import" }, { status: 400 });
    }

    // Create import log entry
    const { data: importLog, error: logError } = await supabase
      .from('exam_import_logs')
      .insert({
        import_type: type,
        source_path: source_path || 'real-exams/',
        status: 'processing',
        initiated_by: user.id
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating import log:', logError);
      return NextResponse.json({ error: "Failed to create import log" }, { status: 500 });
    }

    try {
      const examLoader = new ExamLoaderService();
      let result;

      if (type === 'single_exam') {
        // Import single exam
        const loadResult = await examLoader.loadExam(source_path);

        if (loadResult.success && loadResult.template && loadResult.content) {
          // Insert template
          const { data: template, error: templateError } = await supabase
            .from('exam_templates')
            .insert(loadResult.template)
            .select()
            .single();

          if (templateError) {
            throw new Error(`Failed to insert template: ${templateError.message}`);
          }

          // Insert content
          const contentToInsert = loadResult.content.map(content => ({
            ...content,
            template_id: template.id
          }));

          const { error: contentError } = await supabase
            .from('exam_content')
            .insert(contentToInsert);

          if (contentError) {
            throw new Error(`Failed to insert content: ${contentError.message}`);
          }

          result = {
            success: true,
            summary: {
              total_files_processed: 1,
              successful_imports: 1,
              failed_imports: 0,
              skipped_imports: 0,
              processing_time: 0,
              file_types: { 'exam': 1 }
            },
            errors: loadResult.errors,
            templatesCreated: [template],
            contentCreated: contentToInsert
          };
        } else {
          result = {
            success: false,
            summary: {
              total_files_processed: 1,
              successful_imports: 0,
              failed_imports: 1,
              skipped_imports: 0,
              processing_time: 0,
              file_types: { 'exam': 1 }
            },
            errors: loadResult.errors,
            templatesCreated: [],
            contentCreated: []
          };
        }
      } else {
        // Import all exams
        result = await examLoader.importAllExams();

        // Insert successful templates and content
        for (const template of result.templatesCreated) {
          try {
            // Check if template already exists
            const { data: existingTemplate } = await supabase
              .from('exam_templates')
              .select('id')
              .eq('language', template.language)
              .eq('level', template.level)
              .eq('provider', template.provider)
              .eq('skill', template.skill)
              .single();

            if (existingTemplate) {
              console.log(`Template already exists: ${template.name}`);
              continue;
            }

            // Insert template
            const { data: insertedTemplate, error: templateError } = await supabase
              .from('exam_templates')
              .insert(template)
              .select()
              .single();

            if (templateError) {
              console.error(`Failed to insert template ${template.name}:`, templateError);
              continue;
            }

            // Insert content for this template
            const templateContent = result.contentCreated.filter(
              content => content.template_id === template.id
            );

            if (templateContent.length > 0) {
              const contentToInsert = templateContent.map(content => ({
                ...content,
                template_id: insertedTemplate.id
              }));

              const { error: contentError } = await supabase
                .from('exam_content')
                .insert(contentToInsert);

              if (contentError) {
                console.error(`Failed to insert content for template ${template.name}:`, contentError);
              }
            }
          } catch (error) {
            console.error(`Error processing template ${template.name}:`, error);
          }
        }
      }

      // Update import log with results
      const { error: updateLogError } = await supabase
        .from('exam_import_logs')
        .update({
          status: result.success ? 'completed' : 'partial',
          templates_imported: result.summary.successful_imports,
          content_imported: result.contentCreated.length,
          errors_count: result.errors.length,
          import_summary: result.summary,
          error_details: result.errors,
          completed_at: new Date().toISOString()
        })
        .eq('id', importLog.id);

      if (updateLogError) {
        console.error('Error updating import log:', updateLogError);
      }

      return NextResponse.json({
        success: result.success,
        data: {
          import_id: importLog.id,
          summary: result.summary,
          templates_created: result.templatesCreated.length,
          content_created: result.contentCreated.length,
          errors: result.errors
        },
        message: result.success
          ? `Import completed successfully. ${result.summary.successful_imports} exam(s) imported.`
          : `Import completed with errors. ${result.summary.successful_imports} exam(s) imported, ${result.summary.failed_imports} failed.`
      });

    } catch (error) {
      console.error('Import error:', error);

      // Update import log with error
      await supabase
        .from('exam_import_logs')
        .update({
          status: 'failed',
          errors_count: 1,
          error_details: [{
            file_path: source_path || 'unknown',
            error_type: 'import_error',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          }],
          completed_at: new Date().toISOString()
        })
        .eq('id', importLog.id);

      return NextResponse.json({
        success: false,
        error: "Import failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in POST /api/admin/exams/import:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/admin/exams/import - Get available exams for import
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

    if (!adminUser || !adminUser.active || !['super_admin', 'admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const examLoader = new ExamLoaderService();
    const availableExams = await examLoader.getAvailableExams();

    // Get existing templates to show which ones are already imported
    const { data: existingTemplates } = await supabase
      .from('exam_templates')
      .select('language, level, provider, skill');

    const existingKeys = new Set(
      existingTemplates?.map(t => `${t.language}_${t.level}_${t.provider}_${t.skill}`) || []
    );

    const examsList = availableExams.map(examPath => {
      const [languageCode, levelCode] = examPath.split('/');

      // Simple mapping for display
      const language = languageCode.includes('INGLES') ? 'english' : 'valenciano';
      const level = levelCode;

      const key = `${language}_${level}_cambridge_integrated`; // Default values for check

      return {
        path: examPath,
        language,
        level,
        provider: 'cambridge', // Default
        skill: 'integrated', // Default
        isImported: existingKeys.has(key),
        displayName: `${language.charAt(0).toUpperCase() + language.slice(1)} ${level}`
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        available_exams: examsList,
        total_available: examsList.length,
        already_imported: examsList.filter(e => e.isImported).length,
        can_import: examsList.filter(e => !e.isImported).length
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/exams/import:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}