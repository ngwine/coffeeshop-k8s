import { createProduct } from '../productFactory';

describe('productFactory (Frontend)', () => {
  describe('createProduct - Coffee Type', () => {
    test('should create coffee product with default values', () => {
      const product = createProduct('coffee');

      expect(product.category).toBe('coffee');
      expect(product.name).toBe('Cà phê mới');
      expect(product.price).toBe(50000);
      expect(product.stock).toBe(true);
      expect(product.sku).toMatch(/^COF-\d+$/);
      expect(product.description).toBe('Cà phê nguyên chất');
      expect(Array.isArray(product.variants)).toBe(true);
    });

    test('should override defaults with custom payload', () => {
      const payload = {
        name: 'Espresso Đôi',
        price: 45000,
        description: 'Espresso đậm đà',
        variants: [{ name: 'Độ nóng', options: ['Nóng', 'Lạnh'] }]
      };

      const product = createProduct('coffee', payload);

      expect(product.name).toBe('Espresso Đôi');
      expect(product.price).toBe(45000);
      expect(product.description).toBe('Espresso đậm đà');
      expect(product.variants[0].name).toBe('Độ nóng');
    });

    test('should allow custom sku', () => {
      const product = createProduct('coffee', { sku: 'COFFEE-SIGNATURE' });
      expect(product.sku).toBe('COFFEE-SIGNATURE');
    });

    test('should handle falsy price values (0)', () => {
      const product = createProduct('coffee', { price: 0 });
      expect(product.price).toBe(0);
    });
  });

  describe('createProduct - Accessory Type', () => {
    test('should create accessory with defaults', () => {
      const product = createProduct('accessory');

      expect(product.category).toBe('accessory');
      expect(product.name).toBe('Phụ kiện');
      expect(product.price).toBe(120000);
      expect(product.stock).toBe(true);
      expect(product.sku).toMatch(/^ACC-\d+$/);
    });

    test('should customize accessory', () => {
      const payload = {
        name: 'Ly sứ cao cấp',
        price: 95000,
        stock: false,
        description: 'Ly sứ Nhật Bản'
      };

      const product = createProduct('accessory', payload);

      expect(product.name).toBe('Ly sứ cao cấp');
      expect(product.price).toBe(95000);
      expect(product.stock).toBe(false);
    });
  });

  describe('createProduct - Combo Type', () => {
    test('should create combo with defaults', () => {
      const product = createProduct('combo');

      expect(product.category).toBe('combo');
      expect(product.name).toBe('Combo ưu đãi');
      expect(product.price).toBe(220000);
      expect(product.sku).toMatch(/^CMB-\d+$/);
    });

    test('should customize combo', () => {
      const payload = {
        name: 'Combo Sáng',
        price: 180000,
        description: 'Combo cà phê + bánh'
      };

      const product = createProduct('combo', payload);

      expect(product.name).toBe('Combo Sáng');
      expect(product.price).toBe(180000);
      expect(product.description).toBe('Combo cà phê + bánh');
    });
  });

  describe('createProduct - Default/Unknown Type', () => {
    test('should create general product for unknown type', () => {
      const product = createProduct('unknown_type');

      expect(product.category).toBe('general');
      expect(product.name).toBe('Sản phẩm');
      expect(product.price).toBe(100000);
      expect(product.sku).toMatch(/^PRD-\d+$/);
    });

    test('should handle undefined type', () => {
      const product = createProduct();

      expect(product.category).toBe('general');
      expect(product.name).toBe('Sản phẩm');
    });

    test('should use payload category as fallback', () => {
      const product = createProduct(null, { category: 'special' });

      expect(product.category).toBe('special');
    });
  });

  describe('Nullish Coalescing (??)', () => {
    test('should use default when price is 0 (falsy but valid)', () => {
      const product = createProduct('coffee', { price: 0 });
      expect(product.price).toBe(0);
    });

    test('should use default when price is undefined', () => {
      const product = createProduct('coffee', { price: undefined });
      expect(product.price).toBe(50000);
    });

    test('should use default when stock is false (falsy but valid)', () => {
      const product = createProduct('coffee', { stock: false });
      expect(product.stock).toBe(false);
    });

    test('should use default when stock is undefined', () => {
      const product = createProduct('coffee', { stock: undefined });
      expect(product.stock).toBe(true);
    });
  });

  describe('Edge Cases & Spread Operator', () => {
    test('should merge payload spread correctly', () => {
      const payload = {
        name: 'Custom',
        customProp: 'customValue',
        nested: { key: 'value' }
      };

      const product = createProduct('coffee', payload);

      expect(product.name).toBe('Custom');
      expect(product.customProp).toBe('customValue');
      expect(product.nested).toEqual({ key: 'value' });
    });

    test('should handle empty payload', () => {
      const product = createProduct('coffee', {});

      expect(product.name).toBe('Cà phê mới');
      expect(product.price).toBe(50000);
      expect(product.category).toBe('coffee');
    });

    test('should generate unique SKUs on multiple calls', () => {
      const product1 = createProduct('coffee');
      const product2 = createProduct('coffee');

      expect(product1.sku).not.toBe(product2.sku);
      expect(product1.sku).toMatch(/^COF-\d+$/);
      expect(product2.sku).toMatch(/^COF-\d+$/);
    });

    test('should always return variants as array (unless overridden to null)', () => {
      const product1 = createProduct('coffee');
      expect(Array.isArray(product1.variants)).toBe(true);

      const product2 = createProduct('coffee', { variants: null });
      expect(product2.variants).toBeNull();
    });
  });

  describe('Type-Specific Defaults', () => {
    test('coffee has correct default price', () => {
      const product = createProduct('coffee');
      expect(product.price).toBe(50000);
    });

    test('accessory has correct default price', () => {
      const product = createProduct('accessory');
      expect(product.price).toBe(120000);
    });

    test('combo has correct default price', () => {
      const product = createProduct('combo');
      expect(product.price).toBe(220000);
    });

    test('general has correct default price', () => {
      const product = createProduct('general');
      expect(product.price).toBe(100000);
    });
  });

  describe('SKU Generation', () => {
    test('SKU should contain timestamp', () => {
      const before = Date.now();
      const product = createProduct('coffee');
      const after = Date.now();

      const sku = product.sku;
      const timestamp = parseInt(sku.split('-')[1]);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    test('multiple products should have different SKUs', () => {
      const products = [];
      for (let i = 0; i < 5; i++) {
        products.push(createProduct('coffee'));
      }

      const skus = products.map(p => p.sku);
      const uniqueSkus = new Set(skus);

      expect(uniqueSkus.size).toBe(5);
    });
  });

  describe('Backward Compatibility', () => {
    test('should handle old-style payload (flat properties)', () => {
      const oldPayload = {
        name: 'Legacy Product',
        price: 75000,
        description: 'Old format'
      };

      const product = createProduct('coffee', oldPayload);

      expect(product.name).toBe('Legacy Product');
      expect(product.price).toBe(75000);
      expect(product.description).toBe('Old format');
    });

    test('should maintain factory pattern consistency', () => {
      const type = 'coffee';
      const payload = { name: 'Test' };

      const p1 = createProduct(type, payload);
      const p2 = createProduct(type, payload);

      // Same type, different SKU, same other properties
      expect(p1.name).toBe(p2.name);
      expect(p1.category).toBe(p2.category);
      expect(p1.sku).not.toBe(p2.sku);
    });
  });
});
