 /**
 * ProductRepository - PURE VERSION
 * Organized into patterns/repository
 */

const MongooseRepositoryAdapter = require('../adapter/MongooseRepositoryAdapter');
const ProductFactory = require('../factory/ProductFactory');

class ProductRepository {
  constructor(ProductModel) {
    const Model = ProductModel || require('../../models/Product');
    this.adapter = new MongooseRepositoryAdapter(Model);
    this.model = Model;
  }

  async findPaginated(filters, pagination, sortBy) {
    const { page = 1, limit = 12 } = pagination;
    const criteria = this._buildCriteria(filters);
    const sort = this._buildSort(sortBy);

    const result = await this.adapter.find(criteria, { page, limit, sort });
    const soldStats = await this._getSoldStatsViaAdapter();
    
    const soldMap = new Map(
      soldStats.map((doc) => [String(doc._id), Number(doc.soldCount) || 0])
    );

    const productsWithSold = result.data.map((p) => {
      const keyByNumericId = p.id != null ? String(p.id) : null;
      const keyByObjectId = p._id != null ? String(p._id) : null;

      return {
        ...p,
        id: p.id || p._id,
        soldCount:
          (keyByNumericId && soldMap.get(keyByNumericId)) ??
          (keyByObjectId && soldMap.get(keyByObjectId)) ??
          0,
      };
    });

    return {
      data: productsWithSold,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.pages,
      },
    };
  }

  /**
   * ✅ Lấy danh sách sản phẩm kèm theo tên thuộc tính riêng từ Category (Enrichment)
   * Di chuyển logic từ Controller vào Repository để tuân thủ mẫu thiết kế.
   */
  async findPaginatedWithCategoryAttributes(filters, pagination, sortBy) {
    const result = await this.findPaginated(filters, pagination, sortBy);
    
    try {
      const CategoryModel = require('../../models/Category');
      const categories = await CategoryModel.find({}).lean();
      const catMap = new Map(categories.map(c => [c.name?.toLowerCase().trim(), c]));

      result.data = result.data.map(p => {
        const cat = catMap.get((p.category || '').toLowerCase().trim());
        
        // 🔄 Sử dụng Factory để tạo instance và lấy thông tin đặc trưng
        const factoryProduct = ProductFactory.createProduct(p.category, p);
        
        return {
          ...p,
          categorySpecialInfo: factoryProduct.getCategorySpecialInfo() // Dữ liệu động từ Factory
        };
      });
    } catch (e) {
      console.error('⚠️ [ProductRepo] Enrichment failed:', e.message);
    }

    return result;
  }

  /**
   * @param {string} id
   */
  async findById(id) {
    if (id === 'defaults') return null; // Early return for special routes

    let product;
    try {
      // 1. Try finding by Mongo ObjectId
      product = await this.adapter.findById(id);
      if (product) return product;
    } catch (e) {
      console.log(`⚠️ [ProductRepo] findById(ObjectId) skip for ${id}`);
    }

    const nId = Number(id);
    if (!Number.isNaN(nId)) {
      // 2. Try finding by numeric id
      try {
        product = await this.adapter.findOne({ id: nId });
        if (product) return product;
      } catch (e) {
        console.error(`❌ [ProductRepo] findOne(numeric) error for ${nId}:`, e.message);
      }

      // 3. Fallback to string id check
      try {
        product = await this.adapter.findOne({ id: String(id) });
      } catch (e) {}
    }

    return product;
  }

  async create(productData) {
    return await this.adapter.create({
      ...productData,
      createdAt: new Date(),
    });
  }

  /**
   * @param {string} id
   */
  async update(id, updateData) {
    const product = await this.findById(id);
    if (!product) return null;

    const validated = {
      ...updateData,
      updatedAt: new Date(),
    };

    return await this.adapter.update(product._id, validated);
  }

  /**
   * @param {string} id
   */
  async delete(id) {
    const product = await this.findById(id);
    if (!product) return false;
    return await this.adapter.delete(product._id);
  }

  async findByCategory(category, options = {}) {
    const criteria = this._buildCategoryFilter(category);
    return await this.adapter.find(criteria, options);
  }

  async search(searchTerm, options = {}) {
    const criteria = this._buildSearchCriteria(searchTerm);
    return await this.adapter.find(criteria, options);
  }

  _buildCriteria(filters = {}) {
    const criteria = {};
    if (filters.category) criteria.category = filters.category;
    if (filters.minPrice || filters.maxPrice) {
      criteria._priceRange = {
        min: filters.minPrice,
        max: filters.maxPrice,
      };
    }
    if (filters.inStock) criteria.stock = { _gt: 0 };
    if (filters.minRating) criteria._minRating = filters.minRating;
    return criteria;
  }

  _buildSort(sortBy = 'newest') {
    const sorts = {
      newest: '-createdAt',
      oldest: 'createdAt',
      priceAsc: 'price',
      priceDesc: '-price',
      nameAsc: 'name',
      nameDesc: '-name',
    };
    return sorts[sortBy] || '-createdAt';
  }

  _buildCategoryFilter(category) {
    return {
      category: { _regex: category, _options: 'i' },
    };
  }

  _buildSearchCriteria(searchTerm) {
    return {
      _searchFields: ['name', 'description'],
      _searchTerm: searchTerm,
    };
  }

  async _getSoldStatsViaAdapter() {
    const pipeline = [
      {
        $group: {
          _id: '$id',
          soldCount: { $sum: { $cond: ['$soldCount', '$soldCount', 0] } },
        },
      },
    ];
    return await this.adapter.aggregate(pipeline);
  }
}

module.exports = ProductRepository;
