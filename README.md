# MRT Experiment Suite

A unified Mental Rotation Test (MRT) experiment supporting three presentation conditions — **2D**, **3D**, and **VR** — in a single self-contained web app. Designed for GitHub Pages hosting with no build step.

---

## Contents

```
mrt-suite-v2/
├── index.html    ← merged experiment (ES module script)
├── db.js         ← Google Sheets helpers
├── config.js     ← shared experiment CONFIG
├── README.md     ← this file
└── .nojekyll     ← disables Jekyll on GitHub Pages
```

---

## 1. Google Sheets Setup

### 1a. Create the spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank sheet.
2. Rename it (e.g. `MRT Results`).
3. Copy the **Sheet ID** from its URL:
   `https://docs.google.com/spreadsheets/d/**SHEET_ID**/edit`

### 1b. Create the Apps Script Web App

1. In the sheet, open **Extensions → Apps Script**.
2. Replace the default `Code.gs` content with the script below.
3. Click **Save**, then **Deploy → New deployment**.
4. Set **Execute as** → `Me`, **Who has access** → `Anyone`.
5. Click **Deploy** and copy the **Web App URL** (ends in `/exec`).

```javascript
// Apps Script — Code.gs
// Handles POST (submit row) and GET (download CSV).

const SHEET_NAME = 'Sheet1';  // Change if your sheet tab has a different name

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action === 'submit') {
      const ss    = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAME);

      // Add header row on first use
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          'timestamp', 'participant_id', 'sector', 'role', 'condition',
          'score', 'trials_completed', 'trial_times_ms', 'avg_time_ms', 'total_time_ms'
        ]);
      }
      sheet.appendRow(payload.row);
    }
  } catch (err) {
    // Swallow errors — no-cors callers can't read the response anyway
  }
  return ContentService.createTextOutput('ok');
}

function doGet(e) {
  if (e.parameter.action === 'download') {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    const rows  = sheet.getDataRange().getValues();

    const csv = rows.map(row =>
      row.map(cell => {
        const s = String(cell).replace(/"/g, '""');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
      }).join(',')
    ).join('\r\n');

    return ContentService
      .createTextOutput(csv)
      .setMimeType(ContentService.MimeType.CSV);
  }
  return ContentService.createTextOutput('MRT Apps Script is running.');
}
```

> **CORS note:** The `doGet` handler used for CSV download must be deployed with "Anyone" access so the browser `fetch()` call can read the response. The `doPost` (row submit) uses `mode: 'no-cors'` — the response is unreadable but the row is still written.

### 1c. Configure db.js

`db.js` already has the production URL and Sheet ID pre-filled. If you redeploy the Apps Script or use a different sheet, update those values:

```js
export const DB_CONFIG = {
  SHEET_WEB_APP_URL: 'https://script.google.com/macros/s/…/exec',
  SHEET_ID:          'YOUR_SHEET_ID',   // informational — not used by the script
};
```

Set `SHEET_WEB_APP_URL` to `''` to disable Google Sheets (the app still works; use the local JSON/CSV export buttons instead).

---

## 2. GitHub Pages Setup

1. Create a new GitHub repository (public or private).
2. Upload all files in this folder to the repository root (or a subfolder).
3. Go to **Settings → Pages**.
4. Set **Source** to `Deploy from a branch`, choose `main`, folder `/` (root) or the subfolder you used.
5. Click **Save**. GitHub will provide a URL like `https://username.github.io/repo-name/`.
6. The `.nojekyll` file in this folder is required — it prevents GitHub Pages from running Jekyll, which would otherwise skip files with underscores and interfere with the Three.js CDN `<script>` tags.

> **Serving locally:** `python3 -m http.server` from this folder, then open `http://localhost:8000`. Do **not** open `index.html` directly as a `file://` URL — ES module imports are blocked by browser CORS policy on the file protocol.

---

## 3. Running the Experiment

1. Open the URL in a browser (Chrome / Edge recommended; Meta Quest Browser for VR).
2. **Select a condition** — 2D, 3D, or VR.
3. **Enter Participant ID**, choose your **Sector** from the dropdown (D&E / CS / Manufacturing / IT & Data), and type your **Role** (all three required).
4. Read the instructions and click **Start**.
5. Complete the practice trials and Block A.
6. The debrief screen shows your score and automatically submits the result to Google Sheets.

**Conditions:**
| Condition | Rendering | Rotation |
|-----------|-----------|----------|
| 2D | Flat canvas panels | Fixed viewpoint |
| 3D | Canvas panels | Click-and-drag trackball rotation |
| VR | WebXR (Meta Quest 3) | Physical head/hand movement |

---

## 4. Retrieving Data

### Via Google Sheet
Open the Google Sheet directly. Each completed session appends one row. Column schema: see [Section 8](#8-column-schema).

### Via "Download all results" button
On the debrief screen, click **Download all results (CSV)** to download every row in the sheet as a CSV file named `mrt_results_YYYY-MM-DDTHH-MM-SS.csv`.

### Via local export (fallback / no Sheets configured)
On the debrief screen:
- **Export JSON** — full trial-by-trial log for one session
- **Export CSV** — summary row for one session

---

## 5. VR Data Retrieval

The Meta Quest Browser stores downloaded files inside the headset's file system. To retrieve them via USB:

```bash
# List downloaded files
adb shell ls /sdcard/Download/

# Pull all MRT exports to your computer
adb pull /sdcard/Download/ ./quest-downloads/
```

Alternatively, open the Files app on the Quest and use **Share** to AirDrop or email the files.

---

## 6. CONFIG Reference

All values are in `config.js`. Edit them before deploying.

| Key | Default | Description |
|-----|---------|-------------|
| `SEED` | `42` | Mulberry32 PRNG seed. Same seed = identical trial order across conditions. |
| `TRIALS_PER_BLOCK` | `5` | Number of scored trials in Block A. |
| `TIME_LIMIT_SECONDS` | `300` | Block A time limit (seconds). Timer shown on-screen. |
| `REST_SECONDS` | `60` | Rest interval between blocks (reserved for future use). |
| `PRACTICE_ENABLED` | `true` | Show practice trials before Block A. |
| `PRACTICE_TRIALS` | `2` | Number of practice trials. |
| `ROTATION_ENABLED` | `false` | Enables trackball rotation in 3D condition. Set at runtime — do not change here. |
| `FIXATION_CROSS` | `true` | Show a `+` fixation cross between trials. |
| `FIXATION_MS` | `500` | Duration of the fixation cross (milliseconds). |
| `PARTICIPANT_ID_PROMPT` | `true` | Require Participant ID entry (always true in the suite). |
| `VR_FIGURE_SCALE` | `0.025` | Target figure scale in VR world space — ~10 cm total (slightly bigger than a Rubik's cube). |
| `VR_OPTION_SCALE` | `0.02` | Option figure scale (passed to OptionCell; cell visual size set by `scale.setScalar(0.22)`). |
| `VR_GRAB_RADIUS` | `0.14` | Grab/selection detection sphere radius (metres). |

---

## 7. JSON Export Schema

The full per-session JSON export (`buildLog()`) structure:

```json
{
  "schema_version": "2.0",
  "participant_id": "P001",
  "sector": "D&E",
  "role": "Design Engineer",
  "condition": "2D",
  "start_time": "2025-01-01T10:00:00.000Z",
  "end_time": "2025-01-01T10:10:00.000Z",
  "scores": {
    "practice": 2,
    "block_A": 4
  },
  "strategy_response": "I mentally rotated the top arm first...",
  "trials": [
    {
      "block": "practice",
      "trial_index": 0,
      "figure_id": 3,
      "correct_answer": 1,
      "participant_answer": 1,
      "correct": true,
      "response_time_ms": 4250
    }
  ]
}
```

---

## 8. Column Schema

The Google Sheet (and the single-session CSV export) has these 10 columns, in order:

| # | Column | Type | Description |
|---|--------|------|-------------|
| 1 | `timestamp` | ISO 8601 string | Server time when the row was appended |
| 2 | `participant_id` | string | ID entered on the intro screen |
| 3 | `sector` | `D&E` \| `CS` \| `Manufacturing` \| `IT & Data` | Sector selected from the dropdown |
| 4 | `role` | string | Free-text role entered on the intro screen |
| 5 | `condition` | `2D` \| `3D` \| `VR` | Experiment condition |
| 6 | `score` | integer | Number of correct responses in Block A |
| 7 | `trials_completed` | integer | Number of Block A trials with a recorded response time |
| 8 | `trial_times_ms` | JSON array | Response times (ms) for each Block A trial, in order |
| 9 | `avg_time_ms` | integer | Mean response time across Block A trials (ms) |
| 10 | `total_time_ms` | integer | Sum of all Block A response times (ms) |
