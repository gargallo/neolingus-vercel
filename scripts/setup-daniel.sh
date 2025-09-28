#!/bin/bash

# Setup Daniel User Script
# This script sets up daniel@visionari.es with full access to all courses

set -e  # Exit on any error

echo "🚀 Setting up daniel@visionari.es user account..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with the required Supabase environment variables."
    echo "   Required variables:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Method 1: Try using the API endpoint via curl (if server is running)
echo "🔧 Attempting to setup via API endpoint..."
SETUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/setup/daniel \
    -H "Content-Type: application/json" \
    -w "%{http_code}" \
    -o /tmp/setup_response.json || echo "connection_failed")

if [ "$SETUP_RESPONSE" = "200" ]; then
    echo "✅ Setup completed successfully via API!"
    echo ""
    echo "📄 Response:"
    cat /tmp/setup_response.json | jq '.' 2>/dev/null || cat /tmp/setup_response.json
    echo ""
    rm -f /tmp/setup_response.json
elif [ "$SETUP_RESPONSE" != "connection_failed" ]; then
    echo "⚠️  API setup failed with status: $SETUP_RESPONSE"
    echo "📄 Error response:"
    cat /tmp/setup_response.json
    echo ""
    rm -f /tmp/setup_response.json
    echo "🔄 Falling back to direct script execution..."
else
    echo "🔄 Server not running, using direct script execution..."
fi

# Method 2: Run the Node.js script directly if API method didn't work
if [ "$SETUP_RESPONSE" != "200" ]; then
    echo "🏃 Running setup script directly..."
    node scripts/setup-daniel-user.js
fi

echo ""
echo "🎉 Setup process completed!"
echo ""
echo "🔑 Login Information:"
echo "   Email: daniel@visionari.es"
echo "   Password: NeolingusDemo2025!"
echo ""
echo "🌐 You can now:"
echo "   1. Start the development server: npm run dev"
echo "   2. Navigate to the login page"
echo "   3. Log in with the credentials above"
echo "   4. Access all enrolled courses"
echo ""
echo "✅ Daniel user is ready to use!"