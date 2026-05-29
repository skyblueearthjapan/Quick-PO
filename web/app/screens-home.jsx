// screens-home.jsx — ホーム / 発注履歴 + 発注先マスタ
const { useState: useStateH } = React;

// ───────────────────────── history row ─────────────────────────
function OrderRow({ t, o, onOpen }) {
  const head = o.items[0];
  return (
    <button onClick={() => onOpen(o)} style={{
      all: 'unset', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      width: '100%', boxSizing: 'border-box', padding: `${t.pad - 4}px ${t.pad - 2}px`,
      background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: t.radius,
      marginBottom: t.gap, boxShadow: t.card,
    }}>
      <span style={{
        width: 44, height: 44, borderRadius: t.radiusSm, flexShrink: 0,
        background: o.status === 'draft' ? hexA(t.faint, .14) : hexA(t.primary, .1),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon name={o.status === 'draft' ? 'edit' : 'doc'} size={22} color={o.status === 'draft' ? t.sub : t.primary} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: t.fontHead, fontWeight: 700, color: t.ink, fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.vendor}</span>
          <StatusPill t={t} status={o.status} />
        </span>
        <span style={{ display: 'block', fontSize: 12.5, color: t.sub, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {head.name || head.model}{o.lines > 1 ? ` 他${o.lines - 1}件` : ''} ・ {o.qty}点
        </span>
        <span style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11.5, color: t.faint, fontFamily: t.mono }}>
          <span>{o.no}</span><span>{jpDateShort(o.date)}発注</span>
        </span>
      </span>
      <Icon name="chevR" size={18} color={t.faint} />
    </button>
  );
}

// ───────────────────────── home ─────────────────────────
function HomeScreen({ t, history, onNew, onOpen }) {
  const drafts = history.filter(o => o.status === 'draft');
  const done = history.filter(o => o.status !== 'draft');
  const thisMonth = history.filter(o => o.status !== 'draft' && o.date >= todayISO().slice(0, 7)).length
    || history.filter(o => o.status !== 'draft').length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: t.dark ? 'rgba(21,24,28,.88)' : (t.key === 'kiri' ? 'rgba(255,255,255,.9)' : 'rgba(243,241,234,.92)'),
        backdropFilter: 'saturate(180%) blur(14px)', WebkitBackdropFilter: 'saturate(180%) blur(14px)',
        borderBottom: `1px solid ${t.line}`,
        paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingLeft: t.pad, paddingRight: t.pad, paddingBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <BrandLockup t={t} size={30} />
          <span style={{ fontFamily: t.mono, fontSize: 12, color: t.faint, flexShrink: 0 }}>{jpDateShort(todayISO())}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 12 }}>
          <span style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 26, color: t.ink, lineHeight: 1, letterSpacing: '.01em' }}>発注</span>
          <span style={{ fontSize: 12.5, color: t.sub, paddingBottom: 2 }}>発注書の作成・履歴</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: `${t.pad}px ${t.pad}px 150px` }}>

        {/* quick action */}
        <button onClick={onNew} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
          padding: `${t.pad}px`, marginBottom: t.pad, borderRadius: t.radiusLg, border: 'none',
          background: t.primary, color: t.onPrimary, boxShadow: t.fabShadow, textAlign: 'left',
        }}>
          <span style={{ width: 50, height: 50, borderRadius: 999, background: hexA('#ffffff', t.dark ? .14 : .2), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="mic" size={26} color={t.onPrimary} sw={2.1} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontFamily: t.fontHead, fontWeight: t.key === 'genba' ? 900 : 700, fontSize: 18 }}>発注書を作成</span>
            <span style={{ display: 'block', fontSize: 12.5, opacity: .85, marginTop: 2 }}>話すだけでAIが明細に整理</span>
          </span>
          <Icon name="chevR" size={22} color={t.onPrimary} />
        </button>

        {/* stat strip */}
        <div style={{ display: 'flex', gap: t.gap, marginBottom: 22 }}>
          {[['今月の発注', thisMonth, '件'], ['下書き', drafts.length, '件'], ['発注先', SEED_VENDORS.length, '社']].map(([k, n, u]) => (
            <div key={k} style={{ flex: 1, background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: t.radius, padding: '12px 10px', boxShadow: t.card }}>
              <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 3 }}>{k}</div>
              <div style={{ fontFamily: t.fontHead, fontWeight: 800, color: t.ink }}>
                <span style={{ fontSize: 24 }}>{n}</span><span style={{ fontSize: 12, color: t.sub, marginLeft: 2 }}>{u}</span>
              </div>
            </div>
          ))}
        </div>

        {drafts.length ? (
          <>
            <SectionLabel t={t}>下書き</SectionLabel>
            {drafts.map(o => <OrderRow key={o.id} t={t} o={o} onOpen={onOpen} />)}
          </>
        ) : null}

        <SectionLabel t={t}>最近の発注</SectionLabel>
        {done.map(o => <OrderRow key={o.id} t={t} o={o} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

function SectionLabel({ t, children }) {
  return <div style={{ fontFamily: t.fontHead, fontWeight: 700, fontSize: 13, color: t.sub, margin: '4px 2px 10px', letterSpacing: '.04em' }}>{children}</div>;
}

// ───────────────────────── vendors (発注先マスタ) ─────────────────────────
function VendorScreen({ t, vendors, defaultId, setDefaultId, onUse, flash }) {
  const [q, setQ] = useStateH('');
  const [detail, setDetail] = useStateH(null);
  const list = vendors
    .filter(v => !q || (v.name + v.kana + v.tags.join('')).includes(q))
    .sort((a, b) => (b.id === defaultId) - (a.id === defaultId) || (b.pinned - a.pinned));

  if (detail) {
    return <VendorDetail t={t} v={detail} isDefault={detail.id === defaultId}
      onBack={() => setDetail(null)} onUse={() => onUse(detail)}
      onSetDefault={() => { setDefaultId(detail.id); flash(`${detail.name}を既定に設定`); }} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader t={t} title="発注先マスタ" big
        right={<span style={{ width: 40, height: 40, borderRadius: 999, background: hexA(t.primary, .1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={22} color={t.primary} /></span>} />
      <div style={{ flex: 1, overflowY: 'auto', padding: `${t.pad}px ${t.pad}px 150px` }}>
        <div style={{ position: 'relative', marginBottom: t.pad }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Icon name="search" size={18} color={t.faint} /></span>
          <TextInput t={t} value={q} onChange={e => setQ(e.target.value)} placeholder="発注先を検索" style={{ paddingLeft: 40 }} />
        </div>
        {list.map(v => (
          <button key={v.id} onClick={() => setDetail(v)} style={{
            all: 'unset', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', width: '100%', boxSizing: 'border-box',
            padding: `${t.pad - 4}px ${t.pad - 2}px`, background: t.surface, border: `1.5px solid ${v.id === defaultId ? t.accentLine : t.line}`,
            borderRadius: t.radius, marginBottom: t.gap, boxShadow: t.card,
          }}>
            <span style={{ width: 44, height: 44, borderRadius: t.radiusSm, background: hexA(t.primary, .1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="building" size={22} color={t.primary} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontFamily: t.fontHead, fontWeight: 700, color: t.ink, fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</span>
                {v.id === defaultId ? <span style={{ fontSize: 10.5, fontWeight: 700, color: t.dark ? t.accent : '#1c6b56', background: hexA(t.accent, .18), padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>既定</span> : null}
              </span>
              <span style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                {v.tags.map(tag => <span key={tag} style={{ fontSize: 11, color: t.sub, background: t.surfaceAlt, border: `1px solid ${t.line}`, padding: '2px 8px', borderRadius: 999 }}>{tag}</span>)}
              </span>
            </span>
            <Icon name="chevR" size={18} color={t.faint} />
          </button>
        ))}
      </div>
    </div>
  );
}

function VendorDetail({ t, v, isDefault, onBack, onUse, onSetDefault }) {
  const rows = [['電話', v.tel, 'phone'], ['担当', v.staff, 'building'], ['納品場所', v.deliv, 'truck']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader t={t} title={v.name} left={<><Icon name="chevL" size={20} color={t.primary} />マスタ</>} onLeft={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: `${t.pad}px ${t.pad}px 130px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <span style={{ width: 60, height: 60, borderRadius: t.radius, background: hexA(t.primary, .1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="building" size={30} color={t.primary} />
          </span>
          <div>
            <div style={{ fontFamily: t.fontHead, fontWeight: 800, color: t.ink, fontSize: 20 }}>{v.name}</div>
            <div style={{ fontSize: 12.5, color: t.sub, marginTop: 2 }}>{v.kana} ・ 最終 {jpDateShort(v.last)}</div>
          </div>
        </div>

        <div style={{ background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: t.radius, overflow: 'hidden', boxShadow: t.card, marginBottom: t.pad }}>
          {rows.map(([k, val, ic], i) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `13px ${t.pad - 2}px`, borderBottom: i < rows.length - 1 ? `1px solid ${t.line}` : 'none' }}>
              <Icon name={ic} size={18} color={t.faint} />
              <span style={{ fontSize: 13, color: t.sub, width: 78 }}>{k}</span>
              <span style={{ fontSize: 15, color: t.ink, flex: 1, textAlign: 'right', fontFamily: k === '電話' ? t.mono : t.fontBody }}>{val}</span>
            </div>
          ))}
        </div>

        <button onClick={onSetDefault} disabled={isDefault} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: isDefault ? 'default' : 'pointer',
          padding: 14, borderRadius: t.radius, border: `1.5px solid ${isDefault ? t.accentLine : t.line}`,
          background: isDefault ? hexA(t.accent, .12) : t.surface, color: isDefault ? (t.dark ? t.accent : '#1c6b56') : t.ink,
          fontFamily: t.fontHead, fontWeight: 700, fontSize: 15,
        }}>
          <Icon name={isDefault ? 'checkCircle' : 'star'} size={19} color={isDefault ? (t.dark ? t.accent : '#1c6b56') : t.sub} />
          {isDefault ? 'この発注先が既定です' : '既定の発注先にする'}
        </button>
      </div>

      <div style={{ padding: `12px ${t.pad}px calc(env(safe-area-inset-bottom) + 14px)`, borderTop: `1px solid ${t.line}`, background: t.dark ? 'rgba(21,24,28,.92)' : 'rgba(255,255,255,.0)' }}>
        <Btn t={t} kind="primary" full size="lg" onClick={onUse}><Icon name="doc" size={20} color={t.onPrimary} />この発注先で作成</Btn>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, VendorScreen, VendorDetail, OrderRow });
