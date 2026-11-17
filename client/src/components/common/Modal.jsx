import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-sm transition-opacity duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-xl rounded-xl border border-subtle bg-surface text-primary shadow-elevated overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h3 id="modal-title" className="font-display text-lg font-semibold text-primary">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-canvas transition-colors"
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <div className="p-6 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
};

export default Modal;
