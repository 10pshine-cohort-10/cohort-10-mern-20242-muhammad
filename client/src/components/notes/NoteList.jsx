import React from 'react';
import PropTypes from 'prop-types';
import { FileText, Plus } from 'lucide-react';
import NoteCard from './NoteCard';
import Spinner from '../common/Spinner';
import Button from '../common/Button';

const NoteList = ({ notes = [], loading = false, onDelete, onPin, onFavorite, onNoteClick, onCreateNote }) => {
  if (loading) {
    return (
      <div className="py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-surface rounded-xl border border-subtle shadow-card">
        <div className="w-12 h-12 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto mb-4">
          <FileText size={20} strokeWidth={1.75} />
        </div>
        <h3 className="font-display text-lg font-semibold text-primary mb-1">
          No notes found
        </h3>
        <p className="text-muted text-sm max-w-sm mx-auto mb-5">
          Create your first note to start organizing your thoughts, or adjust your search filters.
        </p>
        {onCreateNote && (
          <Button onClick={onCreateNote} variant="primary" size="md">
            <Plus size={16} strokeWidth={1.75} />
            <span>Create a note</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={onDelete}
          onPin={onPin}
          onFavorite={onFavorite}
          onClick={() => onNoteClick?.(note.id)}
        />
      ))}
    </div>
  );
};

NoteList.propTypes = {
  notes: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  onDelete: PropTypes.func,
  onPin: PropTypes.func,
  onFavorite: PropTypes.func,
  onNoteClick: PropTypes.func,
  onCreateNote: PropTypes.func,
};

export default NoteList;
