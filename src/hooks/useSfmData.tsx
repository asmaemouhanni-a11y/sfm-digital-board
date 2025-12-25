import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  SfmCategory, 
  Kpi, 
  KpiValue, 
  Action, 
  Problem, 
  Note, 
  SmartAlert,
} from '@/types/sfm';
import { toast } from 'sonner';

// Categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sfm_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as SfmCategory[];
    },
  });
}

// KPIs
export function useKpis(categoryId?: string) {
  return useQuery({
    queryKey: ['kpis', categoryId],
    queryFn: async () => {
      let query = supabase.from('kpis').select('*').eq('is_active', true);
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as Kpi[];
    },
  });
}

export function useKpiValues(kpiId: string, limit = 12) {
  return useQuery({
    queryKey: ['kpi_values', kpiId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_values')
        .select('*')
        .eq('kpi_id', kpiId)
        .order('recorded_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as KpiValue[]).reverse();
    },
    enabled: !!kpiId,
  });
}

export function useCreateKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kpi: { category_id: string; name: string; description?: string; unit?: string; target_value?: number }) => {
      const { data, error } = await supabase.from('kpis').insert(kpi).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPI créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du KPI');
    },
  });
}

export function useUpdateKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; unit?: string; target_value?: number }) => {
      const { data, error } = await supabase
        .from('kpis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPI mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

export function useDeleteKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kpis').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPI supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });
}

export function useAddKpiValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: { 
      kpi_id: string; 
      value: number; 
      week_number?: number;
      recorded_at?: string;
      status?: 'green' | 'orange' | 'red';
      trend?: 'up' | 'down' | 'stable';
      comment?: string;
      recorded_by?: string;
    }) => {
      const { data, error } = await supabase.from('kpi_values').insert(value).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi_values'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      toast.success('Valeur KPI enregistrée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement');
    },
  });
}

// Actions
export function useActions(categoryId?: string, status?: 'todo' | 'in_progress' | 'completed' | 'overdue') {
  return useQuery({
    queryKey: ['actions', categoryId, status],
    queryFn: async () => {
      let query = supabase
        .from('actions')
        .select('*, category:sfm_categories(*)');
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.order('due_date');
      if (error) throw error;
      return data as unknown as Action[];
    },
  });
}

export function useTodayPriorities() {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['today_priorities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions')
        .select('*, category:sfm_categories(*)')
        .eq('due_date', today)
        .neq('status', 'completed')
        .order('priority')
        .order('due_date');
      if (error) throw error;
      return data as unknown as Action[];
    },
  });
}

export function useOverdueActions() {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['overdue_actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions')
        .select('*, category:sfm_categories(*)')
        .lt('due_date', today)
        .neq('status', 'completed')
        .order('priority')
        .order('due_date');
      if (error) throw error;
      return data as unknown as Action[];
    },
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: { category_id: string; title: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'urgent'; due_date: string; responsible_id?: string; created_by?: string; status?: 'todo' | 'in_progress' | 'completed' | 'overdue' }) => {
      const { data, error } = await supabase.from('actions').insert([action]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['today_priorities'] });
      toast.success('Action créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de l\'action');
    },
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: 'todo' | 'in_progress' | 'completed' | 'overdue'; completed_at?: string | null }) => {
      const { data, error } = await supabase
        .from('actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['today_priorities'] });
      toast.success('Action mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

export function useDeleteAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('actions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['today_priorities'] });
      toast.success('Action supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });
}

// Problems
export function useProblems(categoryId?: string, status?: 'open' | 'in_progress' | 'resolved') {
  return useQuery({
    queryKey: ['problems', categoryId, status],
    queryFn: async () => {
      let query = supabase
        .from('problems')
        .select('*, category:sfm_categories(*)');
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Problem[];
    },
  });
}

export function useCreateProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (problem: { category_id: string; title: string; description?: string; severity?: 'low' | 'medium' | 'high' | 'critical'; reported_by?: string; status?: 'open' | 'in_progress' | 'resolved'; escalated?: boolean }) => {
      const { data, error } = await supabase.from('problems').insert([problem]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      toast.success('Problème déclaré');
    },
    onError: () => {
      toast.error('Erreur lors de la déclaration');
    },
  });
}

export function useUpdateProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: 'open' | 'in_progress' | 'resolved'; resolved_at?: string | null }) => {
      const { data, error } = await supabase
        .from('problems')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      toast.success('Problème mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

// Notes
export function useNotes(categoryId?: string) {
  return useQuery({
    queryKey: ['notes', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select('*, category:sfm_categories(*)');
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data as unknown as Note[];
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note: { content: string; category_id?: string; created_by?: string }) => {
      const { data, error } = await supabase.from('notes').insert(note).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note ajoutée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout');
    },
  });
}

// Smart Alerts
export function useSmartAlerts() {
  return useQuery({
    queryKey: ['smart_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smart_alerts')
        .select('*, category:sfm_categories(*)')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as (SmartAlert & { category?: SfmCategory })[];
    },
  });
}

export function useAllAlerts() {
  return useQuery({
    queryKey: ['all_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smart_alerts')
        .select('*, category:sfm_categories(*)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as (SmartAlert & { category?: SfmCategory })[];
    },
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('smart_alerts')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart_alerts'] });
      queryClient.invalidateQueries({ queryKey: ['all_alerts'] });
    },
  });
}

export function useGenerateAlerts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-alerts');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart_alerts'] });
      queryClient.invalidateQueries({ queryKey: ['all_alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('smart_alerts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart_alerts'] });
      queryClient.invalidateQueries({ queryKey: ['all_alerts'] });
    },
  });
}

// Profiles
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name');
      if (error) throw error;
      return data;
    },
  });
}

// Category stats
export function useCategoryStats(categoryId: string) {
  return useQuery({
    queryKey: ['category_stats', categoryId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [actionsRes, problemsRes, kpisRes] = await Promise.all([
        supabase.from('actions').select('status, due_date').eq('category_id', categoryId).neq('status', 'completed'),
        supabase.from('problems').select('severity, status').eq('category_id', categoryId).neq('status', 'resolved'),
        supabase.from('kpis').select('id').eq('category_id', categoryId).eq('is_active', true),
      ]);

      const actions = actionsRes.data || [];
      const problems = problemsRes.data || [];
      
      return {
        openActions: actions.length,
        overdueActions: actions.filter(a => a.due_date < today || a.status === 'overdue').length,
        openProblems: problems.length,
        criticalProblems: problems.filter(p => p.severity === 'critical' || p.severity === 'high').length,
        kpiCount: kpisRes.data?.length || 0,
      };
    },
    enabled: !!categoryId,
  });
}
