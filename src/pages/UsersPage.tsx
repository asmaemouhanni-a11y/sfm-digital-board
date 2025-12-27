import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Shield, 
  ShieldCheck, 
  Users, 
  UserCog, 
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  Settings,
  CheckCircle,
  DollarSign,
  Truck,
  TrendingUp,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { AppRole, SfmCategory } from '@/types/sfm';
import { CategoryDialog } from '@/components/admin/CategoryDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { UserDialog } from '@/components/admin/UserDialog';
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog';
import { PendingUsersTab } from '@/components/admin/PendingUsersTab';

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  created_at: string;
  status?: string;
}

const ROLE_CONFIG: Record<AppRole, { label: string; color: string; icon: React.ElementType; description: string }> = {
  admin: { 
    label: 'Administrateur', 
    color: 'bg-destructive/20 text-destructive border-destructive/30',
    icon: ShieldCheck,
    description: 'Gestion des utilisateurs uniquement'
  },
  manager: { 
    label: 'Manager', 
    color: 'bg-primary/20 text-primary border-primary/30',
    icon: Shield,
    description: 'Accès complet, validation des actions, Suivi global des KPI'
  },
  team_leader: { 
    label: 'Chef d\'équipe', 
    color: 'bg-[hsl(var(--status-orange))]/20 text-[hsl(var(--status-orange))] border-[hsl(var(--status-orange))]/30',
    icon: UserCog,
    description: 'Gestion des actions, déclaration de problèmes'
  },
  operator: { 
    label: 'Opérateur', 
    color: 'bg-muted text-muted-foreground border-border',
    icon: Users,
    description: 'Déclaration de problèmes, consultation'
  },
};

const iconMap: Record<string, React.ElementType> = {
  'shield': Shield,
  'check-circle': CheckCircle,
  'dollar-sign': DollarSign,
  'truck': Truck,
  'trending-up': TrendingUp,
  'users': Users,
  'settings': Settings,
  'alert-triangle': AlertTriangle,
};

export default function UsersPage() {
  const { role: currentUserRole, user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SfmCategory | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'category' | 'kpi'; id: string; name: string } | null>(null);

  // User management states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userDialogMode, setUserDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);

  // Redirect non-admin users
  if (currentUserRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, created_at, status')
        .eq('status', 'approved');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles.map(r => [r.user_id, r.role]));

      return profiles.map(p => ({
        ...p,
        role: (roleMap.get(p.user_id) || 'operator') as AppRole,
      })) as UserWithRole[];
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sfm_categories')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as SfmCategory[];
    },
  });

  const { data: pendingCount } = useQuery({
    queryKey: ['pending-users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count || 0;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Rôle mis à jour avec succès');
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    },
  });

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    if (userId === currentUser?.id) {
      toast.error('Vous ne pouvez pas modifier votre propre rôle');
      return;
    }
    updateRoleMutation.mutate({ userId, newRole });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleEditCategory = (category: SfmCategory) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleNewCategory = () => {
    setSelectedCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setDeleteItem({ type: 'category', id, name });
    setDeleteDialogOpen(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserDialogMode('create');
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setUserDialogMode('edit');
    setUserDialogOpen(true);
  };

  const handleDeleteUser = (user: UserWithRole) => {
    setUserToDelete(user);
    setDeleteUserDialogOpen(true);
  };

  return (
    <AppLayout title="Administration" subtitle="Gestion des utilisateurs et configuration">
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2 relative">
            <UserPlus className="h-4 w-4" />
            En attente
            {pendingCount && pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          {/* Role Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(ROLE_CONFIG).map(([role, config]) => {
              const count = users?.filter(u => u.role === role).length || 0;
              const Icon = config.icon;
              return (
                <Card key={role} className="bg-gradient-to-br from-card to-card/80 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{config.label}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{config.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Users Table */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Liste des utilisateurs
                </CardTitle>
                <CardDescription>
                  Gérez les rôles et permissions des utilisateurs de l'application
                </CardDescription>
              </div>
              <Button onClick={handleCreateUser}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle actuel</TableHead>
                      <TableHead>Modifier le rôle</TableHead>
                      <TableHead>Date d'inscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => {
                      const roleConfig = ROLE_CONFIG[user.role];
                      const isCurrentUser = user.user_id === currentUser?.id;
                      
                      return (
                        <TableRow key={user.id} className={isCurrentUser ? 'bg-primary/5' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.full_name}</p>
                                {isCurrentUser && (
                                  <span className="text-xs text-primary">(vous)</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={roleConfig.color}>
                              {roleConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                              disabled={isCurrentUser || updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrateur</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="team_leader">Chef d'équipe</SelectItem>
                                <SelectItem value="operator">Opérateur</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleEditUser(user)}
                                disabled={isCurrentUser}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteUser(user)}
                                disabled={isCurrentUser}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Users Tab */}
        <TabsContent value="pending">
          <PendingUsersTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedCategory}
      />

      {deleteItem && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          itemType={deleteItem.type}
          itemId={deleteItem.id}
          itemName={deleteItem.name}
        />
      )}

      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={selectedUser}
        mode={userDialogMode}
      />

      <DeleteUserDialog
        open={deleteUserDialogOpen}
        onOpenChange={setDeleteUserDialogOpen}
        user={userToDelete}
      />
    </AppLayout>
  );
}
