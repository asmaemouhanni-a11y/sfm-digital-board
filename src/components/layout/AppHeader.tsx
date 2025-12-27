import { Bell, LogOut, User, ChevronDown, Settings, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
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
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { theme, setTheme } = useTheme();

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Admin ne voit pas les alertes opérationnelles
  const showAlerts = role !== 'admin';

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

          {/* Alerts - Hidden for admin, redirects to alerts page */}
          {showAlerts && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => navigate('/alerts')}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          )}

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
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
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
