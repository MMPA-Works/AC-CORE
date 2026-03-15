export type MobilePaginationItem = number | '...';

export function buildMobilePagination(
  currentPage: number,
  totalPages: number,
  windowSize = 3,
): MobilePaginationItem[] {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const safeWindowSize = Math.max(1, windowSize);

  if (safeTotalPages <= safeWindowSize) {
    return createRange(1, safeTotalPages);
  }

  const halfWindow = Math.floor(safeWindowSize / 2);
  let start = Math.max(1, safeCurrentPage - halfWindow);
  let end = Math.min(safeTotalPages, start + safeWindowSize - 1);

  if (end - start + 1 < safeWindowSize) {
    start = Math.max(1, end - safeWindowSize + 1);
  }

  const pages = createRange(start, end);

  if (end < safeTotalPages - 1) {
    return [...pages, '...', safeTotalPages];
  }

  if (end === safeTotalPages - 1) {
    return [...pages, safeTotalPages];
  }

  return pages;
}

function createRange(start: number, end: number): number[] {
  const result: number[] = [];

  for (let page = start; page <= end; page++) {
    result.push(page);
  }

  return result;
}
