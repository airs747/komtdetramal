// Inlezen van de csv met meldingen. Wordt zowel tijdens het bouwen als in de browser gebruikt.

export interface Melding {
  t: number; // tijdstip in milliseconden
  halte: string;
  richting: string;
  tekst: string;
}

// Eenvoudige csv-parser die ook komma's, aanhalingstekens en regeleinden binnen velden aankan.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

// Tijdstempel van Google Forms met Engelse instelling: "11/23/2026 16:29:58" (maand/dag/jaar).
// Valt terug op dag-maand-jaar ("23-11-2026 16:29:58") voor het geval de landinstelling ooit verandert.
// Ook een kaal serienummer van Sheets ("46349.68748", dagen sinds 30-12-1899) wordt herkend.
export function parseTimestamp(s: string): number | null {
  const serial = s.trim().match(/^\d{5}(?:\.\d+)?$/);
  if (serial) {
    const u = new Date(Date.UTC(1899, 11, 30) + Math.round(parseFloat(s) * 86400) * 1000);
    return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate(), u.getUTCHours(), u.getUTCMinutes(), u.getUTCSeconds()).getTime();
  }
  const m = s.trim().match(/^(\d{1,2})([\/\-.])(\d{1,2})\2(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  let month: number, day: number;
  if (m[2] === '/') { month = +m[1]; day = +m[3]; }
  else { day = +m[1]; month = +m[3]; }
  const d = new Date(+m[4], month - 1, day, +(m[5] || 0), +(m[6] || 0), +(m[7] || 0));
  return isNaN(d.getTime()) ? null : d.getTime();
}

export function toMeldingen(csv: string): Melding[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];
  const out: Melding[] = [];
  for (const r of rows.slice(1)) {
    const t = parseTimestamp(r[0] || '');
    if (t === null) continue;
    out.push({
      t,
      halte: (r[1] || '').trim() || 'Onbekend',
      richting: (r[2] || '').trim(),
      tekst: (r[3] || '').trim(),
    });
  }
  return out.sort((a, b) => b.t - a.t);
}
