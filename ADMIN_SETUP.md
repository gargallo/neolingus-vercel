# Admin Setup Guide

This guide explains how to set up the initial admin user for NeoLingus.

## Initial Admin User

The initial admin email is: **`admin@neolingus.com`**

## Setup Options

### Option 1: Automated Setup (Recommended)

1. Make sure your `.env.local` has the required Supabase variables:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the setup script:
   ```bash
   npm run setup-admin
   ```

This will:
- Create the auth user `admin@neolingus.com` if it doesn't exist
- Set up the admin user record in the `admin_users` table
- Assign the `super_admin` role

**Important:** If the script creates a new user, it will use a temporary password `TempAdminPass123!`. **Change this immediately** after first login.

### Option 2: Manual Setup

1. **Create the auth user** in your Supabase dashboard:
   - Go to Authentication > Users
   - Click "Add User"
   - Email: `admin@neolingus.com`
   - Password: Choose a secure password
   - Confirm email: Yes

2. **Run the SQL seed script** in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of supabase/seed_admin.sql
   ```

3. **Verify the setup** by checking the `admin_users` table.

## Admin Roles

The system supports four admin roles:
- `super_admin`: Full access to everything
- `admin`: Full access except admin user management
- `course_manager`: Course and exam management only
- `support`: User support and basic reporting

The initial admin user gets the `super_admin` role.

## Accessing the Admin Dashboard

1. Sign in with the admin email: `admin@neolingus.com`
2. Navigate to: `/admin`
3. You should see the admin dashboard with full access

## Security Notes

- **Change the default password immediately** if using automated setup
- Only assign admin roles to trusted users
- Regularly review admin user access
- Use strong passwords for all admin accounts
- Consider enabling 2FA for admin accounts in production

## Troubleshooting

### "User not found" error
- Make sure the auth user was created in Supabase first
- Check your Supabase environment variables

### "Access denied" to admin dashboard
- Verify the admin user record exists in `admin_users` table
- Check the user has `active = true`
- Ensure RLS policies are properly set up

### Script fails with permissions error
- Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct
- Make sure the service role has the necessary permissions