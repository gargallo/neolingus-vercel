import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/academia/exams/sessions/[sessionId]
 * Temporarily disabled during build process
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  return NextResponse.json(
    { success: false, error: "Service temporarily unavailable" },
    { status: 503 }
  );
}

/**
 * PUT /api/academia/exams/sessions/[sessionId] 
 * Temporarily disabled during build process
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  return NextResponse.json(
    { success: false, error: "Service temporarily unavailable" },
    { status: 503 }
  );
}