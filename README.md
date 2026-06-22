# 3D Google Sheet Data Visualization

This is a completed starter project for the internship assignment.

It uses:

- Vite
- Three.js CSS3DRenderer
- Google Sign-In / Google Identity Services
- Google Sheets API
- Google Sheet data instead of hardcoded periodic-table data

## Assignment features included

- Google login screen
- Data loaded from Google Sheets
- Tiles created from CSV/Google Sheet columns:
  - Name
  - Photo
  - Age
  - Country
  - Interest
  - Net Worth
- Net Worth color rules:
  - Red: less than $100K
  - Orange: $100K to $200K
  - Green: more than $200K
- Layout buttons:
  - Table
  - Sphere
  - Double Helix
  - Grid
- Table layout: 20 x 10
- Grid layout: 5 x 4 x 10

## 1. Install

```bash
npm install
```

## 2. Create Google Sheet

1. Open Google Sheets.
2. Import the CSV file from `data/Data Template.csv`.
3. Make sure the first row headers are exactly:

```text
Name | Photo | Age | Country | Interest | Net Worth
```

Important: If your imported CSV shows ` Net Worth ` with spaces, rename it to `Net Worth`.

4. Rename the sheet tab to:

```text
Sheet1
```

5. Share the Google Sheet with the required evaluator email.

## 3. Google Cloud setup

In Google Cloud Console:

1. Create a project.
2. Enable Google Sheets API.
3. Configure OAuth consent screen.
4. Create an OAuth 2.0 Client ID for Web Application.
5. Create an API key.
6. Add this JavaScript origin for local testing:

```text
http://localhost:5173
```

After deploying, also add your deployed website domain as another authorized JavaScript origin.

## 4. Add your Google values

Open:

```text
src/config.js
```

Replace:

```js
CLIENT_ID: 'PASTE_YOUR_GOOGLE_CLIENT_ID_HERE',
API_KEY: 'PASTE_YOUR_GOOGLE_API_KEY_HERE',
SPREADSHEET_ID: 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE',
```

The Sheet ID is inside the Google Sheet URL.

Example:

```text
https://docs.google.com/spreadsheets/d/THIS_IS_THE_SPREADSHEET_ID/edit
```

## 5. Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## 6. Build for deployment

```bash
npm run build
```

Upload/deploy the project to Vercel, Netlify, GitHub Pages, or another static hosting platform.

## Common problems

### Google login popup does not work

Check that your current website URL is added inside Google Cloud OAuth credentials as an Authorized JavaScript origin.

### Google Sheet does not load

Check:

- Google Sheets API is enabled.
- API key is correct.
- Spreadsheet ID is correct.
- Sheet tab name is `Sheet1`.
- Range is `Sheet1!A:F`.
- You signed in using an account allowed to access the sheet.

### Tile colors do not show correctly

Check that the header is exactly:

```text
Net Worth
```

The code trims spaces from headers, but renaming it correctly is still safer.
