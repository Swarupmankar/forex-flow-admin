export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}

export function exportToCSV(data: ExportData): void {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => 
      row.map(cell => {
        const stringCell = String(cell);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
          return `"${stringCell.replace(/"/g, '""')}"`;
        }
        return stringCell;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${data.filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: ExportData): void {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.filename}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        h1 { color: #333; margin-bottom: 20px; }
        .export-date { color: #666; font-size: 12px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <h1>${data.filename}</h1>
      <div class="export-date">Exported on: ${new Date().toLocaleDateString()}</div>
      <table>
        <thead>
          <tr>
            ${data.headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(row => 
            `<tr>${row.map(cell => `<td>${String(cell)}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}

export function formatDateForExport(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

export function formatCurrencyForExport(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatStatusForExport(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function generateExportFilename(section: string, dateRange?: { from?: Date; to?: Date }): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
  
  let filename = `${section}_${timestamp}`;
  
  if (dateRange?.from && dateRange?.to) {
    const fromDate = dateRange.from.toISOString().slice(0, 10);
    const toDate = dateRange.to.toISOString().slice(0, 10);
    filename = `${section}_${fromDate}_to_${toDate}_${timestamp}`;
  }
  
  return filename;
}