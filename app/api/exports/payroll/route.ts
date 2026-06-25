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
  const employeeId = searchParams.get('employee_id') || '';
  const payPeriod = searchParams.get('pay_period') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  const supabase = createServerClient();
  let query = supabase.from('payroll').select('*, employees(full_name, employee_number)').order('created_at', { ascending: false });

  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  if (employeeId) query = query.eq('employee_id', employeeId);
  if (payPeriod) query = query.eq('pay_period', payPeriod);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to + 'T23:59:59');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = ['ID', 'Employee Name', 'Employee Number', 'Pay Period', 'Employee Type', 'Days Worked', 'Overtime Hours', 'Allowances', 'Deductions', 'Gross Pay', 'Net Pay', 'Site ID', 'Created At'];
  const rows = (data || []).map((p: any) => [p.id, p.employees?.full_name || '', p.employees?.employee_number || '', p.pay_period, p.employee_type, String(p.days_worked), String(p.overtime_hours), String(p.allowances), String(p.deductions), String(p.gross_pay), String(p.net_pay), p.site_id || '', p.created_at]);
  return new NextResponse(toCSV(headers, rows), { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="payroll-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
