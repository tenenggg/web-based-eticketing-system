// Reusable prev/next pager — dashboard table and workspace sidebar




export default function Pagination({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  startIndex = 0,
  totalItems = 0,
  pageSize = 20,
  variant = 'default',
  hideWhenSinglePage = false,
}) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  if (hideWhenSinglePage && totalPages <= 1) {
    return null;                                                        // hide when only one page
  }

  const wrapperClass =
    variant === 'user-compact'
      ? 'user-list-pagination'
      : variant === 'sidebar'
        ? 'sidebar-pagination'
        : 'table-pagination';

  return (
    <div className={wrapperClass}>
      {variant === 'default' && totalItems > 0 && (
        <div className="pagination-info">
          Showing {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
        </div>
      )}

      <div className="pagination-controls">
        <button
          type="button"
          className="btn-secondary pagination-btn"
          onClick={onPreviousPage}
          disabled={isFirstPage}
        >
          Prev
        </button>
        <div className="pagination-info">
          Page {currentPage} of {totalPages}
        </div>
        <button
          type="button"
          className="btn-secondary pagination-btn"
          onClick={onNextPage}
          disabled={isLastPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}
