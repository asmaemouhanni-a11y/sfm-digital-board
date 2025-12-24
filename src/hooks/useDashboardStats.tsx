import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  activeCategories: number;
  activeKpis: number;
  openActions: number;
  inProgressActions: number;
  openProblems: number;
  criticalProblems: number;
  unreadAlerts: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [
        categoriesRes,
        kpisRes,
        actionsRes,
        problemsRes,
        alertsRes,
      ] = await Promise.all([
        supabase.from('sfm_categories').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('kpis').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('actions').select('id, status'),
        supabase.from('problems').select('id, status, severity'),
        supabase.from('smart_alerts').select('id', { count: 'exact' }).eq('is_read', false),
      ]);

      const actions = actionsRes.data || [];
      const problems = problemsRes.data || [];

      return {
        activeCategories: categoriesRes.count || 0,
        activeKpis: kpisRes.count || 0,
        openActions: actions.filter(a => a.status === 'todo' || a.status === 'in_progress').length,
        inProgressActions: actions.filter(a => a.status === 'in_progress').length,
        openProblems: problems.filter(p => p.status === 'open' || p.status === 'in_progress').length,
        criticalProblems: problems.filter(p => p.severity === 'critical' && p.status !== 'resolved').length,
        unreadAlerts: alertsRes.count || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
