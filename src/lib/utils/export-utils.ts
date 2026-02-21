/**
 * Simple CSV Generator for Order Exports
 */
export function generateCSV(data: any[], columns: { header: string; key: string }[]): string {
    const headerRow = columns.map(col => `"${col.header}"`).join(',');
    const rows = data.map(item => {
        return columns.map(col => {
            const val = item[col.key] ?? '';
            // Escape quotes and handle strings
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
    });

    return [headerRow, ...rows].join('\n');
}

export function downloadCSV(csvContent: string, fileName: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
