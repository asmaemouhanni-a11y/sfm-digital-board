import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useNotes, useCategories, useUpdateNote, useDeleteNote } from '@/hooks/useSfmData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { CreateNoteDialog } from '@/components/dashboard/CreateNoteDialog';
import { 
  FileText, 
  Plus,
  Calendar,
  Tag,
  Pin,
  PinOff,
  User,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function NotesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { data: notes, isLoading } = useNotes();
  const { data: categories } = useCategories();
  const { hasPermission, user } = useAuth();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const pinnedNotes = notes?.filter(n => n.is_pinned) || [];
  const regularNotes = notes?.filter(n => !n.is_pinned) || [];
  
  const filteredNotes = selectedCategory === 'all' 
    ? notes 
    : selectedCategory === 'pinned'
    ? pinnedNotes
    : notes?.filter(n => n.category_id === selectedCategory);

  const handleTogglePin = async (noteId: string, isPinned: boolean) => {
    try {
      await updateNote.mutateAsync({ id: noteId, is_pinned: !isPinned });
      toast.success(isPinned ? 'Note désépinglée' : 'Note épinglée');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (noteId: string, createdBy?: string) => {
    // Only allow deletion if user created the note or is admin/manager
    if (createdBy !== user?.id && !hasPermission(['admin', 'manager'])) {
      toast.error('Vous ne pouvez supprimer que vos propres notes');
      return;
    }
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;
    try {
      await deleteNote.mutateAsync(noteId);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getCategoryColor = (categoryId: string | undefined) => {
    if (!categoryId) return undefined;
    return categories?.find(c => c.id === categoryId)?.color;
  };

  if (isLoading) {
    return (
      <AppLayout title="Notes" subtitle="Notes et communication d'équipe">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Notes" subtitle="Notes et communication d'équipe">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary">{notes?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--status-orange))]/30 bg-[hsl(var(--status-orange))]/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[hsl(var(--status-orange))]/10 text-[hsl(var(--status-orange))]">
              <Pin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Épinglées</p>
              <p className="text-2xl font-bold text-[hsl(var(--status-orange))]">{pinnedNotes.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-muted-foreground">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Catégories</p>
              <p className="text-2xl font-bold">{categories?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-muted-foreground">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cette semaine</p>
              <p className="text-2xl font-bold">
                {notes?.filter(n => {
                  const noteDate = new Date(n.created_at);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return noteDate > weekAgo;
                }).length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Liste des notes</h2>
        {hasPermission(['admin', 'manager', 'team_leader']) && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle note
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 flex-wrap">
              <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary gap-2">
                <FileText className="h-4 w-4" />
                Toutes ({notes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pinned" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(var(--status-orange))] text-[hsl(var(--status-orange))] gap-2">
                <Pin className="h-4 w-4" />
                Épinglées ({pinnedNotes.length})
              </TabsTrigger>
              {categories?.map((cat) => (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id} 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.code}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="m-0 p-4">
              {filteredNotes && filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotes.map((note) => {
                    const categoryColor = getCategoryColor(note.category_id);
                    return (
                      <Card 
                        key={note.id} 
                        className={`hover:shadow-md transition-all relative ${
                          note.is_pinned 
                            ? 'border-[hsl(var(--status-orange))]/50 bg-[hsl(var(--status-orange))]/5' 
                            : ''
                        }`}
                      >
                        {note.is_pinned && (
                          <div className="absolute -top-2 -right-2">
                            <div className="bg-[hsl(var(--status-orange))] text-white p-1 rounded-full">
                              <Pin className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {note.category && (
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ 
                                  borderColor: `${categoryColor}50`,
                                  color: categoryColor,
                                  backgroundColor: `${categoryColor}10`
                                }}
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {note.category.name}
                              </Badge>
                            )}
                            {!note.category_id && (
                              <Badge variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                Général
                              </Badge>
                            )}
                          </div>
                          
                          {note.title && (
                            <h3 className="font-semibold text-foreground mb-2">{note.title}</h3>
                          )}
                          
                          <p className="text-foreground whitespace-pre-wrap line-clamp-4 text-sm">
                            {note.content}
                          </p>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(note.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                              </span>
                              {note.author && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {note.author.full_name}
                                </span>
                              )}
                            </div>
                            
                            {hasPermission(['admin', 'manager', 'team_leader']) && (
                              <TooltipProvider>
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleTogglePin(note.id, note.is_pinned)}
                                        disabled={updateNote.isPending}
                                      >
                                        {note.is_pinned ? (
                                          <PinOff className="h-4 w-4 text-[hsl(var(--status-orange))]" />
                                        ) : (
                                          <Pin className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {note.is_pinned ? 'Désépingler' : 'Épingler'}
                                    </TooltipContent>
                                  </Tooltip>
                                  
                                  {(note.created_by === user?.id || hasPermission(['admin', 'manager'])) && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDelete(note.id, note.created_by)}
                                          disabled={deleteNote.isPending}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Supprimer</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TooltipProvider>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">Aucune note</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedCategory === 'pinned' 
                      ? 'Aucune note épinglée' 
                      : 'Commencez par ajouter une note'}
                  </p>
                  {hasPermission(['admin', 'manager', 'team_leader']) && (
                    <Button onClick={() => setDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle note
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {hasPermission(['admin', 'manager', 'team_leader']) && (
        <CreateNoteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </AppLayout>
  );
}