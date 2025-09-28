import { createClient } from '@supabase/supabase-js';

// Admin setup utility - run this after creating the admin user in Supabase Auth
export async function setupInitialAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  // Use service role key for admin operations
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const adminEmail = 'admin@neolingus.com';

  try {
    // Check if user exists in auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }

    const adminAuthUser = authUsers.users.find(user => user.email === adminEmail);
    
    if (!adminAuthUser) {
      // Create the auth user first
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: 'TempAdminPass123!', // Should be changed immediately
        email_confirm: true,
        user_metadata: {
          role: 'super_admin',
          name: 'System Administrator'
        }
      });

      if (createError) {
        throw new Error(`Failed to create auth user: ${createError.message}`);
      }

      console.log('✅ Admin auth user created:', adminEmail);

      // Now create the admin user record
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          user_id: newUser.user.id,
          role: 'super_admin',
          active: true
        });

      if (adminError) {
        throw new Error(`Failed to create admin user record: ${adminError.message}`);
      }

      console.log('✅ Admin user record created');
      console.log('⚠️  IMPORTANT: Change the default password immediately!');
      
      return {
        success: true,
        message: 'Admin user created successfully. Please change the default password.',
        user: newUser.user
      };
    } else {
      // User exists, ensure admin record exists
      const { data: adminUser, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', adminAuthUser.id)
        .single();

      if (adminCheckError && adminCheckError.code !== 'PGRST116') {
        throw new Error(`Failed to check admin user: ${adminCheckError.message}`);
      }

      if (!adminUser) {
        // Create admin record for existing user
        const { error: adminError } = await supabase
          .from('admin_users')
          .insert({
            user_id: adminAuthUser.id,
            role: 'super_admin',
            active: true
          });

        if (adminError) {
          throw new Error(`Failed to create admin user record: ${adminError.message}`);
        }

        console.log('✅ Admin user record created for existing auth user');
      } else {
        console.log('ℹ️  Admin user already exists:', adminEmail);
      }

      return {
        success: true,
        message: 'Admin user verified/created successfully',
        user: adminAuthUser
      };
    }
  } catch (error) {
    console.error('❌ Failed to setup admin user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to check if a user is an admin
export async function isUserAdmin(userId: string) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('admin_users')
    .select('role, active')
    .eq('user_id', userId)
    .eq('active', true)
    .single();

  if (error || !data) {
    return { isAdmin: false, role: null };
  }

  return { isAdmin: true, role: data.role };
}