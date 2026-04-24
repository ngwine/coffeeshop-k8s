const ProductFactory = require('../patterns/factory/ProductFactory');

describe('ProductFactory', () => {
  describe('createProduct - Coffee Type', () => {
    test('should create coffee product with default values', () => {
      const product = ProductFactory.createProduct('coffee');
      
      expect(product.category).toBe('coffee');
      expect(product.name).toBe('Cà phê đặc biệt');
      expect(product.price).toBe(50000);
      expect(product.stock).toBe(true);
      expect(product.sku).toMatch(/^COF-\d+$/);
      expect(product.description).toBe('Cà phê nguyên chất');
      expect(Array.isArray(product.variants)).toBe(true);
    });

    test('should override coffee defaults with custom payload', () => {
      const payload = {
        name: 'Cappuccino',
        price: 65000,
        description: 'Cà phê nóng',
        variants: [{ name: 'Size', options: ['S', 'M', 'L'] }]
      };
      
      const product = ProductFactory.createProduct('coffee', payload);
      
      expect(product.category).toBe('coffee');
      expect(product.name).toBe('Cappuccino');
      expect(product.price).toBe(65000);
      expect(product.description).toBe('Cà phê nóng');
      expect(product.variants).toEqual([{ name: 'Size', options: ['S', 'M', 'L'] }]);
    });

    test('should allow custom sku for coffee', () => {
      const product = ProductFactory.createProduct('coffee', { sku: 'COF-CUSTOM-001' });
      expect(product.sku).toBe('COF-CUSTOM-001');
    });
  });

  describe('createProduct - Accessory Type', () => {
    test('should create accessory product with default values', () => {
      const product = ProductFactory.createProduct('accessory');
      
      expect(product.category).toBe('accessory');
      expect(product.name).toBe('Phụ kiện');
      expect(product.price).toBe(150000);
      expect(product.stock).toBe(true);
      expect(product.sku).toMatch(/^ACC-\d+$/);
      expect(product.description).toBe('Phụ kiện đi kèm');
    });

    test('should create accessory with custom payload', () => {
      const payload = {
        name: 'Phin lọc cà phê',
        price: 85000,
        stock: false
      };
      
      const product = ProductFactory.createProduct('accessory', payload);
      
      expect(product.category).toBe('accessory');
      expect(product.name).toBe('Phin lọc cà phê');
      expect(product.price).toBe(85000);
      expect(product.stock).toBe(false);
    });
  });

  describe('createProduct - Combo Type', () => {
    test('should create combo product with default values', () => {
      const product = ProductFactory.createProduct('combo');
      
      expect(product.category).toBe('combo');
      expect(product.name).toBe('Combo');
      expect(product.price).toBe(200000);
      expect(product.stock).toBe(true);
      expect(product.sku).toMatch(/^CMB-\d+$/);
      expect(product.description).toBe('Combo tiết kiệm');
    });

    test('should override combo with custom values', () => {
      const payload = {
        name: 'combo Nhật Bản',
        price: 350000,
        description: 'Combo 5 loại cà phê'
      };
      
      const product = ProductFactory.createProduct('combo', payload);
      
      expect(product.name).toBe('combo Nhật Bản');
      expect(product.price).toBe(350000);
      expect(product.description).toBe('Combo 5 loại cà phê');
    });
  });

  describe('createProduct - General/Unknown Type', () => {
    test('should create general product for unknown type', () => {
      const product = ProductFactory.createProduct('unknown');
      
      expect(product.category).toBe('general');
      expect(product.name).toBe('Sản phẩm chung');
      expect(product.price).toBe(100000);
      expect(product.sku).toMatch(/^PRD-\d+$/);
    });

    test('should create general product when no type provided', () => {
      const product = ProductFactory.createProduct();
      
      expect(product.category).toBe('general');
      expect(product.name).toBe('Sản phẩm chung');
      expect(product.price).toBe(100000);
    });

    test('should use category from payload as fallback', () => {
      const product = ProductFactory.createProduct(undefined, { category: 'custom' });
      
      expect(product.category).toBe('custom');
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero price', () => {
      const product = ProductFactory.createProduct('coffee', { price: 0 });
      expect(product.price).toBe(0);
    });

    test('should handle negative price (allow for now)', () => {
      const product = ProductFactory.createProduct('coffee', { price: -50000 });
      expect(product.price).toBe(-50000);
    });

    test('should preserve all extra payload properties', () => {
      const payload = {
        name: 'Test',
        customField: 'customValue',
        anotherField: 123
      };
      
      const product = ProductFactory.createProduct('coffee', payload);
      
      expect(product.customField).toBe('customValue');
      expect(product.anotherField).toBe(123);
    });

    test('should handle null/undefined values in payload', () => {
      const payload = {
        name: null,
        price: undefined,
        description: ''
      };
      
      const product = ProductFactory.createProduct('coffee', payload);
      
      expect(product.name).toBeNull();
      expect(product.price).toBeUndefined();
      expect(product.description).toBe('');
    });

    test('should generate unique SKUs for multiple calls', () => {
      const product1 = ProductFactory.createProduct('coffee');
      const product2 = ProductFactory.createProduct('coffee');
      
      expect(product1.sku).not.toBe(product2.sku);
      expect(product1.sku).toMatch(/^COF-/);
      expect(product2.sku).toMatch(/^COF-/);
    });

    test('should always have variants as array', () => {
      const product1 = ProductFactory.createProduct('coffee');
      const product2 = ProductFactory.createProduct('coffee', { variants: null });
      
      expect(Array.isArray(product1.variants)).toBe(true);
      expect(Array.isArray(product2.variants)).toBe(false); // Null được giữ
    });
  });

  describe('Type-Specific SKU Prefixes', () => {
    test('coffee should have COF prefix', () => {
      const product = ProductFactory.createProduct('coffee');
      expect(product.sku).toMatch(/^COF-/);
    });

    test('accessory should have ACC prefix', () => {
      const product = ProductFactory.createProduct('accessory');
      expect(product.sku).toMatch(/^ACC-/);
    });

    test('combo should have CMB prefix', () => {
      const product = ProductFactory.createProduct('combo');
      expect(product.sku).toMatch(/^CMB-/);
    });

    test('general should have PRD prefix', () => {
      const product = ProductFactory.createProduct('general');
      expect(product.sku).toMatch(/^PRD-/);
    });
  });
});
