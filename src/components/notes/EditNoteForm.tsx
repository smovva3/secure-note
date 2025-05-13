
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
import { Loader2, Save, XCircle, FileText, Image as ImageIcon } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "text/plain"];

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100, { message: "Title must be 100 characters or less." }),
  content: z.string().min(1, { message: "Content is required." }),
  attachment: z.custom<File | undefined>((val) => val === undefined || val instanceof File, {
    message: "Invalid file type",
  }).refine(file => !file || file.size <= MAX_FILE_SIZE, `File size should not exceed ${MAX_FILE_SIZE / (1024*1024)}MB.`)
    .refine(file => !file || ALLOWED_FILE_TYPES.includes(file.type), "Only JPEG, PNG, GIF, and TXT files are allowed.")
    .optional(),
});

interface EditNoteFormProps {
  note: Note;
}

export default function EditNoteForm({ note }: EditNoteFormProps) {
  const { updateNote } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for the existing attachment (if any)
  const [currentAttachment, setCurrentAttachment] = useState<NoteFile | null>(note.attachment || null);
  
  // State for the visual preview of a newly selected file
  const [newFilePreviewDataUrl, setNewFilePreviewDataUrl] = useState<string | null>(null);
  const [newFilePreviewInfo, setNewFilePreviewInfo] = useState<{name: string, type: string} | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: note.title,
      content: note.content,
      attachment: undefined, // New file input, not pre-filled with existing attachment
    },
  });

  useEffect(() => {
    form.reset({
      title: note.title,
      content: note.content,
      attachment: undefined,
    });
    setCurrentAttachment(note.attachment || null);
    setNewFilePreviewDataUrl(null);
    setNewFilePreviewInfo(null);
  }, [note, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    form.setValue("attachment", file, { shouldValidate: true }); // Update RHF and validate

    if (file) {
        const fieldState = form.getFieldState("attachment");
        if (fieldState.invalid) {
            setNewFilePreviewDataUrl(null);
            setNewFilePreviewInfo(null);
            // Toast for error handled by FormMessage
            return;
        }
        setNewFilePreviewInfo({ name: file.name, type: file.type });
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewFilePreviewDataUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setNewFilePreviewDataUrl(null);
        }
    } else {
        setNewFilePreviewDataUrl(null);
        setNewFilePreviewInfo(null);
    }
  };

  const removeCurrentAttachment = () => {
    setCurrentAttachment(null); // Mark existing attachment for removal
    toast({ title: "Attachment Marked for Removal", description: "The existing attachment will be removed when you save." });
  };

  const removeNewFileSelection = () => {
    form.setValue("attachment", undefined, { shouldValidate: true }); // Clear RHF value
    setNewFilePreviewDataUrl(null);
    setNewFilePreviewInfo(null);
    const fileInput = document.getElementById('attachment-edit') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let finalAttachment: NoteFile | undefined = currentAttachment ? {...currentAttachment} : undefined; // Start with a copy of current or undefined

    if (values.attachment) { // A new file was selected and is valid
      const file = values.attachment;
      try {
        const fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          if (file.type.startsWith("image/")) {
            reader.readAsDataURL(file);
          } else if (file.type === "text/plain") {
            reader.readAsText(file);
          } else {
            resolve(''); 
          }
        });

        if (file.type.startsWith("image/")) {
          finalAttachment = { name: file.name, type: file.type, url: fileContent };
        } else if (file.type === "text/plain") {
          finalAttachment = { name: file.name, type: file.type, content: fileContent };
        } else {
           finalAttachment = { name: file.name, type: file.type };
        }
      } catch (error) {
        console.error("Error reading new file for submission:", error);
        toast({ title: "File Read Error", description: "Could not process the new attachment.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    } else if (newFilePreviewInfo === null && form.getValues("attachment") === undefined) {
      // This condition means the file input was explicitly cleared OR removeCurrentAttachment was clicked.
      // If removeCurrentAttachment was clicked, currentAttachment is already null.
      // If a new file was selected then cleared via removeNewFileSelection, values.attachment is undefined.
      // In this case, if currentAttachment was also marked for removal (is null), finalAttachment should be undefined.
      // If currentAttachment was not null, it means the user cleared a new selection but wants to keep original.
      // The initial `finalAttachment = currentAttachment ? {...currentAttachment} : undefined;` covers keeping original if no new file.
      // If `currentAttachment` became `null` via `removeCurrentAttachment`, `finalAttachment` is already `undefined`.
    }


    const success = updateNote(note.id, {
      title: values.title,
      content: values.content,
      attachment: finalAttachment, 
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

  // Determine what to display as preview
  const displayAttachmentInfo = newFilePreviewInfo || currentAttachment;
  const displayAttachmentDataUrl = newFilePreviewDataUrl || (currentAttachment?.type.startsWith("image/") ? currentAttachment.url : null);

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
            name="attachment"
            render={() => (
            <FormItem>
              <FormLabel htmlFor="attachment-edit" className="text-foreground/80">
                {currentAttachment && !newFilePreviewInfo ? "Replace current attachment (Optional)" : "Attachment (Optional)"}
              </FormLabel>
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
          )}
        />

        {displayAttachmentInfo && (
          <div className="mt-4 p-3 border rounded-md bg-secondary/30">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                {displayAttachmentInfo.type.startsWith("image/") ? <ImageIcon className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                <span>{displayAttachmentInfo.name}</span> ({displayAttachmentInfo.type})
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={newFilePreviewInfo ? removeNewFileSelection : removeCurrentAttachment} 
                className="text-destructive hover:text-destructive/80"
              >
                <XCircle className="h-4 w-4 mr-1" /> Remove {newFilePreviewInfo ? "New File" : (currentAttachment ? "Current File" : "")}
              </Button>
            </div>
            {displayAttachmentDataUrl && displayAttachmentInfo.type.startsWith("image/") && (
              <img src={displayAttachmentDataUrl} alt="Preview" className="max-h-40 rounded-md object-contain border" data-ai-hint="attachment preview"/>
            )}
            {/* Display existing text content if no new file is previewed and current is text */}
            {currentAttachment && currentAttachment.type === "text/plain" && currentAttachment.content && !newFilePreviewInfo && (
                 <div className="mt-2 p-3 border rounded bg-background max-h-40 overflow-y-auto text-sm">
                    <pre className="whitespace-pre-wrap break-all">{currentAttachment.content}</pre>
                  </div>
            )}
            {!displayAttachmentDataUrl && displayAttachmentInfo.type === "text/plain" && !currentAttachment?.content && (
              <p className="text-xs text-muted-foreground">Text file selected. Content will be saved. Preview not shown here for new text files.</p>
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
