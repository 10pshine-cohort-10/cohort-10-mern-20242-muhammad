import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../src/pages/LoginPage';
import * as authService from '../../src/services/authService';
import AuthContext from '../../src/context/AuthContext';

jest.mock('../../src/services/authService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderLoginPage = (authValue = { isAuthenticated: false, loading: false, setUser: jest.fn() }) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders login form with email, password fields and heading', () => {
    renderLoginPage();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('successfully logs in user, updates AuthContext and redirects to /dashboard', async () => {
    const mockSetUser = jest.fn();
    const mockUser = { id: 1, username: 'farhan', email: 'farhan@example.com' };

    authService.login.mockResolvedValueOnce({
      data: {
        success: true,
        data: { user: mockUser }
      }
    });

    renderLoginPage({ isAuthenticated: false, loading: false, setUser: mockSetUser });

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'farhan@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'farhan@example.com',
        password: 'Password123'
      });
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows loading state while login request is in progress', async () => {
    let resolveLogin;
    authService.login.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'farhan@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(screen.getByRole('button', { name: /Signing in\.\.\./i })).toBeDisabled();

    resolveLogin({ data: { data: { user: { id: 1, email: 'farhan@example.com' } } } });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on failed login attempt', async () => {
    authService.login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });

    renderLoginPage();
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'wrong@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
