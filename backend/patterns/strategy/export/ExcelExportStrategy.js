const ExportStrategy = require('./ExportStrategy');

class ExcelExportStrategy extends ExportStrategy {
  async export(data, options = {}) {
    const { sheetName = 'Sheet1' } = options;

    if (!data || data.length === 0) {
      return this._createEmptyExcel(sheetName);
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
      headers.map(header => item[header] || '').join('\t')
    );

    const excelContent = [
      headers.join('\t'),
      ...rows
    ].join('\n');

    return excelContent;
  }

  _createEmptyExcel(sheetName) {
    return `Sheet: ${sheetName}\nNo data available`;
  }

  getContentType() {
    return 'application/vnd.ms-excel';
  }

  getFileExtension() {
    return 'xls';
  }
}

module.exports = ExcelExportStrategy;
