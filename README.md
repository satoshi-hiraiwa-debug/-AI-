# AI Interview Report App

Google Sheets or CSV data can be turned into an "Our AI Interview Check In" style report.

## Included

- Source files in `src/`
- Shareable built files in `shared-build/`
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

## Shareable Build

これはローカル環境で利用可能なツールです。

`shared-build/` フォルダに入っている `index.html` をダブルクリックで開いて使ってください。ビルド済みの `index.html` は、Chrome の `file://` 表示でも動くように CSS と JavaScript を埋め込んでいます。

Create a local shareable build in the repo root:

```bash
pnpm run build
```

The built app is written to `shared-build/`. You can share that directory as-is, zip it, or open `shared-build/index.html` locally.

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
