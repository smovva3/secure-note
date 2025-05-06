
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotes } from '@/hooks/useNotes';
import type { Note } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Paperclip, Download, Edit, Trash2, Image as ImageIcon, FileText as FileTextIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image'; 
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
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id && !notesLoading) {
      const fetchedNote = getNoteById(id);
      if (fetchedNote) {
        setNote(fetchedNote);
      } else {
        toast({ title: "Note not found", description: "The requested note could not be found or you don't have access.", variant: "destructive" });
        router.push('/notes');
      }
      setIsLoading(false);
    }
  }, [id, getNoteById, router, notesLoading, toast]);

  const handleDelete = () => {
    if (note) {
      setIsDeleting(true);
      // Future: Add API call to delete file from server if note.attachment.url exists
      const success = deleteNote(note.id);
      if (success) {
        toast({
          title: "Note Deleted",
          description: `Note "${note.title}" has been successfully deleted.`,
        });
        router.push("/notes");
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

  if (isLoading || notesLoading) {
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
          <Link href="/notes">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notes
          </Link>
        </Button>
      </div>
    );
  }

  const formattedDate = format(new Date(note.timestamp), "MMMM d, yyyy 'at' h:mm a");

  return (
    <div className="max-w-3xl mx-auto">
      <Button asChild variant="outline" className="mb-6 text-primary border-primary hover:bg-primary/10">
        <Link href="/notes">
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
                <Paperclip className="mr-2 h-5 w-5" aria-hidden="true" /> Attachment
              </h3>
              <div className="p-4 border rounded-lg bg-accent/30">
                <p className="text-sm font-medium text-foreground mb-2">{note.attachment.name}</p>
                
                {/* Image Preview: Uses server URL */}
                {note.attachment.url && note.attachment.type.startsWith('image/') && (
                  <Image
                    src={note.attachment.url} // This is now /uploads/filename.ext
                    alt={note.attachment.name || "Attachment image"}
                    width={300}
                    height={200}
                    className="rounded-md object-contain max-h-64 w-auto shadow-md"
                    data-ai-hint="attachment preview"
                    unoptimized={note.attachment.url.startsWith('/uploads/')} // Useful if Next.js image optimization struggles with local files or for simplicity
                  />
                )}

                {/* Text Preview: Uses stored content if available */}
                {note.attachment.content && note.attachment.type === 'text/plain' && (
                  <div className="mt-2 p-3 border rounded bg-background max-h-64 overflow-y-auto text-sm">
                    <pre>{note.attachment.content}</pre>
                  </div>
                )}

                {/* Fallback for image if URL exists but no specific preview */}
                {note.attachment.url && note.attachment.type.startsWith('image/') && !note.attachment.content && (
                   <p className="text-xs text-muted-foreground mt-1">Image attachment.</p>
                )}

                {/* Fallback for text if URL exists, but no local content for preview */}
                {note.attachment.url && note.attachment.type === 'text/plain' && !note.attachment.content &&(
                  <div className="flex items-center gap-2 text-muted-foreground p-4 border border-dashed rounded-md justify-center">
                    <FileTextIcon className="h-10 w-10" aria-hidden="true" />
                    <span>Text file attached. Download to view.</span>
                  </div>
                )}

                {/* Generic Fallback for other types with URL (e.g. PDF) */}
                {note.attachment.url && !note.attachment.type.startsWith('image/') && !note.attachment.type.startsWith('text/') && (
                   <div className="flex items-center gap-2 text-muted-foreground p-4 border border-dashed rounded-md justify-center">
                      <FileTextIcon className="h-10 w-10" aria-hidden="true" />
                      <span>File attached: {note.attachment.name}. Download to view.</span>
                   </div>
                )}
                
                {/* Fallbacks for missing URL (should be rare with new upload logic) */}
                 {(!note.attachment.url && note.attachment.type.startsWith('image/')) && (
                  <div className="flex items-center gap-2 text-muted-foreground p-4 border border-dashed rounded-md justify-center">
                    <ImageIcon className="h-10 w-10" aria-hidden="true" />
                    <span>Image preview unavailable.</span>
                  </div>
                )}
                 {(!note.attachment.url && note.attachment.type === 'text/plain' && !note.attachment.content) && (
                  <div className="flex items-center gap-2 text-muted-foreground p-4 border border-dashed rounded-md justify-center">
                    <FileTextIcon className="h-10 w-10" aria-hidden="true" />
                    <span>Text preview unavailable.</span>
                  </div>
                )}


                {/* Download Button: Uses server URL or creates blob from content for text */}
                {note.attachment.url && (
                  <Button variant="outline" size="sm" asChild className="mt-3 text-primary border-primary hover:bg-primary/10">
                    <a href={note.attachment.url} download={note.attachment.name}>
                      <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Download
                    </a>
                  </Button>
                )}
                {!note.attachment.url && note.attachment.content && note.attachment.type === 'text/plain' && (
                   <Button variant="outline" size="sm" onClick={() => {
                     if (!document) return; 
                     const blob = new Blob([note.attachment!.content!], { type: 'text/plain' });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = note.attachment!.name;
                     document.body.appendChild(a);
                     a.click();
                     document.body.removeChild(a);
                     URL.revokeObjectURL(url);
                   }} className="mt-3 text-primary border-primary hover:bg-primary/10">
                      <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Download Text
                   </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 border-t flex justify-end gap-2">
           <Button asChild variant="outline" className="text-primary border-primary hover:bg-primary/10">
            <Link href={`/notes/edit/${note.id}`}>
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
