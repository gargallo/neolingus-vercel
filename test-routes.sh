#!/bin/bash

# Test script to verify Neolingus Academy Platform routes
# Run this after starting the development server with `npm run dev`

echo "🧪 Testing Neolingus Academy Platform Routes"
echo "=========================================="

# Test main page
echo "Testing main page..."
curl -s -o /dev/null -w "Main page: %{http_code}\n" http://localhost:3001

# Test academia page (should redirect to sign-in)
echo "Testing academia page..."
curl -s -o /dev/null -w "Academia page: %{http_code}\n" http://localhost:3001/dashboard

# Test sign-in page
echo "Testing sign-in page..."
curl -s -o /dev/null -w "Sign-in page: %{http_code}\n" http://localhost:3001/sign-in

# Test API routes
echo "Testing API routes..."
curl -s -o /dev/null -w "Courses API: %{http_code}\n" http://localhost:3001/api/academia/courses

echo ""
echo "✅ Route testing completed"
echo "ℹ️  Note: 307 redirects are expected for protected routes like /dashboard"
echo "ℹ️  Note: 401 responses are expected for API routes without authentication"