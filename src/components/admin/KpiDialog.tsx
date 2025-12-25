import { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Kpi } from '@/types/sfm';
import { Separator } from '@/components/ui/separator';

interface KpiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi?: Kpi | null;
  defaultCategoryId?: string;
}

const FREQUENCIES = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
];

const CHART_TYPES = [
  { value: 'time_series', label: 'Série temporelle' },
  { value: 'histogram', label: 'Histogramme' },
  { value: 'pareto', label: 'Pareto' },
  { value: 'control_chart', label: 'Carte de contrôle' },
  { value: 'box_plot', label: 'Boîte à moustaches' },
];

const UNITS = [
  { value: '%', label: '%' },
  { value: 'heures', label: 'Heures' },
  { value: 'pièces', label: 'Pièces' },
  { value: '€', label: '€' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'jours', label: 'Jours' },
  { value: 'minutes', label: 'Minutes' },
];

const PERFORMANCE_DIRECTIONS = [
  { value: 'higher_is_better', label: 'Plus la valeur est élevée, mieux c\'est', icon: TrendingUp },
  { value: 'lower_is_better', label: 'Plus la valeur est faible, mieux c\'est', icon: TrendingDown },
];

export function KpiDialog({ open, onOpenChange, kpi, defaultCategoryId }: KpiDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!kpi;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sfm_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    unit: '',
    target_value: '',
    performance_direction: 'higher_is_better' as 'higher_is_better' | 'lower_is_better',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    warning_threshold: '',
    critical_threshold: '',
    chart_type: 'time_series' as 'time_series' | 'pareto' | 'histogram' | 'control_chart' | 'box_plot',
    display_order: '0',
    is_active: true,
  });

  useEffect(() => {
    if (kpi) {
      setFormData({
        name: kpi.name,
        description: kpi.description || '',
        category_id: kpi.category_id,
        unit: kpi.unit || '',
        target_value: kpi.target_value?.toString() || '',
        performance_direction: (kpi as any).performance_direction || 'higher_is_better',
        frequency: kpi.frequency || 'daily',
        warning_threshold: (kpi as any).warning_threshold?.toString() || '',
        critical_threshold: (kpi as any).critical_threshold?.toString() || '',
        chart_type: kpi.chart_type || 'time_series',
        display_order: (kpi as any).display_order?.toString() || '0',
        is_active: kpi.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category_id: defaultCategoryId || '',
        unit: '',
        target_value: '',
        performance_direction: 'higher_is_better',
        frequency: 'daily',
        warning_threshold: '',
        critical_threshold: '',
        chart_type: 'time_series',
        display_order: '0',
        is_active: true,
      });
    }
  }, [kpi, defaultCategoryId, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        category_id: data.category_id,
        unit: data.unit || null,
        target_value: data.target_value ? parseFloat(data.target_value) : null,
        performance_direction: data.performance_direction,
        frequency: data.frequency,
        warning_threshold: data.warning_threshold ? parseFloat(data.warning_threshold) : null,
        critical_threshold: data.critical_threshold ? parseFloat(data.critical_threshold) : null,
        chart_type: data.chart_type,
        display_order: parseInt(data.display_order) || 0,
        is_active: data.is_active,
      };

      if (isEditing && kpi) {
        const { error } = await supabase
          .from('kpis')
          .update(payload)
          .eq('id', kpi.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('kpis')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success(isEditing ? 'KPI modifié' : 'KPI créé');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error saving KPI:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le KPI' : 'Nouveau KPI'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifiez les informations du KPI' : 'Créez un nouvel indicateur de performance'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Informations générales
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Nom du KPI *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Taux de défauts, TRS, Absentéisme"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description (optionnelle)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description détaillée du KPI"
                  rows={2}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Catégorie SFM *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Objectif & mesure */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Objectif & mesure
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Valeur cible (objectif)</Label>
                <Input
                  id="target"
                  type="number"
                  step="any"
                  value={formData.target_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                  placeholder="Ex: 95, ≤ 2, ≥ 85"
                />
              </div>

              <div className="space-y-2">
                <Label>Unité de mesure</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Sens de performance</Label>
                <Select 
                  value={formData.performance_direction} 
                  onValueChange={(value: 'higher_is_better' | 'lower_is_better') => setFormData(prev => ({ ...prev, performance_direction: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERFORMANCE_DIRECTIONS.map((dir) => (
                      <SelectItem key={dir.value} value={dir.value}>
                        <div className="flex items-center gap-2">
                          <dir.icon className="h-4 w-4" />
                          {dir.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fréquence de suivi */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Fréquence de suivi
            </h3>
            
            <div className="space-y-2">
              <Label>Fréquence de mesure</Label>
              <Select 
                value={formData.frequency} 
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFormData(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Seuils d'alerte */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Seuils d'alerte
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warning" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  Seuil Orange (alerte)
                </Label>
                <Input
                  id="warning"
                  type="number"
                  step="any"
                  value={formData.warning_threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, warning_threshold: e.target.value }))}
                  placeholder="Écart toléré"
                />
                <p className="text-xs text-muted-foreground">Écart toléré par rapport à l'objectif</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="critical" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Seuil Rouge (critique)
                </Label>
                <Input
                  id="critical"
                  type="number"
                  step="any"
                  value={formData.critical_threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, critical_threshold: e.target.value }))}
                  placeholder="Écart critique"
                />
                <p className="text-xs text-muted-foreground">Écart critique par rapport à l'objectif</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Paramètres d'affichage */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Paramètres d'affichage
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Type de graphique</Label>
                <Select 
                  value={formData.chart_type} 
                  onValueChange={(value: 'time_series' | 'pareto' | 'histogram' | 'control_chart' | 'box_plot') => setFormData(prev => ({ ...prev, chart_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Ordre d'affichage</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="is_active">KPI actif</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
