import { useEffect, useRef, useState } from "react";

const getVisiblePages = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};

const PaginationControls = ({ currentPage, totalPages, onGoToPage }) => {
  const pageNumbers = getVisiblePages(currentPage, totalPages);
  const [pageInput, setPageInput] = useState(String(currentPage));
  const [activeJumpIndex, setActiveJumpIndex] = useState(null);
  const jumpInputRef = useRef(null);

  useEffect(() => {
    setPageInput(String(currentPage));
    setActiveJumpIndex(null);
  }, [currentPage]);

  useEffect(() => {
    if (activeJumpIndex !== null) {
      jumpInputRef.current?.focus();
      jumpInputRef.current?.select();
    }
  }, [activeJumpIndex]);

  const handlePageSubmit = (e) => {
    e.preventDefault();

    const requestedPage = Number(pageInput);
    if (!pageInput.trim() || !Number.isInteger(requestedPage)) {
      setPageInput(String(currentPage));
      setActiveJumpIndex(null);
      return;
    }

    onGoToPage(requestedPage);
  };

  const openJumpInput = (index) => {
    setActiveJumpIndex(index);
    setPageInput("");
  };

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination-arrow"
        onClick={() => onGoToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      <div className="page-number-group">
        {pageNumbers.map((page, index) =>
          page === "..." && activeJumpIndex === index ? (
            <form
              key={`jump-${index}`}
              className="page-jump page-jump--inline"
              onSubmit={handlePageSubmit}
            >
              <input
                ref={jumpInputRef}
                type="number"
                inputMode="numeric"
                min="1"
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => {
                  setPageInput(String(currentPage));
                  setActiveJumpIndex(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setPageInput(String(currentPage));
                    setActiveJumpIndex(null);
                  }
                }}
                aria-label={`Page number from 1 to ${totalPages}`}
              />
            </form>
          ) : page === "..." ? (
            <button
              type="button"
              key={`ellipsis-${index}`}
              className="page-ellipsis"
              onClick={() => openJumpInput(index)}
              aria-label="Enter a page number"
            >
              ...
            </button>
          ) : (
            <button
              type="button"
              key={page}
              className={`page-number ${page === currentPage ? "active" : ""}`}
              onClick={() => onGoToPage(page)}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        className="pagination-arrow"
        onClick={() => onGoToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
};

export default PaginationControls;
