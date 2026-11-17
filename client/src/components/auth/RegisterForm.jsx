import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import * as authService from '../../services/authService';

export const computePasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: 'Min 8 characters' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1;

  const labels = {
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
  };
  return { score, label: labels[score] || 'Weak' };
};

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = useMemo(() => computePasswordStrength(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register({ username, email, password });
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-danger-soft border border-danger text-danger text-sm font-medium"
        >
          {error}
        </div>
      )}

      <Input
        label="Username"
        type="text"
        placeholder="johndoe"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <div className="space-y-2">
        <Input
          label="Password (min 8 chars)"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showPasswordToggle
          required
          minLength={8}
        />

        <div className="space-y-1" aria-live="polite">
          <div className="grid grid-cols-4 gap-1.5 h-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`rounded-full transition-colors duration-150 ${
                  strength.score >= level ? 'bg-accent' : 'bg-subtle'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted flex justify-between">
            <span>Password strength</span>
            <span data-testid="password-strength-label">{strength.label}</span>
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full mt-2"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
};

export default RegisterForm;
