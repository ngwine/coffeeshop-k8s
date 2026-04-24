import React from 'react';

type PaginationProps = {
  totalItems: number;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  currentPage = 1,
  itemsPerPage = 50,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 1) / itemsPerPage));
  const displayStart = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const displayEnd = totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 md:mt-6 gap-3 text-xs md:text-sm text-text-secondary w-full min-w-0">
      <p className="text-center sm:text-left">
        Showing {displayStart} to {displayEnd} of {totalItems} entr{totalItems === 1 ? 'y' : 'ies'}
      </p>
      {totalItems > 0 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 md:px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.transition = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.transition = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            «
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange && onPageChange(pageNum)}
                className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm ${
                  isActive
                    ? 'bg-primary text-white'
                    : ''
                }`}
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                  backgroundColor: isActive ? 'rgb(124, 58, 237)' : 'transparent',
                  color: isActive ? 'rgb(255, 255, 255)' : 'rgb(156, 163, 175)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = isActive ? 'rgb(124, 58, 237)' : 'transparent';
                  e.currentTarget.style.color = isActive ? 'rgb(255, 255, 255)' : 'rgb(156, 163, 175)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = isActive ? 'rgb(124, 58, 237)' : 'transparent';
                  e.currentTarget.style.color = isActive ? 'rgb(255, 255, 255)' : 'rgb(156, 163, 175)';
                }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 md:px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.transition = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.transition = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;




