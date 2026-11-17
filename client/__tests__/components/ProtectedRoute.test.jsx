import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../src/components/common/ProtectedRoute';
import Navbar from '../../src/components/common/Navbar';
import AuthContext from '../../src/context/AuthContext';
import * as authService from '../../src/services/authService';

jest.mock('../../src/services/authService');

describe('Authentication UI Behavior & ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithAuth = (authValue, initialEntry = '/dashboard') => {
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<div>Login Page Redirected</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('renders loading spinner while authentication state is loading', () => {
    renderWithAuth({ isAuthenticated: false, loading: true, user: null });
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    expect(screen.queryByText('Secret Dashboard Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    renderWithAuth({ isAuthenticated: false, loading: false, user: null });
    expect(screen.getByText('Login Page Redirected')).toBeInTheDocument();
    expect(screen.queryByText('Secret Dashboard Content')).not.toBeInTheDocument();
  });

  it('renders protected child component when user is authenticated', () => {
    renderWithAuth({
      isAuthenticated: true,
      loading: false,
      user: { id: 1, username: 'farhan', email: 'farhan@example.com' }
    });
    expect(screen.getByText('Secret Dashboard Content')).toBeInTheDocument();
  });

  it('opens user profile dropdown in Navbar and logs out when clicking Sign Out', async () => {
    const mockSetUser = jest.fn();
    authService.logout.mockResolvedValueOnce({ data: { success: true } });

    render(
      <AuthContext.Provider
        value={{
          isAuthenticated: true,
          loading: false,
          user: { id: 1, username: 'farhan', email: 'farhan@example.com' },
          setUser: mockSetUser
        }}
      >
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const profileBtn = screen.getByLabelText('User profile menu');
    fireEvent.click(profileBtn);

    expect(screen.getByText('farhan@example.com')).toBeInTheDocument();

    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(mockSetUser).toHaveBeenCalledWith(null);
    });
  });
});
