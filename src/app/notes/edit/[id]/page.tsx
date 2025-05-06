
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EditNoteForm from "@/components/notes/EditNoteForm";
import { useNotes } from '@/hooks/useNotes';
import type { Note } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";


export default function EditNotePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof params.id === 'string' ? params.id : '';
  const { getNoteById, isLoading: notesLoading } = useNotes();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  useEffect(() => {
    if (id && !notesLoading) {
      const fetchedNote = getNoteById(id);
      if (fetchedNote) {
        setNote(fetchedNote);
      } else {
        toast({
          title: "Note not found",
          description: "The note you are trying to edit could not be found.",
          variant: "destructive",
        });
        router.replace('/notes');
      }
      setIsLoadingPage(false);
    } else if (!notesLoading && !id) {
        // Handle case where ID might be missing from params for some reason
        toast({
          title: "Invalid Page",
          description: "No note ID provided for editing.",
          variant: "destructive",
        });
        router.replace('/notes');
        setIsLoadingPage(false);
    }
  }, [id, getNoteById, router, notesLoading, toast]);

  if (isLoadingPage || notesLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground py-10 min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" aria-label="Loading note for editing" />
        <p className="text-lg">Loading note for editing...</p>
      </div>
    );
  }

  if (!note) {
    // This should ideally be caught by the useEffect redirect, but serves as a fallback.
    return (
      <div className="text-center py-10 min-h-screen">
        <h2 className="text-2xl font-semibold text-destructive">Note Not Found</h2>
        <p className="text-muted-foreground">The note you are trying to edit does not exist.</p>
        <Button asChild variant="outline" className="mt-4 text-primary border-primary hover:bg-primary/10">
          <Link href="/notes">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Back to Notes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button asChild variant="outline" className="mb-6 text-primary border-primary hover:bg-primary/10">
        <Link href={`/notes/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Back to Note Details
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Edit Note</CardTitle>
          <CardDescription className="text-muted-foreground">
            Modify the details of your note below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditNoteForm note={note} />
        </CardContent>
      </Card>
    </div>
  );
}
