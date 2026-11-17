import React from 'react';
import PropTypes from 'prop-types';
import { Feather } from 'lucide-react';

const InkwellLogo = ({ size = 'md', showTagline = false }) => {
  const boxSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-9 h-9',
  };

  const iconSizes = {
    sm: 15,
    md: 17,
    lg: 19,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`${boxSizes[size] || boxSizes.md} flex items-center justify-center rounded-lg bg-accent text-accent-fg border border-subtle`}
      >
        <Feather size={iconSizes[size] || 17} strokeWidth={1.75} aria-hidden="true" />
      </div>

      <div className="flex flex-col">
        <span
          className={`font-display font-bold tracking-tight leading-none text-primary ${
            textSizes[size] || textSizes.md
          }`}
        >
          Inkwell
        </span>
        {showTagline && (
          <span className="text-[11px] font-medium tracking-wider uppercase mt-0.5 text-muted">
            Workspace
          </span>
        )}
      </div>
    </div>
  );
};

InkwellLogo.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showTagline: PropTypes.bool,
};

export default InkwellLogo;
