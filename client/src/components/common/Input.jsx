import React, { useState, useId } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({
  label,
  type = 'text',
  error,
  hint,
  className = '',
  id,
  showPasswordToggle = false,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [revealPassword, setRevealPassword] = useState(false);

  const isPassword = type === 'password';
  const effectiveType = isPassword && revealPassword ? 'text' : type;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-muted mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={effectiveType}
          className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors duration-150 bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 ${
            isPassword && showPasswordToggle ? 'pr-10' : ''
          } ${
            error
              ? 'border-danger focus:ring-danger'
              : 'border-subtle focus:border-accent focus:ring-accent'
          }`}
          {...props}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setRevealPassword((prev) => !prev)}
            aria-label={revealPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-muted hover:text-primary transition-colors"
          >
            {revealPassword ? (
              <EyeOff size={16} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Eye size={16} strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {hint && !error && (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.string,
  hint: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
  showPasswordToggle: PropTypes.bool,
};

export default Input;
