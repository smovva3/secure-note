import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotes } from "@/hooks/useNotes";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@/lib/types"; // Note type will be simplified
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100, { message: "Title must be 100 characters or less." }),
  content: z.string().min(1, { message: "Content is required." }),
  // Attachment field removed
});

interface EditNoteFormProps {
  note: Note;
}

export default function EditNoteForm({ note }: EditNoteFormProps) {
  const { updateNote } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: note.title,
      content: note.content,
    },
  });

  useEffect(() => {
    form.reset({
      title: note.title,
      content: note.content,
    });
  }, [note, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const success = updateNote(note.id, {
      title: values.title,
      content: values.content,
      // No attachment
    });

    setIsSubmitting(false);

    if (success) {
      toast({
        title: "Note Updated",
        description: "Your note has been saved successfully.",
      });
      navigate(`/notes/${note.id}`);
    } else {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="title-edit" className="text-foreground/80">Title</FormLabel>
              <FormControl>
                <Input id="title-edit" placeholder="Enter note title" {...field} className="text-base py-3 px-4 focus:ring-primary focus:border-primary" aria-required="true" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="content-edit" className="text-foreground/80">Content</FormLabel>
              <FormControl>
                <Textarea
                  id="content-edit"
                  placeholder="Write your note here..."
                  {...field}
                  rows={8}
                  className="text-base py-3 px-4 focus:ring-primary focus:border-primary"
                  aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Attachment input removed */}

        <Button type="submit" className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> 
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" aria-hidden="true" /> Save Changes
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
