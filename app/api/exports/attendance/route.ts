import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) lines.push(row.map(escape).join(','));
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const status = searchParams.get('status') || '';
  const employeeId = searchParams.get('employee_id') || '';
  const siteId = searchParams.get('site_id') || '';

  const supabase = createServerClient();
  let query = supabase.from('attendance').select('*').order('attendance_date', { ascending: false });

  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  else if (siteId) query = query.eq('site_id', siteId);
  if (from) query = query.gte('attendance_date', from);
  if (to) query = query.lte('attendance_date', to);
  if (status) query = query.eq('status', status);
  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = ['Employee Number', 'Employee Name', 'Date', 'Status', 'Check In', 'Check Out', 'Hours Worked', 'Overtime Hours'];
  const rows = (data || []).map((r: any) => [
    r.employee_number, r.employee_name, r.attendance_date, r.status,
    r.check_in_time || '', r.check_out_time || '',
    String(r.hours_worked), String(r.overtime_hours),
  ]);

  return new NextResponse(toCSV(headers, rows), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="attendance-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
