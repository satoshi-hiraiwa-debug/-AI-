import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Download,
  FileSpreadsheet,
  JapaneseYen,
  Link,
  Medal,
  MessageCircle,
  Printer,
  RefreshCw,
  ThumbsUp,
  Users,
  Wand2,
} from "lucide-react";

const SAMPLE_CSV = `type,name,current,previous,unit,target,history,priority,note
meta,company,株式会社サンプル,,,,"",,
meta,meetingDate,2025年5月20日（火）14:00-15:00,,,,"",,
meta,participants,人事部 採用担当 田中様、佐藤様,,,,"",,
meta,jetb,山田 太郎（カスタマーサクセス）,,,,"",,
meta,period,2025年2月1日 - 2025年4月30日,,,,"",,
meta,previousPeriod,2024年11月1日 - 2025年1月31日,,,,"",,
kpi,URLクリック率,32.5,25.1,%,30,"18,24,22,21,26,31,29,34,33,37",,
kpi,AI面接完了率,52.8,46.3,%,60,"31,36,42,37,44,48,43,55,51,60",,
kpi,面接完了数,342,298,件,380,"180,205,220,235,260,285,300,318,330,342",,
kpi,受験率,71.4,65.2,%,75,"52,64,68,70,69,72,66,73,75,78",,
kpi,内定者数,28,24,名,30,"14,18,21,25,22,24,26,25,27,30",,
kpi,内定率,18.9,16.7,%,20,"11,14,12,16,14,17,16,19,18,21",,
kpi,採用までの日数,34.2,41.6,日,30,"52,47,43,40,39,38,36,34,32,29",,
kpi,採用単価（CPA）,45200,51800,円,40000,"62000,59000,55000,50000,49200,47800,46300,45200,44100,43000",,
action,応募当日のURL送付,実施済み,,,"","",,クリック率 +7.4pt
action,面接時間の短縮（質問数見直し）,一部実施,,,"","",,完了率 +6.5pt
action,評価基準の見直し,未実施,,,"","",,-
plan,AI面接完了率が低い,面接時間・質問数を見直す,JetB,6/20,"","",高,
plan,内定率が低い,評価基準・質問内容を調整する,JetB,6/20,"","",中,
plan,入社率が低い,内定者フォロー体制を整える,貴社,6/30,"","",中,
comment,voice,AI面接の質問数が多く、途中で疲れてしまうという声がある。,,,,"",,
comment,voice,面接時間が長く、受験者の負担になっている。,,,,"",,
comment,request,スマホでの操作性を改善してほしい。,,,,"",,
comment,request,面接結果の比較レポートをもっと見やすくしてほしい。,,,,"",,`;

const KPI_ICONS = [Link, BadgeCheck, Users, CheckCircle2, Medal, ClipboardCheck, CalendarDays, JapaneseYen];
const KPI_COLORS = ["#42a5f5", "#46a56a", "#7b62b8", "#24a6b8", "#f2a718", "#ff6b1a", "#2f6ccf", "#f2607a"];
const MONTHS = ["11月", "12月", "1月", "2月", "3月", "4月"];
const BRAND_LOGO_URL = `${import.meta.env.BASE_URL}brand-logo.png`;
const SAMPLE_MODEL_ROWS = normalizeRows(SAMPLE_CSV);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function normalizeRows(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((row) =>
    headers.reduce((item, header, index) => {
      item[header] = (row[index] || "").trim();
      return item;
    }, {}),
  );
}

function firstFilled(row, keys) {
  for (const key of keys) {
    if (row[key]) return row[key];
  }
  return "";
}

function pickGenericMeta(rows) {
  const meta = {};
  const keyMap = [
    ["company", ["企業名", "会社名", "法人名", "社名", "company"]],
    ["meetingDate", ["実施日", "面談日", "日付", "meetingDate"]],
    ["participants", ["参加者", "ご参加者", "出席者", "participants"]],
    ["jetb", ["JetB担当", "担当", "CS担当", "jetb"]],
    ["period", ["対象期間", "期間", "period"]],
    ["previousPeriod", ["前回期間", "比較期間", "previousPeriod"]],
  ];

  for (const row of rows) {
    for (const [target, candidates] of keyMap) {
      if (meta[target]) continue;
      const direct = firstFilled(row, candidates);
      if (direct) meta[target] = direct;
      if (!meta[target]) {
        const label = firstFilled(row, ["項目", "指標", "name", "type"]);
        const value = firstFilled(row, ["値", "内容", "current", "value"]);
        if (value && candidates.some((candidate) => label.includes(candidate))) meta[target] = value;
      }
    }
  }
  return meta;
}

function numberValue(value) {
  const parsed = Number(String(value || "").replace(/[¥,%件名日pt\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatValue(value, unit) {
  const number = numberValue(value);
  if (unit === "円") return `¥${number.toLocaleString("ja-JP")}`;
  if (unit === "%") return `${number.toFixed(1)}%`;
  if (unit === "日") return `${number.toFixed(1)}日`;
  return `${number.toLocaleString("ja-JP")}${unit || ""}`;
}

function diffLabel(kpi) {
  const current = numberValue(kpi.current);
  const previous = numberValue(kpi.previous);
  const diff = current - previous;
  const betterWhenLower = kpi.name.includes("日数") || kpi.name.includes("単価") || kpi.name.toUpperCase().includes("CPA");
  const good = betterWhenLower ? diff < 0 : diff >= 0;
  const sign = diff > 0 ? "+" : "";
  const unit = kpi.unit === "%" ? "pt" : kpi.unit || "";
  const amount = Math.abs(diff) >= 1000 ? `${sign}${Math.round(diff).toLocaleString("ja-JP")}` : `${sign}${diff.toFixed(kpi.unit === "件" || kpi.unit === "名" ? 0 : 1)}`;
  return { text: `${amount}${unit}`, good };
}

function buildModel(rows) {
  const byType = (type) => rows.filter((row) => (row.type || "").toLowerCase() === type);
  const sampleByType = (type) => SAMPLE_MODEL_ROWS.filter((row) => (row.type || "").toLowerCase() === type);
  const metaRows = byType("meta");
  const hasDedicatedFormat = rows.some((row) => ["meta", "kpi", "action", "plan", "comment"].includes((row.type || "").toLowerCase()));
  const sourceKpis = byType("kpi").length ? byType("kpi") : sampleByType("kpi");
  const meta = {
    ...pickGenericMeta(rows),
    ...Object.fromEntries(metaRows.map((row) => [row.name, row.current])),
  };
  const kpis = sourceKpis.map((row, index) => ({
    ...row,
    icon: KPI_ICONS[index % KPI_ICONS.length],
    color: KPI_COLORS[index % KPI_COLORS.length],
    historyValues: String(row.history || "")
      .split(",")
      .map(numberValue)
      .filter((value) => Number.isFinite(value)),
  }));
  return {
    meta,
    kpis,
    actions: byType("action").length ? byType("action") : sampleByType("action"),
    plans: byType("plan").length ? byType("plan") : sampleByType("plan"),
    voices: byType("comment").filter((row) => row.name === "voice").length ? byType("comment").filter((row) => row.name === "voice") : sampleByType("comment").filter((row) => row.name === "voice"),
    requests: byType("comment").filter((row) => row.name === "request").length ? byType("comment").filter((row) => row.name === "request") : sampleByType("comment").filter((row) => row.name === "request"),
    hasDedicatedFormat,
  };
}

function Sparkline({ values, color }) {
  const safeValues = values.length ? values : [1, 2, 1.5, 3, 2.5, 4];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const points = safeValues
    .map((value, index) => {
      const x = (index / Math.max(safeValues.length - 1, 1)) * 98 + 1;
      const y = 36 - ((value - min) / Math.max(max - min, 1)) * 28;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 100 42" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {safeValues.map((value, index) => {
        const x = (index / Math.max(safeValues.length - 1, 1)) * 98 + 1;
        const y = 36 - ((value - min) / Math.max(max - min, 1)) * 28;
        return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.4" fill={color} />;
      })}
    </svg>
  );
}

function LineChart({ kpis }) {
  const series = kpis.slice(0, 3);
  return (
    <div className="chart-grid">
      <div className="chart-title">AI面接パフォーマンス推移</div>
      <div className="legend">
        {series.map((kpi) => (
          <span key={kpi.name}>
            <i style={{ background: kpi.color }} />
            {kpi.name}
          </span>
        ))}
      </div>
      <div className="line-chart">
        {series.map((kpi) => (
          <Sparkline key={kpi.name} values={kpi.historyValues.slice(-6)} color={kpi.color} />
        ))}
      </div>
      <div className="axis-labels">{MONTHS.map((month) => <span key={month}>{month}</span>)}</div>
    </div>
  );
}

function BarChart({ kpis }) {
  const hires = kpis.find((item) => item.name.includes("内定者"))?.historyValues.slice(-6) || [14, 24, 28, 27, 25, 30];
  const rate = kpis.find((item) => item.name.includes("内定率"))?.historyValues.slice(-6) || [14, 21, 22, 20, 18, 17];
  const max = Math.max(...hires, 1);
  return (
    <div className="chart-grid">
      <div className="chart-title">採用成果推移</div>
      <div className="bar-chart">
        {hires.map((value, index) => (
          <div className="bar-item" key={`${value}-${index}`}>
            <span className="rate-dot" style={{ bottom: `${Math.min(rate[index] * 2.2, 76)}%` }} />
            <div className="bar" style={{ height: `${(value / max) * 82}%` }} />
            <small>{MONTHS[index]}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ kpi }) {
  const Icon = kpi.icon;
  const diff = diffLabel(kpi);
  return (
    <article className="kpi-card">
      <h3>{kpi.name}</h3>
      <Icon className="kpi-icon" style={{ color: kpi.color }} strokeWidth={2.4} />
      <strong>{formatValue(kpi.current, kpi.unit)}</strong>
      <span className="previous">前回 {formatValue(kpi.previous, kpi.unit)}</span>
      <b className={diff.good ? "good-diff" : "bad-diff"}>{diff.text}</b>
      <Sparkline values={kpi.historyValues} color={kpi.color} />
    </article>
  );
}

function SectionTitle({ number, children }) {
  return (
    <h2 className="section-title">
      <span>{number}</span>
      {children}
    </h2>
  );
}

function metric(model, includes) {
  return model.kpis.find((kpi) => includes.some((word) => kpi.name.includes(word)));
}

function Report({ model }) {
  const click = metric(model, ["URLクリック"]);
  const complete = metric(model, ["AI面接完了"]);
  const days = metric(model, ["日数"]);
  const offer = metric(model, ["内定率"]);
  const hires = metric(model, ["内定者"]);
  const cpa = metric(model, ["単価", "CPA"]);
  const goodPoints = [
    `${click?.name || "URLクリック率"}が${diffLabel(click || {}).text}向上しました。`,
    `${metric(model, ["受験率"])?.name || "受験率"}が改善し、応募者のエンゲージメントが高まっています。`,
    `${days?.name || "採用までの日数"}が短縮され、選考スピードが改善しました。`,
    `${cpa?.name || "採用単価"}が改善し、コスト効率が向上しました。`,
  ];
  const warnings = [
    `${complete?.name || "AI面接完了率"}が目標値を下回っています。`,
    `${offer?.name || "内定率"}が目標値を下回っています。`,
    `${hires?.name || "内定者数"}が目標に対してやや不足しています。`,
  ];

  return (
    <div className="report-page" id="report">
      <header className="report-header">
        <h1>Our AI面接 Check In レポート</h1>
        <div className="brand-mark">
          <img className="brand-logo" src={BRAND_LOGO_URL} alt="Our AI面接 logo" />
          <div>
            <b>Our AI面接</b>
            <small>by JetB</small>
          </div>
        </div>
      </header>

      <section className="summary-box">
        <dl>
          <div><dt>企業名</dt><dd>{model.meta.company || "株式会社サンプル"}</dd></div>
          <div><dt>実施日</dt><dd>{model.meta.meetingDate || "2025年5月20日（火）14:00-15:00"}</dd></div>
          <div><dt>ご参加者</dt><dd>{model.meta.participants || "人事部 採用担当 田中様、佐藤様"}</dd></div>
          <div><dt>JetB担当</dt><dd>{model.meta.jetb || "山田 太郎（カスタマーサクセス）"}</dd></div>
          <div><dt>対象期間</dt><dd>{model.meta.period || "2025年2月1日 - 2025年4月30日"}（前回：{model.meta.previousPeriod || "2024年11月1日 - 2025年1月31日"}）</dd></div>
        </dl>
        <div className="purpose">
          <b>本日の目的</b>
          {["前回アクションの結果を確認する", "採用データをもとに現状を分析する", "課題の原因を明確にする", "次回までの改善施策を決定する"].map((item) => (
            <span key={item}><CheckCircle2 size={16} />{item}</span>
          ))}
        </div>
      </section>

      <SectionTitle number="1">KPIサマリー <small>（比較：前回期間との比較）</small></SectionTitle>
      <section className="kpi-grid">{model.kpis.map((kpi) => <KpiCard key={kpi.name} kpi={kpi} />)}</section>
      <p className="note">※期間比較の数値は、小数点第2位を四捨五入して表示しています。</p>

      <SectionTitle number="2">AI分析サマリー</SectionTitle>
      <section className="analysis-grid">
        <article className="analysis-card green">
          <header><h3>良かった点 <small>（前年同期比）</small></h3><ThumbsUp /></header>
          {goodPoints.map((point) => <p key={point}><CheckCircle2 size={15} />{point}</p>)}
        </article>
        <article className="analysis-card orange">
          <header><h3>気になる点</h3><AlertTriangle /></header>
          {warnings.map((point) => <p key={point}><AlertTriangle size={15} />{point}</p>)}
        </article>
        <article className="analysis-card blue">
          <header><h3>AIによる要因分析 <small>（仮説）</small></h3><Wand2 /></header>
          <ol>
            <li><b>AI面接完了率の低下</b><br />面接時間が長いことや、質問数の多さが途中離脱につながっている可能性があります。</li>
            <li><b>内定率の低下</b><br />評価基準や質問内容が、求める人物像と完全に一致していない可能性があります。</li>
            <li><b>内定者数の不足</b><br />母集団の質や量に課題があり、内定につながる候補者数が不足している可能性があります。</li>
          </ol>
        </article>
      </section>

      <SectionTitle number="3">詳細データ</SectionTitle>
      <section className="details-grid">
        <article className="panel funnel">
          <h3>応募〜受験の状況</h3>
          {[
            ["応募数", "1,250件"],
            ["URLクリック数", `${Math.round(numberValue(click?.current) * 12.5).toLocaleString("ja-JP")}件 (${formatValue(click?.current, "%")})`],
            ["AI面接完了数", `${formatValue(metric(model, ["面接完了数"])?.current, "件")}`],
            ["受験率", formatValue(metric(model, ["受験率"])?.current, "%")],
          ].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}
        </article>
        <article className="panel"><LineChart kpis={model.kpis} /></article>
        <article className="panel"><BarChart kpis={model.kpis} /></article>
        <article className="panel roi">
          <h3>コスト・ROIサマリー <Coins /></h3>
          <p><span>AI導入費用（期間）</span><b>¥300,000</b></p>
          <p><span>面接対応削減時間</span><b>125時間</b></p>
          <p><span>削減した費用</span><b>¥250,000</b></p>
          <p><span>採用単価（CPA）</span><b>{formatValue(cpa?.current, "円")}</b></p>
          <p className="roi-number"><span>採用ROI</span><b>83.3%</b></p>
        </article>
      </section>

      <SectionTitle number="4">ボトルネック分析</SectionTitle>
      <section className="bottleneck-grid">
        <article className="panel">
          <h3>定量的ボトルネック</h3>
          <table>
            <thead><tr><th>指標</th><th>現状</th><th>目標</th><th>差異</th><th>優先度</th></tr></thead>
            <tbody>
              {model.kpis.slice(1, 6).map((kpi) => {
                const diff = diffLabel(kpi);
                return <tr key={kpi.name}><td>{kpi.name}</td><td>{formatValue(kpi.current, kpi.unit)}</td><td>{formatValue(kpi.target, kpi.unit)}</td><td>{diff.text}</td><td className={diff.good ? "mid" : "high"}>{diff.good ? "中" : "高"}</td></tr>;
              })}
            </tbody>
          </table>
        </article>
        <article className="panel">
          <h3>定性的ボトルネック <small>（ヒアリング内容）</small></h3>
          {[...model.voices, ...model.requests].slice(0, 4).map((row) => <p className="bullet" key={row.current}>{row.current}</p>)}
        </article>
        <article className="panel">
          <h3>その他のご意見・ご要望 <MessageCircle /></h3>
          {model.requests.map((row) => <p className="bullet" key={row.current}>{row.current}</p>)}
        </article>
      </section>

      <SectionTitle number="5">アクションプラン</SectionTitle>
      <section className="action-grid">
        <article className="panel">
          <h3>前回アクションの実施状況</h3>
          <table>
            <thead><tr><th>前回アクション</th><th>実施状況</th><th>効果</th></tr></thead>
            <tbody>{model.actions.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.current}</td><td>{row.note}</td></tr>)}</tbody>
          </table>
        </article>
        <article className="panel wide">
          <h3>今回決定したアクション</h3>
          <table>
            <thead><tr><th>課題</th><th>改善施策</th><th>担当</th><th>期限</th></tr></thead>
            <tbody>{model.plans.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.current}</td><td>{row.previous}</td><td>{row.unit}</td></tr>)}</tbody>
          </table>
        </article>
        <article className="panel">
          <h3>次回確認事項 <ClipboardCheck /></h3>
          {["AI面接完了率の改善状況", "内定率の改善状況", "内定者フォローの実施状況", "入社率の改善状況"].map((item) => <p className="bullet" key={item}>{item}</p>)}
        </article>
      </section>

      <SectionTitle number="6">まとめ・次回予定</SectionTitle>
      <section className="closing-grid">
        <article className="panel wide">
          <h3>まとめ</h3>
          <p>全体的に応募者行動の改善が見られる一方で、AI面接完了率と内定率の改善が課題となっています。面接内容や評価基準の見直し、内定者フォローの強化により、採用成果の向上が期待できます。</p>
        </article>
        <article className="panel"><h3>次回Check In</h3><p>2025年8月20日（水）14:00〜15:00（予定）</p></article>
        <article className="panel"><h3>CS担当コメント</h3><p>前回から大きく改善が進んでおり、特にクリック率と受験率の向上が明確らしいです。次の施策でさらに成果を伸ばしていきましょう。</p></article>
      </section>
      <footer>© JetB Co., Ltd.</footer>
    </div>
  );
}

export function App() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [sheetUrl, setSheetUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [metaOverrides, setMetaOverrides] = useState({});
  const [status, setStatus] = useState("サンプルデータを表示しています。CSVを入れると即時に反映します。");
  const parsedModel = useMemo(() => buildModel(normalizeRows(csvText)), [csvText]);
  const model = useMemo(
    () => ({
      ...parsedModel,
      meta: { ...parsedModel.meta, ...metaOverrides },
    }),
    [parsedModel, metaOverrides],
  );

  const metaFields = [
    ["company", "企業名"],
    ["meetingDate", "実施日"],
    ["participants", "ご参加者"],
    ["jetb", "JetB担当"],
    ["period", "対象期間"],
    ["previousPeriod", "前回期間"],
  ];

  function updateMeta(key, value) {
    setMetaOverrides((current) => ({ ...current, [key]: value }));
  }

  function readCsvFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") && file.type && !file.type.includes("csv")) {
      setStatus("CSVファイルをドロップしてください。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = reader.result;
      let text = "";
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        text = new TextDecoder("shift_jis").decode(bytes);
      }
      const isDedicated = normalizeRows(text).some((row) => ["meta", "kpi", "action", "plan", "comment"].includes((row.type || "").toLowerCase()));
      setCsvText(text);
      setMetaOverrides({});
      setStatus(isDedicated ? `${file.name} を読み込みました。基本情報は左側で上書きできます。` : `${file.name} を読み込みました。形式が違うため、基本情報だけ拾い、KPIやコメントはテンプレート表示にしています。`);
    };
    reader.readAsArrayBuffer(file);
  }

  async function loadSheet() {
    const id = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    const gid = sheetUrl.match(/[?&#]gid=([0-9]+)/)?.[1] || "0";
    if (!id) {
      setStatus("Google Sheets のURLを確認してください。");
      return;
    }
    const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    setStatus("Google Sheets からCSVを取得しています...");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("fetch failed");
      setCsvText(await response.text());
      setMetaOverrides({});
      setStatus("Google Sheets のCSVを読み込みました。基本情報は左側で上書きできます。");
    } catch {
      setStatus("取得できませんでした。共有設定を「リンクを知っている全員が閲覧可」にするか、CSV貼り付けを使ってください。");
    }
  }

  function handleFile(event) {
    readCsvFile(event.target.files?.[0]);
  }

  return (
    <main className="app-shell">
      <aside className="control-panel">
        <div className="control-heading">
          <FileSpreadsheet />
          <div>
            <h2>レポート生成</h2>
            <p>スプレッドシートの内容を入れると、右側のレポートが更新されます。</p>
          </div>
        </div>
        {!model.hasDedicatedFormat && (
          <div className="format-warning">
            <b>CSV形式の確認</b>
            <span>このCSVには専用の `type` 列がないため、企業名など読める項目だけ反映しています。KPI・コメント・アクションはテンプレートを表示しています。</span>
          </div>
        )}
        <label className="field">
          Google Sheets URL
          <div className="url-row">
            <input value={sheetUrl} onChange={(event) => setSheetUrl(event.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." />
            <button type="button" onClick={loadSheet}><Download size={16} />読込</button>
          </div>
        </label>
        <div
          className={`drop-zone${isDragging ? " is-dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            readCsvFile(event.dataTransfer.files?.[0]);
          }}
        >
          <FileSpreadsheet size={22} />
          <b>CSVをドラッグ＆ドロップ</b>
          <span>元スプレッドシートをCSVで保存して、ここに落としてください。</span>
        </div>
        <label className="file-button">
          <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          <FileSpreadsheet size={17} />CSVを選択
        </label>
        <div className="meta-form">
          <b>基本情報</b>
          <span>日付や企業名はここで変更できます。</span>
          {metaFields.map(([key, label]) => (
            <label key={key}>
              {label}
              <input value={model.meta[key] || ""} onChange={(event) => updateMeta(key, event.target.value)} />
            </label>
          ))}
        </div>
        <label className="field">
          CSV貼り付け
          <textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} spellCheck="false" />
        </label>
        <div className="control-actions">
          <button type="button" onClick={() => { setCsvText(SAMPLE_CSV); setMetaOverrides({}); setStatus("サンプルデータに戻しました。"); }}><RefreshCw size={16} />サンプル</button>
          <button type="button" className="primary" onClick={() => window.print()}><Printer size={16} />PDF保存</button>
        </div>
        <p className="status">{status}</p>
        <div className="schema">
          <b>推奨CSV列</b>
          <span>type, name, current, previous, unit, target, history, priority, note</span>
        </div>
      </aside>
      <section className="preview-panel">
        <Report model={model} />
      </section>
    </main>
  );
}
