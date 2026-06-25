import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employee_id') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  if (!employeeId) return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });

  const supabase = createServerClient();

  let query = supabase.from('attendance').select('status, hours_worked, overtime_hours').eq('employee_id', employeeId);

  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  if (from) query = query.gte('attendance_date', from);
  if (to) query = query.lte('attendance_date', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const records = data || [];
  const daysPresent = records.filter(r => r.status === 'Present').length;
  const halfDays = records.filter(r => r.status === 'Half Day').length;
  const absentDays = records.filter(r => r.status === 'Absent').length;
  const sickLeave = records.filter(r => r.status === 'Sick Leave').length;
  const annualLeave = records.filter(r => r.status === 'Annual Leave').length;
  const totalOvertimeHours = records.reduce((sum, r) => sum + (Number(r.overtime_hours) || 0), 0);
  const totalHoursWorked = records.reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0);

  return NextResponse.json({
    days_present: daysPresent,
    half_days: halfDays,
    absent_days: absentDays,
    sick_leave_days: sickLeave,
    annual_leave_days: annualLeave,
    total_overtime_hours: totalOvertimeHours,
    total_hours_worked: totalHoursWorked,
    total_records: records.length,
    // For weekly/daily workers: days_worked = present + (half_days * 0.5)
    effective_days_worked: daysPresent + halfDays * 0.5,
  });
}
