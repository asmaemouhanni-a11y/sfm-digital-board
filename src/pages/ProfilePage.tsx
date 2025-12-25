import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  User,
  Mail,
  Shield,
  Save,
  Loader2,
  Calendar,
  Camera
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  team_leader: "Chef d'équipe",
  operator: 'Opérateur',
};

const roleColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  manager: 'bg-primary/10 text-primary border-primary/20',
  team_leader: 'bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))] border-[hsl(var(--status-orange))]/20',
  operator: 'bg-muted text-muted-foreground border-border',
};

export default function ProfilePage() {
  const { profile, role, user } = useAuth();
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState({
    full_name: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: async (data: { full_name: string; avatar_url: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error) => {
      console.error('Error saving profile:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
    },
  });

  const handleSaveProfile = () => {
    saveProfileMutation.mutate(profileData);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout title="Mon Profil" subtitle="Gérez vos informations personnelles">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={profileData.avatar_url} alt={profileData.full_name} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {getInitials(profileData.full_name || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold">{profileData.full_name || 'Utilisateur'}</h2>
                <p className="text-muted-foreground">{profile?.email}</p>
                <Badge variant="outline" className={`mt-2 ${role ? roleColors[role] : ''}`}>
                  {role ? roleLabels[role] : 'Chargement...'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Profile Card */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Modifier le profil
              </CardTitle>
              <CardDescription>
                Mettez à jour vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={profileData.full_name}
                  onChange={(e) => 
                    setProfileData(prev => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Votre nom complet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">URL de l'avatar</Label>
                <div className="flex gap-2">
                  <Input
                    id="avatarUrl"
                    value={profileData.avatar_url}
                    onChange={(e) => 
                      setProfileData(prev => ({ ...prev, avatar_url: e.target.value }))
                    }
                    placeholder="https://exemple.com/avatar.jpg"
                  />
                  <Button variant="outline" size="icon" disabled>
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Entrez l'URL d'une image pour votre avatar
                </p>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                className="w-full"
                disabled={saveProfileMutation.isPending}
              >
                {saveProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Informations du compte
              </CardTitle>
              <CardDescription>
                Détails de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-[hsl(var(--status-green))]/20 text-[hsl(var(--status-green))] border-[hsl(var(--status-green))]/30">
                  Vérifié
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Rôle</p>
                    <p className="text-sm text-muted-foreground">
                      {role ? roleLabels[role] : 'Chargement...'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Membre depuis</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.created_at 
                        ? format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: fr })
                        : '-'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
