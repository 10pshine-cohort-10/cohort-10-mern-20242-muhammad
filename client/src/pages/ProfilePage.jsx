import React, { useState, useEffect } from 'react';
import { User, Lock } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import * as authService from '../services/authService';

const ProfilePage = () => {
  const { user, setUser } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });

    const isEmailChanging = email && email.toLowerCase() !== (user?.email || '').toLowerCase();
    if (isEmailChanging && !profileCurrentPassword) {
      setProfileMsg({ text: 'Please enter your current password to change your email address', type: 'error' });
      return;
    }

    setProfileLoading(true);

    try {
      const payload = {
        username,
        email,
      };
      if (profileCurrentPassword) {
        payload.currentPassword = profileCurrentPassword;
      }

      const response = await authService.updateProfile(payload);
      const updatedUser = response?.data?.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
      }
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      setProfileCurrentPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setProfileMsg({ text: msg, type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'New password must be at least 8 characters long', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password';
      setPasswordMsg({ text: msg, type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent font-display font-bold text-lg flex items-center justify-center border border-accent/20">
          {initials}
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            User Profile
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Manage your personal account settings and security credentials
          </p>
        </div>
      </div>

      {/* Profile Details Card */}
      <div className="bg-surface rounded-xl border border-subtle shadow-card p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-subtle">
          <User size={18} strokeWidth={1.75} className="text-accent" />
          <h2 className="font-display text-lg font-semibold text-primary">
            Account Information
          </h2>
        </div>

        {profileMsg.text && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 border ${
              profileMsg.type === 'success'
                ? 'bg-accent-soft text-accent border-accent/20'
                : 'bg-danger-soft text-danger border-danger/20'
            }`}
          >
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Username / Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Current Password (required if modifying email)"
            type="password"
            placeholder="••••••••"
            value={profileCurrentPassword}
            onChange={(e) => setProfileCurrentPassword(e.target.value)}
          />

          <div className="pt-2">
            <Button
              type="submit"
              disabled={profileLoading}
            >
              {profileLoading ? 'Saving...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-surface rounded-xl border border-subtle shadow-card p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-subtle">
          <Lock size={18} strokeWidth={1.75} className="text-accent" />
          <h2 className="font-display text-lg font-semibold text-primary">
            Change Password
          </h2>
        </div>

        {passwordMsg.text && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 border ${
              passwordMsg.type === 'success'
                ? 'bg-accent-soft text-accent border-accent/20'
                : 'bg-danger-soft text-danger border-danger/20'
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="New Password (min 8 chars)"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Updating...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
