import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryDialog } from '@/components/admin/CategoryDialog';
import { KpiDialog } from '@/components/admin/KpiDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  LayoutGrid, 
  BarChart3,
  Shield,
  CheckCircle,
  DollarSign,
  Truck,
  TrendingUp,
  Users,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { SfmCategory, Kpi } from '@/types/sfm';

const iconMap: Record<string, React.ElementType> = {
  'shield': Shield,
  'check-circle': CheckCircle,
  'dollar-sign': DollarSign,
  'truck': Truck,
  'trending-up': TrendingUp,
  'users': Users,
  'settings': Settings,
  'alert-triangle': AlertTriangle,
};

export default function AdminPage() {
  const { hasPermission, role } = useAuth();
  
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<SfmCategory | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'category' | 'kpi'; id: string; name: string } | null>(null);

  // Only managers can access this page (admin only manages users)
  if (role === 'admin') {
    return <Navigate to="/users" replace />;
  }
  
  if (!hasPermission('manager')) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sfm_categories')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as SfmCategory[];
    },
  });

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpis')
        .select('*, category:sfm_categories(name, color)')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const handleEditCategory = (category: SfmCategory) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleNewCategory = () => {
    setSelectedCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleEditKpi = (kpi: Kpi) => {
    setSelectedKpi(kpi);
    setKpiDialogOpen(true);
  };

  const handleNewKpi = () => {
    setSelectedKpi(null);
    setKpiDialogOpen(true);
  };

  const handleDelete = (type: 'category' | 'kpi', id: string, name: string) => {
    setDeleteItem({ type, id, name });
    setDeleteDialogOpen(true);
  };

  return (
    <AppLayout title="Administration" subtitle="Gestion des catégories et KPIs">
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="categories" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="kpis" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            KPIs
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5" />
                  Catégories SFM
                </CardTitle>
                <CardDescription>
                  Gérez les catégories du Shop Floor Management
                </CardDescription>
              </div>
              <Button onClick={handleNewCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ordre</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Icône</TableHead>
                      <TableHead>Couleur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories?.map((category) => {
                      const Icon = iconMap[category.icon || 'settings'] || Settings;
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="font-mono">{category.display_order}</TableCell>
                          <TableCell>
                            <Badge variant="outline" style={{ borderColor: category.color, color: category.color }}>
                              {category.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>
                            <Icon className="h-5 w-5" style={{ color: category.color }} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: category.color }} />
                              <span className="text-sm text-muted-foreground">{category.color}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.is_active ? 'default' : 'secondary'}>
                              {category.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditCategory(category)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete('category', category.id, category.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Indicateurs de Performance (KPIs)
                </CardTitle>
                <CardDescription>
                  Gérez les KPIs de suivi
                </CardDescription>
              </div>
              <Button onClick={handleNewKpi}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau KPI
              </Button>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead>Cible</TableHead>
                      <TableHead>Fréquence</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis?.map((kpi: any) => (
                      <TableRow key={kpi.id}>
                        <TableCell className="font-medium">{kpi.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: kpi.category?.color, color: kpi.category?.color }}>
                            {kpi.category?.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{kpi.unit || '-'}</TableCell>
                        <TableCell className="font-mono">{kpi.target_value ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {kpi.frequency === 'daily' ? 'Quotidien' : 
                             kpi.frequency === 'weekly' ? 'Hebdo' : 'Mensuel'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={kpi.is_active ? 'default' : 'secondary'}>
                            {kpi.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditKpi(kpi)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete('kpi', kpi.id, kpi.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedCategory}
      />

      <KpiDialog
        open={kpiDialogOpen}
        onOpenChange={setKpiDialogOpen}
        kpi={selectedKpi}
      />

      {deleteItem && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          itemType={deleteItem.type}
          itemId={deleteItem.id}
          itemName={deleteItem.name}
        />
      )}
    </AppLayout>
  );
}
