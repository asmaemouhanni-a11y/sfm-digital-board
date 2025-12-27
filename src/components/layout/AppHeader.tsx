import { Bell, LogOut, User, ChevronDown, Settings, Sun, Moon, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSmartAlerts } from '@/hooks/useSfmData';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  team_leader: 'Chef d\'équipe',
  operator: 'Opérateur',
};

const roleColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  manager: 'bg-primary/10 text-primary border-primary/20',
  team_leader: 'bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))] border-[hsl(var(--status-orange))]/20',
  operator: 'bg-muted text-muted-foreground border-border',
};

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const navigate = useNavigate();
  const { profile, role, signOut, hasPermission } = useAuth();
  const { data: alerts } = useSmartAlerts();
  const { theme, setTheme } = useTheme();

  const queryClient = useQueryClient();

  const unreadAlerts = alerts?.filter(a => !a.is_read)?.length || 0;
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleMarkAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('smart_alerts')
      .update({ is_read: true })
      .eq('id', alertId);
    
    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = alerts?.filter(a => !a.is_read).map(a => a.id) || [];
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('smart_alerts')
      .update({ is_read: true })
      .in('id', unreadIds);
    
    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
      toast.success('Toutes les notifications sont lues');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))] border-[hsl(var(--status-orange))]/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {/* Current Date */}
        <div className="hidden lg:flex flex-col items-center text-right flex-shrink-0">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Changer de thème</span>
          </Button>

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadAlerts > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadAlerts > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Tout marquer lu
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[300px]">
                {alerts && alerts.length > 0 ? (
                  <div className="divide-y divide-border">
                    {alerts.slice(0, 10).map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${!alert.is_read ? 'bg-primary/5' : ''}`}
                        onClick={() => !alert.is_read && handleMarkAsRead(alert.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            alert.severity === 'high' ? 'bg-destructive' : 
                            alert.severity === 'medium' ? 'bg-[hsl(var(--status-orange))]' : 'bg-primary'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!alert.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                              {alert.title || alert.type}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {alert.message}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: fr })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Aucune notification</p>
                  </div>
                )}
              </ScrollArea>
              {hasPermission(['manager', 'team_leader']) && alerts && alerts.length > 0 && (
                <div className="p-2 border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => navigate('/alerts')}
                  >
                    Voir toutes les alertes
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
                <Avatar className="h-8 w-8">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{profile?.full_name || 'Utilisateur'}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${role ? roleColors[role] : ''}`}>
                    {role ? roleLabels[role] : 'Chargement...'}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              {hasPermission(['admin', 'manager']) && (
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
