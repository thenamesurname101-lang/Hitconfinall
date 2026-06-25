import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = createServerClient();
  let query = supabase.from('employees').select('*').eq('id', id);
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
    const { data: emp } = await supabase0.from('employees').select('site_id').eq('id', id).maybeSingle();
    if (!emp || emp.site_id !== session.siteId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const supabase = createServerClient();
  const updateData: Record<string, unknown> = {
    employee_number: body.employee_number?.trim(), full_name: body.full_name?.trim(),
    national_id: body.national_id?.trim(), phone_number: body.phone_number?.trim() || '',
    position: body.position?.trim() || '', department: body.department?.trim() || '',
    employment_type: body.employment_type, daily_rate: Number(body.daily_rate) || 0,
    weekly_wage: Number(body.weekly_wage) || 0, monthly_salary: Number(body.monthly_salary) || 0,
    overtime_rate: Number(body.overtime_rate) || 0, date_hired: body.date_hired || null, status: body.status,
  };
  if (session.role === 'master' && body.site_id !== undefined) updateData.site_id = body.site_id || null;

  const { data, error } = await supabase.from('employees').update(updateData).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = createServerClient();
  let query = supabase.from('employees').delete().eq('id', id);
  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
