
"use client";
import useLocalStorage from './useLocalStorage';
import type { Note, NoteFile } from '@/lib/types';
import { useAuth } from './useAuth';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for better ID generation

export function useNotes() {
  const { user } = useAuth();
  const [allNotes, setAllNotes] = useLocalStorage<Note[]>('securenote-notes', []);

  const userNotes = user 
    ? (Array.isArray(allNotes) ? allNotes.filter(note => note.userId === user.username) : []) 
    : [];

  const addNote = (newNoteData: Omit<Note, 'id' | 'timestamp' | 'userId'>) => {
    if (!user) return false;
    const note: Note = {
      ...newNoteData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId: user.username,
      // attachment is passed directly from newNoteData
    };
    try {
      setAllNotes(prevNotes => [...(Array.isArray(prevNotes) ? prevNotes : []), note]);
      return true;
    } catch (error) {
      console.error("Failed to add note to local storage:", error);
      return false;
    }
  };

  const getNoteById = (id: string): Note | undefined => {
    if (!user) return undefined;
    const notesToSearch = Array.isArray(allNotes) ? allNotes : [];
    return notesToSearch.find(note => note.id === id && note.userId === user.username);
  };
  
  const updateNote = (id: string, updatedData: Partial<Omit<Note, 'id' | 'userId' | 'timestamp'>>) => {
    if (!user) return false;
    try {
      setAllNotes(prevNotes =>
        (Array.isArray(prevNotes) ? prevNotes : []).map(note =>
          note.id === id && note.userId === user.username
            ? { ...note, ...updatedData, timestamp: new Date().toISOString() }
            : note
        )
      );
      return true;
    } catch (error) {
      console.error("Failed to update note in local storage:", error);
      return false;
    }
  };

  const deleteNote = (id: string) => {
    if (!user) return false;
    try {
      setAllNotes(prevNotes => (Array.isArray(prevNotes) ? prevNotes : []).filter(note => !(note.id === id && note.userId === user.username)));
      return true;
    } catch (error) {
      console.error("Failed to delete note from local storage:", error);
      return false;
    }
  };

  return { 
    notes: userNotes, 
    addNote, 
    getNoteById, 
    updateNote, 
    deleteNote, 
    isLoading: user === undefined || allNotes === undefined // This might need adjustment based on AuthProvider's loading
  };
}
