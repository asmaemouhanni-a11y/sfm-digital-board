import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'action_reminder' | 'problem_escalation' | 'kpi_alert' | 'general';
  title: string;
  message: string;
  recipientEmail: string;
  recipientName?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client to verify token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { type, title, message, recipientEmail, recipientName }: NotificationRequest = await req.json();

    if (!type || !title || !message || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, title, message, recipientEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for checking user settings
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user settings to check if notifications are enabled
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', recipientEmail)
      .single();

    if (userProfile) {
      const { data: userSettings } = await supabaseAdmin
        .from('user_settings')
        .select('email_alerts, action_reminders, problem_escalation, kpi_alerts')
        .eq('user_id', userProfile.user_id)
        .single();

      // Check if user has disabled this type of notification
      if (userSettings) {
        if (!userSettings.email_alerts) {
          return new Response(
            JSON.stringify({ success: false, reason: "User has disabled email alerts" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (type === 'action_reminder' && !userSettings.action_reminders) {
          return new Response(
            JSON.stringify({ success: false, reason: "User has disabled action reminders" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (type === 'problem_escalation' && !userSettings.problem_escalation) {
          return new Response(
            JSON.stringify({ success: false, reason: "User has disabled problem escalation" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (type === 'kpi_alert' && !userSettings.kpi_alerts) {
          return new Response(
            JSON.stringify({ success: false, reason: "User has disabled KPI alerts" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // For now, we'll log the notification (in production, you'd integrate with an email service)
    console.log(`📧 Sending notification to ${recipientEmail}:`, {
      type,
      title,
      message,
      recipientName,
    });

    // Create an in-app alert as well
    const alertSeverity = type === 'problem_escalation' ? 'high' : 
                          type === 'kpi_alert' ? 'medium' : 'low';

    await supabaseAdmin
      .from('smart_alerts')
      .insert({
        type: `notification_${type}`,
        title: title,
        message: message,
        severity: alertSeverity,
        is_read: false,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${recipientEmail}`,
        notificationType: type,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
