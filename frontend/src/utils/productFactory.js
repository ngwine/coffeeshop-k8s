export function createProduct(type, payload = {}) {
  switch (type) {
    case 'coffee':
      return {
        category: 'coffee',
        name: payload.name || 'Cà phê mới',
        price: payload.price ?? 50000,
        stock: payload.stock ?? true,
        sku: payload.sku || `COF-${Date.now()}`,
        description: payload.description || 'Cà phê nguyên chất',
        variants: payload.variants || [],
        ...payload,
      };
    case 'accessory':
      return {
        category: 'accessory',
        name: payload.name || 'Phụ kiện',
        price: payload.price ?? 120000,
        stock: payload.stock ?? true,
        sku: payload.sku || `ACC-${Date.now()}`,
        description: payload.description || 'Phụ kiện đi kèm',
        variants: payload.variants || [],
        ...payload,
      };
    case 'combo':
      return {
        category: 'combo',
        name: payload.name || 'Combo ưu đãi',
        price: payload.price ?? 220000,
        stock: payload.stock ?? true,
        sku: payload.sku || `CMB-${Date.now()}`,
        description: payload.description || 'Combo tiết kiệm',
        variants: payload.variants || [],
        ...payload,
      };
    default:
      return {
        category: payload.category || 'general',
        name: payload.name || 'Sản phẩm',
        price: payload.price ?? 100000,
        stock: payload.stock ?? true,
        sku: payload.sku || `PRD-${Date.now()}`,
        description: payload.description || '',
        variants: payload.variants || [],
        ...payload,
      };
  }
}
