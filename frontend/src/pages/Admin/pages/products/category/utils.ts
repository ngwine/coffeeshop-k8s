import { ProductsApi } from '../../../../../api/products';

let xlsxModule: any = null;

export const loadXLSX = async () => {
  if (!xlsxModule) {
    const mod = await import('xlsx');
    xlsxModule = mod.default ? mod.default : mod;
  }
  return xlsxModule;
};

export const parseProductsFile = async (file: File) => {
  const name = file.name.toLowerCase();
  if (name.endsWith('.json')) {
    const fileText = await file.text();
    let parsed = JSON.parse(fileText);
    if (!Array.isArray(parsed) && parsed?.products) {
      parsed = parsed.products;
    }
    if (!Array.isArray(parsed)) {
      throw new Error('File JSON have to the array of products');
    }
    return parsed;
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = (await loadXLSX()) as any;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return json;
  }
  throw new Error('File format not supported. Only JSON and Excel (.xlsx) are supported');
};

export const stripDiacritics = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

export const normalizeKeys = (item: any) => {
  const normalized: Record<string, any> = {};
  Object.keys(item || {}).forEach((key) => {
    if (!key) return;
    const lowerKey = key.toLowerCase().trim();
    const value = (item as any)[key];
    normalized[lowerKey] = value;
    const aliasKey = stripDiacritics(lowerKey);
    if (aliasKey && !(aliasKey in normalized)) {
      normalized[aliasKey] = value;
    }
  });
  return normalized;
};

export const buildNameKey = (value?: string | null) => {
  if (!value || typeof value !== 'string') return '';
  return stripDiacritics(value).replace(/\s+/g, '');
};

export const extractIncomingName = (item: any, normalizedKeys: Record<string, any>) => {
  const candidate =
    item?.name ||
    item?.title ||
    normalizedKeys['name'] ||
    normalizedKeys['product name'] ||
    normalizedKeys['tên sản phẩm'] ||
    normalizedKeys['ten san pham'] ||
    normalizedKeys['product'] ||
    '';
  return typeof candidate === 'string' ? candidate.trim() : '';
};

export const coerceNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const str = String(value).replace(/[^0-9,.\-]/g, '');
  if (!str) return null;
  const normalized = str.replace(/\./g, '').replace(/,/g, '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
};

export const coerceInteger = (value: any) => {
  const num = coerceNumber(value);
  return num !== null ? Math.trunc(num) : null;
};

export const parseStatusValue = (
  value: any,
  defaultStatus: 'Publish' | 'Inactive',
): 'Publish' | 'Inactive' | 'Draft' => {
  if (value === null || value === undefined || value === '') {
    return defaultStatus;
  }
  const str = stripDiacritics(String(value));
  if (['publish', 'published', 'active', '1', 'true'].includes(str)) return 'Publish';
  if (['inactive', 'draft', '0', 'false'].includes(str)) return 'Inactive';
  if (str === 'draft') return 'Draft';
  return defaultStatus;
};

export const parseStockValue = (value: any, fallback: boolean) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const str = stripDiacritics(String(value));
  if (
    ['in stock', 'true', '1', 'yes', 'stock', 'con hang', 'còn hàng', 'available', 'ready'].includes(str)
  )
    return true;
  if (
    ['out of stock', 'false', '0', 'no', 'het hang', 'hết hàng', 'sold out', 'empty'].includes(str)
  )
    return false;
  return fallback;
};

const buildCategoryPrefix = (categoryTitle: string) => {
  const categoryPrefixes: Record<string, string> = {
    'roasted coffee': 'RC',
    'coffee sets': 'CS',
    'coffee makers and grinders': 'CM',
    'cups & mugs': 'MG',
  };
  const lower = categoryTitle.toLowerCase().trim();
  if (categoryPrefixes[lower]) {
    return categoryPrefixes[lower];
  }
  const clean = categoryTitle.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (clean.length >= 3) return clean.slice(0, 3);
  if (clean.length === 2) return `${clean}X`;
  if (clean.length === 1) return `${clean}XX`;
  return 'CAT';
};

const ensureUniqueSku = (sku: string, existingSkus?: Set<string>) => {
  if (!sku || !existingSkus) return sku;
  let candidate = sku;
  let attempt = 1;
  while (existingSkus.has(candidate.toLowerCase())) {
    candidate = `${sku}-${attempt++}`;
  }
  existingSkus.add(candidate.toLowerCase());
  return candidate;
};

const LOCATION_CODES = ['TN', 'HC', 'PL', 'TCH'];
export const generateSkuForCategory = (categoryTitle: string, existingSkus?: Set<string>) => {
  const prefix = buildCategoryPrefix(categoryTitle);
  const location = LOCATION_CODES[Math.floor(Math.random() * LOCATION_CODES.length)];
  const number = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  let candidate = `${prefix}-${location}-${number}`;
  if (existingSkus) {
    candidate = ensureUniqueSku(candidate, existingSkus);
  }
  return candidate;
};

export const normalizeProductPayload = (
  item: any,
  normalizedKeys: Record<string, any>,
  index: number,
  categoryTitle: string,
  defaultStatus: 'Publish' | 'Inactive',
  existingSkus?: Set<string>,
  existingProduct?: any,
) => {
  let nameValue =
    item.name ||
    item.title ||
    normalizedKeys['name'] ||
    normalizedKeys['product name'] ||
    normalizedKeys['tên sản phẩm'] ||
    normalizedKeys['ten san pham'] ||
    normalizedKeys['product'] ||
    existingProduct?.name ||
    `Sản phẩm ${index + 1}`;
  if (typeof nameValue === 'string') {
    nameValue = nameValue.trim();
  }

  let skuValue = (item.sku || normalizedKeys['sku'] || existingProduct?.sku || '').toString().trim();
  if (!skuValue) {
    skuValue = generateSkuForCategory(categoryTitle, existingSkus);
  } else if (!existingProduct) {
    skuValue = ensureUniqueSku(skuValue, existingSkus);
  }

  const priceValue =
    coerceNumber(item.price) ??
    coerceNumber(normalizedKeys['price']) ??
    coerceNumber(normalizedKeys['giá']) ??
    coerceNumber(normalizedKeys['gia']);

  const quantityValue =
    coerceInteger(item.quantity) ??
    coerceInteger(normalizedKeys['quantity']) ??
    coerceInteger(normalizedKeys['số lượng']) ??
    coerceInteger(normalizedKeys['so luong']);

  const descriptionValue =
    item.description ||
    normalizedKeys['description'] ||
    normalizedKeys['mô tả'] ||
    normalizedKeys['mo ta'] ||
    existingProduct?.description ||
    '';

  const imageUrlValue =
    item.imageUrl ||
    item.image ||
    normalizedKeys['imageurl'] ||
    normalizedKeys['image'] ||
    existingProduct?.imageUrl ||
    '';

  const statusValue =
    item.status ||
    normalizedKeys['status'] ||
    normalizedKeys['trạng thái'] ||
    normalizedKeys['trang thai'];

  const existingQuantity = existingProduct ? coerceInteger(existingProduct.quantity) || 0 : 0;
  const finalQuantity =
    quantityValue !== null && quantityValue !== undefined ? quantityValue : existingQuantity;

  const stockValue =
    item.stock ?? normalizedKeys['stock'] ?? normalizedKeys['tồn kho'] ?? normalizedKeys['ton kho'];
  const parsedStock = parseStockValue(
    stockValue,
    existingProduct?.stock ??
      (finalQuantity !== null && finalQuantity !== undefined ? finalQuantity > 0 : true),
  );

  return {
    name: nameValue,
    sku: skuValue,
    description: descriptionValue,
    category: categoryTitle.trim(),
    price: priceValue !== null && priceValue !== undefined ? priceValue : Number(existingProduct?.price) || 0,
    quantity: Math.max(finalQuantity ?? 0, 0),
    status: parseStatusValue(statusValue, defaultStatus),
    stock: parsedStock,
    imageUrl: imageUrlValue,
  };
};

export const fetchAllProducts = async () => {
  const productRes = await ProductsApi.list({ limit: 1000, page: 1 } as any);
  return productRes?.data || productRes?.items || [];
};



