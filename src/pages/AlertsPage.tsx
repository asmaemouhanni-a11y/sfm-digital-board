import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAllAlerts, useMarkAlertRead, useGenerateAlerts, useDeleteAlert } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { 
  Bell, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Trash2,
  TrendingDown,
  Target,
  ClipboardList,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const severityConfig: Record<string, { icon: React.ElementType; class: string; bgClass: string; label: string; order: number }> = {
  critical: { 
    icon: AlertTriangle, 
    class: 'bg-destructive/10 text-destructive border-destructive/20', 
    bgClass: 'border-destructive/50 bg-destructive/5',
    label: 'Critique', 
    order: 0 
  },
  high: { 
    icon: AlertCircle, 
    class: 'bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))] border-[hsl(var(--status-orange))]/20', 
    bgClass: 'border-[hsl(var(--status-orange))]/50 bg-[hsl(var(--status-orange))]/5',
    label: 'Haute', 
    order: 1 
  },
  medium: { 
    icon: Info, 
    class: 'bg-primary/10 text-primary border-primary/20', 
    bgClass: 'border-primary/50 bg-primary/5',
    label: 'Moyenne', 
    order: 2 
  },
  low: { 
    icon: Bell, 
    class: 'bg-muted text-muted-foreground border-border', 
    bgClass: 'border-border bg-muted/50',
    label: 'Basse', 
    order: 3 
  },
};

const typeIcons: Record<string, React.ElementType> = {
  kpi_critical: Target,
  kpi_warning: Target,
  kpi_trend: TrendingDown,
  action_overdue: Clock,
  action_urgent: ClipboardList,
  problem_critical: AlertTriangle,
  problem_unresolved: AlertCircle,
};

const typeLabels: Record<string, string> = {
  kpi_critical: 'KPI Critique',
  kpi_warning: 'KPI Alerte',
  kpi_trend: 'Tendance KPI',
  action_overdue: 'Action en retard',
  action_urgent: 'Action urgente',
  problem_critical: 'Problème critique',
  problem_unresolved: 'Problème non résolu',
};

// Sort by severity (critical first), then by date
const sortAlerts = (alerts: any[]) => {
  return [...alerts].sort((a, b) => {
    const orderA = severityConfig[a.severity]?.order ?? 99;
    const orderB = severityConfig[b.severity]?.order ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export default function AlertsPage() {
  const { data: alerts, isLoading } = useAllAlerts();
  const { hasPermission } = useAuth();
  const markRead = useMarkAlertRead();
  const generateAlerts = useGenerateAlerts();
  const deleteAlert = useDeleteAlert();

  const [activeTab, setActiveTab] = useState('unread');

  const unreadAlerts = alerts?.filter(a => !a.is_read) || [];
  const readAlerts = alerts?.filter(a => a.is_read) || [];
  
  const criticalCount = unreadAlerts.filter(a => a.severity === 'critical').length;
  const highCount = unreadAlerts.filter(a => a.severity === 'high').length;

  const displayAlerts = activeTab === 'unread' ? sortAlerts(unreadAlerts) : sortAlerts(readAlerts);

  const handleMarkRead = async (alertId: string) => {
    try {
      await markRead.mutateAsync(alertId);
      toast.success('Alerte marquée comme lue');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await deleteAlert.mutateAsync(alertId);
      toast.success('Alerte supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleRefresh = async () => {
    try {
      const result = await generateAlerts.mutateAsync();
      toast.success(`Alertes actualisées: ${result.newAlertsCreated} nouvelles alertes`);
    } catch (error) {
      toast.error('Erreur lors de la génération des alertes');
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Alertes" subtitle="Notifications et alertes système">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Alertes" subtitle="Notifications et alertes système">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critiques</p>
              <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--status-orange))]/30 bg-[hsl(var(--status-orange))]/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))]">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priorité haute</p>
              <p className="text-2xl font-bold text-[hsl(var(--status-orange))]">{highCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <EyeOff className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Non lues</p>
              <p className="text-2xl font-bold text-primary">{unreadAlerts.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-muted/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-muted-foreground">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lues</p>
              <p className="text-2xl font-bold text-muted-foreground">{readAlerts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Alertes intelligentes
          </CardTitle>
          {hasPermission(['admin', 'manager']) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={generateAlerts.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${generateAlerts.isPending ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="unread" className="gap-2">
                <EyeOff className="h-4 w-4" />
                Non lues ({unreadAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="read" className="gap-2">
                <Eye className="h-4 w-4" />
                Historique ({readAlerts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unread" className="mt-0">
              {renderAlertsList(displayAlerts, true)}
            </TabsContent>

            <TabsContent value="read" className="mt-0">
              {renderAlertsList(displayAlerts, false)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AppLayout>
  );

  function renderAlertsList(alertsList: any[], showMarkRead: boolean) {
    if (alertsList.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-[hsl(var(--status-green))] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">
            {showMarkRead ? 'Aucune alerte non lue' : 'Aucun historique'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {showMarkRead ? 'Tout fonctionne normalement' : 'Les anciennes alertes apparaîtront ici'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {alertsList.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.low;
          const SeverityIcon = config.icon;
          const TypeIcon = typeIcons[alert.type] || Bell;

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                alert.is_read ? 'border-border/30 bg-muted/20 opacity-70' : config.bgClass
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className={config.class}>
                      <SeverityIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1">
                      <TypeIcon className="h-3 w-3" />
                      {typeLabels[alert.type] || alert.type}
                    </Badge>
                    {alert.category && (
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: `${alert.category.color}50`,
                          color: alert.category.color,
                          backgroundColor: `${alert.category.color}10`
                        }}
                      >
                        {alert.category.code}
                      </Badge>
                    )}
                  </div>
                  {alert.title && (
                    <h3 className="font-semibold text-foreground mb-1">{alert.title}</h3>
                  )}
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(alert.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
                
                {hasPermission(['admin', 'manager']) && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {showMarkRead && !alert.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkRead(alert.id)}
                        disabled={markRead.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Marquer lu</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(alert.id)}
                      disabled={deleteAlert.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}
