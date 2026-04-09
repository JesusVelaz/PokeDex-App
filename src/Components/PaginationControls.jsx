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

  return (
    <div className="pagination">
      <button
        type="button"
        className="pagination-arrow"
        onClick={() => onGoToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ‹ Prev
      </button>

      <div className="page-number-group" aria-label="Pagination">
        {pageNumbers.map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="page-ellipsis">
              ···
            </span>
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
        Next ›
      </button>
    </div>
  );
};

export default PaginationControls;
