
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotes } from '@/hooks/useNotes';
import type { Note } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Edit, Trash2, Loader2, Paperclip, Download, Image as ImageIcon, FileText as FileTextIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function NoteDetailsPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { getNoteById, deleteNote, isLoading: notesLoading } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id && !notesLoading) {
      const fetchedNote = getNoteById(id);
      if (fetchedNote) {
        setNote(fetchedNote);
      } else {
        toast({ title: "Note not found", description: "The requested note could not be found or you don't have access.", variant: "destructive" });
        navigate('/notes', { replace: true });
      }
      setIsLoadingPage(false);
    } else if (!id && !notesLoading) {
      // Handle case where ID is missing from URL
       toast({ title: "Invalid URL", description: "No note ID specified.", variant: "destructive" });
       navigate('/notes', { replace: true });
       setIsLoadingPage(false);
    }
  }, [id, getNoteById, navigate, notesLoading, toast]);

  const handleDelete = () => {
    if (note) {
      setIsDeleting(true);
      const success = deleteNote(note.id);
      if (success) {
        toast({
          title: "Note Deleted",
          description: `Note "${note.title}" has been successfully deleted.`,
        });
        navigate("/notes", { replace: true });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the note.",
          variant: "destructive",
        });
        setIsDeleting(false);
      }
    }
  };

  const handleDownload = () => {
    if (!note || !note.attachment) return;

    const { url, content, name, type } = note.attachment;

    if (url && type.startsWith('image/')) { // Assumes URL is a data URI for images
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (content && type === 'text/plain') {
      const blob = new Blob([content], { type: 'text/plain' });
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } else {
      toast({ title: "Download Error", description: "Cannot download this attachment type or data is missing.", variant: "destructive" });
    }
  };


  if (isLoadingPage || notesLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground py-10 min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" aria-label="Loading note details" />
        <p className="text-lg">Loading note details...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-10 min-h-screen">
        <h2 className="text-2xl font-semibold text-destructive">Note Not Found</h2>
        <p className="text-muted-foreground">The note you are looking for does not exist or has been deleted.</p>
        <Button asChild variant="outline" className="mt-4 text-primary border-primary hover:bg-primary/10">
          <Link to="/notes">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Back to Notes
          </Link>
        </Button>
      </div>
    );
  }

  const formattedDate = format(new Date(note.timestamp), "MMMM d, yyyy 'at' h:mm a");

  return (
    <div className="max-w-3xl mx-auto">
      <Button asChild variant="outline" className="mb-6 text-primary border-primary hover:bg-primary/10">
        <Link to="/notes">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Back to Notes
        </Link>
      </Button>
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-secondary/30 p-6">
          <CardTitle className="text-3xl font-bold text-primary">{note.title}</CardTitle>
          <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <Clock className="h-4 w-4" aria-hidden="true" /> Created: {formattedDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="prose prose-sm sm:prose-base max-w-none text-foreground whitespace-pre-wrap break-words">
            {note.content}
          </div>
          {note.attachment && (
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Paperclip className="mr-2 h-5 w-5" /> Attachment
              </h3>
              <div className="p-4 border rounded-lg bg-accent/30 space-y-3">
                <p className="text-sm font-medium text-foreground">{note.attachment.name}</p>
                
                {note.attachment.type.startsWith('image/') && note.attachment.url && (
                  <img
                    src={note.attachment.url}
                    alt={note.attachment.name}
                    className="rounded-md object-contain max-h-64 w-auto shadow-md border"
                    data-ai-hint="attachment preview"
                  />
                )}
                {note.attachment.type === 'text/plain' && note.attachment.content && (
                  <div className="mt-2 p-3 border rounded bg-background max-h-64 overflow-y-auto text-sm">
                    <pre className="whitespace-pre-wrap break-all">{note.attachment.content}</pre>
                  </div>
                )}

                {((note.attachment.type.startsWith('image/') && !note.attachment.url) ||
                 (note.attachment.type === 'text/plain' && !note.attachment.content)) && (
                  <div className="flex items-center gap-2 text-muted-foreground p-4 border border-dashed rounded-md justify-center">
                    {note.attachment.type.startsWith('image/') ? <ImageIcon className="h-10 w-10" /> : <FileTextIcon className="h-10 w-10" />}
                    <span>Preview data unavailable.</span>
                  </div>
                )}
                
                {!note.attachment.type.startsWith('image/') && note.attachment.type !== 'text/plain' && (
                   <div className="flex items-center gap-2 text-muted-foreground p-4 border border-dashed rounded-md justify-center">
                      <FileTextIcon className="h-10 w-10" />
                      <span>Preview not available for this file type ({note.attachment.type}).</span>
                   </div>
                )}

                {(note.attachment.url || note.attachment.content) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                    className="mt-3 text-primary border-primary hover:bg-primary/10"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 border-t flex justify-end gap-2">
           <Button asChild variant="outline" className="text-primary border-primary hover:bg-primary/10">
            <Link to={`/notes/edit/${note.id}`}>
              <Edit className="mr-2 h-4 w-4" aria-hidden="true" /> Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />}
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the note titled "{note.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={handleDelete} 
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                    disabled={isDeleting}
                    aria-label={`Confirm deletion of note ${note.title}`}
                >
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
