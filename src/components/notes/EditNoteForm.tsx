"use client";
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Note, NoteFile } from "@/lib/types";
import { useState, ChangeEvent, useEffect } from "react";
import { Paperclip, XCircle, Image as ImageIcon, FileText as FileTextIcon, Loader2, Save } from "lucide-react";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100, { message: "Title must be 100 characters or less." }),
  content: z.string().min(1, { message: "Content is required." }),
  attachment: z.custom<FileList>((val) => val instanceof FileList, "Please upload a file.")
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((files) => !files || files.length === 0 || ALLOWED_FILE_TYPES.includes(files?.[0]?.type), "Only .jpg, .jpeg, .png, .gif, .txt, .pdf files are allowed."),
});

interface EditNoteFormProps {
  note: Note;
}

export default function EditNoteForm({ note }: EditNoteFormProps) {
  const { updateNote } = useNotes();
  const router = useRouter();
  const { toast } = useToast();
  
  const [preview, setPreview] = useState<string | null>(note.attachment?.url || (note.attachment?.type === 'text/plain' ? note.attachment?.content || null : null));
  const [fileType, setFileType] = useState<string | null>(note.attachment?.type || null);
  const [fileName, setFileName] = useState<string | null>(note.attachment?.name || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentChanged, setAttachmentChanged] = useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: note.title,
      content: note.content,
    },
  });

  useEffect(() => {
    // Pre-fill form with note data
    form.reset({
      title: note.title,
      content: note.content,
    });
    // Pre-fill attachment preview if it exists
    if (note.attachment) {
      setFileName(note.attachment.name);
      setFileType(note.attachment.type);
      if (note.attachment.url && note.attachment.type.startsWith("image/")) {
        setPreview(note.attachment.url);
      } else if (note.attachment.content && note.attachment.type === "text/plain") {
        setPreview(note.attachment.content);
      } else {
        setPreview(null);
      }
    }
  }, [note, form]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setAttachmentChanged(true); // Mark that attachment has been interacted with
    if (file) {
      form.setValue("attachment", event.target.files);
      if (ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileName(file.name);
        setFileType(file.type);
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else if (file.type === "text/plain") {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string); 
          };
          reader.readAsText(file);
        } else {
          setPreview(null);
        }
      } else {
        setPreview(null);
        setFileType(null);
        setFileName(null);
        form.resetField("attachment");
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid file type (JPG, PNG, GIF, TXT, PDF).",
          variant: "destructive",
        });
      }
    } else {
      form.resetField("attachment");
      setPreview(null);
      setFileType(null);
      setFileName(null);
    }
  };

  const removeAttachment = () => {
    form.resetField("attachment");
    setPreview(null);
    setFileType(null);
    setFileName(null);
    setAttachmentChanged(true); // Mark that attachment has been removed
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let noteFileUpdate: NoteFile | undefined | null = note.attachment; // Default to existing or undefined

    if (attachmentChanged) { // Only process attachment if it was changed
        if (values.attachment && values.attachment.length > 0) {
            const file = values.attachment[0];
            noteFileUpdate = {
                name: file.name,
                type: file.type,
            };
            if (file.type.startsWith("image/")) {
                // For images, create a new object URL. Old one might be revoked.
                noteFileUpdate.url = URL.createObjectURL(file); 
            } else if (file.type === "text/plain") {
                noteFileUpdate.content = await file.text();
            }
        } else {
            // Attachment was removed
            noteFileUpdate = null; // Explicitly set to null to indicate removal
        }
    }


    const success = updateNote(note.id, {
      title: values.title,
      content: values.content,
      attachment: noteFileUpdate === null ? undefined : noteFileUpdate, // Pass undefined if null
    });

    setIsSubmitting(false);

    if (success) {
      toast({
        title: "Note Updated",
        description: "Your note has been saved successfully.",
      });
      router.push(`/notes/${note.id}`);
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
              <FormLabel htmlFor="title" className="text-foreground/80">Title</FormLabel>
              <FormControl>
                <Input id="title" placeholder="Enter note title" {...field} className="text-base py-3 px-4 focus:ring-primary focus:border-primary" aria-required="true" />
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
              <FormLabel htmlFor="content" className="text-foreground/80">Content</FormLabel>
              <FormControl>
                <Textarea
                  id="content"
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
          render={() => ( // field is not directly used for display, but for form state
            <FormItem>
              <FormLabel htmlFor="attachment-upload-edit" className="text-foreground/80">Attachment (Optional)</FormLabel>
              <FormControl>
                <div className="relative flex items-center justify-center w-full">
                  <label
                    htmlFor="attachment-upload-edit"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-accent/30 hover:bg-accent/50 border-primary/50 hover:border-primary transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Paperclip className="w-8 h-8 mb-2 text-primary/70" aria-hidden="true" />
                      <p className="mb-1 text-sm text-foreground/70">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, GIF, TXT, PDF (MAX. 5MB)</p>
                    </div>
                    <Input
                      id="attachment-upload-edit"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept={ALLOWED_FILE_TYPES.join(",")}
                      aria-describedby="attachment-description"
                    />
                  </label>
                </div>
              </FormControl>
              <p id="attachment-description" className="sr-only">
                Upload an optional attachment. Allowed types: JPG, PNG, GIF, TXT, PDF. Maximum size: 5MB.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {fileName && (
          <div className="mt-4 p-3 border rounded-lg bg-secondary/50 relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={removeAttachment}
              aria-label="Remove attachment"
            >
              <XCircle className="h-5 w-5" aria-hidden="true" />
            </Button>
            <p className="text-sm font-medium text-foreground mb-2" aria-live="polite">Attached: {fileName}</p>
            {preview && fileType?.startsWith("image/") && (
              <Image src={preview} alt="Attachment preview" width={100} height={100} className="rounded-md object-cover max-h-32" data-ai-hint="file preview" />
            )}
            {preview && fileType === "text/plain" && (
              <div className="mt-2 p-2 border rounded bg-background max-h-32 overflow-y-auto text-xs">
                <pre>{preview.substring(0, 200)}{preview.length > 200 ? '...' : ''}</pre>
              </div>
            )}
            {!preview && fileType && !fileType.startsWith("image/") && !fileType.startsWith("text/") && (
                 <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <FileTextIcon className="h-8 w-8" aria-hidden="true" />
                    <span>This file type does not have a preview.</span>
                 </div>
            )}
          </div>
        )}

        <Button type="submit" className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> Saving Changes...
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
