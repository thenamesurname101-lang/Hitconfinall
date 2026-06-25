import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const department = searchParams.get('department') || '';
  const employmentType = searchParams.get('employment_type') || '';
  const siteId = searchParams.get('site_id') || '';

  const supabase = createServerClient();
  let query = supabase.from('employees').select('*').order('created_at', { ascending: false });

  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  else if (siteId) query = query.eq('site_id', siteId);

  if (search) query = query.or(`full_name.ilike.%${search}%,employee_number.ilike.%${search}%,department.ilike.%${search}%,position.ilike.%${search}%`);
  if (status) query = query.eq('status', status);
  if (department) query = query.eq('department', department);
  if (employmentType) query = query.eq('employment_type', employmentType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { employee_number, full_name, national_id, phone_number, position, department, employment_type, daily_rate, weekly_wage, monthly_salary, overtime_rate, date_hired, status, site_id } = body;

  if (!employee_number || !full_name || !national_id) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });

  const effectiveSiteId = session.role === 'site_manager' ? session.siteId || null : site_id || null;

  const supabase = createServerClient();
  const { data, error } = await supabase.from('employees').insert({
    employee_number: employee_number.trim(), full_name: full_name.trim(), national_id: national_id.trim(),
    phone_number: phone_number?.trim() || '', position: position?.trim() || '', department: department?.trim() || '',
    employment_type: employment_type || 'monthly', daily_rate: Number(daily_rate) || 0, weekly_wage: Number(weekly_wage) || 0,
    monthly_salary: Number(monthly_salary) || 0, overtime_rate: Number(overtime_rate) || 0,
    date_hired: date_hired || null, status: status || 'active', site_id: effectiveSiteId,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
