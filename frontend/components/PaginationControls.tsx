"use client";

/**
 * Matches dashboard pagination: ← / → buttons and "Showing X–Y of Z results".
 * Renders nothing when all items fit on one page.
 */
export default function PaginationControls({
  page,
  pageSize,
  totalCount,
  onPageChange,
  disabled = false,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (totalCount <= pageSize) {
    return null;
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={disabled || page === 1}
          className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={disabled || page >= totalPages}
          className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          →
        </button>
      </div>
      <span className="text-gray-600 font-medium text-sm">
        Showing {start}-{end} of {totalCount} results
      </span>
    </div>
  );
}
