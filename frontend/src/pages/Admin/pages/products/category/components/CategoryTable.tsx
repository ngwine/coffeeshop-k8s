import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import Badge from '../../../../components/Badge';

type Category = {
  id: string | number;
  name: string;
  identifier?: string;
  uniqueAttributeName?: string;
  productCount: number;
  status: string;
  defaultVariants?: any[];
};

type CategoryTableProps = {
  categories: Category[];
  paginatedCategories: Category[];
  startEntry: number;
  endEntry: number;
  totalEntries: number;
  currentPage: number;
  totalPages: number;
  onCategoryClick: (name: string, e?: React.MouseEvent) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onPageChange: (page: number) => void;
};

const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  paginatedCategories,
  startEntry,
  endEntry,
  totalEntries,
  currentPage,
  totalPages,
  onCategoryClick,
  onEdit,
  onDelete,
  onPageChange,
}) => (
  <>
    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <table className="w-full text-left min-w-[600px]">
        <thead>
          <tr className="border-b border-gray-700 text-xs md:text-sm text-text-secondary">
            <th className="p-2 md:p-3">Category Name</th>
            <th className="p-2 md:p-3">Total Products</th>
            <th className="p-2 md:p-3">Status</th>
            <th className="p-2 md:p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCategories.length === 0 && (
            <tr>
              <td colSpan={4} className="p-6 text-center text-text-secondary">
                No categories found
              </td>
            </tr>
          )}
          {paginatedCategories.map((category) => (
            <tr
              key={category.id}
              className="border-b border-gray-700 transition-colors hover:bg-gray-800/50 cursor-pointer"
              onClick={(e) => onCategoryClick(category.name, e)}
            >
              <td className="p-2 md:p-3">
                <span className="font-semibold text-text-primary hover:text-primary text-xs md:text-sm">{category.name}</span>
              </td>
              <td className="p-2 md:p-3 text-text-secondary text-xs md:text-sm">{category.productCount}</td>
              <td className="p-2 md:p-3">
                <Badge color={category.status === 'Active' ? 'green' : 'gray'} className="text-xs md:text-sm">{category.status}</Badge>
              </td>
              <td className="p-2 md:p-3 text-center">
                <div className="flex justify-center items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="p-1 text-text-secondary"
                    onClick={() => onEdit(category)}
                    style={{
                      transition: 'none !important',
                      boxShadow: 'none !important',
                      WebkitTransition: 'none !important',
                      MozTransition: 'none !important',
                      OTransition: 'none !important',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      const icon = e.currentTarget.querySelector('svg');
                      if (icon) {
                        icon.style.color = '#7c3aed'; // Purple on hover
                        icon.style.transition = 'none';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      const icon = e.currentTarget.querySelector('svg');
                      if (icon) {
                        icon.style.color = 'rgb(156, 163, 175)'; // Default color
                        icon.style.transition = 'none';
                      }
                    }}
                  >
                    <Edit size={14} className="md:w-4 md:h-4" style={{ color: 'rgb(156, 163, 175)', transition: 'none' }} />
                  </button>
                  <button
                    className="p-1 text-text-secondary"
                    onClick={() => onDelete(category)}
                    style={{
                      transition: 'none !important',
                      boxShadow: 'none !important',
                      WebkitTransition: 'none !important',
                      MozTransition: 'none !important',
                      OTransition: 'none !important',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      const icon = e.currentTarget.querySelector('svg');
                      if (icon) {
                        icon.style.color = '#ef4444'; // Red on hover
                        icon.style.transition = 'none';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      const icon = e.currentTarget.querySelector('svg');
                      if (icon) {
                        icon.style.color = 'rgb(156, 163, 175)'; // Default color
                        icon.style.transition = 'none';
                      }
                    }}
                  >
                    <Trash2 size={14} className="md:w-4 md:h-4" style={{ color: 'rgb(156, 163, 175)', transition: 'none' }} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="flex flex-row justify-between items-center mt-6 text-xs md:text-sm text-text-secondary">
      <p className="whitespace-nowrap">
        Showing {startEntry} to {endEntry} of {totalEntries} entries
      </p>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
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
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm ${isActive ? 'bg-primary text-white' : ''}`}
              onClick={() => onPageChange(page)}
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
              {page}
            </button>
          );
        })}
        <button
          className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm ${
            currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
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
          Next
        </button>
      </div>
    </div>
  </>
);

export default CategoryTable;


