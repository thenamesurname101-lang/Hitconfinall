/*
  # Multi-Site Management & Role-Based Access Control

  Creates sites, site_managers tables and adds site_id to employees, payroll, reports.
*/

-- site_managers (created before sites due to FK reference)
CREATE TABLE IF NOT EXISTS site_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_name text NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  project_name text NOT NULL DEFAULT '',
  site_location text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_select_site_managers" ON site_managers FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_site_managers" ON site_managers FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_site_managers" ON site_managers FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_site_managers" ON site_managers FOR DELETE TO service_role USING (true);

-- sites
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  location text NOT NULL DEFAULT '',
  manager_id uuid REFERENCES site_managers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_select_sites" ON sites FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_sites" ON sites FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_sites" ON sites FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_sites" ON sites FOR DELETE TO service_role USING (true);

-- add site_id to existing tables
ALTER TABLE employees ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS employees_site_id_idx ON employees (site_id);
CREATE INDEX IF NOT EXISTS payroll_site_id_idx ON payroll (site_id);
CREATE INDEX IF NOT EXISTS reports_site_id_idx ON reports (site_id);
