import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession, hashPassword } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(request);
  if (!session || session.role !== 'master') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const updateData: Record<string, unknown> = {
    manager_name: body.manager_name?.trim(),
    username: body.username?.trim().toLowerCase(),
    project_name: body.project_name?.trim() || '',
    site_location: body.site_location?.trim() || '',
    is_active: body.is_active,
  };
  if (body.password && body.password.length >= 8) {
    updateData.password_hash = await hashPassword(body.password);
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('site_managers')
    .update(updateData)
    .eq('id', id)
    .select('id, manager_name, username, project_name, site_location, is_active, created_at')
    .single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(request);
  if (!session || session.role !== 'master') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from('site_managers').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
