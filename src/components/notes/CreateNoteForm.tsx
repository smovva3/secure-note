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
import { useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100, { message: "Title must be 100 characters or less." }),
  content: z.string().min(1, { message: "Content is required." }),
  // Attachment field removed
});

export default function CreateNoteForm() {
  const { addNote } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    const success = addNote({
      title: values.title,
      content: values.content,
      // No attachment
    });

    setIsSubmitting(false);

    if (success) {
      toast({
        title: "Note Created",
        description: "Your new note has been saved successfully.",
      });
      navigate("/notes");
    } else {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
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
              <FormLabel htmlFor="title-create" className="text-foreground/80">Title</FormLabel>
              <FormControl>
                <Input id="title-create" placeholder="Enter note title" {...field} className="text-base py-3 px-4 focus:ring-primary focus:border-primary" aria-required="true" />
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
              <FormLabel htmlFor="content-create" className="text-foreground/80">Content</FormLabel>
              <FormControl>
                <Textarea
                  id="content-create"
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
              Creating Note...
            </>
          ) : (
            <>
             <PlusCircle className="mr-2 h-5 w-5" aria-hidden="true" /> Create Note
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
