#!/bin/bash

# Neolingus Academy Setup Script
# This script helps with the initial setup of the Neolingus Academy platform

echo "🚀 Neolingus Academy Setup Script"
echo "================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
    echo "⚠️  IMPORTANT: Edit .env.local and add your actual credentials!"
    echo ""
else
    echo "✅ .env.local already exists"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
else
    echo "✅ Node.js is installed ($(node --version))"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ npm is not installed. Please install npm"
    exit 1
else
    echo "✅ npm is installed ($(npm --version))"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.local and add your actual credentials:"
echo "   - Supabase project URL and keys"
echo "   - OpenAI API key (at minimum)"
echo "   - Other AI provider keys as needed"
echo ""
echo "2. Set up your Supabase database:"
echo "   - Go to your Supabase dashboard"
echo "   - Navigate to SQL Editor"
echo "   - Run the contents of supabase/migrations/20250910000000_create_academy_system.sql"
echo ""
echo "3. Install dependencies:"
echo "   npm install"
echo ""
echo "4. Create admin user:"
echo "   npm run setup"
echo ""
echo "5. Start the development server:"
echo "   npm run dev"
echo ""
echo "📖 For detailed instructions, see README.md and SETUP_STATUS.md"