import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { 
  UserListFilters, 
  CreateUserRequest, 
  UserListResponse,
  UserResponse,
  AuditLogEntry,
  UserStatus 
} from '@/lib/admin/users/types';

/**
 * GET /api/admin/users
 * 
 * List users with pagination, search, and filtering capabilities.
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 * - search: string (searches name and email)
 * - status: UserStatus
 * - role: string
 * - course_id: string (filter by enrolled course)
 * - created_after: ISO date string
 * - created_before: ISO date string
 * - sort_by: 'name' | 'email' | 'created_at' | 'last_sign_in'
 * - sort_order: 'asc' | 'desc'
 * 
 * @returns UserListResponse with paginated users and metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const filters: UserListFilters = {
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as UserStatus || undefined,
      role: searchParams.get('role') || undefined,
      courseId: searchParams.get('course_id') || undefined,
      createdAfter: searchParams.get('created_after') || undefined,
      createdBefore: searchParams.get('created_before') || undefined,
      sortBy: (searchParams.get('sort_by') as any) || 'created_at',
      sortOrder: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
    };

    const supabase = createAdminClient();
    
    // Get users from auth.users table (this is where Supabase stores actual users)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: filters.page,
      perPage: filters.limit
    });

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: authError.message },
        { status: 500 }
      );
    }

    // Get admin users to check roles
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('user_id, role, active, created_at');

    // Combine auth users with admin roles
    let users = authUsers.users.map(authUser => ({
      id: authUser.id,
      email: authUser.email || '',
      email_confirmed_at: authUser.email_confirmed_at,
      created_at: authUser.created_at,
      last_sign_in_at: authUser.last_sign_in_at,
      user_metadata: authUser.user_metadata || {},
      // Check if user is admin
      admin_info: adminUsers?.find(admin => admin.user_id === authUser.id),
    }));

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        (user.user_metadata.full_name && user.user_metadata.full_name.toLowerCase().includes(searchLower))
      );
    }

    if (filters.status) {
      users = users.filter(user => {
        if (filters.status === 'active') return user.email_confirmed_at;
        if (filters.status === 'inactive') return !user.email_confirmed_at;
        return true;
      });
    }

    if (filters.role) {
      users = users.filter(user => {
        if (filters.role === 'admin') return user.admin_info;
        if (filters.role === 'student') return !user.admin_info;
        return true;
      });
    }

    // Apply date filters
    if (filters.createdAfter) {
      users = users.filter(user => new Date(user.created_at) >= new Date(filters.createdAfter));
    }

    if (filters.createdBefore) {
      users = users.filter(user => new Date(user.created_at) <= new Date(filters.createdBefore));
    }

    // Apply sorting
    users.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'last_sign_in_at':
        case 'last_sign_in':
          aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at) : new Date(0);
          bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at) : new Date(0);
          break;
        default:
          aValue = a.email;
          bValue = b.email;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    const count = users.length;

    // Calculate stats
    const stats = {
      total: count,
      active: users.filter(user => user.email_confirmed_at).length,
      pending: users.filter(user => !user.email_confirmed_at).length,
      admins: users.filter(user => user.admin_info).length,
    };

    const totalPages = Math.ceil(count / filters.limit);

    // Format response to match our interface
    const response = {
      users: users,
      stats,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1
      },
      filters
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * 
 * Create a new user with email verification.
 * 
 * @param request - Contains CreateUserRequest in body
 * @returns UserResponse with created user data
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Create user in Supabase Auth (this is the main user creation)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: body.sendVerificationEmail !== false,
      user_metadata: {
        full_name: body.fullName || null
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create user', details: authError.message },
        { status: 400 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // If user should be admin, add them to admin_users table
    let adminUser = null;
    if (body.role && ['admin', 'super_admin'].includes(body.role)) {
      const { data: newAdminUser, error: adminError } = await supabase
        .from('admin_users')
        .insert({
          user_id: authUser.user.id,
          role: body.role,
          active: true,
        })
        .select()
        .single();

      if (adminError) {
        console.error('Error creating admin user:', adminError);
        // Clean up auth user if admin creation failed
        await supabase.auth.admin.deleteUser(authUser.user.id);
        
        return NextResponse.json(
          { error: 'Failed to create admin user', details: adminError.message },
          { status: 500 }
        );
      }
      
      adminUser = newAdminUser;
    }

    // Log audit entry
    await supabase
      .from('audit_logs')
      .insert({
        action: 'user_created',
        resource_type: 'user',
        resource_id: authUser.user.id,
        new_data: {
          email: body.email,
          role: body.role || 'student',
          is_admin: !!adminUser
        }
      });

    const response = {
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        email_confirmed_at: authUser.user.email_confirmed_at,
        created_at: authUser.user.created_at,
        last_sign_in_at: authUser.user.last_sign_in_at,
        user_metadata: authUser.user.user_metadata,
        admin_info: adminUser
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}