const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const exportToCsv = (filename, rows, columns = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  const resolvedColumns = columns.length
    ? columns
    : Object.keys(rows[0]).map((key) => ({ key, label: key }));

  const header = resolvedColumns.map((col) => escapeCsvValue(col.label || col.key)).join(',');
  const body = rows
    .map((row) =>
      resolvedColumns
        .map((col) => escapeCsvValue(row[col.key]))
        .join(',')
    )
    .join('\n');

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
