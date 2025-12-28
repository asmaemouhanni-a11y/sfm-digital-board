import { Bell, LogOut, Settings, User, LayoutDashboard, ChevronDown } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  team_leader: 'Chef d\'équipe',
  operator: 'Opérateur',
};

export function DashboardHeader() {
  const { profile, role, signOut } = useAuth();
  const { data: alerts } = useSmartAlerts();

  const unreadAlerts = alerts?.length || 0;
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">SFM DigiBoard</h1>
              <p className="text-xs text-muted-foreground">Shop Floor Management</p>
            </div>
          </div>
        </div>

        {/* Current Date */}
        <div className="hidden md:flex flex-col items-center">
          <span className="text-sm font-medium text-foreground">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Alerts */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadAlerts > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadAlerts}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Alertes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {alerts && alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert) => (
                  <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1 p-3">
                    <span className="font-medium text-sm">{alert.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString('fr-FR')}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune alerte
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{profile?.full_name || 'Utilisateur'}</span>
                  <span className="text-xs text-muted-foreground">
                    {role ? roleLabels[role] : 'Chargement...'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              {role === 'admin' && (
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Administration
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
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
