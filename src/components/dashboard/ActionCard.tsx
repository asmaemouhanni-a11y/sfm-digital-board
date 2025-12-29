import { useState } from 'react';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, User, AlertTriangle, Clock, CheckCircle, MoreHorizontal, Pencil, Trash2, Play, Check } from 'lucide-react';
import { Action } from '@/types/sfm';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUpdateAction, useDeleteAction } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';

interface ActionCardProps {
  action: Action;
  compact?: boolean;
  onEdit?: (action: Action) => void;
}

const priorityConfig = {
  urgent: { label: 'Urgent', className: 'priority-urgent' },
  high: { label: 'Haute', className: 'priority-high' },
  medium: { label: 'Moyenne', className: 'priority-medium' },
  low: { label: 'Basse', className: 'priority-low' },
};

const statusConfig = {
  todo: { label: 'À faire', icon: Clock, color: 'text-muted-foreground' },
  in_progress: { label: 'En cours', icon: Clock, color: 'text-primary' },
  completed: { label: 'Terminée', icon: CheckCircle, color: 'text-status-green' },
  overdue: { label: 'En retard', icon: AlertTriangle, color: 'text-destructive' },
};

export function ActionCard({ action, compact = false, onEdit }: ActionCardProps) {
  const { hasPermission, role } = useAuth();
  const updateAction = useUpdateAction();
  const deleteAction = useDeleteAction();

  const dueDate = parseISO(action.due_date);
  const isOverdue = isPast(dueDate) && action.status !== 'completed';
  const isDueToday = isToday(dueDate);

  const priority = priorityConfig[action.priority];
  const status = statusConfig[isOverdue ? 'overdue' : action.status];
  const StatusIcon = status.icon;

  // All roles except operator can manage
  const canManage = role !== 'operator';

  const handleStatusChange = (newStatus: 'todo' | 'in_progress' | 'completed') => {
    updateAction.mutate({
      id: action.id,
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    });
  };

  const handleDelete = () => {
    if (confirm('Supprimer cette action ?')) {
      deleteAction.mutate(action.id);
    }
  };

  if (compact) {
    return (
      <div 
        className={cn(
          "industrial-card p-3 transition-all duration-200 group w-full overflow-hidden",
          isOverdue && "border-destructive/50",
          isDueToday && !isOverdue && "border-status-orange/50"
        )}
      >
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <StatusIcon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", status.color)} />
            <span className="text-sm font-semibold leading-tight break-words">{action.title}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="outline" className={cn("text-xs px-2 py-0.5", priority.className)}>
              {priority.label}
            </Badge>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(action)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                  )}
                  {action.status !== 'completed' && (
                    <>
                      <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                        <Play className="h-3.5 w-3.5 mr-2" />
                        En cours
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                        <Check className="h-3.5 w-3.5 mr-2" />
                        Terminée
                      </DropdownMenuItem>
                    </>
                  )}
                  {action.status === 'completed' && (
                    <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                      <Clock className="h-3.5 w-3.5 mr-2" />
                      Réouvrir
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Date row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span className={cn(
            isOverdue && "text-destructive",
            isDueToday && !isOverdue && "text-status-orange"
          )}>
            {format(dueDate, 'dd MMM.', { locale: fr })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "industrial-card p-4 transition-all duration-200 group",
        isOverdue && "border-destructive/50",
        isDueToday && !isOverdue && "border-status-orange/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className={cn("h-4 w-4 flex-shrink-0", status.color)} />
            <h3 className="font-semibold text-foreground truncate">{action.title}</h3>
          </div>
          
          {action.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {action.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className={cn(
                isOverdue && "text-destructive font-medium",
                isDueToday && !isOverdue && "text-status-orange font-medium"
              )}>
                {format(dueDate, 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
            
            {action.responsible && (
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>{action.responsible.full_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={cn("text-xs", priority.className)}>
            {priority.label}
          </Badge>
          
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(action)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {action.status !== 'completed' && (
                  <>
                    <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                      <Play className="h-3.5 w-3.5 mr-2" />
                      Marquer en cours
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                      <Check className="h-3.5 w-3.5 mr-2" />
                      Marquer terminée
                    </DropdownMenuItem>
                  </>
                )}
                {action.status === 'completed' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                    <Clock className="h-3.5 w-3.5 mr-2" />
                    Réouvrir
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
