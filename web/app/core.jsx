// core.jsx — shared data, helpers, and AI parsing for Quick-PO
// Exported to window at the bottom. Plain helpers + React-free logic.

// ───────────────────────── date / number helpers ─────────────────────────
const pad2 = (n) => String(n).padStart(2, '0');
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function addDaysISO(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function jpDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}
function jpDateShort(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}
function genNo(iso, seq = 1) {
  const [y, m, d] = iso.split('-');
  return `NK-AAA-${y.slice(2)}${m}${d}-${pad2(seq)}`;
}

// ───────────────────────── company / self ─────────────────────────
const SELF = {
  name: '株式会社 桜井電装',
  zip: '〒125-0032',
  addr: '東京都葛飾区水元1-14-4',
  tel: 'TEL 03-3600-2012',
  fax: 'FAX 03-3600-2743',
  staff: '担当：櫻井(光)',
};

// ───────────────────────── 発注先マスタ (vendors) ─────────────────────────
const SEED_VENDORS = [
  { id: 'v1', name: '中西電機株式会社', kana: 'なかにしでんき', honor: '御中',
    tel: '03-3601-1234', staff: '営業部 田所様', deliv: '弊社（東京）',
    tags: ['分電盤', 'ブレーカー'], pinned: true, last: '2026-05-20' },
  { id: 'v2', name: '関東配線資材センター', kana: 'かんとうはいせん',honor: '御中',
    tel: '048-555-7700', staff: '受注課', deliv: '現場直送',
    tags: ['ケーブル', 'VVF'], pinned: false, last: '2026-05-12' },
  { id: 'v3', name: '東和電設工業株式会社', kana: 'とうわでんせつ', honor: '御中',
    tel: '03-3700-2200', staff: '購買 佐藤様', deliv: '弊社（東京）',
    tags: ['照明', '配線器具'], pinned: false, last: '2026-04-28' },
  { id: 'v4', name: 'ミライ電材', kana: 'みらいでんざい', honor: '御中',
    tel: '042-330-1188', staff: '—', deliv: '現場直送',
    tags: ['工具', '消耗品'], pinned: false, last: '2026-03-09' },
];

// ───────────────────────── 発注履歴 (order history) ─────────────────────────
const SEED_HISTORY = [
  { id: 'o1', no: 'NK-AAA-260520-01', vendor: '中西電機株式会社', date: '2026-05-20',
    due: '2026-06-01', status: 'sent', lines: 3, qty: 9,
    items: [
      { maker: 'パナソニック', model: 'BQR34204', name: '住宅分電盤', qty: '2', unit: '面', note: 'リミッタースペースなし' },
      { maker: 'テンパール', model: 'B-32', name: '安全ブレーカ', qty: '4', unit: '個', note: '' },
      { maker: 'パナソニック', model: 'BQR8302', name: '分電盤', qty: '3', unit: '面', note: '' },
    ] },
  { id: 'o2', no: 'NK-AAA-260512-01', vendor: '関東配線資材センター', date: '2026-05-12',
    due: '2026-05-18', status: 'sent', lines: 2, qty: 250,
    items: [
      { maker: '', model: 'VVF1.6-2C', name: 'VVFケーブル', qty: '200', unit: 'm', note: '黒' },
      { maker: '', model: 'VVF2.0-3C', name: 'VVFケーブル', qty: '50', unit: 'm', note: '' },
    ] },
  { id: 'o3', no: 'NK-AAA-260428-02', vendor: '東和電設工業株式会社', date: '2026-04-28',
    due: '2026-05-10', status: 'received', lines: 4, qty: 22,
    items: [
      { maker: 'コイズミ', model: 'AD1234', name: 'ダウンライト', qty: '12', unit: '台', note: '電球色' },
    ] },
  { id: 'o4', no: 'NK-AAA-260415-01', vendor: '中西電機株式会社', date: '2026-04-15',
    due: '2026-04-22', status: 'received', lines: 1, qty: 5,
    items: [
      { maker: '日東工業', model: 'S20-66', name: 'プラボックス', qty: '5', unit: '個', note: '' },
    ] },
  { id: 'd1', no: '（下書き）', vendor: '中西電機株式会社', date: '2026-05-28',
    due: '2026-06-09', status: 'draft', lines: 1, qty: 2,
    items: [
      { maker: 'パナソニック', model: 'BQR34204', name: '住宅分電盤', qty: '2', unit: '面', note: '' },
    ] },
];

const STATUS_LABEL = { draft: '下書き', sent: '送信済', received: '納品済' };

const UNITS = ['個', '台', '面', '本', '枚', 'm', '巻', 'セット', '箱', '束', '組', '缶'];

// ───────────────────────── local fallback parser ─────────────────────────
const KNOWN_MAKERS = ['パナソニック', 'Panasonic', '三菱電機', '三菱', '日立', '東芝', '富士電機',
  'オムロン', '因幡電工', 'ネグロス', '未来工業', '河村電器', '日東工業', 'テンパール',
  'アメリカン電機', 'コイズミ', '遠藤照明', '大光電機', 'DAIKO', 'KOIZUMI', 'ENDO'];
function z2h(s) {
  return (s || '').replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');
}
function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function localParse(text) {
  text = z2h(text).trim();
  if (!text) return [];
  const chunks = text.split(/[、，,。\n]+|あと|それと|プラス|および|加えて/).map(s => s.trim()).filter(Boolean);
  const rows = [];
  for (let s of chunks) {
    let qty = '', unit = '個';
    const qm = s.match(/(\d+)\s*(個|台|枚|本|セット|箱|巻|束|袋|ケース|m|メートル|組|張|缶|面)/);
    if (qm) { qty = qm[1]; unit = qm[2] === 'メートル' ? 'm' : qm[2]; s = s.replace(qm[0], ' '); }
    else { const qn = s.match(/(\d+)\s*$/); if (qn) { qty = qn[1]; s = s.replace(qn[0], ' '); } }
    let maker = '';
    for (const mk of KNOWN_MAKERS) { if (s.includes(mk)) { maker = mk; s = s.replace(mk, ' '); break; } }
    let model = '';
    const tokens = s.match(/[A-Za-z][A-Za-z0-9\-]{2,}|\d+[A-Za-z][A-Za-z0-9\-]*/g);
    if (tokens) { model = tokens.sort((a, b) => b.length - a.length)[0].toUpperCase(); s = s.replace(new RegExp(escRe(model), 'i'), ' '); }
    let name = s.replace(/[のをがにはへとや]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!maker && !model && !name && !qty) continue;
    rows.push({ maker, model, name, qty, unit, note: '' });
  }
  return rows;
}

// ───────────────────────── AI parser (backend Gemini Flash, with local fallback) ─────────────────────────
function normItem(it) {
  return {
    maker: (it.maker || '').toString().trim(),
    model: (it.model || '').toString().trim(),
    name: (it.name || '').toString().trim(),
    qty: (it.qty || '').toString().replace(/[^\d.]/g, ''),
    unit: (it.unit || '個').toString().trim() || '個',
    note: (it.note || '').toString().trim(),
  };
}
const hasContent = (it) => it.maker || it.model || it.name || it.qty;

// Calls the backend /api/parse endpoint (Gemini Flash on FastAPI). If the backend
// is unreachable or returns nothing usable, falls back to the on-device parser so
// the app keeps working offline / before the API is wired up.
async function aiParse(text) {
  const clean = (text || '').trim();
  if (!clean) return [];
  try {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean }),
    });
    if (res.ok) {
      const json = await res.json();
      const items = (json.items || []).map(normItem).filter(hasContent);
      if (items.length) return items;
    }
  } catch (e) { /* backend not available → fall back to on-device parser */ }
  await new Promise(r => setTimeout(r, 300));
  return localParse(clean);
}

const SAMPLE_UTTERANCE = 'パナソニックの分電盤BQR34204を2面、テンパールの安全ブレーカB-32を4個、あとVVFケーブル1.6-2Cを200メートル';

Object.assign(window, {
  pad2, todayISO, addDaysISO, jpDate, jpDateShort, genNo,
  SELF, SEED_VENDORS, SEED_HISTORY, STATUS_LABEL, UNITS,
  localParse, aiParse, SAMPLE_UTTERANCE,
});
