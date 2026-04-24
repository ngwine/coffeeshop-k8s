/**
 * CategoryRepository - REPOSITORY PATTERN
 * Phân tách hoàn toàn logic truy cập dữ liệu cho Category và đồng bộ với Product.
 */

const MongooseRepositoryAdapter = require('../adapter/MongooseRepositoryAdapter');
const ProductModel = require('../../models/Product');
const CategoryModel = require('../../models/Category');
const Observer = require('../observer/Observer');
const CategoryNameObserver = require('../observer/CategoryNameObserver');

// 📋 Danh sách danh mục chuẩn theo giao diện (Organize Dropdown)
const MASTER_CATEGORIES = [
  'Roasted coffee',
  'Coffee sets',
  'Cups & Mugs',
  'Coffee makers and grinders'
];

class CategoryRepository {
  constructor() {
    // Adapter cho bảng Product (dùng để xóa/cập nhật sản phẩm theo category)
    this.productAdapter = new MongooseRepositoryAdapter(ProductModel);
    
    // Adapter cho bảng Category (dùng để quản lý danh mục độc lập)
    this.categoryAdapter = new MongooseRepositoryAdapter(CategoryModel);

    // 🔔 OBSERVER PATTERN: Setup notification system
    this.nameChangeObserver = new Observer();
    const nameObserver = new CategoryNameObserver();
    
    // Subscribe the concrete observer's update method
    this.nameChangeObserver.subscribe(data => nameObserver.update(data));
  }

  /**
   * ✅ Tự động đồng bộ danh mục từ bảng Product sang bảng Category
   */
  async syncFromProducts() {
    try {
      // 1. Thu thập tên từ bảng Product
      const pipeline = [
        { $match: { category: { $exists: true, $ne: "" } } },
        { $group: { _id: "$category" } }
      ];
      const results = await this.productAdapter.aggregate(pipeline);
      const productCategories = results.map(r => r._id).filter(Boolean);

      // 2. Kết hợp với danh sách MASTER_CATEGORIES để đảm bảo luôn đủ bộ
      const combinedTargets = Array.from(new Set([...productCategories, ...MASTER_CATEGORIES]));
      
      console.log(`🔍 [CategorySync] Total targets to ensure: ${combinedTargets.length}`);

      // 3. Lấy danh sách hiện có để đối chiếu
      const existingRes = await this.categoryAdapter.find({}, { limit: 1000 });
      const existingNames = new Set(existingRes.data.map(c => c.name.toLowerCase().trim()));

      // 4. Khai sinh những danh mục còn thiếu
      let count = 0;
      for (const name of combinedTargets) {
        if (!existingNames.has(name.toLowerCase().trim())) {
          await this.categoryAdapter.create({ 
            name: name.trim(), 
            isActive: true,
            description: `Standard system category`
          });
          count++;
        }
      }

      if (count > 0) console.log(`✅ [CategorySync] Synced ${count} categories.`);
      return count;
    } catch (error) {
      console.error('❌ [CategorySync] Error:', error.message);
      return 0;
    }
  }

  /**
   * ✅ Lấy tất cả danh mục (Hợp nhất từ bảng Category và bảng Product)
   * Đảm bảo dữ liệu không bao giờ bị mất (Data Robustness)
   */
  async getAllCategories() {
    // 1. Lấy từ bảng Category chính thức
    const res = await this.categoryAdapter.find({}, { sort: 'name', limit: 1000 });
    const officialNames = res.data.map(cat => cat.name);

    // 2. Quét thêm từ bảng Product để tránh bỏ sót (Fallback)
    const pipeline = [{ $group: { _id: '$category' } }];
    const productResults = await this.productAdapter.aggregate(pipeline);
    const productNames = productResults.map(r => r._id).filter(Boolean);

    // 3. Ghép, chuẩn hóa và loại bỏ trùng lặp
    const allNames = new Set([...officialNames, ...productNames]);
    return Array.from(allNames).sort((a, b) => a.localeCompare(b));
  }

  /**
   * ✅ Lấy danh sách danh mục kèm thống kê (Hợp nhất dữ liệu)
   */
  async getCategoriesWithCounts() {
    try {
      // 1. Lấy tất cả tên danh mục (đã hợp nhất)
      const allCategoryNames = await this.getAllCategories();
      console.log(`📡 [CategoryRepo] Merged names for listing:`, allCategoryNames);
      
      // 2. Đếm số sản phẩm (Bọc try-catch riêng để tránh lỗi aggregate làm chết cả hàm)
      let countMap = new Map();
      try {
        const pipeline = [
          { $match: { category: { $exists: true, $ne: "" } } },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ];
        const productCounts = await this.productAdapter.aggregate(pipeline);
        countMap = new Map(productCounts.map(doc => [doc._id?.toString().toLowerCase().trim() || '', doc.count]));
      } catch (countErr) {
        console.warn('⚠️ [CategoryRepo] Could not count products, defaulting to 0:', countErr.message);
      }

      // 3. Lấy thông tin chi tiết từ bảng Category (để lấy description, imageUrl)
      let officialMap = new Map();
      try {
        const officialCats = await this.categoryAdapter.find({}, { limit: 1000 });
        officialMap = new Map(officialCats.data.map(c => [c.name.toLowerCase().trim(), c]));
      } catch (offErr) {
        console.warn('⚠️ [CategoryRepo] Could not fetch official category details:', offErr.message);
      }

      // 4. Gom dữ liệu cuối cùng - Ưu tiên hiển thị Tên dù không có stats
      return allCategoryNames.map(name => {
          const lowerName = name.trim().toLowerCase();
          const officialInfo = officialMap.get(lowerName);
          
          return {
            id: officialInfo?._id || officialInfo?.id || `virtual-${name}`,
            name: name.trim(),
            count: countMap.get(lowerName) || 0,
            description: officialInfo ? (officialInfo.description || "") : 'Auto-detected from products',
            status: officialInfo ? (officialInfo.isActive === false ? 'Inactive' : 'Active') : 'Active',
            defaultVariants: officialInfo ? (officialInfo.defaultVariants || []) : []
          };
      });
    } catch (globalErr) {
      console.error('❌ [CategoryRepo] Global error in getCategoriesWithCounts:', globalErr.message);
      throw globalErr;
    }
  }

  /**
   * ✅ Gợi ý danh mục (Dropdown Sync) - Đã sửa tên hàm và bỏ giới hạn 10
   */
  async getCategorySuggestions(searchTerm, limit = 100) {
    let result;
    if (searchTerm) {
      // Truy vấn trực tiếp bằng Mongoose để dùng $regex chuẩn
      const CategoryModel = require('../../models/Category');
      const docs = await CategoryModel.find({ name: { $regex: searchTerm, $options: 'i' } }).limit(limit).lean();
      return docs.map(cat => cat.name);
    }
    result = await this.categoryAdapter.find({}, { limit });
    return result.data.map(cat => cat.name);
  }

  /**
   * ✅ Thêm danh mục mới (Standalone)
   */
  async createCategory(catData) {
    return await this.categoryAdapter.create(catData);
  }

  /**
   * ✅ Cập nhật danh mục (Đồng bộ cả bảng Product)
   */
  async updateCategory(oldName, updateData) {
    const { name, isActive, uniqueAttributeName, description, defaultVariants } = updateData;
    
    // 1. Chuẩn bị dữ liệu cập nhật cho bản ghi Category
    const categoryUpdate = {};
    if (name !== undefined) categoryUpdate.name = name.trim();
    if (isActive !== undefined) categoryUpdate.isActive = isActive;
    if (description !== undefined) categoryUpdate.description = description;
    if (defaultVariants !== undefined) categoryUpdate.defaultVariants = defaultVariants;

    // 2. Cập nhật trong bảng Category
    await this.categoryAdapter.update({ name: oldName }, categoryUpdate);
    
    // 3. 🔔 OBSERVER PATTERN: Nếu tên thay đổi, thông báo cho các observer (Ví dụ: CategoryNameObserver để cập nhật sản phẩm)
    if (name && name.trim() !== oldName) {
      this.nameChangeObserver.notify({ 
        oldName, 
        newName: name.trim() 
      });
      return { modifiedCount: 'Sent to Observer' };
    }
    
    return { modifiedCount: 1 };
  }

  /**
   * ✅ Xóa danh mục và sản phẩm liên quan
   */
  async deleteCategory(categoryName) {
    // 1. Xóa trong bảng Category
    await this.categoryAdapter.delete({ name: categoryName });
    
    // 2. Xóa toàn bộ sản phẩm thuộc category này
    return await this.productAdapter.delete({ category: categoryName });
  }

  async categoryExists(name) {
    // Dùng Mongoose trực tiếp để tránh lỗi Cast to string khi dùng _regex qua adapter
    const CategoryModel = require('../../models/Category');
    const doc = await CategoryModel.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } }).lean();
    return !!doc;
  }

  async getByCategory(categoryName, options = {}) {
    const criteria = { category: categoryName };
    return await this.productAdapter.find(criteria, options);
  }
}

module.exports = CategoryRepository;
