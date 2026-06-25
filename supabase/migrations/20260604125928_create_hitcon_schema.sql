/*
  # Hitcon Construction Admin System - Initial Schema

  ## Overview
  Creates the three core tables for the Hitcon Construction internal admin system.

  ## New Tables

  ### 1. employees
  Stores all employee records including personal details, compensation, and status.
  - id (uuid, primary key)
  - employee_number (text, unique identifier like EMP-001)
  - full_name (text)
  - national_id (text, unique)
  - phone_number (text)
  - position (text, job title)
  - department (text)
  - employment_type (text: 'monthly' | 'weekly' | 'daily')
  - daily_rate (numeric, for daily/weekly wage employees)
  - weekly_wage (numeric, computed or set weekly total)
  - monthly_salary (numeric, for salaried employees)
  - overtime_rate (numeric, hourly overtime rate)
  - date_hired (date)
  - status (text: 'active' | 'inactive' | 'terminated')
  - created_at (timestamptz)

  ### 2. payroll
  Stores payroll computation records per pay period per employee.
  - id (uuid, primary key)
  - employee_id (uuid, foreign key -> employees.id)
  - pay_period (text, e.g. "2024-01" or "2024-W01")
  - employee_type (text: 'monthly' | 'weekly')
  - days_worked (numeric)
  - overtime_hours (numeric)
  - allowances (numeric)
  - deductions (numeric)
  - gross_pay (numeric)
  - net_pay (numeric)
  - created_at (timestamptz)

  ### 3. reports
  Stores metadata for uploaded report files (actual files stored in Supabase Storage).
  - id (uuid, primary key)
  - title (text)
  - file_name (text)
  - file_path (text, path in storage bucket)
  - file_size (integer, bytes)
  - uploaded_by (text, admin username)
  - created_at (timestamptz)

  ## Security
  - RLS enabled on all three tables
  - Policies allow service role full access (admin operations run server-side)
  - Anon key can read for authenticated session checks

  ## Notes
  1. The system uses server-side API routes with service role key — RLS policies restrict direct client access
  2. All monetary fields use NUMERIC for precision
  3. Indexes added on frequently queried columns (employee_id, status, pay_period)
*/

-- ============================================================
-- EMPLOYEES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  national_id text UNIQUE NOT NULL,
  phone_number text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT 'monthly' CHECK (employment_type IN ('monthly', 'weekly', 'daily')),
  daily_rate numeric(12,2) NOT NULL DEFAULT 0,
  weekly_wage numeric(12,2) NOT NULL DEFAULT 0,
  monthly_salary numeric(12,2) NOT NULL DEFAULT 0,
  overtime_rate numeric(12,2) NOT NULL DEFAULT 0,
  date_hired date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employees_status_idx ON employees (status);
CREATE INDEX IF NOT EXISTS employees_department_idx ON employees (department);
CREATE INDEX IF NOT EXISTS employees_employment_type_idx ON employees (employment_type);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Service role has full access (server-side operations)
CREATE POLICY "Service role full access on employees"
  ON employees
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role insert on employees"
  ON employees
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update on employees"
  ON employees
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role delete on employees"
  ON employees
  FOR DELETE
  TO service_role
  USING (true);

-- ============================================================
-- PAYROLL TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pay_period text NOT NULL,
  employee_type text NOT NULL DEFAULT 'monthly' CHECK (employee_type IN ('monthly', 'weekly')),
  days_worked numeric(5,2) NOT NULL DEFAULT 0,
  overtime_hours numeric(5,2) NOT NULL DEFAULT 0,
  allowances numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  gross_pay numeric(12,2) NOT NULL DEFAULT 0,
  net_pay numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payroll_employee_id_idx ON payroll (employee_id);
CREATE INDEX IF NOT EXISTS payroll_pay_period_idx ON payroll (pay_period);
CREATE INDEX IF NOT EXISTS payroll_created_at_idx ON payroll (created_at DESC);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on payroll select"
  ON payroll
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role insert on payroll"
  ON payroll
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update on payroll"
  ON payroll
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role delete on payroll"
  ON payroll
  FOR DELETE
  TO service_role
  USING (true);

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  uploaded_by text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports (created_at DESC);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on reports select"
  ON reports
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role insert on reports"
  ON reports
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update on reports"
  ON reports
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role delete on reports"
  ON reports
  FOR DELETE
  TO service_role
  USING (true);
