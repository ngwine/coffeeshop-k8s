import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils as XLSXUtils, writeFile as writeXLSX } from 'xlsx';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export type ExportColumn<Row extends Record<string, any>> = {
  key: keyof Row;
  label: string;
};

const escapeCsvValue = (value: string | number) => {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportRowsAsCsv = <Row extends Record<string, any>>(rows: Row[], columns: ExportColumn<Row>[], filename: string) => {
  console.log("💾 [Strategy Pattern] Executing CSV Export algorithm...");
  const header = columns.map((col) => col.label).join(',');
  const body = rows.map((row) => columns.map((col) => escapeCsvValue(row[col.key])).join(','));
  const csvContent = [header, ...body].join('\r\n');
  downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), filename);
};

const exportRowsAsExcel = <Row extends Record<string, any>>(rows: Row[], columns: ExportColumn<Row>[], filename: string) => {
  console.log("💾 [Strategy Pattern] Executing Excel (XLSX) Export algorithm...");
  const worksheetData = [
    columns.map((col) => col.label),
    ...rows.map((row) => columns.map((col) => row[col.key])),
  ];
  const worksheet = XLSXUtils.aoa_to_sheet(worksheetData);
  const workbook = XLSXUtils.book_new();
  XLSXUtils.book_append_sheet(workbook, worksheet, 'Export');
  writeXLSX(workbook, filename);
};

const sanitizeForPdf = (value: unknown) => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/₫/g, 'VND');
};

const exportRowsAsPdf = <Row extends Record<string, any>>(rows: Row[], columns: ExportColumn<Row>[], filename: string) => {
  console.log("💾 [Strategy Pattern] Executing PDF Export algorithm (using jsPDF)...");
  const doc: any = new jsPDF({ orientation: 'landscape' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('Exported Data', 14, 18);
  autoTable(doc, {
    head: [columns.map((col) => sanitizeForPdf(col.label))],
    body: rows.map((row) => columns.map((col) => sanitizeForPdf(row[col.key]))),
    startY: 24,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  doc.save(filename);
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

export const exportRows = <Row extends Record<string, any>>(
  rows: Row[],
  columns: ExportColumn<Row>[],
  format: ExportFormat,
  baseFilename: string,
) => {
  const filename = `${baseFilename}-${timestamp()}.${format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'}`;
  
  console.log(`🎯 [Strategy Pattern] Selected Export Strategy: ${format.toUpperCase()}`);

  if (format === 'csv') {
    exportRowsAsCsv(rows, columns, filename);
  } else if (format === 'excel') {
    exportRowsAsExcel(rows, columns, filename);
  } else {
    exportRowsAsPdf(rows, columns, filename);
  }
};


