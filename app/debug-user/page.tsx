import { createSupabaseClient } from "@/utils/supabase/server";

export default async function DebugUserPage() {
  const supabase = await createSupabaseClient();
  
  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('DEBUG: User auth result:', { user: user?.email, error: error?.message });
  
  // Get admin user if exists - try multiple approaches
  let adminUser = null;
  let adminError = null;
  let adminQueryAttempts = [];
  
  if (user) {
    // Attempt 1: Exact query used in admin layout
    const result1 = await supabase
      .from('admin_users')
      .select('id, role, active')
      .eq('user_id', user.id)
      .eq('active', true)
      .single();
    
    adminQueryAttempts.push({
      type: 'admin_layout_exact',
      data: result1.data,
      error: result1.error?.message,
      query: `user_id = '${user.id}' AND active = true`
    });
    
    adminUser = result1.data;
    adminError = result1.error;
    
    // Attempt 2: Without active filter
    const result2 = await supabase
      .from('admin_users')
      .select('id, role, active')
      .eq('user_id', user.id)
      .single();
    
    adminQueryAttempts.push({
      type: 'without_active_filter',
      data: result2.data,
      error: result2.error?.message,
      query: `user_id = '${user.id}'`
    });
    
    // Attempt 3: All admin users for this user
    const result3 = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id);
    
    adminQueryAttempts.push({
      type: 'all_for_user',
      data: result3.data,
      error: result3.error?.message,
      query: `user_id = '${user.id}' (all records)`
    });
    
    console.log('DEBUG: Admin query attempts:', adminQueryAttempts);
  }

  // Get all users from database (this might fail due to RLS)
  const { data: allUsers, error: usersError } = await supabase
    .from('auth.users')
    .select('id, email, created_at')
    .order('created_at', { ascending: false });

  // Get all admin users
  const { data: allAdminUsers } = await supabase
    .from('admin_users')
    .select(`
      id,
      role,
      active,
      user_id,
      auth.users (
        email
      )
    `);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug User Information</h1>
      
      <div className="space-y-6">
        {/* Current Authenticated User */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">Current Authenticated User</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> <code className="bg-white p-1 rounded">{user.id}</code></p>
              <p><strong>Email:</strong> <code className="bg-white p-1 rounded">{user.email}</code></p>
              <p><strong>Created:</strong> {new Date(user.created_at || '').toLocaleString()}</p>
              <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</p>
            </div>
          ) : (
            <p className="text-red-600">❌ No authenticated user found</p>
          )}
          {error && (
            <p className="text-red-600 mt-2">❌ Auth Error: {error.message}</p>
          )}
        </div>

        {/* Admin Status */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">Admin Status Check</h2>
          {user ? (
            <>
              {adminUser ? (
                <div className="space-y-2">
                  <p className="text-green-600">✅ User is an admin</p>
                  <p><strong>Admin ID:</strong> <code className="bg-white p-1 rounded">{adminUser.id}</code></p>
                  <p><strong>Role:</strong> <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">{adminUser.role}</span></p>
                  <p><strong>Active:</strong> <span className={adminUser.active ? 'text-green-600' : 'text-red-600'}>{adminUser.active ? '✅ Yes' : '❌ No'}</span></p>
                </div>
              ) : (
                <div>
                  <p className="text-orange-600">⚠️ User is NOT an admin</p>
                  {adminError && (
                    <p className="text-red-600 mt-1">Error: {adminError.message}</p>
                  )}
                </div>
              )}
              
              {/* Admin Query Debug */}
              <div className="mt-4 p-3 bg-white rounded border">
                <h3 className="font-semibold text-sm mb-2">🔍 Admin Query Debug</h3>
                <div className="space-y-2 text-sm">
                  {adminQueryAttempts.map((attempt: any, index: number) => (
                    <div key={index} className="border-l-2 border-l-gray-300 pl-2">
                      <p><strong>{attempt.type}:</strong></p>
                      <p><code className="text-xs bg-gray-100 px-1 rounded">{attempt.query}</code></p>
                      {attempt.data ? (
                        <p className="text-green-600">✅ Found: {JSON.stringify(attempt.data)}</p>
                      ) : (
                        <p className="text-red-600">❌ {attempt.error || 'No data found'}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-600">No user to check admin status</p>
          )}
        </div>

        {/* All Users in Database */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">All Users in Database ({allUsers?.length || 0})</h2>
          {usersError ? (
            <p className="text-red-600">❌ Cannot access auth.users table: {usersError.message}</p>
          ) : allUsers && allUsers.length > 0 ? (
            <div className="space-y-2">
              {allUsers.map((dbUser: any) => (
                <div key={dbUser.id} className="bg-white p-2 rounded border-l-4 border-l-gray-300">
                  <p><strong>Email:</strong> {dbUser.email}</p>
                  <p><strong>ID:</strong> <code className="text-xs">{dbUser.id}</code></p>
                  <p><strong>Created:</strong> {new Date(dbUser.created_at).toLocaleString()}</p>
                  {user && user.id === dbUser.id && (
                    <span className="text-green-600 font-semibold">👤 THIS IS YOU</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-orange-600">⚠️ No users found or access denied</p>
          )}
        </div>

        {/* All Admin Users */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">All Admin Users ({allAdminUsers?.length || 0})</h2>
          {allAdminUsers && allAdminUsers.length > 0 ? (
            <div className="space-y-2">
              {allAdminUsers.map((adminUserItem: any) => (
                <div key={adminUserItem.id} className="bg-white p-2 rounded border-l-4 border-l-purple-300">
                  <p><strong>Email:</strong> {adminUserItem.auth?.users?.email || 'Unknown'}</p>
                  <p><strong>Role:</strong> <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">{adminUserItem.role}</span></p>
                  <p><strong>Active:</strong> {adminUserItem.active ? '✅' : '❌'}</p>
                  <p><strong>User ID:</strong> <code className="text-xs">{adminUserItem.user_id}</code></p>
                  {user && user.id === adminUserItem.user_id && (
                    <span className="text-green-600 font-semibold">👤 THIS IS YOU</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">❌ No admin users found in database</p>
          )}
        </div>

        {/* Environment Check */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">Environment Configuration</h2>
          <div className="space-y-2 font-mono text-sm">
            <p><strong>Supabase URL:</strong> <code className="bg-white p-1 rounded">{process.env.NEXT_PUBLIC_SUPABASE_URL}</code></p>
            <p><strong>Anon Key:</strong> <code className="bg-white p-1 rounded">{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</code></p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="font-semibold text-lg mb-2">Quick Actions</h2>
          <div className="space-y-2">
            {user ? (
              <p className="text-green-600">✅ You are logged in. Try accessing <a href="/admin" className="text-blue-600 underline">/admin</a></p>
            ) : (
              <p className="text-orange-600">⚠️ You need to <a href="/sign-in" className="text-blue-600 underline">sign in</a> first</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}