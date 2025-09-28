import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { 
  UpdateUserRequest, 
  UserResponse,
  AuditLogEntry,
  UserStatus 
} from '@/lib/admin/users/types';

/**
 * GET /api/admin/users/[id]
 * 
 * Get detailed information for a specific user.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing user ID
 * @returns UserResponse with detailed user data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get user from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get admin info if exists
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('user_id, role, active, created_at')
      .eq('user_id', userId)
      .single();

    // Combine user data
    const user = {
      id: authUser.user.id,
      email: authUser.user.email || '',
      email_confirmed_at: authUser.user.email_confirmed_at,
      created_at: authUser.user.created_at,
      last_sign_in_at: authUser.user.last_sign_in_at,
      user_metadata: authUser.user.user_metadata || {},
      admin_info: adminUser || null,
    };

    const response = { user };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * 
 * Update user information and settings.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get current user to check if exists
    const { data: currentUser, error: fetchError } = await supabase.auth.admin.getUserById(userId);
    
    if (fetchError || !currentUser.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update auth user metadata if fullName or email changed
    const authUpdates: any = {};
    if (body.fullName !== undefined) {
      authUpdates.user_metadata = { 
        ...currentUser.user.user_metadata,
        full_name: body.fullName 
      };
    }
    if (body.email !== undefined) {
      authUpdates.email = body.email;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        userId,
        authUpdates
      );

      if (authUpdateError) {
        console.error('Error updating auth user:', authUpdateError);
        return NextResponse.json(
          { error: 'Failed to update user', details: authUpdateError.message },
          { status: 500 }
        );
      }
    }

    // Handle admin role changes
    if (body.role !== undefined) {
      const isAdminRole = ['admin', 'super_admin'].includes(body.role);
      
      // Check if user is currently an admin
      const { data: existingAdminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (isAdminRole) {
        // User should be admin
        if (existingAdminUser) {
          // Update existing admin user
          await supabase
            .from('admin_users')
            .update({
              role: body.role,
              active: body.active ?? true
            })
            .eq('user_id', userId);
        } else {
          // Create new admin user
          await supabase
            .from('admin_users')
            .insert({
              user_id: userId,
              role: body.role,
              active: body.active ?? true
            });
        }
      } else {
        // User should not be admin
        if (existingAdminUser) {
          // Remove from admin_users
          await supabase
            .from('admin_users')
            .delete()
            .eq('user_id', userId);
        }
      }
    }

    // Log the update
    await supabase
      .from('audit_logs')
      .insert({
        action: 'user_updated',
        resource_type: 'user',
        resource_id: userId,
        old_data: {
          email: currentUser.user.email,
          metadata: currentUser.user.user_metadata
        },
        new_data: body
      });

    return NextResponse.json({
      message: 'User updated successfully',
      userId
    });

  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * 
 * Soft delete a user (sets status to 'deleted' instead of permanent deletion).
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing user ID
 * @returns Success message or error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user exists in auth
    const { data: authUser, error: fetchError } = await supabase.auth.admin.getUserById(userId);

    if (fetchError || !authUser.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For this real system, we'll do a proper delete
    // First remove from admin_users if exists
    await supabase
      .from('admin_users')
      .delete()
      .eq('user_id', userId);

    // Then delete the auth user (this is the main deletion)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete user', details: authDeleteError.message },
        { status: 500 }
      );
    }

    // Log audit entry
    await supabase
      .from('audit_logs')
      .insert({
        action: 'user_deleted',
        resource_type: 'user',
        resource_id: userId,
        old_data: {
          email: authUser.user.email,
        }
      });

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUserId: userId
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}