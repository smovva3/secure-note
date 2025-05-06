
import { render, screen, within } from '@testing-library/react';
import NotesListPage from '../page'; // Adjust path if your file structure is different
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import type { Note } from '@/lib/types';

// Mock hooks
jest.mock('@/hooks/useNotes');
jest.mock('@/hooks/useAuth');

const mockUseNotes = useNotes as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

describe('NotesListPage', () => {
  beforeEach(() => {
    // Setup default mock values for hooks
    mockUseAuth.mockReturnValue({
      user: { username: 'testuser' },
      loading: false,
    });
    mockUseNotes.mockReturnValue({
      notes: [],
      isLoading: false,
      deleteNote: jest.fn(), // Add if NoteCard's delete button is tested through this page
    });
  });

  it('renders loading state correctly', () => {
    mockUseNotes.mockReturnValue({
      notes: [],
      isLoading: true,
    });
    render(<NotesListPage />);
    expect(screen.getByText(/Loading notes.../i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loading notes/i)).toBeInTheDocument(); // For the Loader2 aria-label
  });

  it('renders "No notes yet!" message when there are no notes', () => {
    mockUseNotes.mockReturnValue({
      notes: [],
      isLoading: false,
    });
    render(<NotesListPage />);
    expect(screen.getByText(/No notes yet!/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create First Note/i })).toBeInTheDocument();
  });

  it('renders a list of notes when notes are present', () => {
    const sampleNotes: Note[] = [
      { id: '1', title: 'Note 1', content: 'Content 1', timestamp: new Date().toISOString(), userId: 'testuser' },
      { id: '2', title: 'Note 2', content: 'Content 2', timestamp: new Date().toISOString(), userId: 'testuser', attachment: {name: 'file.txt', type: 'text/plain'} },
    ];
    mockUseNotes.mockReturnValue({
      notes: sampleNotes,
      isLoading: false,
    });

    render(<NotesListPage />);

    expect(screen.getByRole('heading', { name: /My Notes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create New Note/i })).toBeInTheDocument();

    const noteCards = screen.getAllByRole('article'); // Assuming NoteCard renders an <article> or similar landmark
    expect(noteCards).toHaveLength(sampleNotes.length);

    // Check content of the first note card
    const firstCard = noteCards[0];
    expect(within(firstCard).getByText('Note 1')).toBeInTheDocument();
    expect(within(firstCard).getByText('Content 1')).toBeInTheDocument();
    expect(within(firstCard).getByRole('link', { name: /View Details/i })).toHaveAttribute('href', '/notes/1');

    // Check content of the second note card (with attachment)
    const secondCard = noteCards[1];
    expect(within(secondCard).getByText('Note 2')).toBeInTheDocument();
    expect(within(secondCard).getByText('Content 2')).toBeInTheDocument();
    expect(within(secondCard).getByText(/Attachment: file.txt/i)).toBeInTheDocument();
    expect(within(secondCard).getByRole('link', { name: /View Details/i })).toHaveAttribute('href', '/notes/2');
  });

   it('sorts notes by timestamp in descending order', () => {
    const notes: Note[] = [
      { id: '1', title: 'Older Note', content: '...', timestamp: '2023-01-01T10:00:00.000Z', userId: 'testuser' },
      { id: '2', title: 'Newer Note', content: '...', timestamp: '2023-01-02T10:00:00.000Z', userId: 'testuser' },
      { id: '3', title: 'Middle Note', content: '...', timestamp: '2023-01-01T12:00:00.000Z', userId: 'testuser' },
    ];
    mockUseNotes.mockReturnValue({ notes, isLoading: false });

    render(<NotesListPage />);

    const noteTitles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent); // Assuming NoteCard titles are h3
    // Note: This depends on NoteCard's structure. A more robust way is to get specific elements within cards.
    // For simplicity, if NoteCard's CardTitle renders a div with the title text:
    const renderedTitles = screen.getAllByText(/Note/i, { selector: '[class*="text-xl"]' }).map(el => el.textContent);


    // Expected order: Newer Note, Middle Note, Older Note
    // This test is a bit fragile as it relies on the exact rendering of NoteCard.
    // A better test would be to check the order of elements with specific data-testid attributes if available.
    // For now, we can check the order of appearance of title texts.
    const titles = screen.getAllByRole('heading', {name: /(Older Note)|(Newer Note)|(Middle Note)/i});
    expect(titles[0]).toHaveTextContent('Newer Note');
    expect(titles[1]).toHaveTextContent('Middle Note');
    expect(titles[2]).toHaveTextContent('Older Note');
  });
});
