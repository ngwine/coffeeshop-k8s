const Review = require('../models/Review');
const Product = require('../models/Product');
const ProductFactory = require('../patterns/factory/ProductFactory');
/**
 * ProductController - Business logic layer cho Products
 * Xử lý HTTP requests và gọi Repository
 */
class ProductController {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  /**
   * GET /api/products/defaults?category=...
   * Lấy các biến thể mặc định của một category từ Factory
   */
  async getDefaults(req, res, next) {
    try {
      const { category } = req.query;
      if (!category) {
        return res.status(400).json({ success: false, message: 'Category is required' });
      }

      // 1. Kiểm tra cấu hình động từ Database trước (ưu tiên)
      const CategoryModel = require('../models/Category');
      const categoryDoc = await CategoryModel.findOne({ name: { $regex: `^${category}$`, $options: 'i' } }).lean();
      
      if (categoryDoc && categoryDoc.defaultVariants && categoryDoc.defaultVariants.length > 0) {
        return res.json({
          success: true,
          data: {
            category: categoryDoc.name,
            variants: categoryDoc.defaultVariants
          }
        });
      }

      // 2. 🔄 Nếu Database chưa có cấu hình, Fallback về Factory pattern
      const factoryProduct = ProductFactory.createProduct(category, {});
      
      return res.json({
        success: true,
        data: {
          category: factoryProduct.category,
          variants: factoryProduct.variants || []
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products - Lấy danh sách sản phẩm với filters và pagination
   */
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 12,
        search,
        category,
        inStock,
        status,
        minPrice,
        maxPrice,
        sortBy,
      } = req.query;

      const filters = {
        search,
        category,
        inStock,
        status,
        minPrice,
        maxPrice,
      };

      const pagination = {
        page: Math.max(parseInt(page, 10) || 1, 1),
        limit: Math.max(parseInt(limit, 10) || 12, 1),
      };

      const result = await this.productRepository.findPaginatedWithCategoryAttributes(
        filters,
        pagination,
        sortBy
      );

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id - Lấy chi tiết một sản phẩm
   */
  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const product = await this.productRepository.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // 🔄 Sử dụng Factory để lấy thông tin đặc trưng (Enrichment)
      console.log('\n' + '='.repeat(50));
      console.log('🏗️  [DEMO] FACTORY PATTERN IS TRIGGERED');
      console.log(`🔹 Requested Category: ${product.category}`);
      const factoryProduct = ProductFactory.createProduct(product.category, product);
      console.log('='.repeat(50) + '\n');

      const transformedProduct = {
        id: product.id || product._id,
        name: product.name,
        imageUrl: product.imageUrl,
        description: product.description,
        category: product.category,
        stock: product.stock,
        sku: product.sku,
        price: product.price,
        quantity: product.quantity,
        status: product.status,
        variants: product.variants || [],
        categorySpecialInfo: factoryProduct.getCategorySpecialInfo(),
      };

      res.json({
        success: true,
        data: transformedProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id/reviews - Lấy reviews của sản phẩm
   */
  async getReviews(req, res, next) {
    try {
      const { id } = req.params;
      let productIdNum = Number(id);

      if (Number.isNaN(productIdNum)) {
        const product = await Product.findById(id).select('id');
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found',
          });
        }
        productIdNum = product.id;
      }

      const reviews = await Review.find({ productId: productIdNum })
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products/:id/reviews - Tạo review
   */
  async createReview(req, res, next) {
    try {
      const { id } = req.params;
      let productIdNum = Number(id);

      if (Number.isNaN(productIdNum)) {
        const product = await Product.findById(id).select('id');
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found',
          });
        }
        productIdNum = product.id;
      }

      const { rating, comment, customerName, customerEmail, title } = req.body;

      // Validation
      if (rating != null) {
        if (rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5',
          });
        }
      }

      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Comment is required',
        });
      }

      if (
        !customerName ||
        !customerName.trim() ||
        !customerEmail ||
        !customerEmail.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'customerName and customerEmail are required',
        });
      }

      const reviewData = {
        productId: productIdNum,
        comment: comment.trim(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        title: (title || '').trim(),
      };

      if (rating != null) {
        reviewData.rating = rating;
      }

      const review = await Review.create(reviewData);

      // ✅ OBSERVER PATTERN: Broadcast review through ReviewObserver
      try {
        const ReviewObserver = require('../patterns/observer/ReviewObserver');
        const observer = ReviewObserver.getInstance();
        console.log(`🔔 [ReviewObserver] Detected NEW review for Product ID: ${productIdNum} (and string ID: ${id})`);
        
        // Broadcast đến cả ID URL (string) và ID number nội bộ
        observer.broadcastNewReview(id, review);
        if (String(id) !== String(productIdNum)) {
          observer.broadcastNewReview(productIdNum, review);
        }
      } catch (obsError) {
        console.warn('⚠️ [ProductController] Observer error:', obsError.message);
      }

      return res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products - Tạo sản phẩm mới (FACTORY PATTERN)
   * Client gửi: { type: 'coffee'|'accessory'|'combo', name, price?, ... }
   * Factory tự generate: SKU, default price, description, stock
   */
  async create(req, res, next) {
    try {
      const { type = 'general', ...payload } = req.body;

      // ⭐ SYNC CATEGORY: Tự động thêm vào bảng Category nếu chưa tồn tại
      if (payload.category) {
        const Category = require('../models/Category');
        const exists = await Category.findOne({ name: { $regex: `^${payload.category}$`, $options: 'i' } });
        if (!exists) {
            await Category.create({ name: payload.category });
            console.log(`✨ [AutoSync] New Category created: ${payload.category}`);
        }
      }

      // ⭐ FACTORY PATTERN: Delegate product creation to Factory
      console.log('\n' + '*'.repeat(50));
      console.log('🏭 [DEMO] FACTORY PATTERN: CREATING NEW PRODUCT');
      console.log(`🔹 Target Type: ${type}`);
      const factoryProduct = ProductFactory.createProduct(type, payload);
      console.log('*'.repeat(50) + '\n');


      // Auto-generate unique numeric ID (max existing + 1)
      const lastProduct = await Product.findOne().sort({ id: -1 }).select('id').lean();
      const nextId = (lastProduct?.id || 0) + 1;

      // Merge factory output with required model fields
      const productData = {
        ...factoryProduct,
        id: nextId,
        name: factoryProduct.name,
        category: factoryProduct.category,
        sku: factoryProduct.sku,
        price: Number(factoryProduct.price) || 0,
        quantity: Number(payload.quantity) || 0,
        imageUrl: payload.imageUrl || `https://placehold.co/400x400?text=${encodeURIComponent(factoryProduct.name)}`,
        stock: factoryProduct.stock !== undefined ? factoryProduct.stock : true,
        status: payload.status || 'Publish',
        uniqueAttributeValue: payload.uniqueAttributeValue || '',
        variants: (Array.isArray(payload.variants) && payload.variants.length > 0) 
                  ? payload.variants 
                  : (factoryProduct.variants || []),
      };

      console.log(`🏭 [ProductFactory] Created ${type} product: SKU=${productData.sku}, Name=${productData.name}`);

      const created = await this.productRepository.create(productData);

      return res.status(201).json({
        success: true,
        data: created,
        factory: { type, generatedSku: productData.sku },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/products/:id - Cập nhật sản phẩm
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Validate và clean data
      if (updateData.price) {
        updateData.price = Number(updateData.price);
      }
      if (updateData.quantity) {
        updateData.quantity = Number(updateData.quantity);
      }

      const updated = await this.productRepository.update(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      return res.json({
        success: true,
        data: updated,
        message: 'Product updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id - Xóa sản phẩm
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await this.productRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      return res.json({
        success: true,
        message: 'Product deleted successfully',
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
