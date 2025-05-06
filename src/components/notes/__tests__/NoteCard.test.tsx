
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteCard from '../NoteCard';
import type { Note } from '@/lib/types';
import { useNotes } from '@/hooks/useNotes';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

// Mock dependencies
jest.mock('@/hooks/useNotes');
jest.mock('@/hooks/use-toast');
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'), // import and retain default behavior
  formatDistanceToNow: jest.fn(),
}));


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
    mockUseNotes.mockReturnValue({ deleteNote: mockDeleteNote });
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockFormatDistanceToNow.mockReturnValue('about 1 hour ago'); // Default mock return value
    mockDeleteNote.mockClear();
    mockToast.mockClear();
  });

  it('renders note details correctly', () => {
    render(<NoteCard note={baseNote} />);

    expect(screen.getByText(baseNote.title)).toBeInTheDocument();
    expect(screen.getByText(baseNote.content)).toBeInTheDocument();
    expect(screen.getByText('about 1 hour ago')).toBeInTheDocument(); // From mocked formatDistanceToNow
    expect(screen.getByRole('link', { name: /View Details/i })).toHaveAttribute('href', `/notes/${baseNote.id}`);
  });

  it('renders attachment name if attachment exists', () => {
    const noteWithAttachment: Note = {
      ...baseNote,
      attachment: { name: 'document.pdf', type: 'application/pdf' },
    };
    render(<NoteCard note={noteWithAttachment} />);
    expect(screen.getByText(`Attachment: ${noteWithAttachment.attachment!.name}`)).toBeInTheDocument();
  });

  it('does not render attachment info if no attachment', () => {
    render(<NoteCard note={baseNote} />);
    expect(screen.queryByText(/Attachment:/i)).not.toBeInTheDocument();
  });

  it('opens delete confirmation dialog on delete button click', async () => {
    const user = userEvent.setup();
    render(<NoteCard note={baseNote} />);
    
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure?/i)).toBeInTheDocument();
    expect(screen.getByText(`This action cannot be undone. This will permanently delete your note titled "${baseNote.title}".`)).toBeInTheDocument();
  });

  it('calls deleteNote and shows success toast on confirm delete', async () => {
    const user = userEvent.setup();
    mockDeleteNote.mockReturnValue(true); // Simulate successful deletion
    render(<NoteCard note={baseNote} />);
    
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /Continue/i });
    await user.click(confirmButton);

    expect(mockDeleteNote).toHaveBeenCalledWith(baseNote.id);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Note Deleted",
      description: `Note "${baseNote.title}" has been successfully deleted.`,
    });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(); // Dialog should close
  });

  it('shows error toast if deleteNote fails', async () => {
    const user = userEvent.setup();
    mockDeleteNote.mockReturnValue(false); // Simulate failed deletion
    render(<NoteCard note={baseNote} />);

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
    // Button should re-enable if deletion fails and dialog is still open (or re-opens on error, depends on UX)
    // For this component, it simply stays enabled, and the dialog might still be open or closed.
    // Check that the delete button on the card is not in deleting state.
    expect(screen.getByRole('button', { name: /Delete/i })).not.toBeDisabled();
  });

  it('closes dialog on cancel click', async () => {
    const user = userEvent.setup();
    render(<NoteCard note={baseNote} />);
    
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockDeleteNote).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows deleting state on delete button when deleting', async () => {
    const user = userEvent.setup();
    // Make deleteNote return a promise that never resolves to keep it in deleting state
    mockDeleteNote.mockReturnValue(new Promise(() => {})); 
    render(<NoteCard note={baseNote} />);

    const deleteButtonOnCard = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButtonOnCard); // Open dialog

    const confirmButtonInDialog = screen.getByRole('button', { name: /Continue/i });
    // Don't await this click fully because the promise never resolves
    user.click(confirmButtonInDialog);

    // Check button on card after initiating delete
    expect(await screen.findByRole('button', {name: /Deleting.../i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Deleting.../i})).toBeDisabled(); // The card's delete button becomes "Deleting..."
    
    // Also check the continue button in the dialog
    const continueButtonInDialogAfterClick = await screen.findByRole('button', { name: /Continue/i });
    expect(continueButtonInDialogAfterClick).toBeDisabled();
  });
});
