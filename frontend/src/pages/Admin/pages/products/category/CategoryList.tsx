import React, { useMemo, useState, useEffect, useCallback, useDeferredValue } from 'react';
import { CategoriesApi } from '../../../../../api/categories';
import { ProductsApi } from '../../../../../api/products';
import CategoryToolbar from './components/CategoryToolbar';
import CategoryTable from './components/CategoryTable';
import AddCategoryModal from './components/AddCategoryModal';
import EditCategoryModal from './components/EditCategoryModal';
import DeleteCategoryModal from './components/DeleteCategoryModal';
import { ITEMS_PER_PAGE } from './constants';
import {
  parseProductsFile,
  normalizeKeys,
  buildNameKey,
  extractIncomingName,
  normalizeProductPayload,
  fetchAllProducts,
} from './utils';
import { ProductVariant } from '../ProductDetail/components/VariantsSection';

// Danh sách danh mục chuẩn (khớp với OrganizeSection.tsx)
const STANDARD_CATEGORIES = [
  'Roasted coffee',
  'Coffee sets',
  'Cups & Mugs',
  'Coffee makers and grinders',
];

type CategoryListProps = {
  setActivePage: (page: string) => void;
  onCategoryClick?: (categoryName: string) => void;
};

const CategoryList: React.FC<CategoryListProps> = ({ setActivePage, onCategoryClick }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    attachment: null as File | null,
    status: 'Active',
    defaultVariants: [] as ProductVariant[],
  });
  const [importSummary, setImportSummary] = useState<{ created: number; updated: number; failed: number } | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    status: 'Active',
    defaultVariants: [] as ProductVariant[],
  });
  const [editAttachment, setEditAttachment] = useState<File | null>(null);
  const [editSummary, setEditSummary] = useState<{ created: number; updated: number; failed: number } | null>(null);

  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<any | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchValue = useDeferredValue(searchValue);
  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Lấy dữ liệu danh mục thực từ Backend (bao gồm cấu hình defaultVariants)
      const catRes = await CategoriesApi.list({ withStats: 'true' });
      const officialCategories = catRes?.data?.data || catRes?.data || [];
      const officialMap = new Map();
      officialCategories.forEach((cat: any) => {
        officialMap.set((cat.name || '').trim().toLowerCase(), cat);
      });

      // 2. Lấy dữ liệu từ Products API để đếm count chính xác nhất (frontend grouping)
      const productRes = await ProductsApi.list({ limit: 1000, page: 1 } as any);
      const productItems = productRes?.data?.data || productRes?.data || productRes?.items || [];

      // Group sản phẩm theo category và đếm
      const countMap: Record<string, number> = {};
      if (Array.isArray(productItems)) {
        productItems.forEach((product: any) => {
          const cat = (product.category || '').trim();
          if (cat) countMap[cat] = (countMap[cat] || 0) + 1;
        });
      }

      // Build danh sách cơ bản từ Official Categories
      const transformed: any[] = officialCategories.map((cat: any) => {
        const lowerName = (cat.name || '').trim().toLowerCase();
        return {
          id: cat._id || cat.id || `virtual-${lowerName}`,
          name: cat.name,
          identifier: cat.name,
          productCount: countMap[lowerName] || cat.count || 0,
          status: cat.status || (cat.isActive === false ? 'Inactive' : 'Active'),
          defaultVariants: cat.defaultVariants || [],
        };
      });

      // Merge thêm các category ẩn (nếu chỉ tồn tại trong Products API nhưng backend sync bị miss)
      Object.entries(countMap).forEach(([name, count], idx) => {
        const lowerName = name.toLowerCase();
        if (!officialMap.has(lowerName)) {
          transformed.push({
            id: `prod-${idx}`,
            name,
            identifier: name,
            productCount: count,
            status: 'Active',
            defaultVariants: [],
          });
          officialMap.set(lowerName, true);
        }
      });

      const existingNames = new Set(transformed.map((c: any) => c.name.toLowerCase().trim()));
      STANDARD_CATEGORIES.forEach((name, idx) => {
        if (!existingNames.has(name.toLowerCase().trim())) {
          transformed.push({
            id: `std-${idx}`,
            name,
            identifier: name,
            productCount: 0,
            status: 'Active',
            defaultVariants: [],
          });
        }
      });

      // Sắp xếp theo tên
      transformed.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(transformed);
    } catch (error) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchValue]);

  const filteredCategories = useMemo(() => {
    const trimmed = deferredSearchValue.trim();
    if (!trimmed) return categories;
    const normalizedTerm = normalizeText(trimmed);
    if (!normalizedTerm) return categories;

    return categories.filter((category) => {
      const normalizedName = normalizeText(category.name || '');
      if (!normalizedName) return false;
      return normalizedName.startsWith(normalizedTerm);
    });
  }, [categories, deferredSearchValue]);
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCategories = useMemo(
    () => filteredCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [filteredCategories, startIndex],
  );
  const startEntry = filteredCategories.length === 0 ? 0 : startIndex + 1;
  const endEntry =
    filteredCategories.length === 0 ? 0 : Math.min(startIndex + ITEMS_PER_PAGE, filteredCategories.length);

  const handleCategoryClick = (categoryName: string, e?: React.MouseEvent) => {
    if (e && (e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onCategoryClick) {
      onCategoryClick(categoryName);
    } else {
      setActivePage('Product List');
    }
  };

  const handleAddCategorySubmit = async () => {
    if (!categoryForm.title.trim() || !categoryForm.attachment) {
      alert('Vui lòng nhập Title và chọn file sản phẩm (JSON hoặc Excel).');
      return;
    }
    setIsSaving(true);
    setImportSummary(null);
    try {
      await CategoriesApi.create({
        name: categoryForm.title.trim(),
        isActive: categoryForm.status === 'Active',
        defaultVariants: categoryForm.defaultVariants,
      }).catch(err => console.log('Category might already exist or error, continuing...'));

      const parsed = await parseProductsFile(categoryForm.attachment);
      const existingProducts = await fetchAllProducts();
      const skuMap = new Map<string, any>();
      existingProducts.forEach((product: any) => {
        const skuKey = (product.sku || '').toLowerCase();
        if (skuKey) {
          skuMap.set(skuKey, product);
        }
      });
      const existingSkus = new Set<string>(skuMap.keys());
      const nameMap = new Map<string, any>();
      existingProducts.forEach((product: any) => {
        const key = buildNameKey(product?.name);
        if (key && !nameMap.has(key)) {
          nameMap.set(key, product);
        }
      });

      let created = 0;
      let updated = 0;
      let failed = 0;
      for (let i = 0; i < parsed.length; i++) {
        const normalizedKeys = normalizeKeys(parsed[i]);
        let rawSku = (parsed[i]?.sku || normalizedKeys['sku'] || '').toString().trim();
        const incomingName = extractIncomingName(parsed[i], normalizedKeys);
        const nameKey = buildNameKey(incomingName);
        let existingProduct: any | undefined;
        const skuKey = rawSku.toLowerCase();
        if (skuKey) {
          existingProduct = skuMap.get(skuKey);
        }
        if (!existingProduct && nameKey) {
          existingProduct = nameMap.get(nameKey);
          if (existingProduct && !rawSku && existingProduct.sku) {
            rawSku = existingProduct.sku;
            normalizedKeys['sku'] = existingProduct.sku;
            parsed[i].sku = existingProduct.sku;
          }
        }
        const payload = normalizeProductPayload(
          parsed[i],
          normalizedKeys,
          i,
          categoryForm.title,
          categoryForm.status === 'Active' ? 'Publish' : 'Inactive',
          existingProduct ? undefined : existingSkus,
          existingProduct,
        );
        const effectiveSkuKey = (payload.sku || '').toLowerCase();
        try {
          if (existingProduct && effectiveSkuKey) {
            const target = skuMap.get(effectiveSkuKey) || existingProduct;
            const res = await ProductsApi.update(target.id || target._id, payload as any);
            if (!res?.success) {
              throw new Error(res?.message || 'Update failed');
            }
            updated += 1;
            const updatedNameKey = buildNameKey(payload.name);
            if (updatedNameKey) {
              nameMap.set(updatedNameKey, res?.data || target);
            }
          } else {
            const res = await ProductsApi.create(payload as any);
            if (!res?.success) {
              throw new Error(res?.message || 'Create failed');
            }
            created += 1;
            if (effectiveSkuKey) {
              skuMap.set(effectiveSkuKey, res?.data || payload);
              existingSkus.add(effectiveSkuKey);
            }
            const newNameKey = buildNameKey(payload.name);
            if (newNameKey) {
              nameMap.set(newNameKey, res?.data || payload);
            }
          }
        } catch (err) {
          failed += 1;
        }
      }

      setImportSummary({ created, updated, failed });
      await loadCategories();
      if (failed === 0) {
        setCategoryForm({
          title: '',
          attachment: null,
          status: 'Active',
          defaultVariants: [],
        });
        setIsAddModalOpen(false);
      }
    } catch (error: any) {
      alert(error?.message || 'Không thể đọc file sản phẩm');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategorySubmit = async () => {
    if (!editForm.title.trim() || !selectedCategory) {
      alert('Vui lòng nhập tên category');
      return;
    }
    setIsUpdating(true);
    setEditSummary(null);
    try {
      const originalCategoryName = (selectedCategory.name || '').trim() || 'Uncategorized';
      const newCategoryName = editForm.title.trim() || 'Uncategorized';
      const originalStatus = selectedCategory.status || 'Active';
      const desiredStatus = editForm.status === 'Active' ? 'Publish' : 'Inactive';
      const statusChanged = editForm.status !== originalStatus;
      const nameChanged = newCategoryName !== originalCategoryName;
      const variantsChanged = true; // We always update defaultVariants during edit for simplicity

      if (!editAttachment && !statusChanged && !nameChanged && !variantsChanged) {
        alert('Không có thay đổi nào để cập nhật');
        setIsUpdating(false);
        return;
      }

      const summaryResult = { created: 0, updated: 0, failed: 0 };
      let productsCache: any[] | null = null;
      const ensureProducts = async (force = false) => {
        if (!productsCache || force) {
          productsCache = await fetchAllProducts();
        }
        return productsCache;
      };

      if (nameChanged || statusChanged) {
        // Cập nhật metadata của category trước
        const categoryPayload: any = {};
        if (nameChanged) {
          categoryPayload.name = newCategoryName;
          categoryPayload.newName = newCategoryName; // tương thích backward với server cũ
        }
        if (statusChanged) categoryPayload.isActive = editForm.status === 'Active';
        categoryPayload.defaultVariants = editForm.defaultVariants;

        await CategoriesApi.update(originalCategoryName, categoryPayload);

        const allProducts = await ensureProducts();
        const targets = allProducts.filter((product: any) => {
          const categoryValue = (product.category || 'Uncategorized').trim();
          return categoryValue === originalCategoryName;
        });

        if (targets.length === 0 && !editAttachment) {
          throw new Error('Category not found');
        }

        for (const product of targets) {
          const payload: any = {};
          if (nameChanged) payload.category = newCategoryName;
          if (statusChanged) payload.status = desiredStatus;
          if (!Object.keys(payload).length) continue;
          try {
            const res = await ProductsApi.update(product.id || product._id, payload as any);
            if (!res?.success) {
              throw new Error(res?.message || 'Update failed');
            }
            summaryResult.updated += 1;
          } catch (err) {
            summaryResult.failed += 1;
          }
        }

        await ensureProducts(true);
      }

      if (editAttachment) {
        const parsed = await parseProductsFile(editAttachment);
        const allProducts = await fetchAllProducts();
        const skuMap = new Map<string, any>();
        allProducts.forEach((product: any) => {
          const skuKey = (product.sku || '').toLowerCase();
          if (skuKey) {
            skuMap.set(skuKey, product);
          }
        });
        const existingSkus = new Set<string>(skuMap.keys());
        const nameMap = new Map<string, any>();
        allProducts.forEach((product: any) => {
          const key = buildNameKey(product?.name);
          if (key && !nameMap.has(key)) {
            nameMap.set(key, product);
          }
        });

        for (let i = 0; i < parsed.length; i++) {
          const normalizedKeys = normalizeKeys(parsed[i]);
          let rawSku = (parsed[i]?.sku || normalizedKeys['sku'] || '').toString().trim();
          const incomingName = extractIncomingName(parsed[i], normalizedKeys);
          const nameKey = buildNameKey(incomingName);
          let existingProduct: any | undefined;
          const skuKey = rawSku.toLowerCase();
          if (skuKey) {
            existingProduct = skuMap.get(skuKey);
          }
          if (!existingProduct && nameKey) {
            existingProduct = nameMap.get(nameKey);
            if (existingProduct && !rawSku && existingProduct.sku) {
              rawSku = existingProduct.sku;
              normalizedKeys['sku'] = existingProduct.sku;
              parsed[i].sku = existingProduct.sku;
            }
          }
          const payload = normalizeProductPayload(
            parsed[i],
            normalizedKeys,
            i,
            newCategoryName,
            desiredStatus,
            existingProduct ? undefined : existingSkus,
            existingProduct,
          );
          const effectiveSkuKey = (payload.sku || '').toLowerCase();
          try {
            if (existingProduct && effectiveSkuKey) {
              const target = skuMap.get(effectiveSkuKey) || existingProduct;
              const res = await ProductsApi.update(target.id || target._id, payload as any);
              if (!res?.success) {
                throw new Error(res?.message || 'Update failed');
              }
              summaryResult.updated += 1;
              const updatedNameKey = buildNameKey(payload.name);
              if (updatedNameKey) {
                nameMap.set(updatedNameKey, res?.data || target);
              }
            } else {
              const res = await ProductsApi.create(payload as any);
              if (!res?.success) {
                throw new Error(res?.message || 'Create failed');
              }
              summaryResult.created += 1;
              if (effectiveSkuKey) {
                skuMap.set(effectiveSkuKey, res?.data || payload);
                existingSkus.add(effectiveSkuKey);
              }
              const newNameKey = buildNameKey(payload.name);
              if (newNameKey) {
                nameMap.set(newNameKey, res?.data || payload);
              }
            }
          } catch (err) {
            summaryResult.failed += 1;
          }
        }
      }

      await loadCategories();

      if (summaryResult.failed === 0) {
        setIsEditModalOpen(false);
        setSelectedCategory(null);
        setEditAttachment(null);
        setEditSummary(null);
      } else {
        setEditSummary(summaryResult);
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Failed to update category');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!pendingDeleteCategory) {
      return;
    }
    const identifier = (pendingDeleteCategory.identifier || pendingDeleteCategory.name || '').trim();
    if (!identifier) {
      setPendingDeleteCategory(null);
      return;
    }

    try {
      setIsDeletingCategory(true);
      await CategoriesApi.remove(identifier);
      await loadCategories();
      setPendingDeleteCategory(null);
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Failed to delete category');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  return (
    <div className="bg-background-light p-6 rounded-lg shadow-lg">
      <CategoryToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAddClick={() => {
          setCategoryForm({
            title: '',
            attachment: null,
            status: 'Active',
            defaultVariants: [],
          });
          setImportSummary(null);
          setIsAddModalOpen(true);
        }}
      />

      <CategoryTable
        categories={filteredCategories}
        paginatedCategories={paginatedCategories}
        startEntry={startEntry}
        endEntry={endEntry}
        totalEntries={filteredCategories.length}
        currentPage={currentPage}
        totalPages={totalPages}
        onCategoryClick={handleCategoryClick}
        onEdit={async (category) => {
          setSelectedCategory({
            ...category,
            identifier: category.identifier || category.name,
          });
          setEditAttachment(null);
          setEditSummary(null);

          // Nếu category chưa có defaultVariants trong DB, fallback lấy từ Factory
          let variants = category.defaultVariants || [];
          if (variants.length === 0) {
            try {
              const res = await ProductsApi.getDefaults(category.name);
              variants = res?.data?.data?.variants || res?.data?.variants || [];
            } catch (_) { /* Factory không có → để trống */ }
          }

          setEditForm({
            title: category.name,
            status: category.status || 'Active',
            defaultVariants: variants,
          });
          setIsEditModalOpen(true);
        }}
        onDelete={(category) => setPendingDeleteCategory(category)}
        onPageChange={setCurrentPage}
      />

      <AddCategoryModal
        open={isAddModalOpen}
        form={categoryForm}
        importSummary={importSummary}
        isSaving={isSaving}
        onClose={() => {
          if (isSaving) return;
          setIsAddModalOpen(false);
        }}
        onSubmit={handleAddCategorySubmit}
        onTitleChange={(value) =>
          setCategoryForm((prev) => ({
            ...prev,
            title: value,
          }))
        }
        onStatusChange={(value) =>
          setCategoryForm((prev) => ({
            ...prev,
            status: value,
          }))
        }
        onVariantsChange={(variants: ProductVariant[]) =>
          setCategoryForm((prev) => ({
            ...prev,
            defaultVariants: variants,
          }))
        }
        onFileChange={(file) =>
          setCategoryForm((prev) => ({
            ...prev,
            attachment: file,
          }))
        }
      />

      <EditCategoryModal
        open={isEditModalOpen}
        selectedCategory={selectedCategory}
        form={editForm}
        attachment={editAttachment}
        summary={editSummary}
        isUpdating={isUpdating}
        onClose={() => {
          if (isUpdating) return;
          setIsEditModalOpen(false);
        }}
        onCancel={() => {
          if (isUpdating) return;
          setIsEditModalOpen(false);
          setEditAttachment(null);
          setEditSummary(null);
          setSelectedCategory(null);
        }}
        onSubmit={handleEditCategorySubmit}
        onTitleChange={(value) =>
          setEditForm((prev) => ({
            ...prev,
            title: value,
          }))
        }
        onStatusChange={(value) =>
          setEditForm((prev) => ({
            ...prev,
            status: value,
          }))
        }
        onVariantsChange={(variants: ProductVariant[]) =>
          setEditForm((prev) => ({
            ...prev,
            defaultVariants: variants,
          }))
        }
        onFileChange={(file) => setEditAttachment(file)}
      />

      <DeleteCategoryModal
        open={Boolean(pendingDeleteCategory)}
        category={pendingDeleteCategory}
        isDeleting={isDeletingCategory}
        onCancel={() => {
          if (isDeletingCategory) return;
          setPendingDeleteCategory(null);
        }}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
};

export default CategoryList;