import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCategories } from '@/hooks/useSfmData';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/hooks/useAuth';
import { SfmColumn } from '@/components/dashboard/SfmColumn';
import { CreateActionDialog } from '@/components/dashboard/CreateActionDialog';
import { CategoryDialog } from '@/components/admin/CategoryDialog';
import { KpiDialog } from '@/components/admin/KpiDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { SfmCategory, Kpi } from '@/types/sfm';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  BarChart3,
  Bell,
  Plus
} from 'lucide-react';

export default function DashboardPage() {
  const { role } = useAuth();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  // Category management
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SfmCategory | null>(null);
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);

  // KPI management
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);

  // Permissions - Admin and manager can manage categories and KPIs
  const canManageCategories = role === 'admin' || role === 'manager';

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleAddAction = (categoryId?: string) => {
    setSelectedCategoryId(categoryId);
    setActionDialogOpen(true);
  };

  const handleAddKpi = (categoryId?: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedKpi(null);
    setKpiDialogOpen(true);
  };

  const handleEditCategory = (category: SfmCategory) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    if (category) {
      setSelectedCategory(category);
      setDeleteCategoryOpen(true);
    }
  };

  const handleEditKpi = (kpi: Kpi) => {
    setSelectedKpi(kpi);
    setSelectedCategoryId(kpi.category_id);
    setKpiDialogOpen(true);
  };

  const isLoading = categoriesLoading || statsLoading;

  if (isLoading) {
    return (
      <AppLayout title="Tableau de bord" subtitle="Vue d'ensemble des catégories SFM">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[500px] w-[320px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Tableau de bord" subtitle="Vue d'ensemble des catégories SFM">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Catégories</p>
              <p className="text-xl sm:text-2xl font-bold">{stats?.activeCategories || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))]">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">KPIs actifs</p>
              <p className="text-xl sm:text-2xl font-bold">{stats?.activeKpis || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))]">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Actions</p>
              <p className="text-xl sm:text-2xl font-bold">{stats?.openActions || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Problèmes</p>
              <p className="text-xl sm:text-2xl font-bold">{stats?.openProblems || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-primary/10 text-primary">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Alertes</p>
              <p className="text-xl sm:text-2xl font-bold">{stats?.unreadAlerts || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SFM Columns */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-foreground">Catégories SFM</h2>
        {canManageCategories && (
          <Button onClick={handleAddCategory} size="sm" className="gap-2 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle catégorie</span>
            <span className="sm:hidden">Catégorie</span>
          </Button>
        )}
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
          {categories?.map((category) => (
            <SfmColumn 
              key={category.id}
              category={category} 
              onAddAction={() => handleAddAction(category.id)}
              onAddKpi={() => handleAddKpi(category.id)}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onEditKpi={handleEditKpi}
            />
          ))}
        </div>
      </div>

      <CreateActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        defaultCategoryId={selectedCategoryId}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedCategory}
      />

      <KpiDialog
        open={kpiDialogOpen}
        onOpenChange={setKpiDialogOpen}
        kpi={selectedKpi}
        defaultCategoryId={selectedCategoryId}
      />

      {selectedCategory && (
        <DeleteConfirmDialog
          open={deleteCategoryOpen}
          onOpenChange={setDeleteCategoryOpen}
          itemType="category"
          itemId={selectedCategory.id}
          itemName={selectedCategory.name}
        />
      )}
    </AppLayout>
  );
}
