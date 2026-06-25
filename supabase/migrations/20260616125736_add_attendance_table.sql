CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_number text NOT NULL,
  employee_name text NOT NULL,
  attendance_date date NOT NULL,
  status text NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Sick Leave', 'Annual Leave', 'Half Day')),
  check_in_time time,
  check_out_time time,
  hours_worked numeric(5,2) DEFAULT 0,
  overtime_hours numeric(5,2) DEFAULT 0,
  notes text DEFAULT '',
  site_id uuid REFERENCES sites(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, attendance_date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_attendance" ON attendance FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_attendance" ON attendance FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_attendance" ON attendance FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_attendance" ON attendance FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_site_id ON attendance(site_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
