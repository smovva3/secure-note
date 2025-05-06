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
  
  const updateNote = (id: string, updatedData: Partial<Omit<Note, 'id' | 'userId' | 'timestamp'>>) => {
    if (!user) return false;
    setAllNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id && note.userId === user.username
          ? { ...note, ...updatedData, timestamp: new Date().toISOString() }
          : note
      )
    );
    return true;
  };

  const deleteNote = (id: string) => {
    if (!user) return false;
    setAllNotes(prevNotes => prevNotes.filter(note => !(note.id === id && note.userId === user.username)));
    return true;
  };

  return { notes: userNotes, addNote, getNoteById, updateNote, deleteNote, isLoading: user === undefined || allNotes === undefined };
}
