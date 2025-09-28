import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { 
  BulkUserRequest,
  BulkUserResponse,
  AuditLogEntry,
  UserStatus,
  EnrollmentStatus 
} from '@/lib/admin/users/types';

/**
 * POST /api/admin/users/bulk
 * 
 * Perform bulk operations on multiple users.
 * Supports: bulk delete, status updates, course assignments, and role changes.
 * 
 * @param request - Contains BulkUserRequest in body
 * @returns BulkUserResponse with operation results
 */
export async function POST(request: NextRequest) {
  try {
    const body: BulkUserRequest = await request.json();

    // Validate request
    if (!body.operation) {
      return NextResponse.json(
        { error: 'Operation type is required' },
        { status: 400 }
      );
    }

    if (!body.userIds || !Array.isArray(body.userIds) || body.userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Limit bulk operations to prevent abuse
    if (body.userIds.length > 100) {
      return NextResponse.json(
        { error: 'Bulk operations are limited to 100 users at a time' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify all users exist first
    const { data: existingUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, status')
      .in('id', body.userIds);

    if (usersError) {
      console.error('Error fetching users for bulk operation:', usersError);
      return NextResponse.json(
        { error: 'Failed to verify users', details: usersError.message },
        { status: 500 }
      );
    }

    const foundUserIds = existingUsers?.map(u => u.id) || [];
    const missingUserIds = body.userIds.filter(id => !foundUserIds.includes(id));

    if (missingUserIds.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some users not found',
          missingUserIds,
          foundUsers: foundUserIds.length
        },
        { status: 404 }
      );
    }

    const results: BulkUserResponse = {
      operation: body.operation,
      totalRequested: body.userIds.length,
      successful: [],
      failed: [],
      summary: {
        successCount: 0,
        failureCount: 0,
        skippedCount: 0
      }
    };

    // Execute bulk operation based on type
    switch (body.operation) {
      case 'delete':
        await handleBulkDelete(supabase, existingUsers!, body.hardDelete || false, results);
        break;

      case 'update_status':
        if (!body.status) {
          return NextResponse.json(
            { error: 'Status is required for update_status operation' },
            { status: 400 }
          );
        }
        await handleBulkUpdateStatus(supabase, existingUsers!, body.status, results);
        break;

      case 'assign_course':
        if (!body.courseId) {
          return NextResponse.json(
            { error: 'Course ID is required for assign_course operation' },
            { status: 400 }
          );
        }
        await handleBulkAssignCourse(supabase, existingUsers!, body.courseId, body.enrollmentStatus, results);
        break;

      case 'remove_course':
        if (!body.courseId) {
          return NextResponse.json(
            { error: 'Course ID is required for remove_course operation' },
            { status: 400 }
          );
        }
        await handleBulkRemoveCourse(supabase, existingUsers!, body.courseId, results);
        break;

      case 'update_role':
        if (!body.role) {
          return NextResponse.json(
            { error: 'Role is required for update_role operation' },
            { status: 400 }
          );
        }
        await handleBulkUpdateRole(supabase, existingUsers!, body.role, results);
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported bulk operation: ${body.operation}` },
          { status: 400 }
        );
    }

    // Log bulk operation audit entry
    const auditEntry: AuditLogEntry = {
      userId: 'bulk_operation',
      action: `bulk_${body.operation}`,
      details: {
        operation: body.operation,
        total_requested: body.userIds.length,
        successful_count: results.successful.length,
        failed_count: results.failed.length,
        user_ids: body.userIds,
        ...body.status && { status: body.status },
        ...body.courseId && { course_id: body.courseId },
        ...body.role && { role: body.role },
        performed_by: 'admin' // In a real app, get this from session
      },
      timestamp: new Date().toISOString()
    };

    await supabase
      .from('audit_logs')
      .insert({
        user_id: null, // Bulk operation
        action: auditEntry.action,
        details: auditEntry.details,
        created_at: auditEntry.timestamp
      });

    return NextResponse.json(results, { 
      status: results.failed.length > 0 ? 207 : 200 // Multi-status if partial failure
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/users/bulk:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle bulk delete operation
 */
async function handleBulkDelete(
  supabase: any,
  users: any[],
  hardDelete: boolean,
  results: BulkUserResponse
) {
  for (const user of users) {
    try {
      if (hardDelete) {
        // Hard delete: Remove from auth and database
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (authError) {
          results.failed.push({
            userId: user.id,
            error: `Failed to delete from auth: ${authError.message}`
          });
          continue;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (profileError) {
          results.failed.push({
            userId: user.id,
            error: `Failed to delete profile: ${profileError.message}`
          });
          continue;
        }

        results.successful.push({
          userId: user.id,
          message: 'User permanently deleted'
        });

      } else {
        // Soft delete: Mark as deleted
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            status: 'deleted' as UserStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          results.failed.push({
            userId: user.id,
            error: `Failed to soft delete: ${updateError.message}`
          });
          continue;
        }

        // Disable auth user
        await supabase.auth.admin.updateUserById(
          user.id,
          { 
            ban_duration: '876600h', // 100 years ban
            user_metadata: { deleted: true }
          }
        );

        results.successful.push({
          userId: user.id,
          message: 'User soft deleted'
        });
      }

    } catch (error) {
      results.failed.push({
        userId: user.id,
        error: `Unexpected error: ${error.message}`
      });
    }
  }

  results.summary.successCount = results.successful.length;
  results.summary.failureCount = results.failed.length;
}

/**
 * Handle bulk status update operation
 */
async function handleBulkUpdateStatus(
  supabase: any,
  users: any[],
  status: UserStatus,
  results: BulkUserResponse
) {
  for (const user of users) {
    try {
      // Skip if user already has this status
      if (user.status === status) {
        results.summary.skippedCount++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        results.failed.push({
          userId: user.id,
          error: `Failed to update status: ${updateError.message}`
        });
        continue;
      }

      // Update auth user if suspending/activating
      if (status === 'suspended') {
        await supabase.auth.admin.updateUserById(
          user.id,
          { ban_duration: '876600h' } // 100 years ban
        );
      } else if (status === 'active' && user.status === 'suspended') {
        await supabase.auth.admin.updateUserById(
          user.id,
          { ban_duration: 'none' }
        );
      }

      results.successful.push({
        userId: user.id,
        message: `Status updated to ${status}`,
        previousValue: user.status
      });

    } catch (error) {
      results.failed.push({
        userId: user.id,
        error: `Unexpected error: ${error.message}`
      });
    }
  }

  results.summary.successCount = results.successful.length;
  results.summary.failureCount = results.failed.length;
}

/**
 * Handle bulk course assignment operation
 */
async function handleBulkAssignCourse(
  supabase: any,
  users: any[],
  courseId: string,
  enrollmentStatus: EnrollmentStatus = 'active',
  results: BulkUserResponse
) {
  // First verify course exists and is active
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, is_active')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    results.failed = users.map(user => ({
      userId: user.id,
      error: 'Course not found or inactive'
    }));
    results.summary.failureCount = users.length;
    return;
  }

  if (!course.is_active) {
    results.failed = users.map(user => ({
      userId: user.id,
      error: 'Cannot assign inactive course'
    }));
    results.summary.failureCount = users.length;
    return;
  }

  for (const user of users) {
    try {
      // Skip deleted or suspended users
      if (user.status === 'deleted' || user.status === 'suspended') {
        results.failed.push({
          userId: user.id,
          error: `Cannot assign course to ${user.status} user`
        });
        continue;
      }

      // Check if user is already enrolled
      const { data: existingEnrollment } = await supabase
        .from('user_enrollments')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (existingEnrollment) {
        results.summary.skippedCount++;
        continue;
      }

      // Create enrollment
      const { error: enrollError } = await supabase
        .from('user_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: enrollmentStatus,
          enrolled_at: new Date().toISOString(),
          progress: 0,
          certificates_earned: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (enrollError) {
        results.failed.push({
          userId: user.id,
          error: `Failed to create enrollment: ${enrollError.message}`
        });
        continue;
      }

      results.successful.push({
        userId: user.id,
        message: `Assigned to course: ${course.title}`
      });

    } catch (error) {
      results.failed.push({
        userId: user.id,
        error: `Unexpected error: ${error.message}`
      });
    }
  }

  results.summary.successCount = results.successful.length;
  results.summary.failureCount = results.failed.length;
}

/**
 * Handle bulk course removal operation
 */
async function handleBulkRemoveCourse(
  supabase: any,
  users: any[],
  courseId: string,
  results: BulkUserResponse
) {
  for (const user of users) {
    try {
      // Check if enrollment exists
      const { data: enrollment, error: checkError } = await supabase
        .from('user_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          results.summary.skippedCount++;
          continue; // User not enrolled in this course
        }
        
        results.failed.push({
          userId: user.id,
          error: `Failed to check enrollment: ${checkError.message}`
        });
        continue;
      }

      // Delete enrollment
      const { error: deleteError } = await supabase
        .from('user_enrollments')
        .delete()
        .eq('id', enrollment.id);

      if (deleteError) {
        results.failed.push({
          userId: user.id,
          error: `Failed to remove enrollment: ${deleteError.message}`
        });
        continue;
      }

      results.successful.push({
        userId: user.id,
        message: 'Course removed successfully'
      });

    } catch (error) {
      results.failed.push({
        userId: user.id,
        error: `Unexpected error: ${error.message}`
      });
    }
  }

  results.summary.successCount = results.successful.length;
  results.summary.failureCount = results.failed.length;
}

/**
 * Handle bulk role update operation
 */
async function handleBulkUpdateRole(
  supabase: any,
  users: any[],
  role: string,
  results: BulkUserResponse
) {
  for (const user of users) {
    try {
      // Skip if user already has this role
      if (user.role === role) {
        results.summary.skippedCount++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        results.failed.push({
          userId: user.id,
          error: `Failed to update role: ${updateError.message}`
        });
        continue;
      }

      // Update auth user metadata
      await supabase.auth.admin.updateUserById(
        user.id,
        { user_metadata: { role } }
      );

      results.successful.push({
        userId: user.id,
        message: `Role updated to ${role}`,
        previousValue: user.role
      });

    } catch (error) {
      results.failed.push({
        userId: user.id,
        error: `Unexpected error: ${error.message}`
      });
    }
  }

  results.summary.successCount = results.successful.length;
  results.summary.failureCount = results.failed.length;
}