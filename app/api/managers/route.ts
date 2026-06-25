import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'master') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('site_managers')
    .select('id, manager_name, username, project_name, site_location, is_active, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'master') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { manager_name, username, password, project_name, site_location } = body;
  if (!manager_name || !username || !password) {
    return NextResponse.json({ error: 'Manager name, username, and password are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  const password_hash = await hashPassword(password);
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('site_managers')
    .insert({
      manager_name: manager_name.trim(),
      username: username.trim().toLowerCase(),
      password_hash,
      project_name: project_name?.trim() || '',
      site_location: site_location?.trim() || '',
      is_active: true,
    })
    .select('id, manager_name, username, project_name, site_location, is_active, created_at')
    .single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
