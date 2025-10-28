import React from 'react';

const SortNavigation = ({
  sortOrder = 'recommended',
  handleSortChange = () => {},
  isSearchFormVisible,
  toggleSearchForm,
}) => {
  // Define the three sort tabs with labels and base colours.  These values
  // approximate the colours used on the Alternative Airlines website.
  const tabs = [
    { key: 'recommended', label: 'Recommended', activeBg: 'bg-purple-600', inactiveBg: 'bg-purple-100', activeText: 'text-white', inactiveText: 'text-purple-700' },
    { key: 'cheapest', label: 'Cheapest', activeBg: 'bg-emerald-600', inactiveBg: 'bg-emerald-100', activeText: 'text-white', inactiveText: 'text-emerald-700' },
    { key: 'quickest', label: 'Quickest', activeBg: 'bg-orange-500', inactiveBg: 'bg-orange-100', activeText: 'text-white', inactiveText: 'text-orange-700' },
  ];

  return (
    <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search toggle */}
        {typeof isSearchFormVisible !== 'undefined' && typeof toggleSearchForm === 'function' && (
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
            onClick={toggleSearchForm}
          >
            {/* Icon changes based on visibility */}
            {isSearchFormVisible ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            {isSearchFormVisible ? 'Hide search' : 'Modify search'}
          </button>
        )}
        {/* Sort options */}
        <div className="flex flex-1 justify-center sm:justify-end gap-2 flex-wrap">
          {tabs.map(({ key, label, activeBg, inactiveBg, activeText, inactiveText }) => {
            const isActive = sortOrder === key;
            const bgClass = isActive ? activeBg : inactiveBg;
            const textClass = isActive ? activeText : inactiveText;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSortChange(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium focus:outline-none ${bgClass} ${textClass}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default SortNavigation;