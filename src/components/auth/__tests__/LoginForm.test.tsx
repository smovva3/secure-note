
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('LoginForm', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockLogin.mockClear();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      user: null,
      loading: false,
    });
  });

  it('renders the login form correctly', () => {
    render(<LoginForm />);
    expect(screen.getByRole('heading', { name: /Welcome to SecureNote/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('allows user to type in username', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'testuser');
    expect(usernameInput).toHaveValue('testuser');
  });

  it('calls login function with username on submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const usernameInput = screen.getByLabelText(/username/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(usernameInput, 'testuser');
    await user.click(loginButton);

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('testuser');
  });

  it('shows validation error for short username', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const usernameInput = screen.getByLabelText(/username/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(usernameInput, 'ts');
    await user.click(loginButton);
    
    // Wait for validation message to appear
    expect(await screen.findByText(/Username must be at least 3 characters./i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
