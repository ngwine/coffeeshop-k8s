import React from "react";
import { Plus } from "lucide-react";

type CategoryToolbarProps = {
  onAddClick: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

const CategoryToolbar: React.FC<CategoryToolbarProps> = ({
  onAddClick,
  searchValue,
  onSearchChange,
}) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3 md:gap-4">
    <h2 className="text-xl md:text-2xl font-bold text-text-primary">
      Category List
    </h2>

    <div className="flex w-full md:w-auto gap-2 flex-nowrap">
      <input
        type="text"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search category..."
        className="flex-1 min-w-0 bg-background-dark border border-gray-600 rounded-lg px-3 md:px-4 py-1.5 md:py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64 text-sm md:text-base"
      />
      <button
        className="shrink-0 bg-primary text-white font-semibold px-3 md:px-4 py-1.5 md:py-2 rounded-lg flex items-center justify-center gap-1.5 md:gap-2 hover:bg-primary/90 transition-colors whitespace-nowrap text-sm md:text-base"
        onClick={onAddClick}
      >
        <Plus size={16} className="md:w-[18px] md:h-[18px]" />
        Add Category
      </button>
    </div>
  </div>
);

export default CategoryToolbar;





