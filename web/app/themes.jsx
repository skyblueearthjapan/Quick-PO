// themes.jsx — three distinct visual + voice-UX directions for Quick-PO
// Each theme is a flat token bag consumed via inline styles so 3 instances
// can coexist on one canvas with zero CSS-class collisions.

// ── A · 藍 (Ai) — refined traditional. Trustworthy, paper-and-ink, formal. ──
const THEME_AI = {
  key: 'ai',
  name: '藍',
  tagline: '紙と墨の信頼感',
  voiceStyle: 'bar',          // inline recording bar with waveform
  // surfaces
  bg: '#f3f1ea',
  bgGrain: true,
  surface: '#ffffff',
  surfaceAlt: '#fbfaf5',
  // ink
  ink: '#22303a',
  sub: '#75808a',
  faint: '#9aa3ab',
  line: '#ddd8c9',
  lineStrong: '#cdc7b4',
  // brand
  primary: '#1d3a52',
  primaryDeep: '#122a3d',
  onPrimary: '#ffffff',
  accent: '#2f7d6b',
  accentSoft: '#e9f1ed',
  accentLine: '#bfdacf',
  danger: '#bc564d',
  warn: '#b9863f',
  // shape
  radius: 14,
  radiusSm: 10,
  radiusLg: 20,
  // type
  fontHead: '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", system-ui, sans-serif',
  fontBody: '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", system-ui, sans-serif',
  fontSheet: '"Shippori Mincho", "Hiragino Mincho ProN", serif',
  serif: '"Noto Serif JP", serif',
  mono: '"Roboto Mono", ui-monospace, monospace',
  headWeight: 700,
  // density
  pad: 18,
  gap: 13,
  rowMin: 50,
  // labels
  labelSize: 13,
  labelWeight: 700,
  labelColor: '#1d3a52',
  labelCaps: false,
  // shadow
  card: '0 1px 2px rgba(28,42,56,.05), 0 1px 0 rgba(0,0,0,.02)',
  lift: '0 10px 30px rgba(28,42,56,.16)',
  fabShadow: '0 8px 24px rgba(29,58,82,.34)',
};

// ── B · 霧 (Kiri) — modern business SaaS. Light, crisp, cool, compact. ──
const THEME_KIRI = {
  key: 'kiri',
  name: '霧',
  tagline: 'すっきり業務SaaS',
  voiceStyle: 'sheet',        // bottom-sheet recording modal
  bg: '#f6f7f9',
  bgGrain: false,
  surface: '#ffffff',
  surfaceAlt: '#f1f3f6',
  ink: '#1b2330',
  sub: '#6b7585',
  faint: '#9aa3b1',
  line: '#e6e9ee',
  lineStrong: '#d6dae1',
  primary: '#2f6df0',
  primaryDeep: '#1f55cc',
  onPrimary: '#ffffff',
  accent: '#0e9f7f',
  accentSoft: '#e7f6f1',
  accentLine: '#bfe7da',
  danger: '#e0584f',
  warn: '#d6932a',
  radius: 12,
  radiusSm: 9,
  radiusLg: 16,
  fontHead: '"Noto Sans JP", system-ui, sans-serif',
  fontBody: '"Noto Sans JP", system-ui, sans-serif',
  fontSheet: '"Noto Sans JP", system-ui, sans-serif',
  serif: '"Noto Serif JP", serif',
  mono: '"Roboto Mono", ui-monospace, monospace',
  headWeight: 700,
  pad: 16,
  gap: 10,
  rowMin: 46,
  labelSize: 12,
  labelWeight: 600,
  labelColor: '#6b7585',
  labelCaps: true,
  card: '0 1px 2px rgba(20,30,48,.06)',
  lift: '0 12px 32px rgba(20,30,48,.14)',
  fabShadow: '0 8px 22px rgba(47,109,240,.32)',
};

// ── C · 現場 (Genba) — field-ready. High-contrast, huge targets, dark. ──
const THEME_GENBA = {
  key: 'genba',
  name: '現場',
  tagline: '手袋・直射日光OK',
  voiceStyle: 'fullscreen',   // full-screen recording takeover
  dark: true,
  bg: '#15181c',
  bgGrain: false,
  surface: '#1f242a',
  surfaceAlt: '#272d34',
  ink: '#f4f6f8',
  sub: '#9aa6b2',
  faint: '#6f7c89',
  line: '#333b44',
  lineStrong: '#444e58',
  primary: '#ff7a1a',
  primaryDeep: '#e9670c',
  onPrimary: '#1a1207',
  accent: '#ffce3a',
  accentSoft: '#2c2a1c',
  accentLine: '#5a4f24',
  danger: '#ff5d52',
  warn: '#ffce3a',
  radius: 16,
  radiusSm: 12,
  radiusLg: 22,
  fontHead: '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", system-ui, sans-serif',
  fontBody: '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", system-ui, sans-serif',
  fontSheet: '"Zen Kaku Gothic New", system-ui, sans-serif',
  serif: '"Noto Serif JP", serif',
  mono: '"Roboto Mono", ui-monospace, monospace',
  headWeight: 900,
  pad: 18,
  gap: 14,
  rowMin: 60,
  labelSize: 14,
  labelWeight: 800,
  labelColor: '#9aa6b2',
  labelCaps: false,
  card: '0 1px 0 rgba(0,0,0,.4)',
  lift: '0 16px 40px rgba(0,0,0,.5)',
  fabShadow: '0 10px 30px rgba(255,122,26,.45)',
};

const THEMES = { ai: THEME_AI, kiri: THEME_KIRI, genba: THEME_GENBA };
const THEME_ORDER = ['ai', 'kiri', 'genba'];

Object.assign(window, { THEMES, THEME_ORDER });
