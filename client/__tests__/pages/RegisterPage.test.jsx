import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../../src/pages/RegisterPage';
import * as authService from '../../src/services/authService';
import AuthContext from '../../src/context/AuthContext';

jest.mock('../../src/services/authService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('RegisterPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderRegisterPage = (authValue = { isAuthenticated: false, loading: false, setUser: jest.fn() }) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <RegisterPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders registration form with username, email, password fields and submit button', () => {
    renderRegisterPage();
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('johndoe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('submits registration form successfully and navigates to /login', async () => {
    authService.register.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'User registered successfully'
      }
    });

    renderRegisterPage();

    fireEvent.change(screen.getByPlaceholderText('johndoe'), {
      target: { value: 'farhan_user' }
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'farhan@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        username: 'farhan_user',
        email: 'farhan@example.com',
        password: 'Password123'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { message: 'Registration successful! Please log in.' }
      });
    });
  });

  it('shows loading state while registration is submitting', async () => {
    let resolveRegister;
    authService.register.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRegister = resolve;
      })
    );

    renderRegisterPage();

    fireEvent.change(screen.getByPlaceholderText('johndoe'), {
      target: { value: 'farhan_user' }
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'farhan@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(screen.getByRole('button', { name: /Creating Account\.\.\./i })).toBeDisabled();

    resolveRegister({ data: { success: true } });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it('displays error message when registration fails (e.g. duplicate email)', async () => {
    authService.register.mockRejectedValueOnce({
      response: { data: { message: 'Email or username is already registered' } }
    });

    renderRegisterPage();

    fireEvent.change(screen.getByPlaceholderText('johndoe'), {
      target: { value: 'existinguser' }
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'existing@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email or username is already registered')).toBeInTheDocument();
    });
  });
});
