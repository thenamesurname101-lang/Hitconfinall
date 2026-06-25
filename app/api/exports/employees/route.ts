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

  const supabase = createServerClient();
  let query = supabase.from('employees').select('*').order('created_at', { ascending: false });
  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = ['ID', 'Employee Number', 'Full Name', 'National ID', 'Phone Number', 'Position', 'Department', 'Employment Type', 'Daily Rate', 'Weekly Wage', 'Monthly Salary', 'Overtime Rate', 'Date Hired', 'Status', 'Site ID', 'Created At'];
  const rows = (data || []).map(e => [e.id, e.employee_number, e.full_name, e.national_id, e.phone_number, e.position, e.department, e.employment_type, String(e.daily_rate), String(e.weekly_wage), String(e.monthly_salary), String(e.overtime_rate), e.date_hired || '', e.status, e.site_id || '', e.created_at]);
  return new NextResponse(toCSV(headers, rows), { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="employees-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
