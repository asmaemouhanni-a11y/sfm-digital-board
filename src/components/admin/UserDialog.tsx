import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AppRole } from '@/types/sfm';
import { Loader2 } from 'lucide-react';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    role: AppRole;
  } | null;
  mode: 'create' | 'edit';
}

const ROLE_CONFIG: Record<AppRole, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  team_leader: 'Chef d\'équipe',
  operator: 'Opérateur',
};

export function UserDialog({ open, onOpenChange, user, mode }: UserDialogProps) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('operator');

  useEffect(() => {
    if (user && mode === 'edit') {
      setFullName(user.full_name);
      setEmail(user.email);
      setRole(user.role);
      setPassword('');
    } else {
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('operator');
    }
  }, [user, mode, open]);

  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, fullName, role }: { email: string; password: string; fullName: string; role: AppRole }) => {
      // Create user using Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName, role },
        },
      });

      if (authError) throw authError;

      // Wait for the trigger to complete, then update profile status to approved
      if (authData.user) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await supabase
          .from('profiles')
          .update({ status: 'approved', full_name: fullName })
          .eq('user_id', authData.user.id);

        if (role !== 'operator') {
          await supabase
            .from('user_roles')
            .update({ role })
            .eq('user_id', authData.user.id);
        }
      }

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Utilisateur créé avec succès');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Cet email est déjà enregistré');
      } else {
        toast.error('Erreur lors de la création de l\'utilisateur');
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, fullName, email, role }: { userId: string; fullName: string; email: string; role: AppRole }) => {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, email })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Utilisateur mis à jour avec succès');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating user:', error);
      toast.error('Erreur lors de la mise à jour de l\'utilisateur');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (mode === 'create') {
      if (!password || password.length < 6) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      createUserMutation.mutate({ email, password, fullName, role });
    } else if (user) {
      updateUserMutation.mutate({ userId: user.user_id, fullName, email, role });
    }
  };

  const isPending = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Créer un utilisateur' : 'Modifier l\'utilisateur'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Ajoutez un nouvel utilisateur à l\'application' 
              : 'Modifiez les informations de l\'utilisateur'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean@exemple.com"
              required
              disabled={mode === 'edit'}
            />
            {mode === 'edit' && (
              <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
            )}
          </div>

          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select value={role} onValueChange={(value: AppRole) => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_CONFIG).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
