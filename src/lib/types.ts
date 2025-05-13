
export interface User {
  username: string;
}

export interface NoteFile {
  name: string;
  type: string; // MIME type
  url?: string; // For image data URI or other direct links if ever used
  content?: string; // For text file content
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: string; // ISO string
  attachment?: NoteFile; // Attachment field re-introduced
  userId: string; // To associate notes with a user
}
