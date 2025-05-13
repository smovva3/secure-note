import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';
import { useAuth, AuthProvider } from '@/hooks/useAuth'; // Import AuthProvider
import { MemoryRouter } from 'react-router-dom'; // Import MemoryRouter

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => {
  const originalModule = jest.requireActual('@/hooks/useAuth');
  return {
    __esModule: true,
    ...originalModule, // Keep AuthProvider
    useAuth: jest.fn(),
  };
});


describe('LoginForm', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    mockLogin.mockClear();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      user: null,
      loading: false,
    });
  });

  // Helper function to render with providers
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        {/* AuthProvider might not be strictly necessary here if useAuth is fully mocked,
            but good practice if LoginForm itself or its children might consume it.
            If useAuth is fully mocked including context values, direct Provider might be skipped.
            However, useAuth() is called within LoginForm's useAuth import.
            If the real useAuth relies on context, AuthProvider is needed.
            Let's assume for robustness, or if the mock setup for useAuth is simple.
        */}
        <AuthProvider> 
          {ui}
        </AuthProvider>
      </MemoryRouter>
    );
  };


  it('renders the login form correctly', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('heading', { name: /Welcome to SecureNote/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('allows user to type in username', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'testuser');
    expect(usernameInput).toHaveValue('testuser');
  });

  it('calls login function with username on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    const usernameInput = screen.getByLabelText(/username/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(usernameInput, 'testuser');
    await user.click(loginButton);

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('testuser');
  });

  it('shows validation error for short username', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    const usernameInput = screen.getByLabelText(/username/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(usernameInput, 'ts');
    await user.click(loginButton);
    
    expect(await screen.findByText(/Username must be at least 3 characters./i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
