import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTodayPriorities, useUpdateAction } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Calendar,
  User,
  ArrowUp
} from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const priorityConfig = {
  urgent: { label: 'Urgent', class: 'priority-urgent', icon: AlertTriangle },
  high: { label: 'Haute', class: 'priority-high', icon: ArrowUp },
  medium: { label: 'Moyenne', class: 'priority-medium', icon: Target },
  low: { label: 'Basse', class: 'priority-low', icon: Clock },
};

export default function PrioritiesPage() {
  const { data: priorities, isLoading } = useTodayPriorities();
  const { hasPermission } = useAuth();
  const updateAction = useUpdateAction();

  const overdueCount = priorities?.filter(p => isPast(new Date(p.due_date)) && !isToday(new Date(p.due_date))).length || 0;
  const urgentCount = priorities?.filter(p => p.priority === 'urgent').length || 0;
  const highCount = priorities?.filter(p => p.priority === 'high').length || 0;

  const handleComplete = async (actionId: string) => {
    try {
      await updateAction.mutateAsync({ id: actionId, status: 'completed' });
      toast.success('Action marquée comme terminée');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Priorités du jour" subtitle="Actions urgentes et à traiter aujourd'hui">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Priorités du jour" subtitle="Actions urgentes et à traiter aujourd'hui">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En retard</p>
              <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--status-orange))]/30 bg-[hsl(var(--status-orange))]/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Urgentes</p>
              <p className="text-2xl font-bold text-[hsl(var(--status-orange))]">{urgentCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <ArrowUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priorité haute</p>
              <p className="text-2xl font-bold text-primary">{highCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Liste des priorités ({priorities?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-400px)]">
            {priorities && priorities.length > 0 ? (
              <div className="space-y-3">
                {priorities.map((action) => {
                  const config = priorityConfig[action.priority || 'medium'];
                  const Icon = config.icon;
                  const isOverdue = isPast(new Date(action.due_date)) && !isToday(new Date(action.due_date));

                  return (
                    <div
                      key={action.id}
                      className={`p-4 rounded-lg border ${isOverdue ? 'border-destructive/50 bg-destructive/5' : 'border-border/50 bg-card'} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={config.class}>
                              <Icon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                En retard
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground">{action.title}</h3>
                          {action.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(action.due_date), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        </div>
                        
                        {hasPermission(['admin', 'manager', 'team_leader']) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleComplete(action.id)}
                            className="flex-shrink-0"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Terminer
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
                <h3 className="text-lg font-semibold text-foreground">Aucune priorité</h3>
                <p className="text-sm text-muted-foreground">Toutes les actions sont à jour</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
