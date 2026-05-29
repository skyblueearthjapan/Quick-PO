// ui.jsx — themed primitives + icon set shared by all screens.
// Everything is styled with inline styles from the theme token bag `t`.

// ───────────────────────── brand lockup (logo + 社名) — unified across themes ─────────────────────────
const BRAND_NAVY = '#1a3a52';
function BrandLockup({ t, size = 30, en = true, stack = true }) {
  const knockout = !!t.dark;                 // white logo on dark surfaces
  const nameColor = t.dark ? t.ink : BRAND_NAVY;
  const enColor = t.dark ? hexA(t.ink, .6) : hexA(BRAND_NAVY, .58);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
      <img src="brandkit/sakurai-logo-mark.png" alt="株式会社 桜井電装" draggable="false" style={{
        height: size, width: 'auto', flexShrink: 0,
        filter: knockout ? 'invert(1) brightness(1.06)' : 'none',
      }} />
      <div style={{ lineHeight: 1.18, minWidth: 0 }}>
        {en ? <div style={{ fontFamily: t.serif, fontSize: 10.5, letterSpacing: '.09em', color: enColor, fontWeight: 500, whiteSpace: 'nowrap' }}>SAKURAI DENSO CO., LTD.</div> : null}
        <div style={{ fontFamily: t.serif, fontSize: 17, fontWeight: 700, color: nameColor, letterSpacing: '.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>株式会社 桜井電装</div>
      </div>
    </div>
  );
}

// ───────────────────────── icons (simple stroke set) ─────────────────────────
function Icon({ name, size = 22, color = 'currentColor', sw = 1.9, fill = 'none', style }) {
  const p = { fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M3 11l9-7 9 7" {...p} /><path d="M5 9.5V20h14V9.5" {...p} /></>,
    doc: <><path d="M6 3h8l4 4v14H6z" {...p} /><path d="M14 3v4h4M9 12h6M9 16h6" {...p} /></>,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...p} /></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" {...p} /><path d="M5 11a7 7 0 0014 0M12 18v3" {...p} /></>,
    chevR: <path d="M9 5l7 7-7 7" {...p} />,
    chevL: <path d="M15 5l-7 7 7 7" {...p} />,
    back: <path d="M15 5l-7 7 7 7" {...p} />,
    check: <path d="M4 12l5 5L20 6" {...p} />,
    checkCircle: <><circle cx="12" cy="12" r="9" {...p} /><path d="M8 12l3 3 5-5" {...p} /></>,
    edit: <><path d="M5 19h14M7 15l9-9 3 3-9 9H7z" {...p} /></>,
    search: <><circle cx="11" cy="11" r="6" {...p} /><path d="M20 20l-4-4" {...p} /></>,
    print: <><path d="M7 9V3h10v6M7 17H5a2 2 0 01-2-2v-3a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2h-2" {...p} /><rect x="7" y="14" width="10" height="6" rx="1" {...p} /></>,
    download: <><path d="M12 4v11M7 11l5 5 5-5M5 20h14" {...p} /></>,
    x: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" {...p} /><path d="M8 10V7a4 4 0 018 0v3" {...p} /></>,
    building: <><path d="M5 21V5a1 1 0 011-1h8a1 1 0 011 1v16M15 9h3a1 1 0 011 1v11M3 21h18M8 8h2M8 12h2M8 16h2" {...p} /></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" {...p} /></>,
    pin: <><path d="M12 2l2.5 6.5L21 11l-5 4 1.5 7L12 18l-5.5 4L8 15l-5-4 6.5-2.5z" {...p} /></>,
    star: <path d="M12 3l2.6 6.3L21 9.8l-4.8 4.2L17.6 21 12 17.3 6.4 21l1.4-7L3 9.8l6.4-.5z" {...p} />,
    phone: <path d="M5 4h4l1.5 5-2 1.5a11 11 0 005 5l1.5-2 5 1.5v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" {...p} />,
    truck: <><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" {...p} /><circle cx="7" cy="18" r="1.6" {...p} /><circle cx="17" cy="18" r="1.6" {...p} /></>,
    cal: <><rect x="4" y="5" width="16" height="16" rx="2" {...p} /><path d="M4 9h16M8 3v4M16 3v4" {...p} /></>,
    sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" {...p} /><path d="M18 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" {...p} /></>,
    settings: <><circle cx="12" cy="12" r="3" {...p} /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...p} /></>,
    chart: <><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" {...p} /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" {...p} /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" {...p} /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">{paths[name] || null}</svg>
  );
}

// ───────────────────────── status-bar-safe header ─────────────────────────
function AppHeader({ t, title, sub, left, right, onLeft, big }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: t.dark ? 'rgba(21,24,28,.86)' : (t.key === 'kiri' ? 'rgba(255,255,255,.88)' : 'rgba(243,241,234,.9)'),
      backdropFilter: 'saturate(180%) blur(14px)', WebkitBackdropFilter: 'saturate(180%) blur(14px)',
      borderBottom: `1px solid ${t.line}`,
      paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingLeft: t.pad, paddingRight: t.pad, paddingBottom: 11,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 34 }}>
        {left !== undefined ? (
          <button onClick={onLeft} style={{
            border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, margin: '-4px 0 -4px -4px',
            display: 'flex', alignItems: 'center', gap: 3, color: t.primary, fontSize: 15, fontWeight: 600,
            fontFamily: t.fontBody,
          }}>{left}</button>
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.fontHead, fontWeight: t.headWeight, color: t.ink,
            fontSize: big ? 26 : 18, letterSpacing: '.01em', lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{title}</div>
          {sub ? <div style={{ fontSize: 12, color: t.sub, marginTop: 2, fontFamily: t.fontBody }}>{sub}</div> : null}
        </div>
        {right || null}
      </div>
    </div>
  );
}

// ───────────────────────── buttons ─────────────────────────
function Btn({ t, kind = 'primary', children, icon, full, onClick, style, size = 'md', disabled }) {
  const h = size === 'lg' ? 56 : size === 'sm' ? 38 : 48;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: h, padding: size === 'sm' ? '0 14px' : '0 18px',
    width: full ? '100%' : undefined, borderRadius: t.radius,
    fontFamily: t.fontHead, fontWeight: t.key === 'genba' ? 800 : 700,
    fontSize: size === 'lg' ? 18 : 16, cursor: disabled ? 'default' : 'pointer',
    border: '1.5px solid transparent', transition: 'transform .08s, filter .15s, background .15s',
    opacity: disabled ? 0.45 : 1, lineHeight: 1, boxSizing: 'border-box', whiteSpace: 'nowrap',
  };
  const kinds = {
    primary: { background: t.primary, color: t.onPrimary, boxShadow: t.fabShadow, borderColor: t.primary },
    accent: { background: t.accent, color: t.dark ? t.onPrimary : '#fff', borderColor: t.accent },
    ghost: { background: 'transparent', color: t.primary, borderColor: t.lineStrong },
    soft: { background: t.dark ? t.surfaceAlt : t.surfaceAlt, color: t.ink, borderColor: t.line },
    danger: { background: 'transparent', color: t.danger, borderColor: 'transparent' },
  };
  return (
    <button onClick={disabled ? undefined : onClick}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      style={{ ...base, ...kinds[kind], ...style }}>
      {icon ? <Icon name={icon} size={size === 'lg' ? 22 : 19} color="currentColor" sw={t.key === 'genba' ? 2.2 : 1.9} /> : null}
      {children}
    </button>
  );
}

// ───────────────────────── inputs ─────────────────────────
function Field({ t, label, req, hint, children, style }) {
  return (
    <label style={{ display: 'block', marginBottom: t.gap + 2, ...style }}>
      {label ? (
        <span style={{
          display: 'block', marginBottom: 5,
          fontFamily: t.fontHead, fontSize: t.labelSize, fontWeight: t.labelWeight, color: t.labelColor,
          textTransform: t.labelCaps ? 'uppercase' : 'none', letterSpacing: t.labelCaps ? '.06em' : 0,
        }}>{label}{req ? <span style={{ color: t.danger, fontSize: 11, marginLeft: 5 }}>必須</span> : null}</span>
      ) : null}
      {children}
      {hint ? <span style={{ display: 'block', marginTop: 5, fontSize: 11.5, color: t.faint }}>{hint}</span> : null}
    </label>
  );
}

function inputStyle(t, mono) {
  return {
    width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 13px',
    border: `1.5px solid ${t.line}`, borderRadius: t.radiusSm, background: t.surface,
    color: t.ink, fontSize: 16, fontFamily: mono ? t.mono : t.fontBody, outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
  };
}
function TextInput({ t, mono, onFocus, onBlur, style, ...rest }) {
  return (
    <input {...rest}
      onFocus={e => { e.target.style.borderColor = t.primary; e.target.style.boxShadow = `0 0 0 3px ${hexA(t.primary, .14)}`; onFocus && onFocus(e); }}
      onBlur={e => { e.target.style.borderColor = t.line; e.target.style.boxShadow = 'none'; onBlur && onBlur(e); }}
      style={{ ...inputStyle(t, mono), ...style }} />
  );
}

// themed select (pulldown)
function SelectInput({ t, value, onChange, children, mono, style }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={onChange} style={{
        ...inputStyle(t, mono), appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
        paddingRight: 40, cursor: 'pointer', ...style,
      }}>{children}</select>
      <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
        <Icon name="chevR" size={16} color={t.faint} style={{ transform: 'rotate(90deg)' }} />
      </span>
    </div>
  );
}

// locked / auto display rows (read-only)
function ReadRow({ t, children, badge, kind = 'lock' }) {
  const isAuto = kind === 'auto';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      minHeight: 48, padding: '11px 13px', borderRadius: t.radiusSm, fontSize: 15.5,
      background: isAuto ? t.accentSoft : t.surfaceAlt,
      border: `1.5px ${isAuto ? 'solid' : 'dashed'} ${isAuto ? t.accentLine : t.lineStrong}`,
      color: isAuto ? (t.dark ? t.accent : '#23413a') : t.ink,
      fontFamily: isAuto ? t.mono : t.fontBody,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>{children}</span>
      {badge ? <span style={{ fontSize: 11, color: isAuto ? t.accent : t.faint, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>{badge}</span> : null}
    </div>
  );
}

// section divider with centered caption
function SectionRule({ t, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 14px' }}>
      <span style={{ flex: 1, height: 1, background: t.line }} />
      <span style={{ fontFamily: t.fontHead, fontSize: 12.5, fontWeight: 700, color: t.sub, letterSpacing: '.12em' }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: t.line }} />
    </div>
  );
}

// status pill
function StatusPill({ t, status }) {
  const map = {
    draft: { bg: hexA(t.faint, .16), fg: t.sub, label: '下書き' },
    sent: { bg: hexA(t.primary, .14), fg: t.primary, label: '送信済' },
    received: { bg: hexA(t.accent, .18), fg: t.dark ? t.accent : '#1c6b56', label: '納品済' },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
      background: s.bg, color: s.fg, fontFamily: t.fontHead, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

// toast
function Toast({ t, msg }) {
  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 92, transform: `translateX(-50%) translateY(${msg ? 0 : 16}px)`,
      background: t.dark ? '#000' : t.primary, color: '#fff', padding: '11px 18px', borderRadius: 12,
      fontSize: 13.5, fontFamily: t.fontBody, fontWeight: 600, boxShadow: '0 10px 30px rgba(0,0,0,.3)',
      opacity: msg ? 1 : 0, pointerEvents: 'none', transition: '.25s', zIndex: 80, maxWidth: '86%',
      textAlign: 'center', whiteSpace: 'nowrap',
    }}>{msg}</div>
  );
}

// bottom sheet shell
function Sheet({ t, open, onClose, children, height }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 60,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .25s',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 70,
        background: t.surface, borderTopLeftRadius: t.radiusLg + 6, borderTopRightRadius: t.radiusLg + 6,
        boxShadow: '0 -10px 40px rgba(0,0,0,.25)', transform: `translateY(${open ? 0 : 110}%)`,
        transition: 'transform .32s cubic-bezier(.2,.8,.2,1)', maxHeight: '88%', height,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <span style={{ width: 40, height: 5, borderRadius: 999, background: t.lineStrong }} />
        </div>
        {children}
      </div>
    </>
  );
}

// animated waveform (canvas-free, bar based)
function Waveform({ t, active, color, bars = 28, height = 46 }) {
  const c = color || t.primary;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height }}>
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} style={{
          width: 3, borderRadius: 3, background: c,
          height: active ? '100%' : 4, alignSelf: 'center',
          animation: active ? `qpWave 1s ease-in-out ${(i % 7) * 0.09}s infinite` : 'none',
          transformOrigin: 'center',
        }} />
      ))}
    </div>
  );
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

Object.assign(window, {
  Icon, AppHeader, Btn, Field, TextInput, SelectInput, ReadRow, SectionRule, StatusPill, Toast, Sheet, Waveform,
  inputStyle, hexA, BrandLockup, BRAND_NAVY,
});
