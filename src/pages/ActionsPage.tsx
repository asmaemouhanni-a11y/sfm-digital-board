import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useActions, useCategories, useUpdateAction, useDeleteAction, useCreateAction } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateActionDialog } from '@/components/dashboard/CreateActionDialog';
import { 
  CheckSquare, 
  Clock, 
  Play,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Calendar,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const statusConfig = {
  todo: { label: 'À faire', class: 'bg-muted text-muted-foreground', icon: Clock },
  in_progress: { label: 'En cours', class: 'bg-primary/10 text-primary', icon: Play },
  completed: { label: 'Terminé', class: 'bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))]', icon: CheckCircle2 },
  overdue: { label: 'En retard', class: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
};

const priorityConfig = {
  urgent: { label: 'Urgent', class: 'priority-urgent' },
  high: { label: 'Haute', class: 'priority-high' },
  medium: { label: 'Moyenne', class: 'priority-medium' },
  low: { label: 'Basse', class: 'priority-low' },
};

export default function ActionsPage() {
  const [activeTab, setActiveTab] = useState<'todo' | 'in_progress' | 'completed'>('todo');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: todoActions, isLoading: todoLoading } = useActions(undefined, 'todo');
  const { data: inProgressActions, isLoading: progressLoading } = useActions(undefined, 'in_progress');
  const { data: completedActions, isLoading: completedLoading } = useActions(undefined, 'completed');
  const { data: categories } = useCategories();
  const { hasPermission, role } = useAuth();
  
  const updateAction = useUpdateAction();
  const deleteAction = useDeleteAction();

  const canManage = hasPermission(['admin', 'manager', 'team_leader']);

  const handleUpdateStatus = async (actionId: string, status: string) => {
    try {
      await updateAction.mutateAsync({ id: actionId, status: status as any });
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (actionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) return;
    try {
      await deleteAction.mutateAsync(actionId);
      toast.success('Action supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || 'Non catégorisé';
  };

  const renderActionCard = (action: any) => {
    const status = statusConfig[action.status as keyof typeof statusConfig] || statusConfig.todo;
    const priority = priorityConfig[action.priority as keyof typeof priorityConfig] || priorityConfig.medium;
    const StatusIcon = status.icon;

    return (
      <div
        key={action.id}
        className="p-4 rounded-lg border border-border/50 bg-card transition-all hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className={status.class}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              <Badge variant="outline" className={priority.class}>
                {priority.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getCategoryName(action.category_id)}
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground">{action.title}</h3>
            {action.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Échéance: {format(new Date(action.due_date), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
          
          {canManage && (
            <div className="flex flex-col gap-2">
              {action.status === 'todo' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(action.id, 'in_progress')}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {action.status === 'in_progress' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(action.id, 'completed')}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(action.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isLoading = todoLoading || progressLoading || completedLoading;

  if (isLoading) {
    return (
      <AppLayout title="Actions" subtitle="Gestion des actions et tâches">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Actions" subtitle="Gestion des actions et tâches">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-muted-foreground">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">À faire</p>
              <p className="text-2xl font-bold">{todoActions?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Play className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En cours</p>
              <p className="text-2xl font-bold text-primary">{inProgressActions?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--status-green))]/30 bg-[hsl(var(--status-green))]/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Terminées</p>
              <p className="text-2xl font-bold text-[hsl(var(--status-green))]">{completedActions?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Liste des actions</h2>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle action
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger value="todo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                À faire ({todoActions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                En cours ({inProgressActions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Terminées ({completedActions?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todo" className="m-0 p-4">
              <div className="space-y-3">
                {todoActions && todoActions.length > 0 ? (
                  todoActions.map(renderActionCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune action à faire
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="in_progress" className="m-0 p-4">
              <div className="space-y-3">
                {inProgressActions && inProgressActions.length > 0 ? (
                  inProgressActions.map(renderActionCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune action en cours
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="m-0 p-4">
              <div className="space-y-3">
                {completedActions && completedActions.length > 0 ? (
                  completedActions.map(renderActionCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune action terminée
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CreateActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}
