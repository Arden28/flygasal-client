import React from 'react';

const SortNavigation = ({ sortOrder, handleSortChange }) => {
  return (
    <nav className="sorting" style={{ top: '150px' }}>
      <ul className="flex-nowrap gap-3 flex-sm-wrap nav nav-pills nav-justified bg-white rounded-2 overflow-hidden mb-3">
        <li className="nav-item">
          <button
            role="button"
            className={`nav-link px-0 ${sortOrder === 'asc' ? 'active' : ''}`}
            onClick={() => handleSortChange('asc')}
          >
            <span className={`d-block w-100 ${sortOrder === 'asc' ? 'text-black' : ''} d-flex align-items-center justify-content-center gap-2`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line>
              </svg>
              Lowest to Higher
            </span>
          </button>
        </li>
        <li className="nav-item">
          <button
            role="button"
            className={`nav-link px-0 ${sortOrder === 'desc' ? 'active' : ''}`}
            onClick={() => handleSortChange('desc')}
          >
            <span className={`d-block w-100 ${sortOrder === 'desc' ? 'text-black' : ''} d-flex align-items-center justify-content-center gap-2`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10M6 20V4M18 20v-4"/>
              </svg>
              Highest to Lower
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default SortNavigation;