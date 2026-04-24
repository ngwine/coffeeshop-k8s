import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../../../components/BackButton';
import { ProductsApi } from '../../../../../api/products';
import UploadApi from '../../../../../api/upload';
import { formatVND } from '../../../../../utils/currency';
import ImageUploadSection from '../components/ImageUploadSection';
import { formatCurrencyInput } from '../AddProduct/utils';
import VariantsSection, { ProductVariant } from './components/VariantsSection';

type ProductPrefill = Partial<
  Omit<ProductFormState, 'price' | 'quantity'> & {
    price?: string | number;
    quantity?: string | number;
    id?: string | number;
    _id?: string;
  }
>;

type ProductDetailProps = {
  productId: string | number | null;
  onBack: () => void;
  initialProduct?: ProductPrefill;
};

type ProductFormState = {
  name: string;
  sku: string;
  description: string;
  category: string;
  price: string;
  quantity: string;
  status: 'Publish' | 'Inactive' | 'Draft';
  stock: boolean;
  imageUrl: string;
  variants: ProductVariant[];
};

const initialState: ProductFormState = {
  name: '',
  sku: '',
  description: 'Sản phẩm cao cấp được tuyển chọn kỹ lưỡng, đảm bảo chất lượng và hương vị đặc trưng. Phù hợp cho những tín đồ sành điệu, mang lại trải nghiệm tuyệt vời và đáng nhớ.',
  category: '',
  price: '',
  quantity: '',
  status: 'Publish',
  stock: true,
  imageUrl: '',
  variants: [],
};

const toInputString = (value: unknown) =>
  value === undefined || value === null || value === '' ? '' : String(value);

const normalizeProductData = (product?: ProductPrefill): ProductFormState => ({
  name: product?.name || '',
  sku: product?.sku || '',
  description: product?.description || '',
  category: product?.category || '',
  price: toInputString(product?.price),
  quantity: toInputString(product?.quantity),
  status: (product?.status as ProductFormState['status']) || 'Publish',
  stock: product?.stock ?? true,
  imageUrl: (product?.imageUrl as string) || (product as any)?.image || '',
  variants: (product as any)?.variants || [],
});

const ProductDetail: React.FC<ProductDetailProps> = ({ productId: propProductId, onBack, initialProduct }) => {
  const { productId: urlProductId } = useParams<{ productId: string }>();
  const productId = propProductId || urlProductId || null;


  const [productData, setProductData] = useState<ProductFormState>(() =>
    normalizeProductData(initialProduct),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState<{ file?: File; url: string } | null>(() =>
    productData.imageUrl ? { url: productData.imageUrl } : null,
  );
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const priceInputRef = useRef<HTMLInputElement | null>(null);
  const [priceRaw, setPriceRaw] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const isUserTypingRef = useRef(false); // Track if user is actively typing
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  useEffect(() => {
    return () => {
      if (imagePreview?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview.url);
      }
    };
  }, [imagePreview]);

  // Load all categories for metadata
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { CategoriesApi } = await import('../../../../../api/categories');
        const res = await CategoriesApi.list({ withStats: 'true' });
        if (res?.data) {
          const list = res.data.data || (Array.isArray(res.data) ? res.data : []);
          setCategoriesList(list);
        }
      } catch (err) {
        console.error('Failed to load categories metadata', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    // We still load categories for selection dropdown, but no longer need uniqueAttribute logic
  }, [productData.category, categoriesList]);

  useEffect(() => {
    if (initialProduct) {
      const normalized = normalizeProductData(initialProduct);
      setProductData(normalized);
      if (initialProduct.imageUrl) {
        setImagePreview({ url: initialProduct.imageUrl as string });
      }
      setError(null);
      
      // Initialize price display (only on initial load, not during typing)
      isUserTypingRef.current = false;
      setPriceRaw(normalized.price);
      setPriceDisplay(normalized.price ? new Intl.NumberFormat("vi-VN").format(Number(normalized.price)) : "");
    }
  }, [initialProduct]);

  useEffect(() => {
    if (!productId) {
      if (!initialProduct) {
        setError('Product not found');
      } else {
        setError(null);
      }
      return;
    }

    let cancelled = false;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await ProductsApi.get(productId);
        const product: ProductPrefill | null =
          (res?.data as ProductPrefill) || (res?.item as ProductPrefill) || (res as ProductPrefill);
        if (!product) {
          throw new Error('Product data not found');
        }

        if (cancelled) return;
        const normalized = normalizeProductData(product);
        setProductData(normalized);
        
        // Initialize price display (only on fetch, not during typing)
        isUserTypingRef.current = false;
        setPriceRaw(normalized.price);
        setPriceDisplay(normalized.price ? new Intl.NumberFormat("vi-VN").format(Number(normalized.price)) : "");
        
        if (normalized.imageUrl) {
          setImagePreview({ url: normalized.imageUrl });
        } else {
          setImagePreview(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          if (initialProduct) {
            setError(null);
            const normalized = normalizeProductData(initialProduct);
            setProductData(normalized);
            
            // Initialize price display (only on fallback, not during typing)
            isUserTypingRef.current = false;
            setPriceRaw(normalized.price);
            setPriceDisplay(normalized.price ? new Intl.NumberFormat("vi-VN").format(Number(normalized.price)) : "");
            
            if (normalized.imageUrl) {
              setImagePreview({ url: normalized.imageUrl });
            }
          } else {
            setError(err?.message || 'Unable to load product data');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [productId, initialProduct]);

  const handleFieldChange = (field: keyof ProductFormState, value: any) => {
    setProductData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'category' && value) {
      ProductsApi.getDefaults(value).then((res: any) => {
        if (res?.success && res.data?.variants && res.data.variants.length > 0) {
          setProductData((prev) => {
            return {
              ...prev,
              variants: res.data.variants
            };
          });
        }
      }).catch((err: any) => console.error("Failed to fetch category defaults", err));
    }
  };

  const formatPriceDisplay = useCallback(
    (rawValue: string) => (rawValue ? new Intl.NumberFormat("vi-VN").format(Number(rawValue)) : ""),
    [],
  );

  // Only sync from productData.price when it changes externally (e.g., from API)
  // NOT when user is typing (to avoid duplicate formatting)
  useEffect(() => {
    // Skip if user is currently typing
    if (isUserTypingRef.current) {
      return;
    }
    // Only update if priceRaw is empty or if productData.price is different from current priceRaw
    const raw = productData.price;
    if (raw !== priceRaw) {
      setPriceRaw(raw);
      setPriceDisplay(formatPriceDisplay(raw));
    }
  }, [productData.price, priceRaw, formatPriceDisplay]);

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mark that user is typing so effects don't re-format mid-typing
    isUserTypingRef.current = true;

    // Extract only numeric characters
    const raw = e.target.value.replace(/\D/g, "");

    setPriceRaw(raw);

    // While typing, show the raw digits exactly as user entered them
    setPriceDisplay(raw);
  };

  const handlePriceBlur = () => {
    // User finished typing, allow effects to sync again
    isUserTypingRef.current = false;

    // Persist raw price to product data
    setProductData(prev => ({
      ...prev,
      price: priceRaw
    }));

    // After typing completes, show the formatted representation
    setPriceDisplay(formatPriceDisplay(priceRaw));
  };

  const handleImageTrigger = () => {
    if (imagePreview || uploading) {
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview({ file, url: previewUrl });

      const uploadResponse = await UploadApi.uploadImage(file);

      if (uploadResponse && uploadResponse.success && uploadResponse.data) {
        const cloudinaryUrl = uploadResponse.data.secureUrl || uploadResponse.data.url;
        URL.revokeObjectURL(previewUrl);
        setImagePreview({ file, url: cloudinaryUrl });
        setProductData((prev) => ({ ...prev, imageUrl: cloudinaryUrl }));
      } else {
        throw new Error('Upload failed: Invalid response from server');
      }
    } catch (error: any) {
      alert(`Failed to upload image: ${error?.message || 'Please try again.'}`);
      if (imagePreview?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview.url);
      }
      setImagePreview(null);
      setProductData((prev) => ({ ...prev, imageUrl: '' }));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    if (imagePreview || uploading) {
      return;
    }
    handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = () => {
    if (isDragActive) setIsDragActive(false);
  };

  const handleRemoveImage = () => {
    if (imagePreview?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview(null);
    setProductData((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!productId) {
      setError('Cannot update without a product ID');
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage(null);
      setError(null);

      // Ensure productData.price is synced with priceRaw before saving
      const finalPrice = priceRaw || productData.price;

      const finalImageUrl = productData.imageUrl;
      if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
        setError('Please wait for image upload to complete, or try uploading again');
        setSaving(false);
        return;
      }

      const payload = {
        name: productData.name.trim(),
        sku: productData.sku.trim(),
        description: productData.description.trim(),
        category: productData.category.trim(),
        price: Number(finalPrice) || 0,
        quantity: Number(productData.quantity) || 0,
        status: productData.status,
        stock: productData.stock,
        imageUrl: finalImageUrl,
        variants: productData.variants,
      };

      const res = await ProductsApi.update(productId, payload as any);
      if (res && res.success && res.data) {
        setProductData(
          normalizeProductData({
            ...payload,
            imageUrl: res.data.imageUrl || payload.imageUrl,
          }),
        );
        setSuccessMessage('Product updated successfully!');
      } else {
        throw new Error('Unable to update product');
      }
    } catch (updateError: any) {
      setError(updateError?.message || 'Unable to update product');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    label: string,
    value: string,
    {
      required = false,
      type = 'text',
      multiline = false,
      onChange,
    }: {
      required?: boolean;
      type?: string;
      multiline?: boolean;
      onChange?: (value: string) => void;
    } = {},
  ) => (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          rows={6}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={!onChange}
          className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={!onChange}
          className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <BackButton onClick={onBack} className="w-fit" />
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Product Detail</h2>
            <p className="text-sm text-text-secondary mt-1 opacity-70">
              Detailed product information
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !productId}
            className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Update product'}
          </button>
        </div>
      </div>

      <div className="bg-background-light p-4 rounded-lg border border-gray-700 text-sm space-y-2">
        {successMessage && (
          <p className="text-sm text-green-400 font-medium">{successMessage}</p>
        )}
        {loading && <p className="text-text-secondary">Loading product data...</p>}
        {!loading && error && <p className="text-red-400">{error}</p>}
        {!loading && !error && (
          <div className="text-text-secondary flex flex-wrap gap-6">
            <div>
              <span className="text-text-primary font-semibold">Product name:</span>{' '}
              {productData.name || '—'}
            </div>
            <div>
              <span className="text-text-primary font-semibold">SKU:</span>{' '}
              {productData.sku || '—'}
            </div>
            <div>
              <span className="text-text-primary font-semibold">Price:</span>{' '}
              {priceRaw ? `${formatPriceDisplay(priceRaw)} đ` : '—'}
            </div>
            <div>
              <span className="text-text-primary font-semibold">Stock:</span>{' '}
              {productData.stock ? 'Available' : 'Out of stock'}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background-light p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">
              Product Information
            </h3>
            <div className="space-y-4">
              {renderField('Name', productData.name, {
                required: true,
                onChange: (value) => handleFieldChange('name', value),
              })}
              {renderField('SKU', productData.sku, {
                required: true,
                onChange: (value) => handleFieldChange('sku', value),
              })}
              {renderField('Description', productData.description, {
                multiline: true,
                onChange: (value) => handleFieldChange('description', value),
              })}
            </div>
          </div>

          <ImageUploadSection
            imagePreview={imagePreview}
            uploading={uploading}
            isDragActive={isDragActive}
            previewFileName={imagePreview?.file?.name || productData.name || null}
            previewFileSize={imagePreview?.file?.size || null}
            onTriggerUpload={handleImageTrigger}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onRemoveImage={handleRemoveImage}
            onBrowse={handleImageTrigger}
            onFileChange={(event) => handleFiles(event.target.files)}
            fileInputRef={fileInputRef}
            title="Product Image"
            required={false}
          />

          <VariantsSection 
            variants={productData.variants} 
            onChange={(newVariants) => handleFieldChange('variants', newVariants)} 
          />
        </div>

        <div className="space-y-6">
          <div className="bg-background-light p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Inventory</h3>
            <div className="space-y-4">
              {renderField('Quantity', productData.quantity, {
                required: true,
                type: 'number',
                onChange: (value) => handleFieldChange('quantity', value),
              })}
            </div>
          </div>

          <div className="bg-background-light p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Pricing</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Price <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">₫</span>
                 <input
                    ref={priceInputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={priceDisplay}
                    onChange={handlePriceInputChange}
                    onBlur={handlePriceBlur}
                    className="w-full bg-background-dark border border-gray-600 rounded-lg pl-6 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                  />
                </div>
                <p className="text-xs text-text-secondary">
                  {priceRaw ? `${formatPriceDisplay(priceRaw)} đ` : '0 đ'}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">In stock</span>
                <label className="relative inline-flex items-center cursor-default">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={productData.stock}
                    onChange={(e) => handleFieldChange('stock', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-primary">
                    <div
                      className={`h-5 w-5 bg-white rounded-full mt-0.5 ml-0.5 transition-transform ${
                        productData.stock ? 'translate-x-5' : ''
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-background-light p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Organize</h3>
            <div className="space-y-4">
              {renderField('Category', productData.category, {
                onChange: (value) => handleFieldChange('category', value),
              })}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Status
                </label>
                <select
                  value={productData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Publish">Publish</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {/* Unique attributes removed */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

