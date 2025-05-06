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
import { Paperclip, XCircle, Image as ImageIcon, FileText as FileTextIcon, Loader2 } from "lucide-react";
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

export default function CreateNoteForm() {
  const { addNote } = useNotes();
  const router = useRouter();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


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
            setPreview(reader.result as string); // Store text content for preview
          };
          reader.readAsText(file);
        } else {
          setPreview(null); // No preview for other types like PDF
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
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let noteFile: NoteFile | undefined = undefined;
    if (values.attachment && values.attachment.length > 0) {
      const file = values.attachment[0];
      noteFile = {
        name: file.name,
        type: file.type,
      };
      if (file.type.startsWith("image/")) {
        noteFile.url = URL.createObjectURL(file); // For immediate display on NoteDetailsPage (if navigating directly)
      } else if (file.type === "text/plain") {
        noteFile.content = await file.text(); // Read text content
      }
      // For PDF or other types, we might store the file differently in a real backend.
      // Here, we're just storing metadata.
    }

    const success = addNote({
      title: values.title,
      content: values.content,
      attachment: noteFile,
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
              <FormLabel className="text-foreground/80">Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter note title" {...field} className="text-base py-3 px-4 focus:ring-primary focus:border-primary" />
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
              <FormLabel className="text-foreground/80">Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your note here..."
                  {...field}
                  rows={8}
                  className="text-base py-3 px-4 focus:ring-primary focus:border-primary"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="attachment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">Attachment (Optional)</FormLabel>
              <FormControl>
                <div className="relative flex items-center justify-center w-full">
                  <label
                    htmlFor="attachment-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-accent/30 hover:bg-accent/50 border-primary/50 hover:border-primary transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Paperclip className="w-8 h-8 mb-2 text-primary/70" />
                      <p className="mb-1 text-sm text-foreground/70">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, GIF, TXT, PDF (MAX. 5MB)</p>
                    </div>
                    <Input
                      id="attachment-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept={ALLOWED_FILE_TYPES.join(",")}
                    />
                  </label>
                </div>
              </FormControl>
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
            >
              <XCircle className="h-5 w-5" />
              <span className="sr-only">Remove attachment</span>
            </Button>
            <p className="text-sm font-medium text-foreground mb-2">Attached: {fileName}</p>
            {preview && fileType?.startsWith("image/") && (
              <Image src={preview} alt="Preview" width={100} height={100} className="rounded-md object-cover max-h-32" data-ai-hint="file preview" />
            )}
            {preview && fileType === "text/plain" && (
              <div className="mt-2 p-2 border rounded bg-background max-h-32 overflow-y-auto text-xs">
                <pre>{preview.substring(0, 200)}{preview.length > 200 ? '...' : ''}</pre>
              </div>
            )}
            {!preview && fileType && !fileType.startsWith("image/") && !fileType.startsWith("text/") && (
                 <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <FileTextIcon className="h-8 w-8" />
                    <span>This file type does not have a preview.</span>
                 </div>
            )}
          </div>
        )}

        <Button type="submit" className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Note...
            </>
          ) : (
            "Create Note"
          )}
        </Button>
      </form>
    </Form>
  );
}
