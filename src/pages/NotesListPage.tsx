import { useNotes } from "@/hooks/useNotes";
import NoteCard from "@/components/notes/NoteCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, Inbox, Loader2 } from 'lucide-react';

export default function NotesListPage() {
  const { notes, isLoading } = useNotes();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" aria-label="Loading notes" />
        <p className="text-lg">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">My Notes</h2>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to="/notes/create">
            <PlusCircle className="mr-2 h-5 w-5" aria-hidden="true" /> Create New Note
          </Link>
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16 bg-accent/50 rounded-lg shadow-sm">
          <Inbox className="mx-auto h-16 w-16 text-primary/70 mb-4" aria-hidden="true" />
          <h3 className="text-xl font-semibold text-foreground/90 mb-2">No notes yet!</h3>
          <p className="text-muted-foreground mb-6">
            It looks like you haven't created any notes. <br/>
            Get started by creating your first note.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/notes/create">
              <PlusCircle className="mr-2 h-5 w-5" aria-hidden="true" /> Create First Note
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
