// db.js — Google Sheets integration helpers.
// Fill in DB_CONFIG before deploying. See README.md for setup instructions.

export const DB_CONFIG = {
  SHEET_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwucXESWzah14weinauxS4E_Goxd2KLBFCvDjMlnQ0K-Ca2TN1EuHWaLexn95a5dr4WNw/exec',
  SHEET_ID:          '1omIZsoizXfS6vOqXPGUEGC5Ndvz7otUukn',
};

/**
 * Submit one session result row to the Google Sheet.
 * Called automatically when showDebrief() is reached.
 * Uses mode:'no-cors' — fire-and-forget, no response body is readable.
 * @param {Object} data - The full buildLog() object from index.html
 */
export async function submitResult(data) {
  if (!DB_CONFIG.SHEET_WEB_APP_URL) return;

  // Build the 10-column row in the order defined in README.md
  const aTrials = (data.trials || []).filter(t => t.block === 'A');
  const rts     = aTrials.filter(t => t.response_time_ms).map(t => t.response_time_ms);
  const avgMs   = rts.length ? Math.round(rts.reduce((s, v) => s + v, 0) / rts.length) : 0;
  const totalMs = rts.reduce((s, v) => s + v, 0);

  const row = [
    new Date().toISOString(),            // timestamp
    data.participant_id  ?? '',          // participant_id
    data.sector          ?? '',          // sector (dropdown)
    data.role            ?? '',          // role (free text)
    data.condition       ?? '',          // condition ('2D' | '3D' | 'VR')
    data.scores?.block_A ?? 0,           // score
    rts.length,                          // trials_completed
    JSON.stringify(rts),                 // trial_times_ms  (JSON array)
    avgMs,                               // avg_time_ms
    totalMs,                             // total_time_ms
  ];

  await fetch(DB_CONFIG.SHEET_WEB_APP_URL, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action: 'submit', row }),
  });
}

/**
 * Download all rows from the Google Sheet as a CSV file.
 * Requires CORS-enabled Apps Script endpoint (see README.md).
 * Triggered by the "Download all results" button on the debrief screen.
 */
export async function downloadSheetCSV() {
  if (!DB_CONFIG.SHEET_WEB_APP_URL) {
    alert('Google Sheets is not configured. Set DB_CONFIG in db.js first.');
    return;
  }

  const url  = `${DB_CONFIG.SHEET_WEB_APP_URL}?action=download`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const csv  = await resp.text();
  const now  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(blob),
    download: `mrt_results_${now}.csv`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
