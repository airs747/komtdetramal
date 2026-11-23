/**
 * Meldpunt Amstelveenlijn: bundel met meldingen voor GVB.
 *
 * Installeren: open de PRIVE sheet › Extensions › Apps Script, plak dit bestand
 * in Code.gs, sla op en herlaad de sheet. Er verschijnt een menu "Meldpunt".
 *
 * De bundel bevat ALLE meldingen in de periode, zonder contactgegevens.
 */

const SHEET_NAME = 'Form Responses 1';
// Kolomnummers in de privésheet (A = 1).
const COL = { ts: 2, halte: 3, richting: 4, dagTijd: 5, tekst: 6 };
const DAGEN = 14;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Meldpunt')
    .addItem('Bundel voor GVB (laatste ' + DAGEN + ' dagen)', 'bundelStandaard')
    .addItem('Bundel voor GVB (kies startdatum)', 'bundelVanaf')
    .addToUi();
}

function bundelStandaard() {
  const eind = new Date();
  const start = new Date(eind.getTime() - DAGEN * 24 * 3600 * 1000);
  toonBundel(start, eind);
}

function bundelVanaf() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('Bundel voor GVB', 'Startdatum (dd-mm-jjjj):', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const m = res.getResponseText().trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!m) { ui.alert('Gebruik de vorm dd-mm-jjjj, bijvoorbeeld 09-11-2026.'); return; }
  toonBundel(new Date(+m[3], +m[2] - 1, +m[1]), new Date());
}

function toonBundel(start, eind) {
  const ss = SpreadsheetApp.getActive();
  const tz = ss.getSpreadsheetTimeZone();
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { SpreadsheetApp.getUi().alert('Tabblad "' + SHEET_NAME + '" niet gevonden.'); return; }

  const rijen = sh.getDataRange().getValues().slice(1)
    .filter(r => r[COL.ts - 1] instanceof Date && r[COL.ts - 1] >= start && r[COL.ts - 1] < eind)
    .map(r => ({
      ts: r[COL.ts - 1],
      halte: String(r[COL.halte - 1] || '').trim(),
      richting: String(r[COL.richting - 1] || '').trim(),
      dagTijd: String(r[COL.dagTijd - 1] || '').trim(),
      tekst: String(r[COL.tekst - 1] || '').trim(),
    }))
    .sort((a, b) => a.ts - b.ts);

  const fmt = (d, p) => Utilities.formatDate(d, tz, p);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tel = key => {
    const m = {};
    rijen.forEach(r => { const k = r[key] || 'Onbekend'; m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(k => [k, m[k]]).sort((a, b) => b[1] - a[1]);
  };
  const metDagTijd = rijen.some(r => r.dagTijd);

  const td = 'border:1px solid #999;padding:4px 8px;vertical-align:top;font-family:Calibri,Arial,sans-serif;font-size:11pt';
  const th = td + ';background:#e8ebf0;text-align:left';
  let h = '';
  h += '<p style="font-family:Calibri,Arial,sans-serif;font-size:11pt"><b>Meldingen meldpunt Amstelveenlijn (lijn 6 en 25)</b><br>';
  h += 'Periode: ' + fmt(start, 'd-M-yyyy') + ' t/m ' + fmt(new Date(eind.getTime() - 1), 'd-M-yyyy') + '<br>';
  h += 'Totaal: ' + rijen.length + (rijen.length === 1 ? ' melding' : ' meldingen') + '</p>';
  if (rijen.length) {
    h += '<p style="font-family:Calibri,Arial,sans-serif;font-size:11pt"><b>Per halte:</b> ' +
      tel('halte').map(x => esc(x[0]) + ' (' + x[1] + ')').join(', ') + '<br>';
    h += '<b>Per richting:</b> ' + tel('richting').map(x => esc(x[0]) + ' (' + x[1] + ')').join(', ') + '</p>';
    h += '<table style="border-collapse:collapse"><tr>' +
      '<th style="' + th + '">Gemeld op</th><th style="' + th + '">Halte</th><th style="' + th + '">Richting</th>' +
      (metDagTijd ? '<th style="' + th + '">Opgegeven dag en tijd</th>' : '') +
      '<th style="' + th + '">Melding</th></tr>';
    rijen.forEach(r => {
      h += '<tr><td style="' + td + ';white-space:nowrap">' + fmt(r.ts, 'd-M-yyyy HH:mm') + '</td>' +
        '<td style="' + td + '">' + esc(r.halte) + '</td><td style="' + td + '">' + esc(r.richting) + '</td>' +
        (metDagTijd ? '<td style="' + td + '">' + esc(r.dagTijd) + '</td>' : '') +
        '<td style="' + td + '">' + esc(r.tekst) + '</td></tr>';
    });
    h += '</table>';
  }

  const pagina =
    '<div style="font-family:Arial,sans-serif;font-size:13px;margin-bottom:10px">' +
    '<button id="kopieer" style="padding:8px 14px;font-size:14px;cursor:pointer">Kopieer naar klembord</button> ' +
    '<span id="status" style="margin-left:8px;color:#555">Plak daarna in Outlook met Ctrl+V.</span></div>' +
    '<div id="bundel">' + h + '</div>' +
    '<script>' +
    'document.getElementById("kopieer").onclick=function(){' +
    'var el=document.getElementById("bundel"),r=document.createRange();r.selectNodeContents(el);' +
    'var s=window.getSelection();s.removeAllRanges();s.addRange(r);' +
    'var ok=false;try{ok=document.execCommand("copy");}catch(e){}' +
    'document.getElementById("status").textContent=ok?"Gekopieerd. Plak in Outlook met Ctrl+V.":"Tekst is geselecteerd: druk nu op Ctrl+C (Mac: Cmd+C).";};' +
    '</script>';

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(pagina).setWidth(1000).setHeight(700),
    'Bundel voor GVB');
}
