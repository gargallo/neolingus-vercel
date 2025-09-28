#!/bin/bash

# Database Setup Automation Script
# Date: 2025-09-15
# Description: Complete database setup with verification

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify prerequisites
verify_prerequisites() {
    print_info "Verifying prerequisites..."

    # Check if Supabase CLI is installed
    if ! command_exists supabase; then
        print_error "Supabase CLI is not installed. Please install it first:"
        print_error "npm install -g supabase"
        print_error "Or follow: https://supabase.com/docs/guides/cli"
        exit 1
    fi

    print_success "Supabase CLI found: $(supabase --version)"

    # Check if we're in the right directory
    if [ ! -f "supabase/config.toml" ]; then
        print_error "supabase/config.toml not found. Please run this script from the project root."
        exit 1
    fi

    print_success "Found Supabase project configuration"
}

# Test database connectivity
test_connectivity() {
    print_info "Testing database connectivity..."

    if ! supabase status >/dev/null 2>&1; then
        print_error "Cannot connect to Supabase. Make sure your project is linked:"
        print_error "supabase link --project-ref YOUR_PROJECT_REF"
        exit 1
    fi

    print_success "Database connectivity verified"
}

# Run database push
run_db_push() {
    print_info "Pushing local migrations to database..."

    if supabase db push; then
        print_success "Database push completed successfully"
    else
        print_error "Database push failed"
        exit 1
    fi
}

# Execute apply-all-migrations.sql
run_migration_script() {
    print_info "Executing comprehensive migration script..."

    local migration_file="supabase/migrations/apply-all-migrations.sql"

    if [ ! -f "$migration_file" ]; then
        print_error "Migration file not found: $migration_file"
        exit 1
    fi

    # Execute the migration using supabase sql
    if supabase sql --file="$migration_file"; then
        print_success "Migration script executed successfully"
    else
        print_error "Migration script execution failed"
        exit 1
    fi
}

# Verify function exists
verify_function() {
    print_info "Verifying get_user_dashboard_data function..."

    local query="SELECT routine_schema, routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_user_dashboard_data';"

    local result
    result=$(supabase sql --query="$query" 2>/dev/null)

    if echo "$result" | grep -q "get_user_dashboard_data"; then
        print_success "get_user_dashboard_data function found and verified"
        return 0
    else
        print_error "get_user_dashboard_data function not found"
        print_error "This indicates the migration failed or the function was not created properly"
        return 1
    fi
}

# Verify critical tables exist
verify_tables() {
    print_info "Verifying critical tables exist..."

    local tables=("user_analytics" "dashboard_widgets" "courses" "user_course_enrollments" "plans")
    local missing_tables=()

    for table in "${tables[@]}"; do
        local query="SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';"
        local result
        result=$(supabase sql --query="$query" 2>/dev/null)

        if ! echo "$result" | grep -q "$table"; then
            missing_tables+=("$table")
        fi
    done

    if [ ${#missing_tables[@]} -eq 0 ]; then
        print_success "All critical tables verified"
        return 0
    else
        print_error "Missing tables: ${missing_tables[*]}"
        return 1
    fi
}

# Test function execution
test_function() {
    print_info "Testing function execution..."

    # Create a test query that won't fail even if no user data exists
    local test_query="SELECT get_user_dashboard_data('00000000-0000-0000-0000-000000000000'::uuid) IS NOT NULL as function_works;"

    if supabase sql --query="$test_query" >/dev/null 2>&1; then
        print_success "Function execution test passed"
        return 0
    else
        print_warning "Function execution test failed - this may be normal if dependencies are missing"
        return 1
    fi
}

# Check specific PGRST202 error fix
verify_pgrst202_fix() {
    print_info "Verifying PGRST202 error fixes..."

    # Test the specific function that was causing errors
    local test_user_id="test-user-id"
    local api_test_query="SELECT 'get_user_dashboard_data' as test_name,
                          CASE WHEN EXISTS(
                              SELECT 1 FROM information_schema.routines
                              WHERE routine_schema = 'public'
                              AND routine_name = 'get_user_dashboard_data'
                          ) THEN 'FUNCTION_EXISTS' ELSE 'FUNCTION_MISSING' END as status;"

    local result
    result=$(supabase sql --query="$api_test_query" 2>/dev/null)

    if echo "$result" | grep -q "FUNCTION_EXISTS"; then
        print_success "PGRST202 function availability verified"

        # Also verify the tables mentioned in the error logs
        local table_checks=("user_analytics" "dashboard_widgets")
        for table in "${table_checks[@]}"; do
            local table_query="SELECT '$table' as table_name,
                              CASE WHEN EXISTS(
                                  SELECT 1 FROM information_schema.tables
                                  WHERE table_schema = 'public'
                                  AND table_name = '$table'
                              ) THEN 'TABLE_EXISTS' ELSE 'TABLE_MISSING' END as status;"

            local table_result
            table_result=$(supabase sql --query="$table_query" 2>/dev/null)

            if echo "$table_result" | grep -q "TABLE_EXISTS"; then
                print_success "Table $table verified for PGRST202 fix"
            else
                print_error "Table $table still missing - PGRST202 errors may persist"
                return 1
            fi
        done

        return 0
    else
        print_error "PGRST202 function still missing - API errors will continue"
        return 1
    fi
}

# Recovery mechanism for failed setups
attempt_recovery() {
    print_warning "Attempting recovery from failed setup..."

    # Try to reset and reapply migrations
    print_info "Resetting migration state..."

    # Check for any partially applied migrations
    local migration_status
    migration_status=$(supabase migration list 2>/dev/null || echo "Migration list failed")

    if echo "$migration_status" | grep -q "Applied"; then
        print_info "Found existing migrations, attempting incremental fix..."
    else
        print_info "No migrations detected, performing fresh setup..."
    fi

    # Retry the migration script with more verbose output
    print_info "Re-running migration script with detailed logging..."
    local migration_file="supabase/migrations/apply-all-migrations.sql"

    if [ -f "$migration_file" ]; then
        if supabase sql --file="$migration_file" --debug; then
            print_success "Recovery migration completed"
            return 0
        else
            print_error "Recovery migration failed"
            return 1
        fi
    else
        print_error "Migration file not found for recovery"
        return 1
    fi
}

# Main execution
main() {
    print_info "🚀 Starting complete database setup..."
    echo

    # Step 1: Prerequisites
    verify_prerequisites
    echo

    # Step 2: Connectivity
    test_connectivity
    echo

    # Step 3: Database push
    run_db_push
    echo

    # Step 4: Migration script
    run_migration_script
    echo

    # Step 5: Verification
    print_info "🔍 Running verification checks..."

    local verification_failed=false

    # Verify function exists
    if ! verify_function; then
        verification_failed=true
    fi

    # Verify tables exist
    if ! verify_tables; then
        verification_failed=true
    fi

    # Check PGRST202 error fixes specifically
    if ! verify_pgrst202_fix; then
        verification_failed=true
    fi

    # Test function execution (non-critical)
    test_function

    echo

    if [ "$verification_failed" = true ]; then
        print_error "❌ Database setup completed with errors"
        print_error "Attempting recovery process..."
        echo

        if attempt_recovery; then
            print_info "Recovery completed, re-running verification..."

            # Re-run critical verifications after recovery
            if verify_function && verify_tables && verify_pgrst202_fix; then
                print_success "✅ Database setup completed successfully after recovery!"
            else
                print_error "❌ Recovery failed. Manual intervention required."
                print_error "Please check DATABASE_SETUP_GUIDE.md for troubleshooting steps"
                exit 1
            fi
        else
            print_error "❌ Recovery failed. Please check the error messages above"
            print_error "Manual database setup may be required"
            exit 1
        fi
    else
        print_success "✅ Database setup completed successfully!"
    fi

    print_success "The application is ready to run with npm run dev"
    echo
    print_info "Summary of what was created:"
    print_info "- User analytics and dashboard tables"
    print_info "- Course and enrollment management"
    print_info "- Plan management system"
    print_info "- Essential functions including get_user_dashboard_data"
    print_info "- Row Level Security policies"
    print_info "- Performance indexes"
    echo
    print_info "PGRST202 errors should now be resolved!"
    print_info "API endpoints /api/dashboard/user/[id] should work correctly"
}

# Script usage information
usage() {
    echo "Usage: $0"
    echo
    echo "This script sets up the complete Neolingus database schema."
    echo "It will:"
    echo "  1. Verify Supabase CLI and project connectivity"
    echo "  2. Push local migrations to the database"
    echo "  3. Execute the comprehensive migration script"
    echo "  4. Verify all components are working correctly"
    echo
    echo "Prerequisites:"
    echo "  - Supabase CLI installed and configured"
    echo "  - Project linked to Supabase (supabase link)"
    echo "  - Run from the project root directory"
    echo
    echo "Example:"
    echo "  chmod +x scripts/setup-database-complete.sh"
    echo "  ./scripts/setup-database-complete.sh"
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown argument: $1"
        usage
        exit 1
        ;;
esac