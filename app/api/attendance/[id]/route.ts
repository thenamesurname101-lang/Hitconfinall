import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = createServerClient();

  let query = supabase.from('attendance').select('*').eq('id', id);
  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  const { data, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  if (session.role === 'site_manager') {
    const supabase0 = createServerClient();
    const { data: rec } = await supabase0.from('attendance').select('site_id').eq('id', id).maybeSingle();
    if (!rec || rec.site_id !== session.siteId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const supabase = createServerClient();

  const updateData: Record<string, unknown> = {
    status: body.status,
    check_in_time: body.check_in_time || null,
    check_out_time: body.check_out_time || null,
    hours_worked: Number(body.hours_worked) || 0,
    overtime_hours: Number(body.overtime_hours) || 0,
    notes: body.notes || '',
  };

  const { data, error } = await supabase.from('attendance').update(updateData).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = createServerClient();

  let query = supabase.from('attendance').delete().eq('id', id);
  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
