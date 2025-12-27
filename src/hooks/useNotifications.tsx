import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SmartAlert {
  id: string;
  title: string | null;
  type: string;
  message: string;
  severity: string;
  category_id: string | null;
  is_read: boolean | null;
  created_at: string;
  related_id: string | null;
  related_type: string | null;
}

interface NotificationSettings {
  email_alerts: boolean;
  action_reminders: boolean;
  problem_escalation: boolean;
  kpi_alerts: boolean;
}

export function useNotifications() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationSettings>({
    email_alerts: true,
    action_reminders: true,
    problem_escalation: true,
    kpi_alerts: true,
  });

  // Fetch user notification settings
  const { data: userSettings } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update local settings when fetched
  useEffect(() => {
    if (userSettings) {
      setSettings({
        email_alerts: userSettings.email_alerts ?? true,
        action_reminders: userSettings.action_reminders ?? true,
        problem_escalation: userSettings.problem_escalation ?? true,
        kpi_alerts: userSettings.kpi_alerts ?? true,
      });
    }
  }, [userSettings]);

  // Fetch unread alerts
  const { data: alerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['smart-alerts-unread'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smart_alerts')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SmartAlert[];
    },
    enabled: !!user?.id,
  });

  // Subscribe to realtime alerts
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('smart-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'smart_alerts',
        },
        (payload) => {
          const newAlert = payload.new as SmartAlert;
          
          // Check notification settings before showing
          const shouldNotify = () => {
            if (newAlert.type === 'kpi_critical' && !settings.kpi_alerts) return false;
            if (newAlert.type === 'action_overdue' && !settings.action_reminders) return false;
            if (newAlert.type === 'problem_critical' && !settings.problem_escalation) return false;
            return true;
          };

          // Check role permissions
          const canSeeAlert = () => {
            if (role === 'admin') return false; // Admin ne voit pas les alertes opérationnelles
            return true;
          };

          if (shouldNotify() && canSeeAlert()) {
            // Show toast notification
            const severity = newAlert.severity;
            const title = newAlert.title || 'Nouvelle alerte';
            const message = newAlert.message;

            if (severity === 'critical' || severity === 'high') {
              toast.error(title, { description: message, duration: 8000 });
            } else if (severity === 'warning' || severity === 'medium') {
              toast.warning(title, { description: message, duration: 6000 });
            } else {
              toast.info(title, { description: message, duration: 5000 });
            }
          }

          // Refetch alerts to update the list
          queryClient.invalidateQueries({ queryKey: ['smart-alerts-unread'] });
          queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, settings, role, queryClient]);

  // Mark alert as read
  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('smart_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) {
      console.error('Error marking alert as read:', error);
      return false;
    }

    queryClient.invalidateQueries({ queryKey: ['smart-alerts-unread'] });
    queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
    return true;
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('smart_alerts')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all alerts as read:', error);
      return false;
    }

    queryClient.invalidateQueries({ queryKey: ['smart-alerts-unread'] });
    queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
    return true;
  };

  const unreadCount = alerts?.length || 0;

  return {
    alerts,
    unreadCount,
    settings,
    markAsRead,
    markAllAsRead,
    refetchAlerts,
  };
}
