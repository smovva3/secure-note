import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Note } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { FileText, Clock, Trash2, ExternalLink, Loader2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { useNotes } from "@/hooks/useNotes";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface NoteCardProps {
  note: Note;
  // onDelete prop is removed as NoteCard will handle its own deletion logic
}

export default function NoteCard({ note }: NoteCardProps) {
  const formattedDate = formatDistanceToNow(new Date(note.timestamp), { addSuffix: true });
  const { deleteNote } = useNotes();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    const success = deleteNote(note.id);
    if (success) {
      toast({
        title: "Note Deleted",
        description: `Note "${note.title}" has been successfully deleted.`,
      });
      // No router.push needed here as the component will be unmounted from the list
    } else {
      toast({
        title: "Error",
        description: "Failed to delete the note.",
        variant: "destructive",
      });
    }
    setIsDeleting(false);
  };

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
          <FileText className="h-5 w-5" aria-hidden="true" />
          {note.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" /> {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground/80 line-clamp-3">
          {note.content}
        </p>
        {note.attachment && (
           <p className="text-xs text-muted-foreground mt-2">Attachment: {note.attachment.name}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <Button asChild variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
          <Link href={`/notes/${note.id}`}>
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" /> View Details
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your note titled "{note.title}".
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
  );
}
