import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });
  return destroySession(response);
}
