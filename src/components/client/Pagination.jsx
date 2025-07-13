import React from 'react';

const Pagination = ({ currentPage, totalPages, handlePageChange }) => {
  return (
    <div className="listjs--pagination-container d-flex gap-1">
      <button
        className="pag--nav prev--pag"
        type="button"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
        </svg>
      </button>
      <ul className="pagination--listjs d-flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <li key={page} className={page === currentPage ? 'active' : ''}>
            <button onClick={() => handlePageChange(page)}>{page}</button>
          </li>
        ))}
      </ul>
      <button
        className="pag--nav next--pag"
        type="button"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;