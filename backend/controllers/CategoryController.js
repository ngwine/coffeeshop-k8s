/**
 * CategoryController - Business logic layer for Category operations
 */
class CategoryController {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  /**
   * GET /api/categories - Get all categories
   */
  async getAll(req, res, next) {
    try {
      const { withStats = false } = req.query;

      // ⭐ DATA INTEGRITY: Tự động đồng bộ các danh mục từ bảng Product sang bảng Category
      // khi truy cập danh sách (Đặc biệt hữu dụng cho dữ liệu Import)
      await this.categoryRepository.syncFromProducts();

      let categories;
      if (withStats === "true" || withStats === "1") {
        categories = await this.categoryRepository.getCategoriesWithCounts();
      } else {
        categories = await this.categoryRepository.getAllCategories();
      }

      return res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/:categoryName - Get products in category
   */
  async getByCategory(req, res, next) {
    try {
      const { categoryName } = req.params;
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
      const sort = req.query.sort || "-createdAt";

      // Check if category exists
      const exists = await this.categoryRepository.categoryExists(categoryName);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: `Category "${categoryName}" not found`,
        });
      }

      // Get category stats
      const stats = await this.categoryRepository.getCategoryStats(categoryName);

      // Get products
      const options = { page, limit, sort };
      const result = await this.categoryRepository.getByCategory(categoryName, options);

      return res.json({
        success: true,
        category: categoryName,
        stats,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/search/suggestions - Get category suggestions
   */
  async getSuggestions(req, res, next) {
    try {
      const { q = "", limit = 10 } = req.query;

      const suggestions = await this.categoryRepository.getCategorySuggestions(
        q,
        Math.min(parseInt(limit, 10) || 10, 50)
      );

      return res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/:categoryName/search - Search within category
   */
  async search(req, res, next) {
    try {
      const { categoryName } = req.params;
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Missing search query 'q'",
        });
      }

      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
      const sort = req.query.sort || "-createdAt";

      const options = { page, limit, sort };
      const result = await this.categoryRepository.searchInCategory(
        categoryName,
        q,
        options
      );

      return res.json({
        success: true,
        category: categoryName,
        query: q,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/categories - Tạo danh mục mới kèm thuộc tính riêng
   */
  async create(req, res, next) {
    try {
      const { name, description, isActive, defaultVariants } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Missing 'name' in request body",
        });
      }

      // Kiểm tra trùng tên
      const exists = await this.categoryRepository.categoryExists(name);
      if (exists) {
        return res.status(409).json({
          success: false,
          message: `Category "${name}" already exists`,
        });
      }

      const category = await this.categoryRepository.createCategory({
        name: name.trim(),
        description: description || "",
        isActive: isActive !== undefined ? isActive : true,
        defaultVariants: defaultVariants || []
      });

      return res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/categories/:categoryName - Cập nhật danh mục
   */
  async update(req, res, next) {
    try {
      console.log('🚀 [Debug] CategoryController.update called with:', {
        categoryName: req.params.categoryName,
        body: req.body
      });
      const { categoryName } = req.params;
      const rawBody = req.body;

      // Chuẩn hóa payload: chấp nhận cả 'name' và 'newName' (backward compatibility)
      const updateData = { ...rawBody };
      if (!updateData.name && updateData.newName) {
        updateData.name = updateData.newName;
      }
      delete updateData.newName; // loại bỏ trường dư thừa

      // 1. Kiểm tra danh mục cũ có tồn tại không
      const exists = await this.categoryRepository.categoryExists(categoryName);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: `Category "${categoryName}" not found`,
        });
      }

      // 2. Nếu thay đổi tên, kiểm tra trùng tên mới
      if (updateData.name && updateData.name.trim() !== categoryName) {
        const newExists = await this.categoryRepository.categoryExists(updateData.name.trim());
        if (newExists) {
          return res.status(409).json({
            success: false,
            message: `Category "${updateData.name.trim()}" already exists`,
          });
        }
      }

      // 3. Thực hiện cập nhật
      const result = await this.categoryRepository.updateCategory(categoryName, updateData);

      return res.json({
        success: true,
        message: `Category "${categoryName}" updated successfully`,
        data: {
          originalName: categoryName,
          updatedData: updateData,
          modifiedProductCount: result.modifiedCount || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/categories/:categoryName - Delete category and all products
   */
  async delete(req, res, next) {
    try {
      const { categoryName } = req.params;

      // Check if category exists
      const exists = await this.categoryRepository.categoryExists(categoryName);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: `Category "${categoryName}" not found`,
        });
      }

      // Delete category
      const result = await this.categoryRepository.deleteCategory(categoryName);

      return res.json({
        success: true,
        message: `Category "${categoryName}" and all products deleted`,
        data: {
          deletedCount: result.deletedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoryController;
