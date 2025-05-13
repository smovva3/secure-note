
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
import type { Note, NoteFile } from "@/lib/types";
import { useState, useEffect } from "react";
import { Loader2, Save, Paperclip, XCircle, FileText, Image as ImageIcon } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "text/plain"];

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100, { message: "Title must be 100 characters or less." }),
  content: z.string().min(1, { message: "Content is required." }),
  attachment: z.custom<File | undefined>((val) => val === undefined || val instanceof File, {
    message: "Invalid file type",
  }).optional(),
});

interface EditNoteFormProps {
  note: Note;
}

export default function EditNoteForm({ note }: EditNoteFormProps) {
  const { updateNote } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState<NoteFile | null>(note.attachment || null);
  const [newAttachmentPreview, setNewAttachmentPreview] = useState<string | null>(null);
  const [newAttachmentFile, setNewAttachmentFile] = useState<NoteFile | null>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: note.title,
      content: note.content,
      attachment: undefined, // Handled separately
    },
  });

  useEffect(() => {
    form.reset({
      title: note.title,
      content: note.content,
    });
    setCurrentAttachment(note.attachment || null);
    setNewAttachmentFile(null);
    setNewAttachmentPreview(null);
  }, [note, form]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `File size should not exceed ${MAX_FILE_SIZE / (1024*1024)}MB.`, variant: "destructive" });
        form.setValue("attachment", undefined);
        setNewAttachmentPreview(null);
        setNewAttachmentFile(null);
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({ title: "Invalid file type", description: "Only JPEG, PNG, GIF, and TXT files are allowed.", variant: "destructive" });
        form.setValue("attachment", undefined);
        setNewAttachmentPreview(null);
        setNewAttachmentFile(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (file.type.startsWith("image/")) {
          setNewAttachmentPreview(reader.result as string);
          setNewAttachmentFile({ name: file.name, type: file.type, url: reader.result as string });
        } else if (file.type === "text/plain") {
          setNewAttachmentPreview(null); 
          setNewAttachmentFile({ name: file.name, type: file.type, content: reader.result as string });
        }
        setCurrentAttachment(null); // Clear existing attachment if new one is selected
      };

      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else if (file.type === "text/plain") {
        reader.readAsText(file);
      }
    } else { // No file selected or file removed
      form.setValue("attachment", undefined);
      setNewAttachmentPreview(null);
      setNewAttachmentFile(null);
      // If user clears file input, we don't automatically restore the old attachment. They must explicitly keep or remove.
    }
  };

  const removeCurrentAttachment = () => {
    setCurrentAttachment(null);
    toast({ title: "Attachment Removed", description: "The existing attachment will be removed upon saving." });
  };

  const removeNewAttachment = () => {
    form.setValue("attachment", undefined);
    setNewAttachmentPreview(null);
    setNewAttachmentFile(null);
    const fileInput = document.getElementById('attachment-edit') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const attachmentToSave = newAttachmentFile ? newAttachmentFile : currentAttachment;

    const success = updateNote(note.id, {
      title: values.title,
      content: values.content,
      attachment: attachmentToSave || undefined, // Use the new one if present, else the current one (which might be null if removed)
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

  const displayAttachment = newAttachmentFile || currentAttachment;
  const displayPreview = newAttachmentPreview || (currentAttachment?.url || null);


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
        
        <FormItem>
          <FormLabel htmlFor="attachment-edit" className="text-foreground/80">Attachment (Optional)</FormLabel>
          <FormControl>
            <Input 
              id="attachment-edit" 
              type="file" 
              onChange={handleFileChange}
              className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              accept={ALLOWED_FILE_TYPES.join(",")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        {displayAttachment && (
          <div className="mt-4 p-3 border rounded-md bg-secondary/30">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                {displayAttachment.type.startsWith("image/") ? <ImageIcon className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                <span>{displayAttachment.name}</span> ({displayAttachment.type})
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={newAttachmentFile ? removeNewAttachment : removeCurrentAttachment} 
                className="text-destructive hover:text-destructive/80"
              >
                <XCircle className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
            {displayPreview && displayAttachment.type.startsWith("image/") && (
              <img src={displayPreview} alt="Preview" className="max-h-40 rounded-md object-contain border" data-ai-hint="attachment preview"/>
            )}
            {!displayPreview && displayAttachment.type === "text/plain" && (
              <p className="text-xs text-muted-foreground">Text file content will be saved. Preview not shown here.</p>
            )}
          </div>
        )}

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
