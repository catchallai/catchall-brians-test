// Export to CSV
export const exportToCSV = (data, filename, columns) => {
  if (!data || data.length === 0) {
    return;
  }

  const headers = columns ? columns.map((c) => c.label) : Object.keys(data[0]);
  const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0]);

  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      keys
        .map((key) => {
          let value = row[key];
          if (value === null || value === undefined) {
            value = '';
          }
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          // Escape quotes and wrap in quotes if contains comma
          value = String(value).replace(/"/g, '""');
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            value = `"${value}"`;
          }
          return value;
        })
        .join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

// Export to JSON
export const exportToJSON = (data, filename) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
};

// Helper to download file
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Parse CSV to array
export const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    return { headers: [], data: [] };
  }

  // Detect delimiter (tab or comma)
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';

  const parseRow = (row, delim) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Parse header from first line
  const headers = parseRow(firstLine, delimiter);

  // Parse data rows
  const data = lines.slice(1).map((line) => {
    const values = parseRow(line, delimiter);
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });

  return { headers, data };
};
