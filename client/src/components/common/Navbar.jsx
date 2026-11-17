import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronDown, FileText, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/authService';
import InkwellLogo from './InkwellLogo';
import ThemeToggle from './ThemeToggle';
import Button from './Button';

const Navbar = ({ onOpenCommandPalette }) => {
  const { user, setUser, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    try {
      await logout();
    } catch {
      // Clear local session regardless
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  const displayName = user?.username || user?.name || user?.email || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-subtle transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="focus:outline-none">
              <InkwellLogo size="md" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                aria-label="Open command palette"
                className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-subtle bg-canvas text-xs text-muted hover:border-accent hover:text-primary transition-colors"
              >
                <Search size={14} strokeWidth={1.75} aria-hidden="true" />
                <span>Command palette</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface border border-subtle text-muted">
                  Ctrl+K
                </kbd>
              </button>
            )}

            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'bg-accent-soft text-accent'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  Dashboard
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative pl-3 border-l border-subtle" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-canvas transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="true"
                    aria-label="User profile menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent-soft text-accent font-semibold text-xs flex items-center justify-center border border-subtle">
                      {avatarInitial}
                    </div>
                    <span className="text-sm font-medium text-primary max-w-[130px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown size={15} strokeWidth={1.75} className="text-muted" aria-hidden="true" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-subtle bg-surface shadow-elevated py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-subtle">
                        <p className="text-sm font-semibold text-primary truncate">
                          {displayName}
                        </p>
                        {user?.email && (
                          <p className="text-xs text-muted truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary hover:bg-accent-soft hover:text-accent transition-colors"
                      >
                        <FileText size={16} strokeWidth={1.75} aria-hidden="true" />
                        <span>My Notes</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary hover:bg-accent-soft hover:text-accent transition-colors"
                      >
                        <Settings size={16} strokeWidth={1.75} aria-hidden="true" />
                        <span>Profile Settings</span>
                      </Link>
                      <div className="border-t border-subtle mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 text-left px-4 py-2 text-sm text-danger hover:bg-danger-soft font-medium transition-colors"
                        >
                          <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-muted hover:text-primary px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger + Theme Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-muted hover:text-primary hover:bg-canvas focus:outline-none"
              aria-label="Toggle Menu"
            >
              {menuOpen ? (
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-subtle bg-surface px-4 pt-2 pb-4 space-y-1">
          {isAuthenticated ? (
            <>
              <div className="py-2 text-xs text-muted border-b border-subtle">
                Signed in as <strong className="text-primary">{displayName}</strong>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-accent-soft hover:text-accent"
              >
                <FileText size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-accent-soft hover:text-accent"
              >
                <Settings size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>Profile</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger-soft"
              >
                <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-accent-soft"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-accent hover:bg-accent-soft"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

Navbar.propTypes = {
  onOpenCommandPalette: PropTypes.func,
};

export default Navbar;
