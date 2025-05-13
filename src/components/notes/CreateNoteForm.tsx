
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
import { Loader2, PlusCircle, Paperclip, XCircle, FileText, Image as ImageIcon } from "lucide-react";
import type { NoteFile } from "@/lib/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "text/plain"];

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100, { message: "Title must be 100 characters or less." }),
  content: z.string().min(1, { message: "Content is required." }),
  attachment: z.custom<File | undefined>((val) => val === undefined || val instanceof File, {
    message: "Invalid file type",
  }).optional(),
});

export default function CreateNoteForm() {
  const { addNote } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<NoteFile | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      attachment: undefined,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `File size should not exceed ${MAX_FILE_SIZE / (1024*1024)}MB.`, variant: "destructive" });
        form.setValue("attachment", undefined);
        setAttachmentPreview(null);
        setAttachmentFile(null);
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({ title: "Invalid file type", description: "Only JPEG, PNG, GIF, and TXT files are allowed.", variant: "destructive" });
        form.setValue("attachment", undefined);
        setAttachmentPreview(null);
        setAttachmentFile(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (file.type.startsWith("image/")) {
          setAttachmentPreview(reader.result as string);
          setAttachmentFile({ name: file.name, type: file.type, url: reader.result as string });
        } else if (file.type === "text/plain") {
          setAttachmentPreview(null); // No visual preview for text, just name
          setAttachmentFile({ name: file.name, type: file.type, content: reader.result as string });
        }
      };

      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else if (file.type === "text/plain") {
        reader.readAsText(file);
      }
    } else {
      form.setValue("attachment", undefined);
      setAttachmentPreview(null);
      setAttachmentFile(null);
    }
  };

  const removeAttachment = () => {
    form.setValue("attachment", undefined);
    setAttachmentPreview(null);
    setAttachmentFile(null);
    // Reset the file input visually
    const fileInput = document.getElementById('attachment-create') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    const success = addNote({
      title: values.title,
      content: values.content,
      attachment: attachmentFile || undefined,
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
        <FormField
          control={form.control}
          name="attachment"
          render={() => ( // field is not directly used here for input type file's controlled state
            <FormItem>
              <FormLabel htmlFor="attachment-create" className="text-foreground/80">Attachment (Optional)</FormLabel>
              <FormControl>
                <Input 
                  id="attachment-create" 
                  type="file" 
                  onChange={handleFileChange}
                  className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  accept={ALLOWED_FILE_TYPES.join(",")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {attachmentFile && (
          <div className="mt-4 p-3 border rounded-md bg-secondary/30">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                {attachmentFile.type.startsWith("image/") ? <ImageIcon className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                <span>{attachmentFile.name}</span> ({attachmentFile.type})
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={removeAttachment} className="text-destructive hover:text-destructive/80">
                <XCircle className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
            {attachmentPreview && attachmentFile.type.startsWith("image/") && (
              <img src={attachmentPreview} alt="Preview" className="max-h-40 rounded-md object-contain border" data-ai-hint="attachment preview" />
            )}
          </div>
        )}

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
