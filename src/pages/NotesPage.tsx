import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useNotes, useCategories, useCreateNote } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { CreateNoteDialog } from '@/components/dashboard/CreateNoteDialog';
import { 
  FileText, 
  Plus,
  Calendar,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function NotesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: notes, isLoading } = useNotes();
  const { data: categories } = useCategories();
  const { hasPermission } = useAuth();

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Général';
    return categories?.find(c => c.id === categoryId)?.name || 'Non catégorisé';
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return 'bg-muted text-muted-foreground';
    const category = categories?.find(c => c.id === categoryId);
    if (!category) return 'bg-muted text-muted-foreground';
    return `bg-[${category.color}]/10 text-[${category.color}]`;
  };

  if (isLoading) {
    return (
      <AppLayout title="Notes" subtitle="Notes et observations">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Notes" subtitle="Notes et observations">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{notes?.length || 0} notes</h2>
            <p className="text-sm text-muted-foreground">Notes d'équipe et observations</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle note
        </Button>
      </div>

      {/* Notes Grid */}
      {notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {getCategoryName(note.category_id)}
                  </Badge>
                </div>
                <p className="text-foreground whitespace-pre-wrap line-clamp-6">
                  {note.content}
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(note.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Aucune note</h3>
          <p className="text-sm text-muted-foreground mb-4">Commencez par ajouter une note</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle note
          </Button>
        </div>
      )}

      <CreateNoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}
