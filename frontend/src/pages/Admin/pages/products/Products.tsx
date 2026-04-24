/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react';
import { ProductStatus, Product } from '../../types';
import { ProductsApi } from '../../../../api/products';
import Badge from '../../components/Badge';
import { formatVND } from '../../../../utils/currency';
import { Plus, Edit, Trash2 } from 'lucide-react';
import ExportDropdown from '../../../../components/ExportDropdown';
import { exportRows, ExportColumn, ExportFormat } from '../../../../utils/exportUtils';
import ModalDialog from '../../../../components/ModalDialog';

const ITEMS_PER_PAGE = 10;
const API_FETCH_LIMIT = 1000;

type ProductExportRow = {
  name: string;
  category: string;
  sku: string;
  price: string;
  quantity: number;
  status: string;
  stock: string;
};

const PRODUCT_EXPORT_COLUMNS: ExportColumn<ProductExportRow>[] = [
  { key: 'name', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'sku', label: 'SKU' },
  { key: 'price', label: 'Price' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'status', label: 'Status' },
  { key: 'stock', label: 'Stock' },
];

type ProductsProps = {
  setActivePage: (page: string) => void;
  selectedCategory?: string | null;
  onClearSelectedCategory?: () => void;
  embedded?: boolean;
  onProductClick?: (product: Product) => void;
  refreshTrigger?: number;
};

const Products: React.FC<ProductsProps> = ({ setActivePage, selectedCategory = null, onClearSelectedCategory, embedded = false, onProductClick }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [categoryFilter, setCategoryFilter] = useState<string>(selectedCategory || '');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [pendingDeleteIdentifiers, setPendingDeleteIdentifiers] = useState<string[]>([]);
  const [deletingIdentifier, setDeletingIdentifier] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
    onConfirm?: () => void;
  } | null>(null);
  const isCategoryLocked = Boolean(selectedCategory);

  const categoryOptions = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      const name = (product.category || '').trim();
      if (name) unique.add(name);
    });
    if (selectedCategory && selectedCategory.trim() && !unique.has(selectedCategory)) {
      unique.add(selectedCategory);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [products, selectedCategory]);

  const resetFilters = (options?: { forceCategory?: boolean }) => {
    setStatusFilter('');
    setStockFilter('');
    if (options?.forceCategory || !isCategoryLocked) {
      setCategoryFilter('');
      onClearSelectedCategory?.();
    }
    setSearchQuery('');
    setSelectedIds([]);
    setCurrentPage(1);
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ProductsApi.list({ limit: API_FETCH_LIMIT, page: 1 });
        if (response && response.success && response.data) {
          setProducts(response.data);
        } else {
          setError('Failed to fetch products - Invalid response format');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => products.some((product) => product.id === id)));
  }, [products]);

  const itemsPerPage = ITEMS_PER_PAGE;

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

  const filteredProducts = useMemo(() => {
    // Use categoryFilter from dropdown if available, otherwise use selectedCategory prop
    const activeCategory = categoryFilter || selectedCategory;

    const normalizedSearch = normalizeText(searchQuery);

    return products.filter((product) => {
      if (normalizedSearch) {
        const normalizedName = normalizeText(product.name || '');
        const normalizedSku = normalizeText(product.sku || '');
        if (
          (normalizedName && !normalizedName.startsWith(normalizedSearch)) &&
          (normalizedSku && !normalizedSku.startsWith(normalizedSearch))
        ) {
          return false;
        }
      }
      // Filter by category
      if (activeCategory && product.category !== activeCategory) {
        return false;
      }

      // Filter by status
      if (statusFilter && product.status !== statusFilter) {
        return false;
      }

      // Filter by stock
      if (stockFilter) {
        const isInStock = product.stock === true;
        if (stockFilter === 'in_stock' && !isInStock) {
          return false;
        }
        if (stockFilter === 'out_of_stock' && isInStock) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, categoryFilter, statusFilter, stockFilter, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    // Update category filter when selectedCategory changes
    if (selectedCategory) {
      setCategoryFilter(selectedCategory);
    } else if (!selectedCategory && categoryFilter) {
      // Clear category filter when selectedCategory is cleared
      setCategoryFilter('');
    }
  }, [selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
    if (currentPage > total) {
      setCurrentPage(total);
    }
  }, [filteredProducts.length, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  const startEntry = filteredProducts.length === 0 ? 0 : startIndex + 1;
  const endEntry = filteredProducts.length === 0 ? 0 : Math.min(startIndex + itemsPerPage, filteredProducts.length);
  const pageIds = paginatedProducts.map((product) => product.id);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const noneChecked = selectedIds.length === 0;
  const isRowClickable = Boolean(onProductClick);

  function toggleAll() {
    setSelectedIds((prev) =>
      allChecked
        ? prev.filter((id) => !pageIds.includes(id))
        : [...prev, ...pageIds.filter((id) => !prev.includes(id))]
    );
  }
  function toggleOne(id: number) {
    setSelectedIds((selected) =>
      selected.includes(id)
        ? selected.filter((i) => i !== id)
        : [...selected, id]
    );
  }

  const buildProductExportRows = (): ProductExportRow[] => {
    if (!selectedIds.length) return [];
    const selectedSet = new Set(selectedIds);
    return products
      .filter((product) => selectedSet.has(product.id))
      .map((product) => ({
        name: product.name,
        category: product.category || '',
        sku: (product as any).sku || '',
        price: formatVND(Number((product as any).price) || 0),
        quantity: Number((product as any).quantity) || 0,
        status: product.status,
        stock: product.stock ? 'In stock' : 'Out of stock',
      }));
  };

  const handleExport = (format: ExportFormat) => {
    const rows = buildProductExportRows();
    if (!rows.length) {
      alert('Please select at least one product to export.');
      return;
    }
    exportRows(rows, PRODUCT_EXPORT_COLUMNS, format, 'products');
  };

  // Open Edit - Navigate to ProductDetail
  function onOpenEdit(p: Product) {
    if (onProductClick) {
      onProductClick(p);
    }
  }

  const collectIdentifiers = (product: Product | null | undefined) => {
    if (!product) return [];
    const seen = new Set<string>();
    const add = (value: unknown) => {
      if (value === null || value === undefined) return;
      const str = String(value).trim();
      if (!str || seen.has(str)) return;
      seen.add(str);
    };
    add(product.id);
    add((product as any)?._id);
    add((product as any)?.mongoId);
    return Array.from(seen);
  };

  const getPrimaryProductId = (product: Product | null | undefined) => {
    const identifiers = collectIdentifiers(product);
    return identifiers.length ? identifiers[0] : null;
  };

  async function handleDeleteProduct(product: Product) {
    const identifiers = collectIdentifiers(product);
    if (identifiers.length === 0) {
      setDialog({
        title: 'Delete product',
        message: 'Unable to delete this product because it is missing an ID.',
      });
      return;
    }
    setPendingDelete(product);
    setPendingDeleteIdentifiers(identifiers);
    setDialog({
      title: 'Delete product',
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: confirmDeleteProduct,
    });
  }

  async function confirmDeleteProduct() {
    if (!pendingDelete || pendingDeleteIdentifiers.length === 0) {
      setDialog(null);
      return;
    }
    let deleted = false;
    let lastError: any = null;
    setDeletingIdentifier(pendingDeleteIdentifiers[0]);
    try {
      for (const identifier of pendingDeleteIdentifiers) {
        try {
          const response = await ProductsApi.remove(identifier);
          if (response && response.success === false) {
            throw new Error(response?.message || 'Delete failed');
          }
          deleted = true;
          break;
        } catch (err: any) {
          lastError = err;
          if (err?.response?.status !== 404) {
            throw err;
          }
        }
      }
      if (!deleted) {
        throw lastError || new Error('Product not found');
      }
      setProducts(prev =>
        prev.filter(item => {
          const itemId = getPrimaryProductId(item);
          return !pendingDeleteIdentifiers.some(identifier => String(identifier) === String(itemId));
        }),
      );
      setSelectedIds(prev =>
        prev.filter(id => !pendingDeleteIdentifiers.some(identifier => String(identifier) === String(id))),
      );
    } catch (deleteError: any) {
      setDialog({
        title: 'Failed to delete product',
        message: deleteError?.response?.data?.message || deleteError?.message || 'Failed to delete product',
        variant: 'danger',
      });
      return;
    } finally {
      setDeletingIdentifier(null);
      setPendingDelete(null);
      setPendingDeleteIdentifiers([]);
    }
    setDialog(null);
  }


  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.Publish:
        return 'green';
      case ProductStatus.Inactive:
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <>
      <div className={embedded ? 'space-y-6' : 'bg-background-light p-6 rounded-lg shadow-lg'}>

        {!embedded && selectedCategory && (
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                resetFilters({ forceCategory: true });
                setActivePage('Category List');
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 text-text-primary hover:bg-gray-700/40 transition-colors"
              aria-label="Back to categories"
              title="Back to categories"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
                <line x1="9" y1="12" x2="21" y2="12" />
              </svg>
            </button>
          </div>
        )}

        {!embedded && (
          <div className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
            <div className="flex items-center justify-between sm:w-auto">
              <p className="text-sm text-text-secondary">Filter</p>
              <button
                type="button"
                onClick={() => resetFilters()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-600 text-text-primary hover:bg-gray-700/40 transition-colors"
                title="Reset filters"
                aria-label="Reset filters"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-5" />
                </svg>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 w-full">
              <select
                className={`bg-background-light border border-gray-700 rounded-lg px-3 py-2 flex-1 min-w-[140px] sm:min-w-[120px] ${statusFilter ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Status</option>
                <option value="Publish">Publish</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                className={`bg-background-light border border-gray-700 rounded-lg px-3 py-2 flex-1 min-w-[140px] sm:min-w-[120px] ${(categoryFilter || selectedCategory) ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                value={isCategoryLocked ? selectedCategory || '' : categoryFilter}
                onChange={(e) => {
                  if (isCategoryLocked) return;
                  setCategoryFilter(e.target.value);
                  if (e.target.value === '' && onClearSelectedCategory) {
                    onClearSelectedCategory();
                  }
                }}
                disabled={isCategoryLocked}
              >
                <option value="">Category</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                className={`bg-background-light border border-gray-700 rounded-lg px-3 py-2 flex-1 min-w-[140px] sm:min-w-[120px] ${stockFilter ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="">Stock</option>
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </div>
          </div>
        )}

        <div className="border-b border-gray-700 w-full mb-4 mt-2"></div>
        {!embedded && (
          <div className="flex flex-row items-center justify-between gap-3 mb-4">

            <div className="flex-1">
              <input
                type="text"
                placeholder="Search Product"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background-light border border-gray-700 rounded-lg px-3 py-2 w-full max-w-xs h-10"
              />
            </div>

            <div className="flex flex-row items-center gap-2 justify-end">
              <ExportDropdown disabled={noneChecked} onExport={handleExport} />
              <button className="bg-primary text-white font-semibold px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors h-10"
                onClick={() => setActivePage('Add Product')}>
                <Plus size={16} />
                Add Product
              </button>
            </div>
          </div>
        )}

        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-700 text-sm text-text-secondary">
                <th className="p-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all products" /></th>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Stock</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Price</th>
                <th className="p-3">QTY</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-text-secondary">
                    Loading products...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-red-400">
                    Error: {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-text-secondary">
                    {selectedCategory ? `No products found in category "${selectedCategory}"` : 'No products found'}
                  </td>
                </tr>
              )}
              {!loading && !error && filteredProducts.length > 0 && paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-text-secondary">
                    No products on this page
                  </td>
                </tr>
              )}
              {!loading && !error && paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleOne(product.id)} aria-label={`Select product ${product.name}`} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-gray-700 text-xs text-text-secondary flex items-center justify-center">
                          N/A
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-text-primary">{product.name}</p>
                        <p className="text-xs text-text-secondary">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-text-secondary">{product.category}</td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={product.stock}
                        onChange={async (e) => {
                          try {
                            const newStockValue = e.target.checked;

                            // Update stock in MongoDB
                            const res = await ProductsApi.update(product.id, { stock: newStockValue });

                            if (res && res.success && res.data) {
                              // Update local state
                              setProducts(prev => prev.map(p =>
                                p.id === product.id ? { ...p, stock: newStockValue } : p
                              ));
                            } else {
                              throw new Error('Update failed');
                            }
                          } catch (error: any) {
                            alert(`Failed to update stock: ${error.message || 'Unknown error'}`);
                            // Revert checkbox state on error
                            e.target.checked = !e.target.checked;
                          }
                        }}
                      />
                      <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:bg-primary transition"></div>
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                    </label>
                  </td>
                  <td className="p-3 text-text-secondary">{product.sku}</td>
                  <td className="p-3 text-text-primary font-medium whitespace-nowrap">{formatVND(product.price)}</td>
                  <td className="p-3 text-text-secondary">{product.quantity}</td>
                  <td className="p-3">
                    <Badge color={getStatusColor(product.status)}>{product.status}</Badge>
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center items-center gap-2">
                      <button
                        className="p-2 text-text-secondary"
                        onClick={() => onOpenEdit(product)}
                        aria-label="Edit product"
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
                            icon.style.color = '#7c3aed';
                            icon.style.transition = 'none';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transition = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          const icon = e.currentTarget.querySelector('svg');
                          if (icon) {
                            icon.style.color = 'rgb(156, 163, 175)';
                            icon.style.transition = 'none';
                          }
                        }}
                      >
                        <Edit size={16} style={{ color: 'rgb(156, 163, 175)', transition: 'none' }} />
                      </button>
                      {(() => {
                        const productKey = getPrimaryProductId(product);
                        const isDeleting =
                          productKey !== null &&
                          productKey !== undefined &&
                          deletingIdentifier !== null &&
                          String(deletingIdentifier) === String(productKey);
                        return (
                          <button
                            className={`p-2 text-text-secondary ${isDeleting ? 'opacity-60 cursor-not-allowed' : ''}`}
                            onClick={() => handleDeleteProduct(product)}
                            disabled={isDeleting}
                            aria-label="Delete product"
                            style={{
                              transition: 'none !important',
                              boxShadow: 'none !important',
                              WebkitTransition: 'none !important',
                              MozTransition: 'none !important',
                              OTransition: 'none !important',
                              backgroundColor: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (!isDeleting) {
                                e.currentTarget.style.transition = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.backgroundColor = 'transparent';
                                const icon = e.currentTarget.querySelector('svg');
                                if (icon) {
                                  icon.style.color = '#ef4444';
                                  icon.style.transition = 'none';
                                }
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transition = 'none';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.backgroundColor = 'transparent';
                              const icon = e.currentTarget.querySelector('svg');
                              if (icon) {
                                icon.style.color = 'rgb(156, 163, 175)';
                                icon.style.transition = 'none';
                              }
                            }}
                          >
                            {isDeleting ? (
                              <span className="text-xs animate-pulse">...</span>
                            ) : (
                              <Trash2 size={16} style={{ color: 'rgb(156, 163, 175)', transition: 'none' }} />
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-6 text-sm text-text-secondary">
            <p>Showing {startEntry} to {endEntry} of {filteredProducts.length} entries</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => currentPage > 1 && setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md ${isActive ? 'bg-primary text-white' : ''
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
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => currentPage < totalPages && setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        </div>
      </div>
      <ModalDialog
        isOpen={!!dialog}
        title={dialog?.title || ''}
        message={dialog?.message || ''}
        confirmLabel={dialog?.confirmLabel}
        cancelLabel={dialog?.cancelLabel}
        variant={dialog?.variant}
        onConfirm={() => {
          const action = dialog?.onConfirm;
          if (action) {
            action();
          }
        }}
        onCancel={() => {
          setDialog(null);
          setPendingDelete(null);
          setPendingDeleteIdentifiers([]);
          setDeletingIdentifier(null);
        }}
      />
    </>
  );
};

export default Products;
