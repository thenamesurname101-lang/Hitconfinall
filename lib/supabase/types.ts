// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          employee_number: string;
          full_name: string;
          national_id: string;
          phone_number: string;
          position: string;
          department: string;
          employment_type: 'monthly' | 'weekly' | 'daily';
          daily_rate: number;
          weekly_wage: number;
          monthly_salary: number;
          overtime_rate: number;
          date_hired: string | null;
          status: 'active' | 'inactive' | 'terminated';
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_number: string;
          full_name: string;
          national_id: string;
          phone_number?: string;
          position?: string;
          department?: string;
          employment_type?: 'monthly' | 'weekly' | 'daily';
          daily_rate?: number;
          weekly_wage?: number;
          monthly_salary?: number;
          overtime_rate?: number;
          date_hired?: string | null;
          status?: 'active' | 'inactive' | 'terminated';
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_number?: string;
          full_name?: string;
          national_id?: string;
          phone_number?: string;
          position?: string;
          department?: string;
          employment_type?: 'monthly' | 'weekly' | 'daily';
          daily_rate?: number;
          weekly_wage?: number;
          monthly_salary?: number;
          overtime_rate?: number;
          date_hired?: string | null;
          status?: 'active' | 'inactive' | 'terminated';
          created_at?: string;
        };
      };
      payroll: {
        Row: {
          id: string;
          employee_id: string;
          pay_period: string;
          employee_type: 'monthly' | 'weekly';
          days_worked: number;
          overtime_hours: number;
          allowances: number;
          deductions: number;
          gross_pay: number;
          net_pay: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          pay_period: string;
          employee_type: 'monthly' | 'weekly';
          days_worked?: number;
          overtime_hours?: number;
          allowances?: number;
          deductions?: number;
          gross_pay: number;
          net_pay: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          pay_period?: string;
          employee_type?: 'monthly' | 'weekly';
          days_worked?: number;
          overtime_hours?: number;
          allowances?: number;
          deductions?: number;
          gross_pay?: number;
          net_pay?: number;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          title: string;
          file_name: string;
          file_path: string;
          file_size: number;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          file_name: string;
          file_path: string;
          file_size?: number;
          uploaded_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          uploaded_by?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Employee = Database['public']['Tables']['employees']['Row'];
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

export type Payroll = Database['public']['Tables']['payroll']['Row'];
export type PayrollInsert = Database['public']['Tables']['payroll']['Insert'];

export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];
