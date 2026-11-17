import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../../src/pages/ProfilePage';
import * as authService from '../../src/services/authService';
import AuthContext from '../../src/context/AuthContext';

jest.mock('../../src/services/authService');

describe('ProfilePage Component', () => {
  const mockUser = { id: 1, username: 'Farhan', email: 'farhan@example.com' };
  const mockSetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderProfilePage = (user = mockUser) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user, setUser: mockSetUser, isAuthenticated: true, loading: false }}>
          <ProfilePage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders profile page with account info, password cards, and user initials', () => {
    renderProfilePage();
    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
    expect(screen.getByText('FA')).toBeInTheDocument();
  });

  it('pre-populates username and email inputs from authenticated user', () => {
    renderProfilePage();
    expect(screen.getByDisplayValue('Farhan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('farhan@example.com')).toBeInTheDocument();
  });

  it('shows error if changing email without current password', async () => {
    renderProfilePage();
    const emailInput = screen.getByDisplayValue('farhan@example.com');
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Update Profile/i }));

    expect(
      await screen.findByText(/Please enter your current password to change your email address/i)
    ).toBeInTheDocument();
    expect(authService.updateProfile).not.toHaveBeenCalled();
  });

  it('updates profile successfully when username is changed', async () => {
    const updatedUser = { id: 1, username: 'FarhanUpdated', email: 'farhan@example.com' };
    authService.updateProfile.mockResolvedValueOnce({
      data: {
        success: true,
        data: { user: updatedUser },
      },
    });

    renderProfilePage();
    const usernameInput = screen.getByDisplayValue('Farhan');
    fireEvent.change(usernameInput, { target: { value: 'FarhanUpdated' } });

    fireEvent.click(screen.getByRole('button', { name: /Update Profile/i }));

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
    expect(mockSetUser).toHaveBeenCalledWith(updatedUser);
  });

  it('displays API error message if profile update fails', async () => {
    authService.updateProfile.mockRejectedValueOnce({
      response: { data: { message: 'Username already taken' } },
    });

    renderProfilePage();
    const usernameInput = screen.getByDisplayValue('Farhan');
    fireEvent.change(usernameInput, { target: { value: 'TakenUser' } });

    fireEvent.click(screen.getByRole('button', { name: /Update Profile/i }));

    await waitFor(() => {
      expect(screen.getByText('Username already taken')).toBeInTheDocument();
    });
  });

  it('validates minimum 8 characters for new password', async () => {
    renderProfilePage();
    const currentPassInput = screen.getByLabelText(/^Current Password$/i);
    const newPassInput = screen.getByLabelText(/New Password \(min 8 chars\)/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);

    fireEvent.change(currentPassInput, { target: { value: 'CurrentPass123' } });
    fireEvent.change(newPassInput, { target: { value: 'short' } });
    fireEvent.change(confirmPassInput, { target: { value: 'short' } });

    fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

    expect(
      await screen.findByText('New password must be at least 8 characters long')
    ).toBeInTheDocument();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('validates password confirmation match', async () => {
    renderProfilePage();
    const currentPassInput = screen.getByLabelText(/^Current Password$/i);
    const newPassInput = screen.getByLabelText(/New Password \(min 8 chars\)/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);

    fireEvent.change(currentPassInput, { target: { value: 'CurrentPass123' } });
    fireEvent.change(newPassInput, { target: { value: 'ValidPassword123' } });
    fireEvent.change(confirmPassInput, { target: { value: 'DifferentPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('successfully changes password when inputs are valid', async () => {
    authService.changePassword.mockResolvedValueOnce({
      data: { success: true },
    });

    renderProfilePage();
    const currentPassInput = screen.getByLabelText(/^Current Password$/i);
    const newPassInput = screen.getByLabelText(/New Password \(min 8 chars\)/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);

    fireEvent.change(currentPassInput, { target: { value: 'OldPassword123' } });
    fireEvent.change(newPassInput, { target: { value: 'NewPassword123' } });
    fireEvent.change(confirmPassInput, { target: { value: 'NewPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

    await waitFor(() => {
      expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
    });
    expect(authService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
    });
  });

  it('displays API error message if changing password fails', async () => {
    authService.changePassword.mockRejectedValueOnce({
      response: { data: { message: 'Current password is incorrect' } },
    });

    renderProfilePage();
    const currentPassInput = screen.getByLabelText(/^Current Password$/i);
    const newPassInput = screen.getByLabelText(/New Password \(min 8 chars\)/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);

    fireEvent.change(currentPassInput, { target: { value: 'WrongPass' } });
    fireEvent.change(newPassInput, { target: { value: 'NewPassword123' } });
    fireEvent.change(confirmPassInput, { target: { value: 'NewPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
    });
  });
});
