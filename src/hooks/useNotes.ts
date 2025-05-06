"use client";
import useLocalStorage from './useLocalStorage';
import type { Note, NoteFile } from '@/lib/types';
import { useAuth } from './useAuth';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for better ID generation

export function useNotes() {
  const { user } = useAuth();
  const [allNotes, setAllNotes] = useLocalStorage<Note[]>('securenote-notes', []);

  const userNotes = user ? allNotes.filter(note => note.userId === user.username) : [];

  const addNote = (newNoteData: Omit<Note, 'id' | 'timestamp' | 'userId'>) => {
    if (!user) return false;
    const note: Note = {
      ...newNoteData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId: user.username,
    };
    setAllNotes(prevNotes => [...prevNotes, note]);
    return true;
  };

  const getNoteById = (id: string): Note | undefined => {
    if (!user) return undefined;
    return allNotes.find(note => note.id === id && note.userId === user.username);
  };
  
  const deleteNote = (id: string) => {
    if (!user) return false;
    setAllNotes(prevNotes => prevNotes.filter(note => !(note.id === id && note.userId === user.username)));
    return true;
  };

  return { notes: userNotes, addNote, getNoteById, deleteNote, isLoading: user === undefined || allNotes === undefined };
}

// Need to install uuid: npm install uuid @types/uuid
// The user's package.json does not have uuid. This comment is for the developer.
// I will add uuid to package.json.
