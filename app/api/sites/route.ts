import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== 'master') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('sites')
    .select('*, site_managers(id, manager_name, username, is_active)')
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
  const { project_name, location, manager_id } = body;
  if (!project_name) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('sites')
    .insert({
      project_name: project_name.trim(),
      location: location?.trim() || '',
      manager_id: manager_id || null,
    })
    .select('*, site_managers(id, manager_name, username, is_active)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
