import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServerClient } from '@/lib/supabase/server';

const SESSION_COOKIE = 'hitcon_session';

export interface SessionData {
  role: 'master' | 'site_manager';
  username: string;
  siteId?: string;
  managerId?: string;
}

function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodeSession(token: string): SessionData | null {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    return null;
  }
}

export function getAdminCredentials() {
  return {
    username: process.env.DEFAULT_ADMIN_USERNAME || process.env.MASTER_USERNAME || 'admin',
    password: process.env.DEFAULT_ADMIN_PASSWORD || process.env.MASTER_PASSWORD || 'ChangeMe123',
  };
}

export function createSession(response: NextResponse, data: SessionData): NextResponse {
  const token = encodeSession(data);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return response;
}

export function destroySession(response: NextResponse): NextResponse {
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export function getSession(request: NextRequest): SessionData | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function getServerSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export function isAuthenticated(request: NextRequest): boolean {
  return !!getSession(request);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<SessionData | null> {
  // Check master credentials first
  const master = getAdminCredentials();
  if (username === master.username && password === master.password) {
    return { role: 'master', username };
  }

  // Check site_managers table
  const supabase = createServerClient();
  const { data: manager } = await supabase
    .from('site_managers')
    .select('id, username, password_hash, is_active')
    .eq('username', username)
    .maybeSingle();

  if (!manager || !manager.is_active) return null;

  const valid = await verifyPassword(password, manager.password_hash);
  if (!valid) return null;

  // Look up the site assigned to this manager
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('manager_id', manager.id)
    .maybeSingle();

  return {
    role: 'site_manager',
    username: manager.username,
    siteId: site?.id || undefined,
    managerId: manager.id,
  };
}
