/**
 * backend/patterns/observer/CategoryNameObserver.js
 * 👁️ CONCRETE OBSERVER - Handles product updates when a category is renamed
 */
const ProductModel = require('../../models/Product');

class CategoryNameObserver {
  /**
   * Called when a category is renamed
   * @param {Object} data - { oldName, newName }
   */
  async update(data) {
    const { oldName, newName } = data;
    
    if (!oldName || !newName || oldName === newName) return;

    console.log(`📡 [CategoryNameObserver] Rename event received: "${oldName}" -> "${newName}"`);
    
    try {
      // Perform the update on the Product collection
      const result = await ProductModel.updateMany(
        { category: oldName },
        { category: newName }
      );
      
      console.log(`✅ [CategoryNameObserver] Success: Updated ${result.modifiedCount} products.`);
    } catch (error) {
      console.error(`❌ [CategoryNameObserver] Failed to update products:`, error.message);
    }
  }
}

module.exports = CategoryNameObserver;
