import React, { useMemo, useState } from "react";

const Pagination = ({
  currentPage,
  totalPages,
  handlePageChange,
  // optional
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}) => {
  const [jump, setJump] = useState("");

  // Safe helpers (no hooks inside)
  const range = (s, e) => (e >= s ? Array.from({ length: e - s + 1 }, (_, i) => s + i) : []);

  const pages = useMemo(() => {
    // Always compute (even if totalPages <= 1) to keep hook order stable
    const maxLength = 7;
    const innerDelta = 2;

    if (!Number.isFinite(totalPages) || totalPages < 1) return [];
    if (totalPages <= maxLength) return range(1, totalPages);

    const left = Math.max(2, currentPage - innerDelta);
    const right = Math.min(totalPages - 1, currentPage + innerDelta);

    const items = [1];
    if (left > 2) items.push("…");
    items.push(...range(left, right));
    if (right < totalPages - 1) items.push("…");
    items.push(totalPages);

    return items;
  }, [currentPage, totalPages]);

  const go = (p) => {
    const page = Number(p);
    if (!Number.isFinite(page)) return;
    const clamped = Math.max(1, Math.min(totalPages || 1, page));
    if (clamped !== currentPage) handlePageChange(clamped);
  };

  const jumpBy = (n) => go(currentPage + n);

  // Brand-styled primitives
  const btn =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm border border-slate-300 bg-white hover:bg-slate-50 " +
    "focus:outline-none focus:ring-2 focus:ring-[#F68221]/25 focus:border-[#F68221] " +
    "disabled:opacity-50 disabled:cursor-not-allowed";
  const pill =
    "min-w-[40px] inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm border";
  const active =
    "bg-[#F68221] border-[#F68221] text-white hover:bg-[#E37314] focus:ring-2 focus:ring-[#F68221]/30";
  const num =
    "border-slate-300 bg-white text-slate-800 hover:bg-[#FFF4EB] focus:outline-none focus:ring-2 focus:ring-[#F68221]/25 focus:border-[#F68221]";

  // It's safe to return null *after* hooks ran
  if (!Number.isFinite(totalPages) || totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      aria-label="Pagination"
    >
      {/* Left: optional page size */}
      {pageSizeOptions && onPageSizeChange ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <label className="whitespace-nowrap">Results per page:</label>
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm focus:border-[#F68221] focus:ring-2 focus:ring-[#F68221]/25"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div />
      )}

      {/* Center: full controls on md+, compact on small */}
      <div className="flex items-center justify-between w-full md:w-auto">
        {/* Mobile: compact */}
        <div className="flex w-full items-center justify-between md:hidden">
          <button type="button" className={btn} onClick={() => go(1)} disabled={currentPage === 1} aria-label="First page">
            «
          </button>
          <button type="button" className={`${btn} ml-2`} onClick={() => go(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
            ‹
          </button>

          <div className="mx-3 text-sm text-slate-700">
            <span className="font-medium">{currentPage}</span> / {totalPages}
          </div>

          <button type="button" className={`${btn} mr-2`} onClick={() => go(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">
            ›
          </button>
          <button type="button" className={btn} onClick={() => go(totalPages)} disabled={currentPage === totalPages} aria-label="Last page">
            »
          </button>
        </div>

        {/* Desktop: windowed */}
        <div className="hidden md:flex md:items-center md:gap-2">
          <button type="button" className={btn} onClick={() => go(1)} disabled={currentPage === 1} aria-label="First page">
            « First
          </button>
          <button type="button" className={btn} onClick={() => go(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
            ‹ Prev
          </button>

          <button
            type="button"
            className={btn}
            onClick={() => jumpBy(-5)}
            disabled={currentPage <= 5}
            aria-label="Jump back 5 pages"
            title="Jump back 5"
          >
            −5
          </button>

          <ul className="flex items-center gap-1">
            {pages.map((p, i) =>
              p === "…" ? (
                <li key={`dots-${i}`} className="px-2 text-slate-300 select-none">…</li>
              ) : (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => go(p)}
                    className={`${pill} ${p === currentPage ? active : num}`}
                    aria-current={p === currentPage ? "page" : undefined}
                    aria-label={p === currentPage ? `Page ${p}, current page` : `Go to page ${p}`}
                  >
                    {p}
                  </button>
                </li>
              )
            )}
          </ul>

          <button
            type="button"
            className={btn}
            onClick={() => jumpBy(5)}
            disabled={currentPage + 5 > totalPages}
            aria-label="Jump forward 5 pages"
            title="Jump forward 5"
          >
            +5
          </button>

          <button type="button" className={btn} onClick={() => go(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">
            Next ›
          </button>
          <button type="button" className={btn} onClick={() => go(totalPages)} disabled={currentPage === totalPages} aria-label="Last page">
            Last »
          </button>
        </div>
      </div>

      {/* Right: quick jump */}
      <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
        <label htmlFor="goto" className="whitespace-nowrap">Go to page:</label>
        <input
          id="goto"
          type="number"
          min={1}
          max={totalPages}
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              go(jump);
              setJump("");
            }
          }}
          className="h-9 w-20 rounded-md border border-slate-300 px-2 text-sm focus:border-[#F68221] focus:ring-2 focus:ring-[#F68221]/25"
          placeholder="e.g. 3"
          aria-label="Jump to page"
        />
        <button
          type="button"
          className={btn}
          onClick={() => {
            go(jump);
            setJump("");
          }}
        >
          Go
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
