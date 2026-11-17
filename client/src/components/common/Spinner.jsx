import React from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 'md' }) => {
  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <output className="flex justify-center items-center" aria-label="Loading">
      <Loader2
        size={iconSizes[size] || 24}
        strokeWidth={1.75}
        className="animate-spin text-accent"
        aria-hidden="true"
      />
    </output>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default Spinner;
