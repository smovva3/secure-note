
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
  attachmentFile: z.custom<File>((val) => val instanceof File) 
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((file) => !file || ALLOWED_FILE_TYPES.includes(file.type), "Only .jpg, .jpeg, .png, .gif, .txt, .pdf files are allowed."),
});

interface EditNoteFormProps {
  note: Note;
}

export default function EditNoteForm({ note }: EditNoteFormProps) {
  const { updateNote } = useNotes();
  const router = useRouter();
  const { toast } = useToast();
  
  // Preview can be a data URL (for new images/text), or an existing server URL (for existing images)
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(note.attachment?.type || null);
  const [fileName, setFileName] = useState<string | null>(note.attachment?.name || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentChanged, setAttachmentChanged] = useState(false);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | undefined>(note.attachment?.url);


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
    if (note.attachment) {
      setFileName(note.attachment.name);
      setFileType(note.attachment.type);
      setExistingAttachmentUrl(note.attachment.url);

      if (note.attachment.url && note.attachment.type.startsWith("image/")) {
        setPreview(note.attachment.url); // Existing server URL for image
      } else if (note.attachment.content && note.attachment.type === "text/plain") {
        setPreview(note.attachment.content); // Existing text content for preview
      } else {
        setPreview(null);
      }
    } else {
      setFileName(null);
      setFileType(null);
      setPreview(null);
      setExistingAttachmentUrl(undefined);
    }
  }, [note, form]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setAttachmentChanged(true); 
    setExistingAttachmentUrl(undefined); // Clear existing URL if new file is chosen

    if (file) {
      form.setValue("attachmentFile", file);
      if (ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileName(file.name);
        setFileType(file.type);
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string); // Data URL for new image preview
          };
          reader.readAsDataURL(file);
        } else if (file.type === "text/plain") {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string); // Text content for new text file preview
          };
          reader.readAsText(file);
        } else {
          setPreview(null);
        }
      } else {
        setPreview(null);
        setFileType(null);
        setFileName(null);
        form.resetField("attachmentFile");
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid file type (JPG, PNG, GIF, TXT, PDF).",
          variant: "destructive",
        });
      }
    } else {
      form.resetField("attachmentFile");
      // If no file is selected, and an attachment existed, reset to showing the existing one if user cancels change
      // This part is tricky; for simplicity, clearing means it's gone unless form is not submitted.
      // Or, we can revert to old attachment details if file input is cleared.
      // For now, if they clear it, it's marked for removal.
      setPreview(null);
      setFileType(null);
      setFileName(null);
    }
  };

  const removeAttachment = () => {
    form.resetField("attachmentFile");
    setPreview(null);
    setFileType(null);
    setFileName(null);
    setAttachmentChanged(true); 
    setExistingAttachmentUrl(undefined); // Mark for removal
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let noteAttachmentUpdate: NoteFile | undefined | null = undefined; // undefined = no change, null = remove

    if (attachmentChanged) {
        if (values.attachmentFile) { // New file uploaded
            setIsUploading(true);
            const file = values.attachmentFile;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'File upload failed');
                }
                const result = await response.json();
                noteAttachmentUpdate = {
                    name: result.filename,
                    type: result.filetype,
                    url: result.url,
                };
                if (file.type === "text/plain" && preview && !preview.startsWith("http")) { // ensure preview is client-side content
                    noteAttachmentUpdate.content = preview;
                }
            } catch (error) {
                toast({ title: "Upload Error", description: (error as Error).message, variant: "destructive" });
                setIsUploading(false);
                setIsSubmitting(false);
                return;
            } finally {
                setIsUploading(false);
            }
        } else { // Attachment explicitly removed
            noteAttachmentUpdate = null;
        }
    } else if (existingAttachmentUrl && note.attachment) { // No change, keep existing
        noteAttachmentUpdate = note.attachment;
    }


    const success = updateNote(note.id, {
      title: values.title,
      content: values.content,
      attachment: noteAttachmentUpdate === null ? undefined : (noteAttachmentUpdate !== undefined ? noteAttachmentUpdate : note.attachment),
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
        <FormField
          control={form.control}
          name="attachmentFile"
          render={() => ( 
            <FormItem>
              <FormLabel htmlFor="attachment-upload-edit" className="text-foreground/80">Attachment (Optional)</FormLabel>
              <FormControl>
                <div className="relative flex items-center justify-center w-full">
                   <label
                    htmlFor="attachment-upload-edit"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-accent/30 hover:bg-accent/50 border-primary/50 hover:border-primary transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isUploading ? (
                       <div className="flex flex-col items-center justify-center pt-5 pb-6">
                         <Loader2 className="w-8 h-8 mb-2 text-primary/70 animate-spin" aria-hidden="true" />
                         <p className="text-sm text-foreground/70">Uploading...</p>
                       </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Paperclip className="w-8 h-8 mb-2 text-primary/70" aria-hidden="true" />
                        <p className="mb-1 text-sm text-foreground/70">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, GIF, TXT, PDF (MAX. 5MB)</p>
                      </div>
                    )}
                    <Input
                      id="attachment-upload-edit"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept={ALLOWED_FILE_TYPES.join(",")}
                      aria-describedby="attachment-description-edit"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </FormControl>
              <p id="attachment-description-edit" className="sr-only">
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
              disabled={isUploading || isSubmitting}
            >
              <XCircle className="h-5 w-5" aria-hidden="true" />
            </Button>
            <p className="text-sm font-medium text-foreground mb-2" aria-live="polite">Attached: {fileName}</p>
            {preview && fileType?.startsWith("image/") && (
              <Image 
                src={preview} // Can be data URL or server URL
                alt={fileName ? `Preview of ${fileName}` : "Attachment preview"}
                width={100} 
                height={100} 
                className="rounded-md object-cover max-h-32" 
                data-ai-hint="file preview"
                onError={() => { // Handle error if server URL for image is broken, etc.
                  if (preview.startsWith('/uploads/')) { // only if it's a server url
                     setPreview(null); // Clear preview on error
                     toast({ title: "Preview Error", description: "Could not load image preview.", variant: "destructive" });
                  }
                }}
              />
            )}
            {preview && fileType === "text/plain" && (
              <div className="mt-2 p-2 border rounded bg-background max-h-32 overflow-y-auto text-xs" aria-label={`Text file preview of ${fileName}`}>
                <pre>{preview.substring(0, 200)}{preview.length > 200 ? '...' : ''}</pre>
              </div>
            )}
            {!preview && fileType && !fileType.startsWith("image/") && !fileType.startsWith("text/") && (
                 <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <FileTextIcon className="h-8 w-8" aria-hidden="true" />
                    <span>This file type does not have a preview.</span>
                 </div>
            )}
             {/* If preview is null but there was an existing attachment (e.g. PDF), show placeholder */}
            {!preview && existingAttachmentUrl && fileType && !fileType.startsWith("image/") && !fileType.startsWith("text/") && (
                 <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <FileTextIcon className="h-8 w-8" aria-hidden="true" />
                    <span>Preview not available. File: {fileName}</span>
                 </div>
            )}
          </div>
        )}

        <Button type="submit" className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || isUploading}>
          {isSubmitting || isUploading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> 
              {isUploading ? 'Uploading File...' : 'Saving Changes...'}
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
