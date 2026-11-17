import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Search, X, Pin, Star } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

const SearchBar = ({ onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    onFilterChange({
      search: debouncedSearch,
      pinned: pinnedOnly ? 'true' : undefined,
      favorite: favoriteOnly ? 'true' : undefined,
      sort: sortBy,
    });
  }, [debouncedSearch, pinnedOnly, favoriteOnly, sortBy, onFilterChange]);

  const handleTogglePinned = () => {
    setPinnedOnly((prev) => {
      const next = !prev;
      if (next) {
        setFavoriteOnly(false);
      }
      return next;
    });
  };

  const handleToggleFavorite = () => {
    setFavoriteOnly((prev) => {
      const next = !prev;
      if (next) {
        setPinnedOnly(false);
      }
      return next;
    });
  };

  return (
    <div className="bg-surface p-4 rounded-xl border border-subtle shadow-card space-y-3 transition-colors duration-150">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <Search size={16} strokeWidth={1.75} />
          </div>
          <input
            type="text"
            placeholder="Search notes by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-surface text-primary placeholder:text-muted border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm transition-colors duration-150"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-primary transition-colors duration-150"
              aria-label="Clear search"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs font-medium text-muted whitespace-nowrap">
            Sort by
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-subtle rounded-lg px-3 py-2 text-sm bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-150"
          >
            <option value="newest" className="bg-surface text-primary">Newest First</option>
            <option value="oldest" className="bg-surface text-primary">Oldest First</option>
            <option value="created_desc" className="bg-surface text-primary">Created (Newest)</option>
            <option value="created_asc" className="bg-surface text-primary">Created (Oldest)</option>
            <option value="title" className="bg-surface text-primary">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-medium text-muted mr-1">
          Filter:
        </span>
        <button
          type="button"
          onClick={() => {
            setPinnedOnly(false);
            setFavoriteOnly(false);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-150 ${
            !pinnedOnly && !favoriteOnly
              ? 'bg-accent-soft text-accent border-accent/30'
              : 'bg-canvas text-muted border-subtle hover:text-primary'
          }`}
        >
          All Notes
        </button>
        <button
          type="button"
          onClick={handleTogglePinned}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-150 ${
            pinnedOnly
              ? 'bg-accent-soft text-accent border-accent/30'
              : 'bg-canvas text-muted border-subtle hover:text-primary'
          }`}
        >
          <Pin size={14} strokeWidth={1.75} />
          <span>Pinned Only</span>
        </button>
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-150 ${
            favoriteOnly
              ? 'bg-accent-soft text-accent border-accent/30'
              : 'bg-canvas text-muted border-subtle hover:text-primary'
          }`}
        >
          <Star size={14} strokeWidth={1.75} />
          <span>Favorites</span>
        </button>
      </div>
    </div>
  );
};

SearchBar.propTypes = {
  onFilterChange: PropTypes.func,
};

export default SearchBar;
