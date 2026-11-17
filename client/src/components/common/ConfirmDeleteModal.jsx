import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, isDeleting = false }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Note">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-danger-soft text-danger shrink-0">
            <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Are you sure you want to permanently delete this note? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-subtle">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmDeleteModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  isDeleting: PropTypes.bool,
};

export default ConfirmDeleteModal;
