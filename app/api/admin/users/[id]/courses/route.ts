import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { 
  UserCoursesResponse,
  AssignCourseRequest,
  AuditLogEntry,
  EnrollmentStatus 
} from '@/lib/admin/users/types';

/**
 * GET /api/admin/users/[id]/courses
 * 
 * Get all courses for a specific user with enrollment details.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing user ID
 * @returns UserCoursesResponse with user's course enrollments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as EnrollmentStatus || undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // First verify user exists
    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      console.error('Error verifying user:', userError);
      return NextResponse.json(
        { error: 'Failed to verify user', details: userError.message },
        { status: 500 }
      );
    }

    // Build query for user enrollments
    let query = supabase
      .from('user_enrollments')
      .select(`
        id,
        course_id,
        status,
        enrolled_at,
        completed_at,
        progress,
        certificates_earned,
        created_at,
        updated_at,
        courses(
          id,
          title,
          description,
          level,
          category,
          price,
          duration_hours,
          thumbnail_url,
          instructor_name,
          is_active
        )
      `)
      .eq('user_id', userId);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Order by enrollment date (newest first)
    query = query.order('enrolled_at', { ascending: false });

    const { data: enrollments, error } = await query;

    if (error) {
      console.error('Error fetching user courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user courses', details: error.message },
        { status: 500 }
      );
    }

    const response: UserCoursesResponse = {
      userId,
      user: userExists,
      enrollments: enrollments || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users/[id]/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/[id]/courses
 * 
 * Assign a course to a user (create enrollment).
 * 
 * @param request - Contains AssignCourseRequest in body
 * @param params - Route parameters containing user ID
 * @returns Created enrollment data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body: AssignCourseRequest = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name, status')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      console.error('Error verifying user:', userError);
      return NextResponse.json(
        { error: 'Failed to verify user', details: userError.message },
        { status: 500 }
      );
    }

    // Check if user is active
    if (user.status === 'deleted' || user.status === 'suspended') {
      return NextResponse.json(
        { error: `Cannot assign course to ${user.status} user` },
        { status: 400 }
      );
    }

    // Verify course exists and is active
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, is_active, price')
      .eq('id', body.courseId)
      .single();

    if (courseError) {
      if (courseError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      console.error('Error verifying course:', courseError);
      return NextResponse.json(
        { error: 'Failed to verify course', details: courseError.message },
        { status: 500 }
      );
    }

    if (!course.is_active) {
      return NextResponse.json(
        { error: 'Cannot assign inactive course' },
        { status: 400 }
      );
    }

    // Check if user is already enrolled in this course
    const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
      .from('user_enrollments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', body.courseId)
      .single();

    if (enrollmentCheckError && enrollmentCheckError.code !== 'PGRST116') {
      console.error('Error checking existing enrollment:', enrollmentCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing enrollment', details: enrollmentCheckError.message },
        { status: 500 }
      );
    }

    if (existingEnrollment) {
      return NextResponse.json(
        { 
          error: 'User is already enrolled in this course',
          existingEnrollment: {
            id: existingEnrollment.id,
            status: existingEnrollment.status
          }
        },
        { status: 409 }
      );
    }

    // Create enrollment
    const enrollmentData = {
      user_id: userId,
      course_id: body.courseId,
      status: body.status || 'active' as EnrollmentStatus,
      enrolled_at: new Date().toISOString(),
      progress: 0,
      certificates_earned: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newEnrollment, error: createError } = await supabase
      .from('user_enrollments')
      .insert(enrollmentData)
      .select(`
        id,
        course_id,
        status,
        enrolled_at,
        completed_at,
        progress,
        certificates_earned,
        created_at,
        updated_at,
        courses(
          id,
          title,
          description,
          level,
          category,
          price,
          duration_hours,
          thumbnail_url,
          instructor_name,
          is_active
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating enrollment:', createError);
      return NextResponse.json(
        { error: 'Failed to create enrollment', details: createError.message },
        { status: 500 }
      );
    }

    // Log audit entry
    const auditEntry: AuditLogEntry = {
      userId,
      action: 'course_assigned',
      details: {
        course_id: body.courseId,
        course_title: course.title,
        enrollment_status: body.status || 'active',
        assigned_by: 'admin' // In a real app, get this from session
      },
      timestamp: new Date().toISOString()
    };

    await supabase
      .from('audit_logs')
      .insert({
        user_id: auditEntry.userId,
        action: auditEntry.action,
        details: auditEntry.details,
        created_at: auditEntry.timestamp
      });

    return NextResponse.json(
      {
        message: 'Course assigned successfully',
        enrollment: newEnrollment
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/users/[id]/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/courses
 * 
 * Remove a course from a user (delete enrollment).
 * 
 * Query parameters:
 * - course_id: string (required) - The course to remove
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing user ID
 * @returns Success message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      console.error('Error verifying user:', userError);
      return NextResponse.json(
        { error: 'Failed to verify user', details: userError.message },
        { status: 500 }
      );
    }

    // Check if enrollment exists
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_enrollments')
      .select(`
        id,
        status,
        progress,
        courses(id, title)
      `)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError) {
      if (enrollmentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Enrollment not found' },
          { status: 404 }
        );
      }

      console.error('Error checking enrollment:', enrollmentError);
      return NextResponse.json(
        { error: 'Failed to check enrollment', details: enrollmentError.message },
        { status: 500 }
      );
    }

    // Delete the enrollment
    const { error: deleteError } = await supabase
      .from('user_enrollments')
      .delete()
      .eq('id', enrollment.id);

    if (deleteError) {
      console.error('Error deleting enrollment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove course enrollment', details: deleteError.message },
        { status: 500 }
      );
    }

    // Log audit entry
    const auditEntry: AuditLogEntry = {
      userId,
      action: 'course_removed',
      details: {
        course_id: courseId,
        course_title: enrollment.courses?.title,
        enrollment_id: enrollment.id,
        previous_status: enrollment.status,
        previous_progress: enrollment.progress,
        removed_by: 'admin' // In a real app, get this from session
      },
      timestamp: new Date().toISOString()
    };

    await supabase
      .from('audit_logs')
      .insert({
        user_id: auditEntry.userId,
        action: auditEntry.action,
        details: auditEntry.details,
        created_at: auditEntry.timestamp
      });

    return NextResponse.json({
      message: 'Course removed from user successfully',
      removedEnrollmentId: enrollment.id,
      courseId,
      userId
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/users/[id]/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}