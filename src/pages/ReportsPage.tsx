import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCategories, useKpis, useActions, useProblems } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  CalendarIcon, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  Target,
  TrendingUp,
  Loader2,
  FileDown
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, getWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { generateSfmReport } from '@/lib/pdfReportGenerator';
import { KpiValue } from '@/types/sfm';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: kpis, isLoading: kpisLoading } = useKpis();
  const { data: actions, isLoading: actionsLoading } = useActions();
  const { data: problems, isLoading: problemsLoading } = useProblems();
  const { hasPermission } = useAuth();

  const isLoading = categoriesLoading || kpisLoading || actionsLoading || problemsLoading;

  // Calculate stats for preview
  const stats = {
    totalKpis: kpis?.length || 0,
    greenKpis: 0,
    orangeKpis: 0,
    redKpis: 0,
    totalActions: actions?.length || 0,
    completedActions: actions?.filter(a => a.status === 'completed').length || 0,
    overdueActions: actions?.filter(a => new Date(a.due_date) < new Date() && a.status !== 'completed').length || 0,
    openProblems: problems?.filter(p => p.status !== 'resolved').length || 0,
    criticalProblems: problems?.filter(p => p.severity === 'critical' && p.status !== 'resolved').length || 0,
  };

  const handleGenerateReport = async () => {
    if (!categories || !kpis || !actions || !problems) {
      toast.error('Données non disponibles');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Fetch KPI values for all KPIs
      const kpiValuesMap = new Map<string, KpiValue[]>();
      
      for (const kpi of kpis) {
        const { data, error } = await supabase
          .from('kpi_values')
          .select('*')
          .eq('kpi_id', kpi.id)
          .order('recorded_at', { ascending: true })
          .limit(12);
        
        if (!error && data) {
          kpiValuesMap.set(kpi.id, data as KpiValue[]);
        }
      }

      // Generate the PDF
      generateSfmReport({
        categories,
        kpis,
        kpiValues: kpiValuesMap,
        actions,
        problems,
        reportType,
        date: selectedDate,
        companyName: 'SFM Digital',
      });

      toast.success('Rapport PDF généré avec succès');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPeriodLabel = () => {
    if (reportType === 'daily') {
      return format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr });
    } else {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekNum = getWeek(selectedDate, { weekStartsOn: 1 });
      return `Semaine S${weekNum} (${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM/yyyy')})`;
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Rapports" subtitle="Génération de rapports PDF">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Rapports" subtitle="Génération de rapports PDF automatiques">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Configuration du rapport
              </CardTitle>
              <CardDescription>
                Sélectionnez le type et la période du rapport
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de rapport</label>
                <Tabs value={reportType} onValueChange={(v) => setReportType(v as 'daily' | 'weekly')}>
                  <TabsList className="w-full">
                    <TabsTrigger value="daily" className="flex-1 gap-2">
                      <Clock className="h-4 w-4" />
                      Quotidien
                    </TabsTrigger>
                    <TabsTrigger value="weekly" className="flex-1 gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Hebdomadaire
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date / Période</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {getPeriodLabel()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      locale={fr}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateReport} 
                className="w-full" 
                size="lg"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Générer le rapport PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileDown className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Rapport automatique</p>
                  <p className="text-muted-foreground mt-1">
                    Le rapport inclut automatiquement les KPIs, actions, et problèmes 
                    de votre base de données.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aperçu du contenu</CardTitle>
              <CardDescription>
                Données qui seront incluses dans le rapport
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">KPIs</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalKpis}</p>
                  <p className="text-xs text-muted-foreground">indicateurs suivis</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-green))]" />
                    <span className="text-sm font-medium">Actions</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.completedActions}/{stats.totalActions}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.overdueActions > 0 && (
                      <span className="text-destructive">{stats.overdueActions} en retard</span>
                    )}
                    {stats.overdueActions === 0 && 'terminées'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-orange))]" />
                    <span className="text-sm font-medium">Problèmes</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.openProblems}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.criticalProblems > 0 && (
                      <span className="text-destructive">{stats.criticalProblems} critiques</span>
                    )}
                    {stats.criticalProblems === 0 && 'ouverts'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Catégories</span>
                  </div>
                  <p className="text-2xl font-bold">{categories?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">catégories SFM</p>
                </div>
              </div>

              {/* Sections Preview */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Sections du rapport
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">En-tête & Synthèse globale</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Page 1</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-green))]" />
                      <span className="text-sm font-medium">KPIs par catégorie (SQCDPH)</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{stats.totalKpis} KPIs</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-orange))]" />
                      <span className="text-sm font-medium">Actions et leur statut</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{stats.totalActions} actions</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="text-sm font-medium">Problèmes et gravité</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{problems?.length || 0} problèmes</Badge>
                  </div>
                </div>
              </div>

              {/* Categories Preview */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Catégories SFM incluses
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categories?.map((cat) => (
                    <Badge 
                      key={cat.id} 
                      variant="outline"
                      style={{ 
                        borderColor: `${cat.color}50`,
                        color: cat.color,
                        backgroundColor: `${cat.color}10`
                      }}
                    >
                      {cat.code} - {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}