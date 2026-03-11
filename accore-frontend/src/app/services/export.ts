import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  exportToCSV(data: any[], filename: string = 'hazard_reports'): void {
    if (!data || !data.length) return;

    // 1. Get headers dynamically from the first object keys
    // This makes the service reusable for any component
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // 2. Add Header row (Capitalize first letters for professional look)
    csvRows.push(headers.map(h => `"${h.toUpperCase()}"`).join(','));

    // 3. Add Data rows
    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '""'); // Escape double quotes
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    // 4. Create Blob and trigger download
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
  }
}