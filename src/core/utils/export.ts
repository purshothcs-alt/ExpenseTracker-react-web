import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveBlob } from './saveFile';

export interface ExportColumn<T> {
  header: string;
  key: keyof T;
  format?: (val: T[keyof T], row: T) => string;
  width?: number;
}

// jsPDF's built-in fonts only cover Latin characters; anything else (the rupee sign,
// the dirham sign) is printed as garbage, so currency symbols are spelled out.
const PDF_TEXT_REPLACEMENTS: Array<[string, string]> = [
  ['₹', 'Rs. '],
  ['د.إ', 'AED '],
];

function pdfSafe(text: string): string {
  return PDF_TEXT_REPLACEMENTS.reduce((t, [from, to]) => t.split(from).join(to), text).replace(
    /\s{2,}/g,
    ' ',
  );
}

export function exportToPDF<T extends object>(
  title: string,
  columns: ExportColumn<T>[],
  data: T[],
  filename = 'report',
): Promise<boolean> {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(pdfSafe(title), 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      return pdfSafe(col.format ? col.format(val, row) : String(val ?? ''));
    }),
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  return saveBlob(doc.output('blob'), `${filename}.pdf`);
}

export function exportToExcel<T extends object>(
  sheetName: string,
  columns: ExportColumn<T>[],
  data: T[],
  filename = 'report',
): Promise<boolean> {
  const rows = data.map((row) => {
    const obj: Record<string, string> = {};
    columns.forEach((col) => {
      const val = row[col.key];
      obj[col.header] = col.format ? col.format(val, row) : String(val ?? '');
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = columns.map((c) => ({ wch: c.width || Math.max(c.header.length, 12) }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return saveBlob(blob, `${filename}.xlsx`);
}

export function exportToCSV<T extends object>(
  columns: ExportColumn<T>[],
  data: T[],
  filename = 'report',
): Promise<boolean> {
  const headers = columns.map((c) => `"${c.header}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key];
        const str = col.format ? col.format(val, row) : String(val ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(','),
  );
  const csv = [headers, ...rows].join('\n');
  return saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

export function parseCSVFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim());
        const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
        const data = lines.slice(1).map((line) => {
          const vals = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
          return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
        });
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}
