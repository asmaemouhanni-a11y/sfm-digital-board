import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Building2, 
  Mail,
  Save
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function SettingsPage() {
  const { role, profile, hasPermission } = useAuth();

  // Redirect non-authorized users
  if (!hasPermission(['admin', 'manager'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    actionReminders: true,
    problemEscalation: true,
    kpiAlerts: true,
  });

  const [appSettings, setAppSettings] = useState({
    companyName: 'Mon Entreprise',
    timezone: 'Europe/Paris',
    language: 'fr',
  });

  const handleSaveNotifications = () => {
    toast.success('Paramètres de notification enregistrés');
  };

  const handleSaveApp = () => {
    toast.success('Paramètres de l\'application enregistrés');
  };

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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailAlerts">Alertes par email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les alertes importantes par email
                </p>
              </div>
              <Switch
                id="emailAlerts"
                checked={notifications.emailAlerts}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, emailAlerts: checked }))
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
                checked={notifications.actionReminders}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, actionReminders: checked }))
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
                checked={notifications.problemEscalation}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, problemEscalation: checked }))
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
                checked={notifications.kpiAlerts}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, kpiAlerts: checked }))
                }
              />
            </div>

            <Button onClick={handleSaveNotifications} className="w-full mt-4">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        {/* Application Settings */}
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
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input
                id="companyName"
                value={appSettings.companyName}
                onChange={(e) => 
                  setAppSettings(prev => ({ ...prev, companyName: e.target.value }))
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

            <Button onClick={handleSaveApp} className="w-full mt-4">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Informations sur votre compte et sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-[hsl(var(--status-green))]/20 text-[hsl(var(--status-green))] border-[hsl(var(--status-green))]/30">
                Vérifié
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Rôle</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {role === 'admin' ? 'Administrateur' : 
                     role === 'manager' ? 'Manager' :
                     role === 'team_leader' ? 'Chef d\'équipe' : 'Opérateur'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Thème</p>
                  <p className="text-sm text-muted-foreground">Sombre</p>
                </div>
              </div>
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
