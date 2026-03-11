import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  exportToCSV(data: any[], filename: string = 'hazard_reports.csv'): void {
    if (!data || !data.length) return;

    // CSV headers
    const headers = ['Title', 'Category', 'Barangay', 'Status', 'Created At', 'Latitude', 'Longitude', 'Resolved By'];
    const csvRows = [headers.join(',')];

    // Loop through data and extract required fields
    data.forEach(report => {
      const title = report.title || report.category || '';
      const category = report.category || '';
      const barangay = report.barangay || '';
      const status = report.status || '';
      const createdAt = report.createdAt || '';
      const latitude = report.location?.coordinates?.[1] || '';
      const longitude = report.location?.coordinates?.[0] || '';

      // Find admin who resolved the issue
      let resolvedBy = '';
      if (report.statusHistory?.length) {
        const resolvedEntry = report.statusHistory.find((h: any) => h.status === 'Resolved');
        resolvedBy = resolvedEntry?.adminName || '';
      }

      const row = [title, category, barangay, status, createdAt, latitude, longitude, resolvedBy];
      csvRows.push(row.map(v => `"${v}"`).join(',')); // wrap values in quotes
    });

    // Create CSV Blob and trigger download
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
}