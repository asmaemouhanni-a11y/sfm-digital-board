import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { SfmCategory } from '@/types/sfm';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: SfmCategory | null;
}

const ICONS = [
  { value: 'shield', label: 'Bouclier' },
  { value: 'check-circle', label: 'Check' },
  { value: 'dollar-sign', label: 'Dollar' },
  { value: 'truck', label: 'Camion' },
  { value: 'trending-up', label: 'Tendance' },
  { value: 'users', label: 'Utilisateurs' },
  { value: 'settings', label: 'Paramètres' },
  { value: 'alert-triangle', label: 'Alerte' },
];

const COLORS = [
  { value: '#EF4444', label: 'Rouge' },
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#22C55E', label: 'Vert' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EC4899', label: 'Rose' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#6366F1', label: 'Indigo' },
];

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    icon: 'settings',
    color: '#3B82F6',
    display_order: 1,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        code: category.code,
        icon: category.icon || 'settings',
        color: category.color,
        display_order: category.display_order,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        icon: 'settings',
        color: '#3B82F6',
        display_order: 1,
      });
    }
  }, [category, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (isEditing && category) {
        const { error } = await supabase
          .from('sfm_categories')
          .update(data)
          .eq('id', category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sfm_categories')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEditing ? 'Catégorie modifiée' : 'Catégorie créée');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error saving category:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifiez les informations de la catégorie' : 'Créez une nouvelle catégorie SFM'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Sécurité"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code (1 caractère) *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase().slice(0, 1) }))}
              placeholder="Ex: S"
              maxLength={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Icône</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICONS.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>
                    {icon.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Ordre d'affichage</Label>
            <Input
              id="order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
              min={1}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
