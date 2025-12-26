export type AppRole = 'admin' | 'manager' | 'team_leader' | 'operator';
export type ActionStatus = 'todo' | 'in_progress' | 'completed' | 'overdue';
export type ActionPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProblemSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ProblemStatus = 'open' | 'in_progress' | 'resolved';
export type KpiFrequency = 'daily' | 'weekly' | 'monthly';
export type KpiTrend = 'up' | 'down' | 'stable';
export type KpiStatus = 'green' | 'orange' | 'red';
export type ChartType = 'pareto' | 'histogram' | 'time_series' | 'control_chart' | 'box_plot';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface SfmCategory {
  id: string;
  name: string;
  code: string;
  color: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Kpi {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  unit?: string;
  target_value?: number;
  warning_threshold?: number;
  critical_threshold?: number;
  performance_direction?: string;
  display_order?: number;
  frequency: KpiFrequency;
  chart_type: ChartType;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface KpiValue {
  id: string;
  kpi_id: string;
  value: number;
  recorded_at: string;
  week_number?: number;
  trend: KpiTrend;
  status: KpiStatus;
  comment?: string;
  recorded_by?: string;
  created_at: string;
}

export interface Action {
  id: string;
  category_id: string;
  title: string;
  description?: string;
  priority: ActionPriority;
  status: ActionStatus;
  responsible_id?: string;
  due_date: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  responsible?: Profile;
  category?: SfmCategory;
}

export interface Problem {
  id: string;
  category_id: string;
  title: string;
  description?: string;
  severity: ProblemSeverity;
  status: ProblemStatus;
  reported_by?: string;
  assigned_to?: string;
  escalated: boolean;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
  assignee?: Profile;
  category?: SfmCategory;
}

export interface Note {
  id: string;
  category_id?: string;
  title?: string;
  content: string;
  is_pinned: boolean;
  created_by?: string;
  created_at: string;
  author?: Profile;
  category?: SfmCategory;
}

export interface SmartAlert {
  id: string;
  type: string;
  title?: string;
  message: string;
  severity: string;
  related_id?: string;
  related_type?: string;
  category_id?: string;
  is_read: boolean;
  created_at: string;
  category?: SfmCategory;
}

export interface CategoryStats {
  category: SfmCategory;
  openActions: number;
  overdueActions: number;
  openProblems: number;
  criticalProblems: number;
  kpis: Kpi[];
  latestKpiValues: Map<string, KpiValue[]>;
}
