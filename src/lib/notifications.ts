import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'action_reminder' | 'problem_escalation' | 'kpi_alert' | 'general';

interface SendNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  recipientEmail: string;
  recipientName?: string;
}

export async function sendNotification(params: SendNotificationParams): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await supabase.functions.invoke('send-notification', {
      body: params,
    });

    if (response.error) {
      console.error('Error sending notification:', response.error);
      return { success: false, error: response.error.message };
    }

    return { 
      success: response.data?.success ?? true, 
      message: response.data?.message || response.data?.reason 
    };
  } catch (error) {
    console.error('Error in sendNotification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper functions for specific notification types
export async function sendActionReminder(
  recipientEmail: string,
  actionTitle: string,
  dueDate: string,
  recipientName?: string
) {
  return sendNotification({
    type: 'action_reminder',
    title: 'Rappel: Action à échéance',
    message: `L'action "${actionTitle}" arrive à échéance le ${dueDate}. Veuillez la compléter.`,
    recipientEmail,
    recipientName,
  });
}

export async function sendProblemEscalation(
  recipientEmail: string,
  problemTitle: string,
  severity: string,
  recipientName?: string
) {
  return sendNotification({
    type: 'problem_escalation',
    title: 'Escalade: Problème critique',
    message: `Le problème "${problemTitle}" de sévérité ${severity} a été escaladé et nécessite votre attention.`,
    recipientEmail,
    recipientName,
  });
}

export async function sendKpiAlert(
  recipientEmail: string,
  kpiName: string,
  currentValue: number,
  threshold: number,
  recipientName?: string
) {
  return sendNotification({
    type: 'kpi_alert',
    title: 'Alerte KPI',
    message: `Le KPI "${kpiName}" a atteint ${currentValue}, dépassant le seuil critique de ${threshold}.`,
    recipientEmail,
    recipientName,
  });
}
