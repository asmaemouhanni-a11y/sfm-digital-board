import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertData {
  type: string;
  title: string;
  message: string;
  severity: string;
  related_id?: string;
  related_type?: string;
  category_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting alert generation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create client with user context to verify authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // 3. Verify user authentication
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.log('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // 4. Check if user has admin or manager role using service role for the check
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.log('Error fetching user role:', roleError.message);
      return new Response(
        JSON.stringify({ error: 'Forbidden - unable to verify role' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roleData || !['admin', 'manager'].includes(roleData.role)) {
      console.log('User does not have required role:', roleData?.role);
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin or manager role required' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User role verified:', roleData.role);

    // 5. Now proceed with alert generation using service role
    const today = new Date().toISOString().split('T')[0];
    const alertsToCreate: AlertData[] = [];

    // Check for KPI alerts (critical status or negative trend)
    console.log('Checking KPI alerts...');
    const { data: kpiValues, error: kpiError } = await supabaseAdmin
      .from('kpi_values')
      .select(`
        id,
        kpi_id,
        value,
        status,
        trend,
        recorded_at,
        kpi:kpis(id, name, category_id)
      `)
      .order('recorded_at', { ascending: false });

    if (kpiError) {
      console.error('Error fetching KPI values:', kpiError);
    } else if (kpiValues) {
      // Group by KPI to get latest value per KPI
      const latestByKpi = new Map<string, any>();
      for (const value of kpiValues) {
        if (!latestByKpi.has(value.kpi_id)) {
          latestByKpi.set(value.kpi_id, value);
        }
      }

      for (const [kpiId, latestValue] of latestByKpi) {
        const kpi = latestValue.kpi as any;
        if (!kpi) continue;

        // KPI critical (red status)
        if (latestValue.status === 'red') {
          alertsToCreate.push({
            type: 'kpi_critical',
            title: `KPI critique: ${kpi.name}`,
            message: `Le KPI "${kpi.name}" est en zone critique (rouge). Valeur actuelle: ${latestValue.value}`,
            severity: 'critical',
            related_id: kpiId,
            related_type: 'kpi',
            category_id: kpi.category_id,
          });
        }

        // KPI warning (orange status)
        if (latestValue.status === 'orange') {
          alertsToCreate.push({
            type: 'kpi_warning',
            title: `KPI en alerte: ${kpi.name}`,
            message: `Le KPI "${kpi.name}" est en zone d'alerte (orange). Valeur actuelle: ${latestValue.value}`,
            severity: 'high',
            related_id: kpiId,
            related_type: 'kpi',
            category_id: kpi.category_id,
          });
        }

        // KPI negative trend (declining performance)
        if (latestValue.trend === 'down' && latestValue.status !== 'green') {
          alertsToCreate.push({
            type: 'kpi_trend',
            title: `Tendance négative: ${kpi.name}`,
            message: `Le KPI "${kpi.name}" montre une tendance à la baisse.`,
            severity: 'medium',
            related_id: kpiId,
            related_type: 'kpi',
            category_id: kpi.category_id,
          });
        }
      }
    }

    // Check for overdue actions
    console.log('Checking overdue actions...');
    const { data: overdueActions, error: actionsError } = await supabaseAdmin
      .from('actions')
      .select('id, title, due_date, priority, category_id')
      .lt('due_date', today)
      .neq('status', 'completed');

    if (actionsError) {
      console.error('Error fetching overdue actions:', actionsError);
    } else if (overdueActions) {
      for (const action of overdueActions) {
        const isUrgent = action.priority === 'urgent' || action.priority === 'high';
        alertsToCreate.push({
          type: 'action_overdue',
          title: `Action en retard: ${action.title}`,
          message: `L'action "${action.title}" est en retard (échéance: ${action.due_date})`,
          severity: isUrgent ? 'critical' : 'high',
          related_id: action.id,
          related_type: 'action',
          category_id: action.category_id,
        });
      }
    }

    // Check for critical/high priority actions due today
    console.log('Checking urgent actions due today...');
    const { data: urgentTodayActions, error: urgentError } = await supabaseAdmin
      .from('actions')
      .select('id, title, priority, category_id')
      .eq('due_date', today)
      .in('priority', ['urgent', 'high'])
      .neq('status', 'completed');

    if (urgentError) {
      console.error('Error fetching urgent actions:', urgentError);
    } else if (urgentTodayActions) {
      for (const action of urgentTodayActions) {
        alertsToCreate.push({
          type: 'action_urgent',
          title: `Action urgente aujourd'hui: ${action.title}`,
          message: `L'action urgente "${action.title}" doit être terminée aujourd'hui.`,
          severity: 'high',
          related_id: action.id,
          related_type: 'action',
          category_id: action.category_id,
        });
      }
    }

    // Check for critical/high severity problems
    console.log('Checking critical problems...');
    const { data: criticalProblems, error: problemsError } = await supabaseAdmin
      .from('problems')
      .select('id, title, severity, category_id, created_at')
      .in('severity', ['critical', 'high'])
      .neq('status', 'resolved');

    if (problemsError) {
      console.error('Error fetching problems:', problemsError);
    } else if (criticalProblems) {
      for (const problem of criticalProblems) {
        const isCritical = problem.severity === 'critical';
        
        // Check if problem is old (more than 3 days)
        const createdDate = new Date(problem.created_at);
        const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        const isOld = daysSinceCreation > 3;

        alertsToCreate.push({
          type: isOld ? 'problem_unresolved' : 'problem_critical',
          title: `Problème ${isCritical ? 'critique' : 'important'}: ${problem.title}`,
          message: isOld 
            ? `Le problème "${problem.title}" n'est pas résolu depuis ${daysSinceCreation} jours.`
            : `Problème de gravité ${isCritical ? 'critique' : 'élevée'}: "${problem.title}"`,
          severity: isCritical ? 'critical' : 'high',
          related_id: problem.id,
          related_type: 'problem',
          category_id: problem.category_id,
        });
      }
    }

    // Delete old read alerts (cleanup - older than 7 days)
    console.log('Cleaning up old alerts...');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: deleteError } = await supabaseAdmin
      .from('smart_alerts')
      .delete()
      .eq('is_read', true)
      .lt('created_at', sevenDaysAgo);

    if (deleteError) {
      console.error('Error deleting old alerts:', deleteError);
    }

    // Check for existing alerts to avoid duplicates
    console.log(`Processing ${alertsToCreate.length} potential alerts...`);
    
    const { data: existingAlerts, error: existingError } = await supabaseAdmin
      .from('smart_alerts')
      .select('related_id, type')
      .eq('is_read', false);

    if (existingError) {
      console.error('Error fetching existing alerts:', existingError);
    }

    const existingSet = new Set(
      existingAlerts?.map(a => `${a.type}-${a.related_id}`) || []
    );

    // Filter out duplicates
    const newAlerts = alertsToCreate.filter(
      alert => !existingSet.has(`${alert.type}-${alert.related_id}`)
    );

    console.log(`Creating ${newAlerts.length} new alerts...`);

    // Insert new alerts
    if (newAlerts.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('smart_alerts')
        .insert(newAlerts.map(alert => ({
          ...alert,
          is_read: false,
        })));

      if (insertError) {
        console.error('Error inserting alerts:', insertError);
        throw insertError;
      }
    }

    const summary = {
      totalChecked: alertsToCreate.length,
      newAlertsCreated: newAlerts.length,
      duplicatesSkipped: alertsToCreate.length - newAlerts.length,
    };

    console.log('Alert generation completed:', summary);

    return new Response(
      JSON.stringify({ success: true, ...summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
