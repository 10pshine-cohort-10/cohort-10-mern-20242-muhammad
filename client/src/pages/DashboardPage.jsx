import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Pin, Star } from 'lucide-react';
import SearchBar from '../components/notes/SearchBar';
import NoteList from '../components/notes/NoteList';
import NoteEditor from '../components/notes/NoteEditor';
import Sidebar from '../components/common/Sidebar';
import Modal from '../components/common/Modal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useNotes } from '../hooks/useNotes';

const DashboardPage = () => {
  const {
    notes,
    pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
    loading,
    error,
    fetchNotes,
    createNote,
    deleteNote,
    togglePin,
    toggleFavorite,
    importNoteFile,
  } = useNotes();

  const [filterParams, setFilterParams] = useState({ sort: 'newest' });
  const [sidebarFilter, setSidebarFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newIsFavorite, setNewIsFavorite] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleFilterChange = useCallback((params) => {
    setFilterParams(params);
    if (params.favorite === 'true') {
      setSidebarFilter('favorite');
    } else if (params.pinned === 'true') {
      setSidebarFilter('pinned');
    } else {
      setSidebarFilter('all');
    }
  }, []);

  const handleSidebarFilter = (type) => {
    setSidebarFilter(type);
    setFilterParams((prev) => ({
      ...prev,
      pinned: type === 'pinned' ? 'true' : undefined,
      favorite: type === 'favorite' ? 'true' : undefined,
    }));
  };

  useEffect(() => {
    fetchNotes(filterParams).catch(() => {});
  }, [filterParams, fetchNotes]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!newContent.trim() || newContent === '<p></p>') {
      setFormError('Note content cannot be empty');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const payload = {
        title: newTitle.trim(),
        content: newContent,
        is_pinned: newIsPinned ? 1 : 0,
      };
      if (newCategory.trim()) payload.category = newCategory.trim();
      if (newTags.trim()) payload.tags = newTags.trim();
      if (newIsFavorite) payload.is_favorite = 1;

      await createNote(payload);
      setIsModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory('');
      setNewTags('');
      setNewIsPinned(false);
      setNewIsFavorite(false);
      fetchNotes(filterParams);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !importNoteFile) return;

    try {
      const content = await file.text();
      await importNoteFile({ filename: file.name, content });
      fetchNotes(filterParams);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Could not import file');
    } finally {
      e.target.value = '';
    }
  };

  const handleDeleteRequest = (id) => {
    setNoteToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      await deleteNote(noteToDelete);
      setNoteToDelete(null);
      fetchNotes(filterParams);
    } catch (err) {
      setFormError(err.message || 'Could not delete note');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePin = async (id, currentPin) => {
    try {
      await togglePin(id, currentPin);
      fetchNotes(filterParams);
    } catch (err) {
      setFormError(err.message || 'Could not update pin status');
    }
  };

  const handleFavorite = async (id, currentFav) => {
    if (!toggleFavorite) return;
    try {
      await toggleFavorite(id, currentFav);
      fetchNotes(filterParams);
    } catch (err) {
      setFormError(err.message || 'Could not update favorite status');
    }
  };

  const handlePageChange = (nextPage) => {
    setFilterParams((prev) => ({ ...prev, page: nextPage, limit: prev.limit || 9 }));
  };

  const pinnedCount = notes.filter((n) => Boolean(n.is_pinned)).length;
  const favoriteCount = notes.filter((n) => Boolean(n.is_favorite)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            My Notes
          </h1>
          <p className="text-sm text-muted mt-1">
            Organize, search, and manage your rich text notes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-subtle bg-surface text-primary hover:bg-canvas transition-colors duration-150">
            <Upload size={16} strokeWidth={1.75} className="text-muted" />
            <span>Import File</span>
            <input
              type="file"
              accept=".txt,.md,.html,.json"
              onChange={handleFileImport}
              className="hidden"
              aria-label="Import note file"
            />
          </label>

          <Button
            onClick={() => {
              setFormError('');
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} strokeWidth={1.75} />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger-soft border border-danger/20 text-danger rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Responsive Sidebar */}
        <Sidebar
          activeFilter={sidebarFilter}
          onSelectFilter={handleSidebarFilter}
          totalCount={notes.length}
          pinnedCount={pinnedCount}
          favoriteCount={favoriteCount}
        />

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Filters and Search */}
          <div className="mb-6">
            <SearchBar onFilterChange={handleFilterChange} />
          </div>

          {/* Notes Grid */}
          <NoteList
            notes={notes}
            loading={loading}
            onDelete={handleDeleteRequest}
            onPin={handlePin}
            onFavorite={handleFavorite}
            onNoteClick={(id) => navigate(`/notes/${id}`)}
            onCreateNote={() => {
              setFormError('');
              setIsModalOpen(true);
            }}
          />

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-surface px-4 py-3 rounded-xl border border-subtle shadow-card">
              <span className="text-xs text-muted">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Note Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Note"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-danger-soft border border-danger/20 text-danger rounded-lg text-sm">
              {formError}
            </div>
          )}

          <Input
            label="Title"
            placeholder="e.g. Project Ideas, Meeting Notes"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Category"
              placeholder="e.g. Work, Personal, Study"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Input
              label="Tags (comma-separated)"
              placeholder="e.g. urgent, roadmap"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-primary mb-1.5">
              Content
            </span>
            <NoteEditor
              content={newContent}
              onChange={(html) => setNewContent(html)}
              placeholder="Write your note with rich text formatting..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pin-checkbox"
                checked={newIsPinned}
                onChange={(e) => setNewIsPinned(e.target.checked)}
                className="h-4 w-4 accent-accent rounded border-subtle focus:ring-accent"
              />
              <label htmlFor="pin-checkbox" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary cursor-pointer">
                <Pin size={14} strokeWidth={1.75} className="text-muted" />
                <span>Pin this note to top</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="favorite-checkbox"
                checked={newIsFavorite}
                onChange={(e) => setNewIsFavorite(e.target.checked)}
                className="h-4 w-4 accent-accent rounded border-subtle focus:ring-accent"
              />
              <label htmlFor="favorite-checkbox" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary cursor-pointer">
                <Star size={14} strokeWidth={1.75} className="text-muted" />
                <span>Mark as favorite</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-subtle">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={Boolean(noteToDelete)}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default DashboardPage;
