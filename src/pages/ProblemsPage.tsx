import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProblems, useCategories, useUpdateProblem, useCreateProblem } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateProblemDialog } from '@/components/dashboard/CreateProblemDialog';
import { 
  AlertTriangle, 
  Clock, 
  Play,
  CheckCircle2,
  Plus,
  Calendar,
  AlertCircle,
  ArrowUpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const statusConfig = {
  open: { label: 'Ouvert', class: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
  in_progress: { label: 'En cours', class: 'bg-primary/10 text-primary', icon: Play },
  resolved: { label: 'Résolu', class: 'bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))]', icon: CheckCircle2 },
};

const severityConfig = {
  critical: { label: 'Critique', class: 'bg-destructive text-destructive-foreground' },
  high: { label: 'Haute', class: 'bg-[hsl(var(--status-orange))] text-white' },
  medium: { label: 'Moyenne', class: 'bg-primary text-primary-foreground' },
  low: { label: 'Basse', class: 'bg-muted text-muted-foreground' },
};

export default function ProblemsPage() {
  const [activeTab, setActiveTab] = useState<'open' | 'in_progress' | 'resolved'>('open');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: openProblems, isLoading: openLoading } = useProblems(undefined, 'open');
  const { data: inProgressProblems, isLoading: progressLoading } = useProblems(undefined, 'in_progress');
  const { data: resolvedProblems, isLoading: resolvedLoading } = useProblems(undefined, 'resolved');
  const { data: categories } = useCategories();
  const { hasPermission, role } = useAuth();
  
  const updateProblem = useUpdateProblem();

  const canManage = hasPermission(['admin', 'manager', 'team_leader']);

  const criticalCount = openProblems?.filter(p => p.severity === 'critical').length || 0;
  const escalatedCount = openProblems?.filter(p => p.escalated).length || 0;

  const handleUpdateStatus = async (problemId: string, status: string) => {
    try {
      await updateProblem.mutateAsync({ id: problemId, status: status as any });
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || 'Non catégorisé';
  };

  const renderProblemCard = (problem: any) => {
    const status = statusConfig[problem.status as keyof typeof statusConfig] || statusConfig.open;
    const severity = severityConfig[problem.severity as keyof typeof severityConfig] || severityConfig.medium;
    const StatusIcon = status.icon;

    return (
      <div
        key={problem.id}
        className={`p-4 rounded-lg border transition-all hover:shadow-md ${
          problem.severity === 'critical' 
            ? 'border-destructive/50 bg-destructive/5' 
            : 'border-border/50 bg-card'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={severity.class}>
                {severity.label}
              </Badge>
              <Badge variant="outline" className={status.class}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              {problem.escalated && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  <ArrowUpCircle className="h-3 w-3 mr-1" />
                  Escaladé
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {getCategoryName(problem.category_id)}
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground">{problem.title}</h3>
            {problem.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{problem.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Signalé le {format(new Date(problem.created_at), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
          
          {canManage && (
            <div className="flex flex-col gap-2">
              {problem.status === 'open' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(problem.id, 'in_progress')}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {problem.status === 'in_progress' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(problem.id, 'resolved')}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const isLoading = openLoading || progressLoading || resolvedLoading;

  if (isLoading) {
    return (
      <AppLayout title="Problèmes" subtitle="Suivi et résolution des problèmes">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Problèmes" subtitle="Suivi et résolution des problèmes">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ouverts</p>
              <p className="text-2xl font-bold text-destructive">{openProblems?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--status-orange))]/30 bg-[hsl(var(--status-orange))]/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))]">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critiques</p>
              <p className="text-2xl font-bold text-[hsl(var(--status-orange))]">{criticalCount}</p>
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
              <p className="text-2xl font-bold text-primary">{inProgressProblems?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--status-green))]/30 bg-[hsl(var(--status-green))]/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Résolus</p>
              <p className="text-2xl font-bold text-[hsl(var(--status-green))]">{resolvedProblems?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Liste des problèmes</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Signaler un problème
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger value="open" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Ouverts ({openProblems?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                En cours ({inProgressProblems?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="resolved" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Résolus ({resolvedProblems?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="m-0 p-4">
              <div className="space-y-3">
                {openProblems && openProblems.length > 0 ? (
                  openProblems.map(renderProblemCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun problème ouvert
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="in_progress" className="m-0 p-4">
              <div className="space-y-3">
                {inProgressProblems && inProgressProblems.length > 0 ? (
                  inProgressProblems.map(renderProblemCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun problème en cours
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="resolved" className="m-0 p-4">
              <div className="space-y-3">
                {resolvedProblems && resolvedProblems.length > 0 ? (
                  resolvedProblems.map(renderProblemCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun problème résolu
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CreateProblemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}
