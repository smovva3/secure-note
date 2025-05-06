
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
import type { NoteFile } from "@/lib/types";
import { useState, ChangeEvent } from "react";
import { Paperclip, XCircle, Image as ImageIcon, FileText as FileTextIcon, Loader2, PlusCircle } from "lucide-react";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];


const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100, { message: "Title must be 100 characters or less." }),
  content: z.string().min(1, { message: "Content is required." }),
  attachmentFile: z.custom<File>((val) => val instanceof File, "Please select a file.") // Changed to single File object
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((file) => !file || ALLOWED_FILE_TYPES.includes(file.type), "Only .jpg, .jpeg, .png, .gif, .txt, .pdf files are allowed."),
});

export default function CreateNoteForm() {
  const { addNote } = useNotes();
  const router = useRouter();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null); // For image Data URL or text content
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("attachmentFile", file); // Store the File object
      if (ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileName(file.name);
        setFileType(file.type);
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string); // Data URL for image preview
          };
          reader.readAsDataURL(file);
        } else if (file.type === "text/plain") {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string); // Text content for preview
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
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let noteAttachment: NoteFile | undefined = undefined;

    if (values.attachmentFile) {
      setIsUploading(true);
      const file = values.attachmentFile;
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'File upload failed');
        }

        const result = await response.json();
        noteAttachment = {
          name: result.filename,
          type: result.filetype,
          url: result.url, // Server URL
        };
        // If it's a text file, keep the client-side preview content
        if (file.type === "text/plain" && preview) {
          noteAttachment.content = preview;
        }

      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload Error",
          description: (error as Error).message || "Could not upload the attachment.",
          variant: "destructive",
        });
        setIsUploading(false);
        setIsSubmitting(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const success = addNote({
      title: values.title,
      content: values.content,
      attachment: noteAttachment,
    });

    setIsSubmitting(false);

    if (success) {
      toast({
        title: "Note Created",
        description: "Your new note has been saved successfully.",
      });
      router.push("/notes");
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
          name="attachmentFile" // Ensure this matches the schema
          render={() => ( 
            <FormItem>
              <FormLabel htmlFor="attachment-upload-create" className="text-foreground/80">Attachment (Optional)</FormLabel>
              <FormControl>
                <div className="relative flex items-center justify-center w-full">
                  <label
                    htmlFor="attachment-upload-create"
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
                      id="attachment-upload-create"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept={ALLOWED_FILE_TYPES.join(",")}
                      aria-describedby="attachment-description-create"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </FormControl>
              <p id="attachment-description-create" className="sr-only">
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
              <XCircle className="h-5 w-5" aria-hidden="true"/>
            </Button>
            <p className="text-sm font-medium text-foreground mb-2" aria-live="polite">Attached: {fileName}</p>
            {preview && fileType?.startsWith("image/") && (
              <Image src={preview} alt="Attachment preview" width={100} height={100} className="rounded-md object-cover max-h-32" data-ai-hint="file preview" />
            )}
            {preview && fileType === "text/plain" && (
              <div className="mt-2 p-2 border rounded bg-background max-h-32 overflow-y-auto text-xs" aria-label="Text file preview">
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

        <Button type="submit" className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || isUploading}>
          {isSubmitting || isUploading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> 
              {isUploading ? 'Uploading File...' : 'Creating Note...'}
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
