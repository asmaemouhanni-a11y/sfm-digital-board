import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCategories, useKpis } from '@/hooks/useSfmData';
import { SfmColumn } from '@/components/dashboard/SfmColumn';
import { CreateActionDialog } from '@/components/dashboard/CreateActionDialog';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  BarChart3
} from 'lucide-react';

export default function DashboardPage() {
  const { data: categories, isLoading } = useCategories();
  
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const handleAddAction = (categoryId?: string) => {
    setSelectedCategoryId(categoryId);
    setActionDialogOpen(true);
  };

  const handleAddKpi = (categoryId?: string) => {
    setSelectedCategoryId(categoryId);
    setKpiDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AppLayout title="Tableau de bord" subtitle="Vue d'ensemble des catégories SFM">
        <div className="grid grid-cols-6 gap-4 h-[calc(100vh-180px)]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-full rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Tableau de bord" subtitle="Vue d'ensemble des catégories SFM">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Catégories actives</p>
              <p className="text-2xl font-bold">{categories?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))]">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">KPIs suivis</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))]">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actions en cours</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Problèmes ouverts</p>
              <p className="text-2xl font-bold">5</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SFM Columns */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-2">Catégories SFM</h2>
        <p className="text-sm text-muted-foreground">Sécurité, Qualité, Coût, Livraison, Performance, Humain</p>
      </div>

      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="flex gap-4 pb-4">
          {categories?.map((category) => (
            <div key={category.id} className="w-[320px] flex-shrink-0">
              <SfmColumn 
                category={category} 
                onAddAction={() => handleAddAction(category.id)}
                onAddKpi={() => handleAddKpi(category.id)}
              />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <CreateActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        defaultCategoryId={selectedCategoryId}
      />
    </AppLayout>
  );
}
