import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Factory, Shield, TrendingUp, Users, Briefcase, HardHat, Wrench, Clock, LogOut, Camera, X } from 'lucide-react';
import { z } from 'zod';
import { AppRole } from '@/types/sfm';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe: 6 caractères minimum'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Nom requis (2 caractères minimum)'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe: 6 caractères minimum'),
  role: z.enum(['manager', 'team_leader', 'operator']),
});

const roleLabels: Record<Exclude<AppRole, 'admin'>, { label: string; description: string; icon: React.ReactNode }> = {
  manager: { label: 'Manager / Superviseur', description: 'Suivi global des KPI', icon: <Briefcase className="h-4 w-4" /> },
  team_leader: { label: 'Chef d\'équipe', description: 'Gestion des actions', icon: <HardHat className="h-4 w-4" /> },
  operator: { label: 'Opérateur', description: 'Consultation', icon: <Wrench className="h-4 w-4" /> },
};

export default function Auth() {
  const navigate = useNavigate();
  const { user, signUp, signIn, signOut, loading, isPending, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<Exclude<AppRole, 'admin'>>('operator');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !loading && !isPending && profile?.status === 'approved') {
      navigate('/');
    }
  }, [user, loading, isPending, profile, navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 2 Mo');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou mot de passe incorrect');
      } else {
        toast.error('Erreur de connexion');
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signupSchema.parse({ fullName: signupName, email: signupEmail, password: signupPassword, role: signupRole });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error, data } = await signUp(signupEmail, signupPassword, signupName, signupRole);
    
    if (error) {
      setIsSubmitting(false);
      if (error.message.includes('already registered')) {
        toast.error('Cet email est déjà enregistré');
      } else {
        toast.error('Erreur lors de l\'inscription');
      }
      return;
    }

    // Upload avatar if provided
    if (avatarFile && data?.user) {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${data.user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });
      
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        // Update profile with avatar URL
        await supabase
          .from('profiles')
          .update({ avatar_url: urlData.publicUrl })
          .eq('user_id', data.user.id);
      }
    }

    setIsSubmitting(false);
    setSignupSuccess(true);
    setActiveTab('login');
    toast.success('Inscription réussie ! Veuillez attendre la validation par un administrateur.');
  };

  const handleSignOut = async () => {
    await signOut();
    setSignupSuccess(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show pending approval screen - block access if pending
  if (user && isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-[hsl(var(--status-orange))]/10 border border-[hsl(var(--status-orange))]/20">
                <Clock className="h-8 w-8 text-[hsl(var(--status-orange))]" />
              </div>
            </div>
            <CardTitle className="text-2xl">Compte en attente de validation</CardTitle>
            <CardDescription className="text-base mt-2">
              Votre compte n'a pas encore été validé par un administrateur.
              <br />
              Vous ne pouvez pas accéder à l'application tant que votre inscription n'est pas approuvée.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Veuillez patienter. Un administrateur examinera votre demande.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show rejected screen
  if (user && profile?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <X className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Inscription refusée</CardTitle>
            <CardDescription className="text-base mt-2">
              Votre demande d'inscription a été refusée par un administrateur.
              <br />
              Vous ne pouvez pas accéder à l'application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show signup success screen
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">Inscription réussie !</CardTitle>
            <CardDescription className="text-base mt-2">
              Votre demande d'inscription a été envoyée.
              <br />
              Un administrateur doit valider votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => {
                setSignupSuccess(false);
                setSignupName('');
                setSignupEmail('');
                setSignupPassword('');
              }}
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-background to-background p-12 flex-col justify-between border-r border-border">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Factory className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">SFM Digital</h1>
              <p className="text-sm text-muted-foreground">Shop Floor Management</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-4xl font-bold text-foreground leading-tight">
            Pilotez votre performance<br />
            <span className="text-primary">industrielle en temps réel</span>
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50">
              <div className="p-2 rounded-lg bg-sfm-safety/10">
                <Shield className="h-5 w-5 text-sfm-safety" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Sécurité</h3>
                <p className="text-sm text-muted-foreground">Suivi des incidents</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50">
              <div className="p-2 rounded-lg bg-sfm-quality/10">
                <TrendingUp className="h-5 w-5 text-sfm-quality" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Qualité</h3>
                <p className="text-sm text-muted-foreground">KPIs en temps réel</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50">
              <div className="p-2 rounded-lg bg-sfm-performance/10">
                <TrendingUp className="h-5 w-5 text-sfm-performance" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Performance</h3>
                <p className="text-sm text-muted-foreground">Tableaux de bord</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50">
              <div className="p-2 rounded-lg bg-sfm-human/10">
                <Users className="h-5 w-5 text-sfm-human" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Équipes</h3>
                <p className="text-sm text-muted-foreground">Collaboration</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          © 2026 SFM Digital. Solution de management visuel industriel.
        </p>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Factory className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold">SFM Digital</span>
            </div>
            <CardTitle className="text-2xl">Bienvenue</CardTitle>
            <CardDescription>
              Connectez-vous pour accéder au tableau de bord
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nom complet</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Jean Dupont"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rôle</Label>
                    <Select value={signupRole} onValueChange={(value: Exclude<AppRole, 'admin'>) => setSignupRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(roleLabels) as Exclude<AppRole, 'admin'>[]).map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              {roleLabels[role].icon}
                              <div>
                                <span className="font-medium">{roleLabels[role].label}</span>
                                <span className="text-muted-foreground ml-2 text-xs">
                                  ({roleLabels[role].description})
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Photo upload - optional */}
                  <div className="space-y-2">
                    <Label>Photo de profil (facultatif)</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        {avatarPreview && <AvatarImage src={avatarPreview} alt="Prévisualisation" />}
                        <AvatarFallback className="bg-muted">
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Choisir une photo
                        </Button>
                        {avatarFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeAvatar}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Max 2 Mo. Formats: JPG, PNG, GIF
                    </p>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center bg-muted/50 p-2 rounded-lg">
                    Note: Votre inscription devra être validée par un administrateur avant de pouvoir vous connecter.
                  </p>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Création...' : 'Créer un compte'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
