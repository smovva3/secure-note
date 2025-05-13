export interface User {
  username: string;
}

// NoteFile interface removed as attachments are removed for simplicity.
// export interface NoteFile {
//   name: string;
//   type: string; // MIME type
//   url?: string; 
//   content?: string; 
// }

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: string; // ISO string
  // attachment?: NoteFile; // Attachment field removed
  userId: string; // To associate notes with a user
}
