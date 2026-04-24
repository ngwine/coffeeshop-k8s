const CSVExportStrategy = require('./CSVExportStrategy');
const ExcelExportStrategy = require('./ExcelExportStrategy');
const PDFExportStrategy = require('./PDFExportStrategy');

class ExportStrategyFactory {
  static #instances = new Map();

  /**
   * Factory method to create export strategies based on format.
   * Only CSV, Excel, and PDF are supported.
   * 
   * Uses Caching (Flyweight-like) to reuse stateless strategy instances.
   * 
   * @param {string} format - The file format (csv, excel, pdf)
   * @returns {ExportStrategy} The selected strategy instance
   */
  static createStrategy(format) {
    if (!format) {
      throw new Error('Export format is required');
    }

    const normalizedFormat = format.toLowerCase() === 'xls' ? 'excel' : format.toLowerCase();
    
    // Check Cache first
    if (ExportStrategyFactory.#instances.has(normalizedFormat)) {
      return ExportStrategyFactory.#instances.get(normalizedFormat);
    }

    let strategy;
    switch (normalizedFormat) {
      case 'csv':
        strategy = new CSVExportStrategy();
        break;

      case 'excel':
        strategy = new ExcelExportStrategy();
        break;

      case 'pdf':
        strategy = new PDFExportStrategy();
        break;

      default:
        throw new Error(`Unsupported export format: ${format}. Supported: CSV, Excel, PDF.`);
    }

    // Save to Cache
    ExportStrategyFactory.#instances.set(normalizedFormat, strategy);
    console.log(`💾 [ExportFactory] Cached new instance for: ${normalizedFormat}`);
    
    return strategy;
  }

  /**
   * Get all supported export formats.
   * @returns {string[]} List of supported formats.
   */
  static getSupportedFormats() {
    return ['csv', 'excel', 'pdf'];
  }
}

module.exports = ExportStrategyFactory;

