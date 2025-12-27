import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Settings, 
  Bell, 
  Shield, 
  Building2, 
  Save,
  Loader2,
  KeyRound,
  Send,
  CheckCircle2
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { sendNotification } from '@/lib/notifications';

interface NotificationSettings {
  email_alerts: boolean;
  action_reminders: boolean;
  problem_escalation: boolean;
  kpi_alerts: boolean;
}

interface AppSettings {
  company_name: string;
  timezone: string;
  language: string;
}

export default function SettingsPage() {
  const { role, profile, user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  // Redirect non-authorized users
  if (!hasPermission(['admin', 'manager'])) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch user notification settings
  const { data: userSettings, isLoading: userSettingsLoading } = useQuery({
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

  // Fetch app settings (admin only)
  const { data: appSettingsData, isLoading: appSettingsLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) throw error;
      
      const settings: AppSettings = {
        company_name: 'Mon Entreprise',
        timezone: 'Europe/Paris',
        language: 'fr',
      };
      
      data?.forEach(item => {
        if (item.key in settings) {
          (settings as any)[item.key] = item.value;
        }
      });
      
      return settings;
    },
    enabled: role === 'admin',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_alerts: true,
    action_reminders: true,
    problem_escalation: true,
    kpi_alerts: true,
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    company_name: 'Mon Entreprise',
    timezone: 'Europe/Paris',
    language: 'fr',
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (userSettings) {
      setNotifications({
        email_alerts: userSettings.email_alerts ?? true,
        action_reminders: userSettings.action_reminders ?? true,
        problem_escalation: userSettings.problem_escalation ?? true,
        kpi_alerts: userSettings.kpi_alerts ?? true,
      });
    }
  }, [userSettings]);

  useEffect(() => {
    if (appSettingsData) {
      setAppSettings(appSettingsData);
    }
  }, [appSettingsData]);

  // Save notification settings mutation
  const saveNotificationsMutation = useMutation({
    mutationFn: async (settings: NotificationSettings) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_settings')
          .update(settings)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id, ...settings });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success('Paramètres de notification enregistrés');
    },
    onError: (error) => {
      console.error('Error saving notifications:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  // Save app settings mutation (admin only)
  const saveAppSettingsMutation = useMutation({
    mutationFn: async (settings: AppSettings) => {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_by: user?.id,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: update.value, updated_by: update.updated_by })
          .eq('key', update.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('Paramètres de l\'application enregistrés');
    },
    onError: (error) => {
      console.error('Error saving app settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const handleSaveNotifications = () => {
    saveNotificationsMutation.mutate(notifications);
  };

  const handleSaveApp = () => {
    saveAppSettingsMutation.mutate(appSettings);
  };

  const isLoading = userSettingsLoading || (role === 'admin' && appSettingsLoading);

  return (
    <AppLayout title="Paramètres" subtitle="Configuration de l'application">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Settings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configurez les alertes et rappels automatiques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {userSettingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailAlerts">Alertes par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir les alertes importantes par email
                    </p>
                  </div>
                  <Switch
                    id="emailAlerts"
                    checked={notifications.email_alerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, email_alerts: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="actionReminders">Rappels d'actions</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications pour les actions à échéance proche
                    </p>
                  </div>
                  <Switch
                    id="actionReminders"
                    checked={notifications.action_reminders}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, action_reminders: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="problemEscalation">Escalade problèmes</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertes lors de l'escalade de problèmes critiques
                    </p>
                  </div>
                  <Switch
                    id="problemEscalation"
                    checked={notifications.problem_escalation}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, problem_escalation: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="kpiAlerts">Alertes KPI</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications quand un KPI passe au rouge
                    </p>
                  </div>
                  <Switch
                    id="kpiAlerts"
                    checked={notifications.kpi_alerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, kpi_alerts: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium">Tester les notifications</p>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      if (!profile?.email) {
                        toast.error('Email non disponible');
                        return;
                      }
                      const result = await sendNotification({
                        type: 'general',
                        title: 'Test de notification',
                        message: 'Ceci est un test de notification. Si vous recevez ce message, vos notifications fonctionnent correctement.',
                        recipientEmail: profile.email,
                        recipientName: profile.full_name,
                      });
                      if (result.success) {
                        toast.success('Notification de test envoyée !');
                      } else {
                        toast.error(result.error || result.message || 'Erreur lors de l\'envoi');
                      }
                    }}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer une notification de test
                  </Button>
                </div>

                <Button 
                  onClick={handleSaveNotifications} 
                  className="w-full mt-4"
                  disabled={saveNotificationsMutation.isPending}
                >
                  {saveNotificationsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer les préférences
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Application Settings - Admin only */}
        {role === 'admin' && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Application
              </CardTitle>
              <CardDescription>
                Paramètres généraux de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {appSettingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de l'entreprise</Label>
                    <Input
                      id="companyName"
                      value={appSettings.company_name}
                      onChange={(e) => 
                        setAppSettings(prev => ({ ...prev, company_name: e.target.value }))
                      }
                      placeholder="Nom de votre entreprise"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuseau horaire</Label>
                    <Input
                      id="timezone"
                      value={appSettings.timezone}
                      onChange={(e) => 
                        setAppSettings(prev => ({ ...prev, timezone: e.target.value }))
                      }
                      placeholder="Europe/Paris"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Langue</Label>
                    <Input
                      id="language"
                      value={appSettings.language}
                      onChange={(e) => 
                        setAppSettings(prev => ({ ...prev, language: e.target.value }))
                      }
                      placeholder="fr"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Seul le français est disponible actuellement
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveApp} 
                    className="w-full mt-4"
                    disabled={saveAppSettingsMutation.isPending}
                  >
                    {saveAppSettingsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Security Info */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Gérez la sécurité de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-3 mb-3">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Mot de passe oublié ?</p>
                  <p className="text-sm text-muted-foreground">
                    Réinitialisez votre mot de passe par email
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={async () => {
                  if (!profile?.email) {
                    toast.error('Email non disponible');
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
                    redirectTo: `${window.location.origin}/auth`,
                  });
                  if (error) {
                    toast.error('Erreur lors de l\'envoi de l\'email');
                  } else {
                    toast.success('Email de réinitialisation envoyé !');
                  }
                }}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Réinitialiser le mot de passe
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              À propos
            </CardTitle>
            <CardDescription>
              Informations sur l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">Version</p>
              <Badge variant="outline">1.0.0</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">Nom de l'application</p>
              <p className="text-sm text-muted-foreground">SFM Digital</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">Gestion Lean Manufacturing</p>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                Application de gestion de la performance opérationnelle basée sur les principes du Shop Floor Management.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
