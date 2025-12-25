import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, getWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SfmCategory, Kpi, KpiValue, Action, Problem } from '@/types/sfm';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

interface ReportData {
  categories: SfmCategory[];
  kpis: Kpi[];
  kpiValues: Map<string, KpiValue[]>;
  actions: Action[];
  problems: Problem[];
  reportType: 'daily' | 'weekly';
  date: Date;
  companyName?: string;
}

// Status colors
const STATUS_COLORS = {
  green: { r: 34, g: 197, b: 94 },
  orange: { r: 249, g: 115, b: 22 },
  red: { r: 239, g: 68, b: 68 },
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgent',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  completed: 'Terminée',
  overdue: 'En retard',
  open: 'Ouvert',
  resolved: 'Résolu',
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critique',
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
};

const TREND_SYMBOLS: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
};

export function generateSfmReport(data: ReportData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Calculate period
  const { startDate, endDate, periodLabel } = getPeriodInfo(data.date, data.reportType);

  // ===== PAGE 1: HEADER & SUMMARY =====
  
  // Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport SFM', margin, 18);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(data.reportType === 'daily' ? 'Quotidien' : 'Hebdomadaire', margin, 28);
  
  doc.setFontSize(10);
  doc.text(periodLabel, pageWidth - margin, 18, { align: 'right' });
  doc.text(data.companyName || 'SFM Digital', pageWidth - margin, 28, { align: 'right' });
  
  doc.setFontSize(8);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, pageWidth - margin, 36, { align: 'right' });
  
  yPosition = 50;
  
  // Summary Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Synthèse Globale', margin, yPosition);
  yPosition += 10;

  // Calculate stats
  const stats = calculateStats(data);
  
  // Summary boxes
  const boxWidth = (pageWidth - 2 * margin - 15) / 4;
  const boxHeight = 25;
  
  // KPIs box
  drawStatBox(doc, margin, yPosition, boxWidth, boxHeight, 'KPIs Suivis', stats.totalKpis.toString(), null);
  
  // KPI Status box
  drawStatusBox(doc, margin + boxWidth + 5, yPosition, boxWidth, boxHeight, 'KPIs Status', 
    stats.greenKpis, stats.orangeKpis, stats.redKpis);
  
  // Actions box
  drawStatBox(doc, margin + 2 * (boxWidth + 5), yPosition, boxWidth, boxHeight, 'Actions', 
    `${stats.completedActions}/${stats.totalActions}`, stats.overdueActions > 0 ? `${stats.overdueActions} en retard` : null);
  
  // Problems box
  drawStatBox(doc, margin + 3 * (boxWidth + 5), yPosition, boxWidth, boxHeight, 'Problèmes', 
    stats.openProblems.toString(), stats.criticalProblems > 0 ? `${stats.criticalProblems} critiques` : null);
  
  yPosition += boxHeight + 10;
  
  // Alert message
  const alertMessages = generateAlertMessages(stats);
  if (alertMessages.length > 0) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 15, 3, 3, 'F');
    doc.setTextColor(180, 83, 9); // amber-700
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠ Points d\'attention: ' + alertMessages.join(' | '), margin + 5, yPosition + 9);
    yPosition += 20;
  }
  
  yPosition += 5;
  
  // ===== KPI SECTION =====
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicateurs de Performance (KPIs)', margin, yPosition);
  yPosition += 8;

  // Group KPIs by category
  const kpisByCategory = groupKpisByCategory(data);
  
  for (const [categoryId, categoryKpis] of Object.entries(kpisByCategory)) {
    const category = data.categories.find(c => c.id === categoryId);
    if (!category || categoryKpis.length === 0) continue;
    
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }
    
    // Category header
    doc.setFillColor(hexToRgb(category.color).r, hexToRgb(category.color).g, hexToRgb(category.color).b);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${category.code} - ${category.name}`, margin + 5, yPosition + 5.5);
    yPosition += 12;
    
    // KPI table for this category
    const kpiTableData = categoryKpis.map(kpi => {
      const values = data.kpiValues.get(kpi.id) || [];
      const latestValue = values[values.length - 1];
      const status = latestValue?.status || 'green';
      const trend = latestValue?.trend || 'stable';
      
      return [
        kpi.name,
        kpi.target_value ? `${kpi.target_value} ${kpi.unit || ''}` : '-',
        latestValue ? `${latestValue.value} ${kpi.unit || ''}` : '-',
        getStatusLabel(status),
        TREND_SYMBOLS[trend] || '→',
      ];
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Indicateur', 'Objectif', 'Valeur', 'Status', 'Tendance']],
      body: kpiTableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 60 },
        3: { halign: 'center' },
        4: { halign: 'center', fontSize: 12 },
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const status = getStatusFromLabel(data.cell.text[0]);
          if (status === 'green') data.cell.styles.textColor = [34, 197, 94];
          else if (status === 'orange') data.cell.styles.textColor = [249, 115, 22];
          else if (status === 'red') data.cell.styles.textColor = [239, 68, 68];
        }
      },
    });
    
    yPosition = doc.lastAutoTable.finalY + 8;
  }
  
  // ===== ACTIONS SECTION =====
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  }
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Actions', margin, yPosition);
  
  // Progress indicator
  const completionRate = stats.totalActions > 0 ? Math.round((stats.completedActions / stats.totalActions) * 100) : 0;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Progression: ${completionRate}%`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 8;
  
  // Actions table
  const actionsTableData = data.actions
    .sort((a, b) => {
      // Sort by status (overdue first) then by due_date
      const statusOrder: Record<string, number> = { overdue: 0, todo: 1, in_progress: 2, completed: 3 };
      const isOverdueA = new Date(a.due_date) < new Date() && a.status !== 'completed';
      const isOverdueB = new Date(b.due_date) < new Date() && b.status !== 'completed';
      if (isOverdueA && !isOverdueB) return -1;
      if (!isOverdueA && isOverdueB) return 1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 15) // Limit to 15 actions
    .map(action => {
      const category = data.categories.find(c => c.id === action.category_id);
      const isOverdue = new Date(action.due_date) < new Date() && action.status !== 'completed';
      const statusLabel = isOverdue ? 'En retard' : STATUS_LABELS[action.status] || action.status;
      
      return [
        action.title.substring(0, 40) + (action.title.length > 40 ? '...' : ''),
        category?.code || '-',
        action.responsible?.full_name?.substring(0, 15) || '-',
        format(new Date(action.due_date), 'dd/MM/yyyy'),
        statusLabel,
        PRIORITY_LABELS[action.priority] || action.priority,
      ];
    });
  
  if (actionsTableData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Action', 'Cat.', 'Responsable', 'Échéance', 'Statut', 'Priorité']],
      body: actionsTableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 4) {
          const status = data.cell.text[0];
          if (status === 'En retard') {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Terminée') {
            data.cell.styles.textColor = [34, 197, 94];
          }
        }
        if (data.section === 'body' && data.column.index === 5) {
          const priority = data.cell.text[0];
          if (priority === 'Urgent') {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          } else if (priority === 'Haute') {
            data.cell.styles.textColor = [249, 115, 22];
          }
        }
      },
    });
    yPosition = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Aucune action pour cette période', margin, yPosition + 5);
    yPosition += 15;
  }
  
  // ===== PROBLEMS SECTION =====
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  }
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Problèmes', margin, yPosition);
  yPosition += 8;
  
  const problemsTableData = data.problems
    .sort((a, b) => {
      // Sort by severity (critical first) then by status (open first)
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const statusOrder: Record<string, number> = { open: 0, in_progress: 1, resolved: 2 };
      const sevDiff = (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
      if (sevDiff !== 0) return sevDiff;
      return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    })
    .slice(0, 15)
    .map(problem => {
      const category = data.categories.find(c => c.id === problem.category_id);
      
      return [
        problem.title.substring(0, 45) + (problem.title.length > 45 ? '...' : ''),
        category?.code || '-',
        SEVERITY_LABELS[problem.severity] || problem.severity,
        STATUS_LABELS[problem.status] || problem.status,
        format(new Date(problem.created_at), 'dd/MM/yyyy'),
      ];
    });
  
  if (problemsTableData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Problème', 'Cat.', 'Gravité', 'Statut', 'Date']],
      body: problemsTableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
          const severity = data.cell.text[0];
          if (severity === 'Critique') {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          } else if (severity === 'Élevée') {
            data.cell.styles.textColor = [249, 115, 22];
          }
        }
        if (data.section === 'body' && data.column.index === 3) {
          const status = data.cell.text[0];
          if (status === 'Résolu') {
            data.cell.styles.textColor = [34, 197, 94];
          }
        }
      },
    });
    yPosition = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Aucun problème pour cette période', margin, yPosition + 5);
    yPosition += 15;
  }
  
  // ===== FOOTER ON EACH PAGE =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('SFM Digital - Rapport automatique', margin, pageHeight - 10);
  }
  
  // Save the PDF
  const filename = `Rapport_SFM_${data.reportType === 'daily' ? 'Quotidien' : 'Hebdomadaire'}_${format(data.date, 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// Helper functions
function getPeriodInfo(date: Date, type: 'daily' | 'weekly') {
  if (type === 'daily') {
    return {
      startDate: startOfDay(date),
      endDate: endOfDay(date),
      periodLabel: `Journée du ${format(date, 'dd MMMM yyyy', { locale: fr })}`,
    };
  } else {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const weekNum = getWeek(date, { weekStartsOn: 1 });
    return {
      startDate: weekStart,
      endDate: weekEnd,
      periodLabel: `Semaine S${weekNum} (${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM/yyyy')})`,
    };
  }
}

function calculateStats(data: ReportData) {
  const totalKpis = data.kpis.length;
  let greenKpis = 0, orangeKpis = 0, redKpis = 0;
  
  data.kpis.forEach(kpi => {
    const values = data.kpiValues.get(kpi.id) || [];
    const latest = values[values.length - 1];
    if (latest) {
      if (latest.status === 'green') greenKpis++;
      else if (latest.status === 'orange') orangeKpis++;
      else if (latest.status === 'red') redKpis++;
    }
  });
  
  const now = new Date();
  const overdueActions = data.actions.filter(a => 
    new Date(a.due_date) < now && a.status !== 'completed'
  ).length;
  
  const completedActions = data.actions.filter(a => a.status === 'completed').length;
  
  const openProblems = data.problems.filter(p => p.status !== 'resolved').length;
  const criticalProblems = data.problems.filter(p => 
    p.severity === 'critical' && p.status !== 'resolved'
  ).length;
  
  return {
    totalKpis,
    greenKpis,
    orangeKpis,
    redKpis,
    totalActions: data.actions.length,
    completedActions,
    overdueActions,
    openProblems,
    criticalProblems,
  };
}

function generateAlertMessages(stats: ReturnType<typeof calculateStats>): string[] {
  const messages: string[] = [];
  
  if (stats.redKpis > 0) {
    messages.push(`${stats.redKpis} KPI(s) critique(s)`);
  }
  if (stats.overdueActions > 0) {
    messages.push(`${stats.overdueActions} action(s) en retard`);
  }
  if (stats.criticalProblems > 0) {
    messages.push(`${stats.criticalProblems} problème(s) critique(s)`);
  }
  
  return messages;
}

function groupKpisByCategory(data: ReportData): Record<string, Kpi[]> {
  const grouped: Record<string, Kpi[]> = {};
  
  data.kpis.forEach(kpi => {
    if (!grouped[kpi.category_id]) {
      grouped[kpi.category_id] = [];
    }
    grouped[kpi.category_id].push(kpi);
  });
  
  return grouped;
}

function drawStatBox(
  doc: jsPDF, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  title: string, 
  value: string, 
  subtitle: string | null
) {
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(x, y, width, height, 3, 3, 'F');
  
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(title, x + 5, y + 7);
  
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + 5, y + 18);
  
  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(239, 68, 68); // red-500
    doc.text(subtitle, x + 5, y + 23);
  }
}

function drawStatusBox(
  doc: jsPDF, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  title: string,
  green: number,
  orange: number,
  red: number
) {
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(x, y, width, height, 3, 3, 'F');
  
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(title, x + 5, y + 7);
  
  // Status circles
  const circleY = y + 16;
  const circleRadius = 4;
  const spacing = 18;
  
  // Green
  doc.setFillColor(34, 197, 94);
  doc.circle(x + 8, circleY, circleRadius, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(green.toString(), x + 14, circleY + 3);
  
  // Orange
  doc.setFillColor(249, 115, 22);
  doc.circle(x + 8 + spacing, circleY, circleRadius, 'F');
  doc.text(orange.toString(), x + 14 + spacing, circleY + 3);
  
  // Red
  doc.setFillColor(239, 68, 68);
  doc.circle(x + 8 + 2 * spacing, circleY, circleRadius, 'F');
  doc.text(red.toString(), x + 14 + 2 * spacing, circleY + 3);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 100, g: 100, b: 100 };
}

function getStatusLabel(status: string): string {
  if (status === 'green') return '✓ Vert';
  if (status === 'orange') return '⚠ Orange';
  if (status === 'red') return '✗ Rouge';
  return status;
}

function getStatusFromLabel(label: string): string {
  if (label.includes('Vert')) return 'green';
  if (label.includes('Orange')) return 'orange';
  if (label.includes('Rouge')) return 'red';
  return 'green';
}