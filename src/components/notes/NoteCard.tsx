import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Note } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { FileText, Clock, Trash2, ExternalLink } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, onDelete }: NoteCardProps) {
  const formattedDate = formatDistanceToNow(new Date(note.timestamp), { addSuffix: true });

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {note.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> {formattedDate}
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
            <ExternalLink className="mr-2 h-4 w-4" /> View Details
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(note.id)} className="text-destructive hover:bg-destructive/10">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
