# AI Interview Report App

Google Sheets or CSV data can be turned into an "Our AI Interview Check In" style report.

## Included

- Source files in `src/`
- Built files in `dist/`
- Sample report screenshot: `chrome-report.png`
- QA memo: `design-qa.md`

## Local Preview

Install dependencies, then run the dev server.

```bash
pnpm install
pnpm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

## Data Input

The app supports:

- Google Sheets URL import when the sheet can be exported as CSV
- CSV file upload
- CSV paste
- Sample data reset
- Print/PDF save

Recommended CSV columns:

```text
type,name,current,previous,unit,target,history,priority,note
```
