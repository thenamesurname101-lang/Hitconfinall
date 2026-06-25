import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { calcHoursWorked, statusUsesTime } from '@/lib/attendance';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const date = searchParams.get('date') || '';
  const status = searchParams.get('status') || '';
  const employeeId = searchParams.get('employee_id') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const siteId = searchParams.get('site_id') || '';

  const supabase = createServerClient();
  let query = supabase.from('attendance').select('*').order('attendance_date', { ascending: false });

  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  else if (siteId) query = query.eq('site_id', siteId);

  if (search) query = query.or(`employee_name.ilike.%${search}%,employee_number.ilike.%${search}%`);
  if (date) query = query.eq('attendance_date', date);
  if (status) query = query.eq('status', status);
  if (employeeId) query = query.eq('employee_id', employeeId);
  if (from) query = query.gte('attendance_date', from);
  if (to) query = query.lte('attendance_date', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { employee_id, employee_number, employee_name, attendance_date, status, check_in_time, check_out_time, hours_worked, overtime_hours, notes } = body;

  if (!employee_id || !attendance_date || !status) {
    return NextResponse.json({ error: 'Employee, date, and status are required' }, { status: 400 });
  }

  if (!['Present', 'Absent', 'Sick Leave', 'Annual Leave', 'Half Day'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const effectiveSiteId = session.role === 'site_manager' ? session.siteId || null : body.site_id || null;

  const usesTime = statusUsesTime(status);
  const finalCheckIn = usesTime ? (check_in_time || null) : null;
  const finalCheckOut = usesTime ? (check_out_time || null) : null;
  let finalHours = Number(hours_worked) || 0;
  if (usesTime && finalCheckIn && finalCheckOut && finalHours === 0) {
    finalHours = calcHoursWorked(finalCheckIn, finalCheckOut);
  }
  if (!usesTime) finalHours = 0;

  const insertData: Record<string, unknown> = {
    employee_id,
    employee_number: employee_number || '',
    employee_name: employee_name || '',
    attendance_date,
    status,
    check_in_time: finalCheckIn,
    check_out_time: finalCheckOut,
    hours_worked: finalHours,
    overtime_hours: Number(overtime_hours) || 0,
    notes: notes || '',
    site_id: effectiveSiteId,
  };

  const supabase = createServerClient();
  const { data, error } = await supabase.from('attendance').insert(insertData).select().single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Attendance record already exists for this employee on this date' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
