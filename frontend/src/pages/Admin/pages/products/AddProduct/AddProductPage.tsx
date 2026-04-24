import React, { useEffect, useRef, useState } from 'react';
import { ProductsApi } from '../../../../../api/products';
import { CategoriesApi } from '../../../../../api/categories';
import UploadApi from '../../../../../api/upload';
import { AddProductFormData } from './components/ProductInfoSection';
import AddProductHeader from './components/AddProductHeader';
import ProductInfoSection from './components/ProductInfoSection';
import ImageUploadSection from '../components/ImageUploadSection';
import PricingSection from './components/PricingSection';
import OrganizeSection from './components/OrganizeSection';
import { generateSKU } from './utils';
import ModalDialog from '../../../../../components/ModalDialog';
import VariantsSection, { ProductVariant } from '../ProductDetail/components/VariantsSection';

type AddProductProps = {
  onBack?: () => void;
  setActivePage?: (page: string) => void;
};

const MASTER_DESCRIPTIONS: Record<string, string> = {
  'Roasted coffee': 'Cà phê rang mộc nguyên chất, hương vị đậm đà, hậu vị ngọt. Quy trình rang kiểm soát nhiệt độ nghiêm ngặt, giữ trọn vẹn tinh túy của từng hạt cà phê đặc sản.',
  'Coffee sets': 'Bộ quà tặng cà phê sang trọng với thiết kế tinh tế, bao gồm đa dạng các loại cà phê và dụng cụ pha chế cao cấp. Lựa chọn hoàn hảo để biếu tặng người thân và đối tác.',
  'Cups & Mugs': 'Sản phẩm làm từ chất liệu cao cấp, chịu nhiệt tốt, thiết kế Ergonomic cầm nắm thoải mái. Kiểu dáng hiện đại, tối giản, phù hợp cho mọi không gian thưởng thức cà phê.',
  'Coffee makers and grinders': 'Thiết bị chuyên nghiệp với công nghệ tiên tiến, hoạt động bền bỉ và dễ vận hành. Giúp tối ưu hóa hương vị, mang lại chất lượng cà phê hoàn hảo như tại cửa hàng.',
};

const AddProductPage: React.FC<AddProductProps> = ({ onBack, setActivePage }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const priceInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
    onConfirm?: () => void;
  } | null>(null);

  const previewFileName = imagePreview?.file?.name || null;
  const previewFileSize = imagePreview?.file?.size || null;

  const [formData, setFormData] = useState<AddProductFormData>({
    name: '',
    sku: '',
    description: 'Sản phẩm cao cấp được tuyển chọn kỹ lưỡng, đảm bảo chất lượng và hương vị đặc trưng.',
    category: '',
    price: '',
    quantity: '',
    status: 'Publish',
    stock: true,
    variants: [],
  });
  

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await CategoriesApi.list({ withStats: 'true' });
        if (res?.data) {
          const list = res.data.data || (Array.isArray(res.data) ? res.data : []);
          setCategoriesList(list);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadData();

    if (formData.category && !formData.sku) {
      const newSku = generateSKU(formData.category);
      setFormData((prev) => ({ ...prev, sku: newSku }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);




  const handleImageTrigger = () => {
    if (imagePreview || uploading) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setDialog({
        title: 'Invalid file',
        message: 'Please select an image file (PNG, JPG, GIF).',
      });
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
      } else {
        throw new Error('Upload failed: Invalid response from server');
      }
    } catch (error: any) {
      setDialog({
        title: 'Upload failed',
        message: error?.message || 'Failed to upload image. Please try again.',
      });
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview.url);
      }
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({
      ...prev,
      price: val,
    }));
  };
  

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
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
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (field: keyof AddProductFormData, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === 'category' && value) {
        newData.sku = generateSKU(value);
        newData.description = MASTER_DESCRIPTIONS[value] || newData.description;
      }
      return newData;
    });

    if (field === 'category' && value) {
      ProductsApi.getDefaults(value).then((res: any) => {
        if (res?.success && res.data?.variants) {
          setFormData((prev) => {
            return {
              ...prev,
              variants: res.data.variants
            };
          });
        }
      }).catch((err: any) => console.error("Failed to fetch category defaults", err));
    }
  };

  const handleGenerateSKU = () => {
    if (formData.category) {
      setFormData((prev) => ({ ...prev, sku: generateSKU(formData.category) }));
    } else {
      setDialog({
        title: 'Select category',
        message: 'Please select a category before generating a SKU.',
      });
    }
  };

  const handleSubmit = async (status: 'Publish' | 'Draft' | 'Inactive') => {
    try {
      if (!formData.name.trim()) {
        setDialog({ title: 'Missing information', message: 'Product name is required.' });
        return;
      }
      if (!formData.category) {
        setDialog({ title: 'Missing information', message: 'Category is required.' });
        return;
      }

      let finalSku = formData.sku.trim();
      if (!finalSku && formData.category) {
        finalSku = generateSKU(formData.category);
        setFormData((prev) => ({ ...prev, sku: finalSku }));
      }

      if (!finalSku) {
        setDialog({ title: 'Missing information', message: 'SKU is required.' });
        return;
      }

      if (!imagePreview) {
        setDialog({ title: 'Missing information', message: 'Product image is required.' });
        return;
      }

      setSaving(true);

      const finalImageUrl = imagePreview.url;
      if (finalImageUrl.startsWith('blob:')) {
        setDialog({ title: 'Upload in progress', message: 'Please wait for the image upload to finish.' });
        return;
      }

      const payload = {
        name: formData.name.trim(),
        sku: finalSku,
        description: formData.description.trim(),
        category: formData.category,
        imageUrl: finalImageUrl,
        price: Number(formData.price) || 0,
        quantity: Number(formData.quantity) || 0,
        status,
        stock: formData.stock,
        variants: formData.variants,
      };

      const res = await ProductsApi.create(payload);

      if (res && res.success) {
        if (imagePreview) URL.revokeObjectURL(imagePreview.url);
        if (onBack) onBack();
        else if (setActivePage) setActivePage('Product List');
      } else {
        throw new Error(res?.message || 'Create failed');
      }
    } catch (e: any) {
      setDialog({
        title: 'Failed to create product',
        message: e?.response?.data?.message || e?.message || 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };


  useEffect(
    () => () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview.url);
      }
    },
    [imagePreview],
  );

  return (
    <div className="space-y-6">
      <AddProductHeader onBack={onBack} saving={saving} onSubmit={handleSubmit} />

      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="grid grid-cols-3 gap-6 min-w-[1000px]">
        <div className="col-span-2 space-y-6 min-w-0">
          <ProductInfoSection 
            formData={formData} 
            onChange={handleInputChange} 
            onGenerateSKU={handleGenerateSKU} 
          />
          <ImageUploadSection
            imagePreview={imagePreview}
            uploading={uploading}
            isDragActive={isDragActive}
            previewFileName={previewFileName}
            previewFileSize={previewFileSize}
            onTriggerUpload={handleImageTrigger}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onRemoveImage={handleRemoveImage}
            onBrowse={() => handleImageTrigger()}
            onFileChange={(event) => handleFiles(event.target.files)}
            fileInputRef={fileInputRef}
          />
          <VariantsSection 
            variants={formData.variants} 
            onChange={(newVariants) => handleInputChange('variants', newVariants)} 
          />
        </div>

        <div className="space-y-6">
          <PricingSection formData={formData} onChange={handleInputChange} onPriceChange={handlePriceInputChange} priceInputRef={priceInputRef} />
          <OrganizeSection formData={formData} categories={categoriesList} onChange={handleInputChange} />
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
          dialog?.onConfirm?.();
          setDialog(null);
        }}
        onCancel={() => {
          setDialog(null);
        }}
      />
    </div>
  );
};

export default AddProductPage;
