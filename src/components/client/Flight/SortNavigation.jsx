import React from 'react';

const SortNavigation = ({ sortOrder, handleSortChange, isSearchFormVisible, toggleSearchForm }) => {
  return (
    <nav className="sorting" style={{ top: '150px' }}>
      <ul className="flex-nowrap gap-3 flex-sm-wrap nav nav-pills nav-justified bg-white rounded-2 overflow-hidden mb-3">
        <li className="nav-item d-none d-lg-inline-block">
          <button
            role="button"
            className={`nav-link px-0 rounded-5 ${isSearchFormVisible ? 'active' : 'active'}`}
            onClick={toggleSearchForm}
          >
            <span className={`d-block w-100 fw-bold ${isSearchFormVisible ? 'text-black' : 'text-black'} d-flex align-items-center justify-content-center gap-2`}>
              {isSearchFormVisible ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 9l-7 7-7-7" transform="rotate(180)" />
                  </svg>
                  Hide Search
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Modify Search
                </>
              )}
            </span>
          </button>
        </li>
        <li className="nav-item">
          <button
            role="button"
            className={`nav-link px-0 rounded-5 ${sortOrder === 'asc' ? 'active' : ''}`}
            onClick={() => handleSortChange('asc')}
          >
            <span className={`d-block w-100 ${sortOrder === 'asc' ? 'text-black' : ''} d-flex align-items-center justify-content-center gap-2`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="20" x2="12" y2="10"></line>
                <line x1="18" y1="20" x2="18" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="16"></line>
              </svg>
              Lowest to Higher
            </span>
          </button>
        </li>
        <li className="nav-item">
          <button
            role="button"
            className={`nav-link px-0 rounded-5 ${sortOrder === 'desc' ? 'active' : ''}`}
            onClick={() => handleSortChange('desc')}
          >
            <span className={`d-block w-100 ${sortOrder === 'desc' ? 'text-black' : ''} d-flex align-items-center justify-content-center gap-2`}
              style={{ fontSize: '0.775rem' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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