import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteCard from '../NoteCard';
import type { Note } from '@/lib/types';
import { useNotes } from '@/hooks/useNotes';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { MemoryRouter } from 'react-router-dom'; // Import MemoryRouter
import { AuthProvider } from '@/hooks/useAuth'; // Import AuthProvider

// Mock dependencies
jest.mock('@/hooks/useNotes');
jest.mock('@/hooks/use-toast');
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  formatDistanceToNow: jest.fn(),
}));
// Mock useAuth as it's used by useNotes and potentially other components
jest.mock('@/hooks/useAuth', () => {
  const originalModule = jest.requireActual('@/hooks/useAuth');
  return {
    __esModule: true,
    ...originalModule,
    useAuth: jest.fn(() => ({ // Provide a default mock implementation for useAuth
      user: { username: 'testuser' }, // Mock user for useNotes
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    })),
  };
});


const mockUseNotes = useNotes as jest.Mock;
const mockUseToast = useToast as jest.Mock;
const mockFormatDistanceToNow = formatDistanceToNow as jest.Mock;


describe('NoteCard', () => {
  const mockDeleteNote = jest.fn();
  const mockToast = jest.fn();

  const baseNote: Note = {
    id: 'note1',
    title: 'Test Note Title',
    content: 'This is the content of the test note, it might be a bit long to test clamping.',
    timestamp: new Date().toISOString(),
    userId: 'user123',
  };

  beforeEach(() => {
    mockUseNotes.mockReturnValue({ deleteNote: mockDeleteNote, getNoteById: jest.fn(), notes: [], addNote: jest.fn(), updateNote: jest.fn(), isLoading:false });
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockFormatDistanceToNow.mockReturnValue('about 1 hour ago');
    mockDeleteNote.mockClear();
    mockToast.mockClear();
  });

  // Helper function to render with providers
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        <AuthProvider> {/* useNotes internally uses useAuth, so provider is good */}
          {ui}
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('renders note details correctly', () => {
    renderWithProviders(<NoteCard note={baseNote} />);

    expect(screen.getByText(baseNote.title)).toBeInTheDocument();
    expect(screen.getByText(baseNote.content)).toBeInTheDocument();
    expect(screen.getByText('about 1 hour ago')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Details/i })).toHaveAttribute('href', `/notes/${baseNote.id}`);
  });

  // Attachment tests removed as functionality is removed

  it('opens delete confirmation dialog on delete button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NoteCard note={baseNote} />);
    
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure?/i)).toBeInTheDocument();
    expect(screen.getByText(`This action cannot be undone. This will permanently delete your note titled "${baseNote.title}".`)).toBeInTheDocument();
  });

  it('calls deleteNote and shows success toast on confirm delete', async () => {
    const user = userEvent.setup();
    mockDeleteNote.mockReturnValue(true);
    renderWithProviders(<NoteCard note={baseNote} />);
    
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /Continue/i });
    await user.click(confirmButton);

    expect(mockDeleteNote).toHaveBeenCalledWith(baseNote.id);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Note Deleted",
      description: `Note "${baseNote.title}" has been successfully deleted.`,
    });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows error toast if deleteNote fails', async () => {
    const user = userEvent.setup();
    mockDeleteNote.mockReturnValue(false);
    renderWithProviders(<NoteCard note={baseNote} />);

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);
    
    const confirmButton = screen.getByRole('button', { name: /Continue/i });
    await user.click(confirmButton);

    expect(mockDeleteNote).toHaveBeenCalledWith(baseNote.id);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Failed to delete the note.",
      variant: "destructive",
    });
    expect(screen.getByRole('button', { name: /Delete/i })).not.toBeDisabled();
  });

  it('closes dialog on cancel click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NoteCard note={baseNote} />);
    
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockDeleteNote).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows deleting state on delete button when deleting', async () => {
    const user = userEvent.setup();
    mockDeleteNote.mockReturnValue(new Promise(() => {})); 
    renderWithProviders(<NoteCard note={baseNote} />);

    const deleteButtonOnCard = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButtonOnCard);

    const confirmButtonInDialog = screen.getByRole('button', { name: /Continue/i });
    user.click(confirmButtonInDialog);

    expect(await screen.findByRole('button', {name: /Deleting.../i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Deleting.../i})).toBeDisabled();
    
    const continueButtonInDialogAfterClick = await screen.findByRole('button', { name: /Continue/i });
    expect(continueButtonInDialogAfterClick).toBeDisabled();
  });
});
