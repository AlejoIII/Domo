export type TabularCsvRow = Record<string, string>;

export type ParseTabularCsvResult = {
  rows: TabularCsvRow[];
  delimiter: ',' | ';';
};

const normalizeHeader = (raw: string) =>
  raw
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '_');

function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseTabularCsv(csv: string): ParseTabularCsvResult {
  const lines = csv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], delimiter: ';' };
  }

  const delimiter: ',' | ';' = lines[0].includes(';') ? ';' : ',';
  const headerCells = splitCsvLine(lines[0], delimiter).map(normalizeHeader);
  const rows: TabularCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    const row: TabularCsvRow = {};
    headerCells.forEach((h, idx) => {
      if (h) row[h] = (cells[idx] ?? '').trim();
    });
    if (Object.values(row).some((v) => v.length > 0)) {
      rows.push(row);
    }
  }

  return { rows, delimiter };
}

export function pickField(row: TabularCsvRow, keys: string[]): string {
  for (const key of keys) {
    const v = row[normalizeHeader(key)];
    if (v) return v;
  }
  return '';
}
