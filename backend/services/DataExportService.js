/**
 * Data Export Service - Strategy Pattern Context
 * Updated to use split strategy files
 */

const ExportStrategy = require('../patterns/strategy/export/ExportStrategy');
const ExportStrategyFactory = require('../patterns/strategy/export/ExportStrategyFactory');

class DataExportService {
  constructor() {
    this.strategies = new Map();
  }

  /**
   * Register a custom export strategy
   * @param {string} format 
   * @param {ExportStrategy} strategy 
   */
  registerStrategy(format, strategy) {
    if (!(strategy instanceof ExportStrategy)) {
      throw new Error('Strategy must extend ExportStrategy');
    }
    this.strategies.set(format.toLowerCase(), strategy);
  }

  /**
   * Export data using specified format
   */
  async exportData(data, format, options = {}) {
    const formattedFormat = format.toLowerCase();
    
    // Check if strategy is registered, otherwise use factory
    let strategy = this.strategies.get(formattedFormat);
    
    if (!strategy) {
      strategy = ExportStrategyFactory.createStrategy(formattedFormat);
    }

    const exportedData = await strategy.export(data, options);

    return {
      data: exportedData,
      contentType: strategy.getContentType(),
      fileExtension: strategy.getFileExtension(),
      format: formattedFormat
    };
  }

  /**
   * Get supported formats
   */
  getSupportedFormats() {
    const factoryFormats = ExportStrategyFactory.getSupportedFormats();
    const customFormats = Array.from(this.strategies.keys());
    return [...new Set([...factoryFormats, ...customFormats])];
  }
}

module.exports = {
  DataExportService,
  ExportStrategy // Re-export for potential custom strategy registration
};