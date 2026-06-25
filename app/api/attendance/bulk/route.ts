import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { calcHoursWorked, statusUsesTime } from '@/lib/attendance';

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { attendance_date, records } = body;

  if (!attendance_date || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'Date and attendance records are required' }, { status: 400 });
  }

  const validStatuses = ['Present', 'Absent', 'Sick Leave', 'Annual Leave', 'Half Day'];
  for (const r of records) {
    if (!r.employee_id || !r.status) {
      return NextResponse.json({ error: 'Each record must have employee_id and status' }, { status: 400 });
    }
    if (!validStatuses.includes(r.status)) {
      return NextResponse.json({ error: `Invalid status: ${r.status}` }, { status: 400 });
    }
  }

  const effectiveSiteId = session.role === 'site_manager' ? session.siteId || null : null;

  const rows = records.map((r: { employee_id: string; employee_number: string; employee_name: string; status: string; check_in_time?: string; check_out_time?: string; hours_worked?: number; overtime_hours?: number; site_id?: string }) => {
    const usesTime = statusUsesTime(r.status);
    const checkIn = usesTime ? (r.check_in_time || null) : null;
    const checkOut = usesTime ? (r.check_out_time || null) : null;
    let hours = Number(r.hours_worked) || 0;
    if (usesTime && checkIn && checkOut && hours === 0) {
      hours = calcHoursWorked(checkIn, checkOut);
    }
    if (!usesTime) hours = 0;
    return {
      employee_id: r.employee_id,
      employee_number: r.employee_number || '',
      employee_name: r.employee_name || '',
      attendance_date,
      status: r.status,
      check_in_time: checkIn,
      check_out_time: checkOut,
      hours_worked: hours,
      overtime_hours: Number(r.overtime_hours) || 0,
      notes: '',
      site_id: effectiveSiteId || r.site_id || null,
    };
  });

  const supabase = createServerClient();

  // Delete existing records for this date and these employees to allow bulk upsert
  const employeeIds = rows.map((r: { employee_id: string }) => r.employee_id);
  const { error: delError } = await supabase
    .from('attendance')
    .delete()
    .eq('attendance_date', attendance_date)
    .in('employee_id', employeeIds);

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  const { data, error } = await supabase.from('attendance').insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
