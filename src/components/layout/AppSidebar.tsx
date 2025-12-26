import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Bell, 
  CheckSquare, 
  AlertTriangle, 
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Factory,
  Users,
  FileBarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  requiredRole?: string[];
}

// Pages pour opérateurs - accès limité
const operatorItems: NavItem[] = [
  { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, requiredRole: ['manager', 'team_leader', 'operator'] },
  { title: 'Priorités du jour', href: '/priorities', icon: Target, requiredRole: ['manager', 'team_leader', 'operator'] },
  { title: 'Problèmes', href: '/problems', icon: AlertTriangle, requiredRole: ['manager', 'team_leader', 'operator'] },
];

// Pages supplémentaires pour chef d'équipe et manager
const teamLeaderItems: NavItem[] = [
  { title: 'Alertes', href: '/alerts', icon: Bell, requiredRole: ['manager', 'team_leader'] },
  { title: 'Actions', href: '/actions', icon: CheckSquare, requiredRole: ['manager', 'team_leader'] },
  { title: 'Notes', href: '/notes', icon: FileText, requiredRole: ['manager', 'team_leader'] },
  { title: 'Rapports', href: '/reports', icon: FileBarChart, requiredRole: ['manager'] },
];

// Pages d'administration - uniquement pour admin
const adminItems: NavItem[] = [
  { title: 'Utilisateurs', href: '/users', icon: Users, requiredRole: ['admin'] },
  { title: 'Paramètres', href: '/settings', icon: Settings, requiredRole: ['admin'] },
];

// Pages pour manager
const managerItems: NavItem[] = [
  { title: 'Catégories & KPIs', href: '/admin', icon: Settings, requiredRole: ['manager'] },
  { title: 'Paramètres', href: '/settings', icon: Settings, requiredRole: ['manager'] },
];

export function AppSidebar() {
  const { collapsed, toggle } = useSidebar();
  const location = useLocation();
  const { hasPermission, role } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const renderNavItem = (item: NavItem) => {
    if (item.requiredRole && !item.requiredRole.includes(role || '')) {
      return null;
    }

    const Icon = item.icon;
    const active = isActive(item.href);

    if (collapsed) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to={item.href}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 mx-auto',
                active
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
          active
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', active ? '' : 'group-hover:scale-110 transition-transform')} />
        <span className="font-medium text-sm">{item.title}</span>
      </Link>
    );
  };

  // Admin voit uniquement ses pages
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isTeamLeader = role === 'team_leader';
  const isOperator = role === 'operator';

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-64'
        )}
        style={{
          background: 'linear-gradient(180deg, hsl(220 20% 12%) 0%, hsl(220 18% 8%) 100%)',
        }}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 h-16 border-b border-sidebar-border/50',
          collapsed ? 'justify-center px-2' : 'px-4'
        )}>
          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0">
            <Factory className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-sidebar-foreground truncate">SFM Digital</span>
              <span className="text-xs text-sidebar-foreground/50 truncate">Gestion Lean</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {/* Admin Section - uniquement pour admin */}
          {isAdmin && (
            <div className="space-y-1">
              {adminItems.map(renderNavItem)}
            </div>
          )}

          {/* Pages opérationnelles - pour tous sauf admin */}
          {!isAdmin && (
            <>
              <div className="space-y-1">
                {operatorItems.map(renderNavItem)}
              </div>

              {/* Pages chef d'équipe et manager */}
              {(isTeamLeader || isManager) && (
                <div className="space-y-1 pt-2">
                  {teamLeaderItems.map(renderNavItem)}
                </div>
              )}

              {/* Pages manager */}
              {isManager && (
                <>
                  <div className="pt-4 pb-2">
                    {!collapsed && (
                      <span className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                        Administration
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {managerItems.map(renderNavItem)}
                  </div>
                </>
              )}
            </>
          )}
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-t border-sidebar-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn(
              'w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              !collapsed && 'justify-start gap-2'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm">Réduire</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
