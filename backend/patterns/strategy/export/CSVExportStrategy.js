const ExportStrategy = require('./ExportStrategy');

class CSVExportStrategy extends ExportStrategy {
  async export(data, options = {}) {
    const { headers = [], delimiter = ',' } = options;

    if (!data || data.length === 0) {
      return '';
    }

    // Auto-detect headers if not provided
    const csvHeaders = headers.length > 0 ? headers : Object.keys(data[0]);

    // Convert data to CSV rows
    const rows = data.map(item => {
      return csvHeaders.map(header => {
        const value = item[header] || '';
        // Escape quotes and wrap in quotes if contains delimiter or quotes
        const stringValue = String(value);
        if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
    });

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(delimiter),
      ...rows.map(row => row.join(delimiter))
    ].join('\n');

    return csvContent;
  }

  getContentType() {
    return 'text/csv';
  }

  getFileExtension() {
    return 'csv';
  }
}

module.exports = CSVExportStrategy;
