class ExportStrategy {
  /**
   * Export data to specific format
   * @param {Array} data - Data to export
   * @param {Object} options - Export options
   * @returns {string|Buffer} Exported data
   */
  async export(data, options = {}) {
    throw new Error('Export method must be implemented by subclass');
  }

  /**
   * Get content type for HTTP response
   */
  getContentType() {
    throw new Error('getContentType method must be implemented by subclass');
  }

  /**
   * Get file extension
   */
  getFileExtension() {
    throw new Error('getFileExtension method must be implemented by subclass');
  }
}

module.exports = ExportStrategy;
