declare module 'jspdf' {
  export default class jsPDF {
    constructor(options?: any);
    text(text: string, x: number, y: number): void;
    setFontSize(size: number): void;
    save(filename: string): void;
  }
}

declare module 'jspdf-autotable' {
  const autoTable: (doc: any, options: any) => void;
  export default autoTable;
}

declare module 'xlsx' {
  export const utils: {
    aoa_to_sheet(data: any[][]): any;
    book_new(): any;
    book_append_sheet(workbook: any, worksheet: any, name?: string): void;
  };
  export function writeFile(workbook: any, filename: string): void;
}

















