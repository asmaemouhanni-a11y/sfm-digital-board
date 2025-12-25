import { AppLayout } from '@/components/layout/AppLayout';
import { useSmartAlerts, useMarkAlertRead } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { 
  Bell, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const severityConfig: Record<string, { icon: React.ElementType; class: string; label: string }> = {
  critical: { icon: AlertTriangle, class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Critique' },
  high: { icon: AlertCircle, class: 'bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))] border-[hsl(var(--status-orange))]/20', label: 'Haute' },
  medium: { icon: Info, class: 'bg-primary/10 text-primary border-primary/20', label: 'Moyenne' },
  low: { icon: Bell, class: 'bg-muted text-muted-foreground border-border', label: 'Basse' },
};

export default function AlertsPage() {
  const { data: alerts, isLoading } = useSmartAlerts();
  const { hasPermission } = useAuth();
  const markRead = useMarkAlertRead();

  const criticalCount = alerts?.filter(a => a.severity === 'critical').length || 0;
  const highCount = alerts?.filter(a => a.severity === 'high').length || 0;

  const handleMarkRead = async (alertId: string) => {
    try {
      await markRead.mutateAsync(alertId);
      toast.success('Alerte marquée comme lue');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total alertes</p>
              <p className="text-2xl font-bold text-primary">{alerts?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Toutes les alertes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity] || severityConfig.low;
                const Icon = config.icon;

                return (
                  <div
                    key={alert.id}
                    className="p-4 rounded-lg border border-border/50 bg-card transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={config.class}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-foreground">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(alert.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      
                      {hasPermission(['admin', 'manager']) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkRead(alert.id)}
                          className="flex-shrink-0"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Marquer lu
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-[hsl(var(--status-green))] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Aucune alerte</h3>
              <p className="text-sm text-muted-foreground">Tout fonctionne normalement</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
