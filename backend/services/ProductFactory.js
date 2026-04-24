class ProductFactory {
  static createProduct(type, payload = {}) {
    switch (type) {
      case 'coffee':
        return {
          category: 'coffee',
          name: payload.name || 'Cà phê đặc biệt',
          price: payload.price || 50000,
          stock: payload.stock !== undefined ? payload.stock : true,
          sku: payload.sku || `COF-${Date.now()}`,
          description: payload.description || 'Cà phê nguyên chất',
          variants: payload.variants || [],
          ...payload,
        };
      case 'accessory':
        return {
          category: 'accessory',
          name: payload.name || 'Phụ kiện',
          price: payload.price || 150000,
          stock: payload.stock !== undefined ? payload.stock : true,
          sku: payload.sku || `ACC-${Date.now()}`,
          description: payload.description || 'Phụ kiện đi kèm',
          variants: payload.variants || [],
          ...payload,
        };
      case 'combo':
        return {
          category: 'combo',
          name: payload.name || 'Combo',
          price: payload.price || 200000,
          stock: payload.stock !== undefined ? payload.stock : true,
          sku: payload.sku || `CMB-${Date.now()}`,
          description: payload.description || 'Combo tiết kiệm',
          variants: payload.variants || [],
          ...payload,
        };
      default:
        return {
          category: payload.category || 'general',
          name: payload.name || 'Sản phẩm chung',
          price: payload.price || 100000,
          stock: payload.stock !== undefined ? payload.stock : true,
          sku: payload.sku || `PRD-${Date.now()}`,
          description: payload.description || '',
          variants: payload.variants || [],
          ...payload,
        };
    }
  }
}

module.exports = ProductFactory;
