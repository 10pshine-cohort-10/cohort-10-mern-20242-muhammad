import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ShieldCheck, Terminal, FileText } from 'lucide-react';
import InkwellLogo from '../common/InkwellLogo';
import ThemeToggle from '../common/ThemeToggle';

const AuthSplitLayout = ({
  mode = 'login',
  title,
  subtitle,
  bannerMessage,
  children,
}) => {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] grid grid-cols-1 lg:grid-cols-12 bg-canvas text-primary transition-colors duration-150">
      {/* Left Editorial Column */}
      <div className="hidden lg:flex lg:col-span-6 bg-surface border-r border-subtle p-12 flex-col justify-between">
        <div className="flex items-center justify-between">
          <InkwellLogo size="lg" showTagline />
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-subtle bg-canvas text-muted">
            v2.0
          </span>
        </div>

        <div className="my-auto max-w-md space-y-6">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-primary">
            Quiet, structured space for lasting notes.
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            Built with an editorial type hierarchy, distraction-free rich text formatting,
            and strict server-and-client sanitization.
          </p>

          <div className="p-5 rounded-xl bg-canvas border border-subtle space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="px-2 py-0.5 rounded-md bg-accent-soft text-accent font-medium">
                Architecture
              </span>
              <span className="font-mono text-[11px]">Pinned</span>
            </div>
            <p className="font-display text-base font-semibold text-primary">
              System Design & API Contracts
            </p>
            <p className="text-xs text-muted line-clamp-2">
              Parameterized SQL queries scoped by user_id, HttpOnly JWT session cookies, and instant keyboard navigation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-canvas border border-subtle">
            <FileText size={14} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
            <span>TipTap Editor</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-canvas border border-subtle">
            <Terminal size={14} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
            <span>Ctrl+K Palette</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-canvas border border-subtle">
            <ShieldCheck size={14} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
            <span>DOMPurify + JWT</span>
          </span>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex p-1 rounded-lg bg-surface border border-subtle">
              <Link
                to="/login"
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:text-primary'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:text-primary'
                }`}
              >
                Create Account
              </Link>
            </div>
            <ThemeToggle showLabel />
          </div>

          <div className="rounded-xl border border-subtle bg-surface p-7 sm:p-8 shadow-card">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-primary tracking-tight">
                {title}
              </h2>
              <p className="text-sm text-muted mt-1">
                {subtitle}
              </p>
            </div>

            {bannerMessage && (
              <div className="mb-5 p-3 rounded-lg bg-accent-soft border border-accent text-accent text-sm font-medium">
                {bannerMessage}
              </div>
            )}

            {children}

            <div className="mt-6 pt-5 border-t border-subtle text-center text-sm text-muted">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-accent hover:underline"
                  >
                    Create one
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-accent hover:underline"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AuthSplitLayout.propTypes = {
  mode: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  bannerMessage: PropTypes.string,
  children: PropTypes.node,
};

export default AuthSplitLayout;
