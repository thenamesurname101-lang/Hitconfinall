import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employee_id') || '';
  const payPeriod = searchParams.get('pay_period') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  const supabase = createServerClient();
  let query = supabase.from('payroll').select('*, employees(id, full_name, employee_number, employment_type)').order('created_at', { ascending: false });

  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  if (employeeId) query = query.eq('employee_id', employeeId);
  if (payPeriod) query = query.eq('pay_period', payPeriod);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to + 'T23:59:59');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { employee_id, pay_period, employee_type, days_worked, overtime_hours, allowances, deductions, base_salary, daily_rate, overtime_rate } = body;

  if (!employee_id || !pay_period) return NextResponse.json({ error: 'employee_id and pay_period are required' }, { status: 400 });

  // Verify employee belongs to site manager's site
  const supabase0 = createServerClient();
  if (session.role === 'site_manager') {
    const { data: emp } = await supabase0.from('employees').select('site_id').eq('id', employee_id).maybeSingle();
    if (!emp || emp.site_id !== session.siteId) return NextResponse.json({ error: 'Employee not found at your site' }, { status: 404 });
  }

  const { data: emp } = await supabase0.from('employees').select('site_id').eq('id', employee_id).maybeSingle();

  let gross_pay = 0, net_pay = 0;
  if (employee_type === 'monthly') {
    const baseSal = Number(base_salary) || 0;
    const otPay = (Number(overtime_hours) || 0) * (Number(overtime_rate) || 0);
    const allow = Number(allowances) || 0;
    const deduct = Number(deductions) || 0;
    gross_pay = baseSal + otPay + allow;
    net_pay = gross_pay - deduct;
  } else {
    const dailyR = Number(daily_rate) || 0;
    const days = Number(days_worked) || 0;
    const otPay = (Number(overtime_hours) || 0) * (Number(overtime_rate) || 0);
    const deduct = Number(deductions) || 0;
    gross_pay = dailyR * days + otPay;
    net_pay = gross_pay - deduct;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.from('payroll').insert({
    employee_id, pay_period, employee_type,
    days_worked: Number(days_worked) || 0, overtime_hours: Number(overtime_hours) || 0,
    allowances: Number(allowances) || 0, deductions: Number(deductions) || 0,
    gross_pay, net_pay, site_id: emp?.site_id || null,
  }).select('*, employees(id, full_name, employee_number)').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
