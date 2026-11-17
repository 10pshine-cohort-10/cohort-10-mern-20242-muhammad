import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Pin, Star, Settings } from 'lucide-react';

const Sidebar = ({
  activeFilter = 'all',
  onSelectFilter,
  totalCount = 0,
  pinnedCount = 0,
  favoriteCount = 0,
}) => {
  const location = useLocation();

  const itemClass = (isActive) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
      isActive
        ? 'bg-accent-soft text-accent'
        : 'text-muted hover:text-primary hover:bg-surface'
    }`;

  return (
    <aside className="w-full lg:w-60 shrink-0 lg:border-r lg:border-subtle lg:pr-6">
      <nav className="space-y-1" aria-label="Workspace navigation">
        <p className="px-3 text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
          Workspace
        </p>

        <button
          type="button"
          onClick={() => onSelectFilter?.('all')}
          className={itemClass(activeFilter === 'all' && location.pathname === '/dashboard')}
        >
          <span className="flex items-center gap-2.5">
            <FileText size={17} strokeWidth={1.75} aria-hidden="true" />
            <span>All Notes</span>
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md border border-subtle bg-surface text-muted">
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter?.('pinned')}
          className={itemClass(activeFilter === 'pinned' && location.pathname === '/dashboard')}
        >
          <span className="flex items-center gap-2.5">
            <Pin size={17} strokeWidth={1.75} aria-hidden="true" />
            <span>Pinned</span>
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md border border-subtle bg-surface text-muted">
            {pinnedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter?.('favorite')}
          className={itemClass(activeFilter === 'favorite' && location.pathname === '/dashboard')}
        >
          <span className="flex items-center gap-2.5">
            <Star size={17} strokeWidth={1.75} aria-hidden="true" />
            <span>Favorites</span>
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md border border-subtle bg-surface text-muted">
            {favoriteCount}
          </span>
        </button>

        <div className="pt-3 mt-3 border-t border-subtle">
          <Link
            to="/profile"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              location.pathname === '/profile'
                ? 'bg-accent-soft text-accent'
                : 'text-muted hover:text-primary hover:bg-surface'
            }`}
          >
            <Settings size={17} strokeWidth={1.75} aria-hidden="true" />
            <span>Profile Settings</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
};

Sidebar.propTypes = {
  activeFilter: PropTypes.string,
  onSelectFilter: PropTypes.func,
  totalCount: PropTypes.number,
  pinnedCount: PropTypes.number,
  favoriteCount: PropTypes.number,
};

export default Sidebar;
