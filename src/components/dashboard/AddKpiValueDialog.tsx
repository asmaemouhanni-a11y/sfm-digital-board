import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories, useKpis, useAddKpiValue, useKpiValues } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';
import { Kpi, KpiStatus, KpiTrend } from '@/types/sfm';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AddKpiValueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultKpiId?: string;
  defaultCategoryId?: string;
}

// Calculate status based on value, target, thresholds, and performance direction
function calculateStatus(
  value: number,
  target: number | null | undefined,
  warningThreshold: number | null | undefined,
  criticalThreshold: number | null | undefined,
  direction: string | null | undefined
): KpiStatus {
  if (!target) return 'green';
  
  const isHigherBetter = direction !== 'lower_is_better';
  
  // Calculate difference from target
  const diff = isHigherBetter ? target - value : value - target;
  const percentDiff = Math.abs(diff / target) * 100;
  
  // Check against thresholds
  if (criticalThreshold !== null && criticalThreshold !== undefined) {
    if (diff > 0 && percentDiff >= criticalThreshold) {
      return 'red';
    }
  }
  
  if (warningThreshold !== null && warningThreshold !== undefined) {
    if (diff > 0 && percentDiff >= warningThreshold) {
      return 'orange';
    }
  }
  
  // Simple comparison if no thresholds
  if (isHigherBetter) {
    if (value >= target) return 'green';
    if (value >= target * 0.9) return 'orange';
    return 'red';
  } else {
    if (value <= target) return 'green';
    if (value <= target * 1.1) return 'orange';
    return 'red';
  }
}

// Calculate trend based on current and previous value
function calculateTrend(
  currentValue: number,
  previousValue: number | null | undefined,
  direction: string | null | undefined
): KpiTrend {
  if (previousValue === null || previousValue === undefined) return 'stable';
  
  const diff = currentValue - previousValue;
  const threshold = Math.abs(previousValue * 0.01); // 1% threshold for stability
  
  if (Math.abs(diff) <= threshold) return 'stable';
  
  return diff > 0 ? 'up' : 'down';
}

export function AddKpiValueDialog({ open, onOpenChange, defaultKpiId, defaultCategoryId }: AddKpiValueDialogProps) {
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultCategoryId || '');
  const [selectedKpiId, setSelectedKpiId] = useState<string>(defaultKpiId || '');
  const [value, setValue] = useState('');
  const [periodType, setPeriodType] = useState<'week' | 'date'>('week');
  const [weekNumber, setWeekNumber] = useState('');
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');

  const { data: allKpis } = useKpis(selectedCategoryId || undefined);
  const addKpiValue = useAddKpiValue();

  // Get the selected KPI details
  const selectedKpi = useMemo(() => {
    return allKpis?.find(k => k.id === selectedKpiId);
  }, [allKpis, selectedKpiId]);

  // Get previous values for trend calculation
  const { data: previousValues } = useKpiValues(selectedKpiId, 2);
  const latestValue = previousValues?.[previousValues.length - 1];

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCategoryId(defaultCategoryId || '');
      setSelectedKpiId(defaultKpiId || '');
      setValue('');
      setWeekNumber('');
      setRecordedDate(new Date().toISOString().split('T')[0]);
      setComment('');
      
      // Set current week number
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNum = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
      setWeekNumber(weekNum.toString());
    }
  }, [open, defaultCategoryId, defaultKpiId]);

  // Update KPI selection when category changes
  useEffect(() => {
    if (allKpis && allKpis.length > 0 && !selectedKpiId) {
      setSelectedKpiId(allKpis[0].id);
    }
  }, [allKpis, selectedKpiId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedKpiId || !value) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    // Calculate status and trend
    const status = calculateStatus(
      numValue,
      selectedKpi?.target_value,
      (selectedKpi as any)?.warning_threshold,
      (selectedKpi as any)?.critical_threshold,
      (selectedKpi as any)?.performance_direction
    );

    const trend = calculateTrend(
      numValue,
      latestValue?.value,
      (selectedKpi as any)?.performance_direction
    );

    addKpiValue.mutate({
      kpi_id: selectedKpiId,
      value: numValue,
      week_number: periodType === 'week' ? parseInt(weekNumber) : undefined,
      recorded_at: recordedDate,
      status,
      trend,
      comment: comment || undefined,
      recorded_by: user?.id,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  // Preview calculations
  const previewStatus = useMemo(() => {
    if (!value || !selectedKpi) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    return calculateStatus(
      numValue,
      selectedKpi.target_value,
      (selectedKpi as any)?.warning_threshold,
      (selectedKpi as any)?.critical_threshold,
      (selectedKpi as any)?.performance_direction
    );
  }, [value, selectedKpi]);

  const previewTrend = useMemo(() => {
    if (!value) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    return calculateTrend(
      numValue,
      latestValue?.value,
      (selectedKpi as any)?.performance_direction
    );
  }, [value, latestValue, selectedKpi]);

  const statusColors = {
    green: 'hsl(var(--status-green))',
    orange: 'hsl(var(--status-orange))',
    red: 'hsl(var(--status-red))',
  };

  const TrendIcon = previewTrend === 'up' ? TrendingUp : previewTrend === 'down' ? TrendingDown : Minus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Ajouter une valeur KPI
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Catégorie SFM</Label>
            <Select value={selectedCategoryId} onValueChange={(v) => {
              setSelectedCategoryId(v);
              setSelectedKpiId('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name} ({cat.code})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* KPI Selection */}
          <div className="space-y-2">
            <Label>Indicateur KPI *</Label>
            <Select value={selectedKpiId} onValueChange={setSelectedKpiId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un KPI" />
              </SelectTrigger>
              <SelectContent>
                {allKpis?.map((kpi) => (
                  <SelectItem key={kpi.id} value={kpi.id}>
                    {kpi.name} {kpi.unit ? `(${kpi.unit})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedKpi?.target_value && (
              <p className="text-xs text-muted-foreground">
                Objectif: {selectedKpi.target_value} {selectedKpi.unit}
              </p>
            )}
          </div>

          {/* Period Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de période</Label>
              <Select value={periodType} onValueChange={(v) => setPeriodType(v as 'week' | 'date')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semaine (S1, S2...)</SelectItem>
                  <SelectItem value="date">Date précise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodType === 'week' ? (
              <div className="space-y-2">
                <Label>Numéro de semaine</Label>
                <Input
                  type="number"
                  min="1"
                  max="53"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(e.target.value)}
                  placeholder="Ex: 1, 2, 3..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={recordedDate}
                  onChange={(e) => setRecordedDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Value Input */}
          <div className="space-y-2">
            <Label>Valeur mesurée *</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Entrer la valeur"
                className="flex-1"
                required
              />
              {selectedKpi?.unit && (
                <span className="text-sm text-muted-foreground">{selectedKpi.unit}</span>
              )}
            </div>
          </div>

          {/* Status & Trend Preview */}
          {previewStatus && value && (
            <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: statusColors[previewStatus] }}
                />
                <span className="text-sm font-medium">
                  Statut: {previewStatus === 'green' ? 'Vert (OK)' : previewStatus === 'orange' ? 'Orange (Alerte)' : 'Rouge (Critique)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendIcon className="h-4 w-4" style={{ color: statusColors[previewStatus] }} />
                <span className="text-sm text-muted-foreground">
                  {previewTrend === 'up' ? 'Hausse' : previewTrend === 'down' ? 'Baisse' : 'Stable'}
                </span>
              </div>
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <Label>Commentaire (optionnel)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!selectedKpiId || !value || addKpiValue.isPending}>
              {addKpiValue.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
