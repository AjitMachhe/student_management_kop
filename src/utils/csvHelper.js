import Papa from 'papaparse';

export function exportToCsv(filename, rows, columns = null) {
  if (!rows || rows.length === 0) {
    throw new Error('No records available to export.');
  }

  let formattedRows = rows;
  if (columns && Array.isArray(columns)) {
    formattedRows = rows.map((row) => {
      const obj = {};
      columns.forEach(({ key, header }) => {
        obj[header] = row[key] ?? '';
      });
      return obj;
    });
  }

  const csvString = Papa.unparse(formattedRows);
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}