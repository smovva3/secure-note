export interface User {
  username: string;
}

export interface NoteFile {
  name: string;
  type: string; // MIME type
  url?: string; // For image preview using URL.createObjectURL
  content?: string; // For text file preview
}
export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: string; // ISO string
  attachment?: NoteFile;
  userId: string; // To associate notes with a user
}
