import { useState } from 'react';
import { Shield, CheckCircle, DollarSign, Truck, TrendingUp, Users, AlertTriangle, Clock, Plus, Pencil, Trash2, MoreHorizontal, PlusCircle } from 'lucide-react';
import { SfmCategory, Kpi, Action } from '@/types/sfm';
import { useKpis, useCategoryStats, useActions, useDeleteKpi } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';
import { KpiChart } from './KpiChart';
import { ActionCard } from './ActionCard';
import { EditActionDialog } from './EditActionDialog';
import { AddKpiValueDialog } from './AddKpiValueDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'shield': Shield,
  'check-circle': CheckCircle,
  'dollar-sign': DollarSign,
  'truck': Truck,
  'trending-up': TrendingUp,
  'users': Users,
};

interface SfmColumnProps {
  category: SfmCategory;
  onAddAction?: () => void;
  onAddKpi?: () => void;
  onEditCategory?: (category: SfmCategory) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onEditKpi?: (kpi: Kpi) => void;
}

export function SfmColumn({ category, onAddAction, onAddKpi, onEditCategory, onDeleteCategory, onEditKpi }: SfmColumnProps) {
  const { role } = useAuth();
  const { data: kpis } = useKpis(category.id);
  const { data: stats } = useCategoryStats(category.id);
  const { data: actions } = useActions(category.id);
  const deleteKpi = useDeleteKpi();
  
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [editActionOpen, setEditActionOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [addValueDialogOpen, setAddValueDialogOpen] = useState(false);
  
  const Icon = iconMap[category.icon || 'trending-up'] || TrendingUp;
  const selectedKpi = kpis?.find(k => k.id === selectedKpiId) || kpis?.[0];

  const openActions = actions?.filter(a => a.status !== 'completed') || [];

  // All roles except operator can manage actions
  const canManage = role !== 'operator';
  // Admin and manager can manage categories and KPIs
  const canManageCategories = role === 'admin' || role === 'manager';
  const canManageKpis = role === 'admin' || role === 'manager';

  const handleEditAction = (action: Action) => {
    setSelectedAction(action);
    setEditActionOpen(true);
  };

  const handleDeleteKpi = (kpiId: string) => {
    if (confirm('Supprimer cet indicateur KPI ?')) {
      deleteKpi.mutate(kpiId);
    }
  };

  return (
    <div 
      className="sfm-column flex flex-col h-auto min-h-[400px]"
      data-code={category.code}
      style={{ '--category-color': category.color } as React.CSSProperties}
    >
      {/* Header */}
      <div 
        className="p-4 border-b border-border/30"
        style={{ borderBottomColor: `${category.color}30` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <Icon className="h-5 w-5" style={{ color: category.color }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
              <span 
                className="text-xs font-mono font-semibold"
                style={{ color: category.color }}
              >
                {category.code}
              </span>
            </div>
          </div>
          {canManageCategories && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditCategory?.(category)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteCategory?.(category.id)} 
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 mt-3">
          {stats?.overdueActions && stats.overdueActions > 0 ? (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              {stats.overdueActions} en retard
            </Badge>
          ) : null}
          {stats?.openActions ? (
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {stats.openActions} actions
            </Badge>
          ) : null}
        </div>
      </div>

      {/* KPI Selector */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Indicateur KPI
          </span>
          {canManageKpis && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddKpi}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {kpis && kpis.length > 0 ? (
          <div className="flex items-center gap-2">
            <Select 
              value={selectedKpi?.id || ''} 
              onValueChange={(value) => setSelectedKpiId(value)}
            >
              <SelectTrigger className="flex-1 bg-background/50">
                <SelectValue placeholder="Sélectionner un KPI" />
              </SelectTrigger>
              <SelectContent>
                {kpis.map((kpi) => (
                  <SelectItem key={kpi.id} value={kpi.id}>
                    {kpi.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManageKpis && selectedKpi && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditKpi?.(selectedKpi)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteKpi(selectedKpi.id)} 
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            Aucun KPI configuré
          </div>
        )}
      </div>

      {/* KPI Chart */}
      {selectedKpi && (
        <div className="p-4 border-b border-border/30">
          <KpiChart kpi={selectedKpi} categoryColor={category.color} />
          {/* Add KPI Value Button */}
          {canManageKpis && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3 gap-2"
              onClick={() => setAddValueDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Ajouter une valeur
            </Button>
          )}
        </div>
      )}

      {/* Actions Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Plan d'actions
            </span>
            <Badge variant="outline" className="text-xs">
              {openActions.length}
            </Badge>
          </div>
          {canManage && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddAction}>
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-3">
            {openActions.length > 0 ? (
              openActions.slice(0, 5).map((action) => (
                <ActionCard 
                  key={action.id} 
                  action={action} 
                  compact 
                  onEdit={canManage ? handleEditAction : undefined}
                />
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Aucune action en cours
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Edit Action Dialog */}
      <EditActionDialog
        open={editActionOpen}
        onOpenChange={setEditActionOpen}
        action={selectedAction}
      />

      {/* Add KPI Value Dialog */}
      <AddKpiValueDialog
        open={addValueDialogOpen}
        onOpenChange={setAddValueDialogOpen}
        defaultKpiId={selectedKpi?.id}
        defaultCategoryId={category.id}
      />
    </div>
  );
}
