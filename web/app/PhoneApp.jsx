// PhoneApp.jsx — app shell: state, routing, tab bar, localStorage persistence.
const { useState: useStateA, useMemo: useMemoA, useEffect: useEffectA } = React;

// ── persistence (履歴・マスタを端末に保存) ──
const LS_HISTORY = 'qp_history_v1';
const LS_DEFAULT = 'qp_defaultId_v1';
const LS_VENDORS = 'qp_vendors_v1';
const LS_DELIVS = 'qp_delivs_v1';
function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

function freshDraft(vendor, delivName, delivAddr) {
  const d = todayISO();
  return {
    orderDate: d, dueDate: addDaysISO(12), no: genNo(d),
    vendor,
    deliv: delivName || vendor.deliv || '',
    delivAddr: delivAddr || '',
    items: [{ maker: '', model: '', name: '', qty: '', unit: '個', note: '' }],
  };
}

function PhoneApp({ themeKey }) {
  const t = THEMES[themeKey];
  const [route, setRoute] = useStateA('home');
  const [history, setHistory] = useStateA(() => loadLS(LS_HISTORY, SEED_HISTORY));
  const [vendors, setVendors] = useStateA(() => loadLS(LS_VENDORS, SEED_VENDORS));
  const [delivs, setDelivs] = useStateA(() => loadLS(LS_DELIVS, SEED_DELIVS));
  const [defaultId, setDefaultId] = useStateA(() => loadLS(LS_DEFAULT, 'v1'));
  const defVendor = useMemoA(() => vendors.find(v => v.id === defaultId) || vendors[0], [vendors, defaultId]);
  const [draft, setDraft] = useStateA(() => freshDraft(SEED_VENDORS[0], SEED_VENDORS[0].deliv, ''));
  const [toast, setToast] = useStateA('');
  const flash = (m) => { setToast(m); clearTimeout(window['_qpT' + themeKey]); window['_qpT' + themeKey] = setTimeout(() => setToast(''), 2400); };

  useEffectA(() => { saveLS(LS_HISTORY, history); }, [history]);
  useEffectA(() => { saveLS(LS_DEFAULT, defaultId); }, [defaultId]);
  useEffectA(() => { saveLS(LS_VENDORS, vendors); }, [vendors]);
  useEffectA(() => { saveLS(LS_DELIVS, delivs); }, [delivs]);

  function newOrder(vendor) {
    const v = vendor || defVendor;
    const dl = delivs.find(d => d.name === v.deliv);
    setDraft(freshDraft(v, v.deliv, dl ? dl.addr : ''));
    setRoute('create');
  }
  function removeOrder(o) {
    setHistory(h => h.filter(x => x.id !== o.id));
    flash('発注履歴を削除しました');
  }
  function openOrder(o) {
    const v = vendors.find(x => x.name === o.vendor) || defVendor;
    const dl = delivs.find(d => d.name === (o.deliv || v.deliv));
    setDraft({ orderDate: o.date, dueDate: o.due, no: o.no === '（下書き）' ? genNo(o.date) : o.no, vendor: v, deliv: o.deliv || v.deliv || '', delivAddr: o.delivAddr != null ? o.delivAddr : (dl ? dl.addr : ''), items: o.items.map(x => ({ unit: '個', note: '', ...x })) });
    setRoute(o.status === 'draft' ? 'create' : 'preview');
  }
  function sendOrder() {
    const items = draft.items.filter(it => it.maker || it.model || it.name || it.qty);
    setHistory(h => [{
      id: 'n' + Date.now(), no: draft.no, vendor: draft.vendor.name, deliv: draft.deliv, delivAddr: draft.delivAddr || '', date: draft.orderDate,
      due: draft.dueDate, status: 'sent', lines: items.length, qty: items.reduce((s, it) => s + (parseInt(it.qty) || 0), 0), items,
    }, ...h.filter(o => o.status !== 'draft')]);
    setRoute('home'); flash('発注書を保存しました');
  }

  const showTabs = route === 'home' || route === 'vendors';

  return (
    <div style={{ position: 'relative', height: '100%', background: t.bg, color: t.ink, fontFamily: t.fontBody, overflow: 'hidden' }}>
      {t.bgGrain ? <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .5, backgroundImage: 'radial-gradient(rgba(120,110,80,.05) 1px, transparent 1px)', backgroundSize: '4px 4px', zIndex: 0 }} /> : null}
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {route === 'home' ? <HomeScreen t={t} history={history} vendorCount={vendors.length} onNew={() => newOrder()} onOpen={openOrder} onDelete={removeOrder} /> : null}
        {route === 'create' ? <CreateScreen t={t} draft={draft} setDraft={setDraft} vendors={vendors} delivs={delivs} onPreview={() => setRoute('preview')} onHome={() => setRoute('home')} flash={flash} /> : null}
        {route === 'preview' ? <PreviewScreen t={t} draft={draft} onBack={() => setRoute('create')} onSend={sendOrder} flash={flash} /> : null}
        {route === 'vendors' ? <MasterScreen t={t} vendors={vendors} setVendors={setVendors} delivs={delivs} setDelivs={setDelivs} defaultId={defaultId} setDefaultId={setDefaultId} onUse={(v) => newOrder(v)} flash={flash} /> : null}
      </div>

      {showTabs ? (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)', paddingTop: 8,
          background: t.dark ? 'rgba(21,24,28,.9)' : (t.key === 'kiri' ? 'rgba(255,255,255,.92)' : 'rgba(243,241,234,.94)'),
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: `1px solid ${t.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        }}>
          <TabBtn t={t} icon="home" label="ホーム" active={route === 'home'} onClick={() => setRoute('home')} />
          <button onClick={() => newOrder()} style={{
            width: 58, height: 58, borderRadius: 999, border: t.dark ? '3px solid #15181c' : '3px solid ' + t.bg, marginTop: -28,
            background: t.primary, color: t.onPrimary, cursor: 'pointer', boxShadow: t.fabShadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><Icon name="plus" size={28} color={t.onPrimary} sw={2.4} /></button>
          <TabBtn t={t} icon="building" label="マスタ" active={route === 'vendors'} onClick={() => setRoute('vendors')} />
        </div>
      ) : null}

      <Toast t={t} msg={toast} />
    </div>
  );
}

function TabBtn({ t, icon, label, active, onClick }) {
  const c = active ? t.primary : t.faint;
  return (
    <button onClick={onClick} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 22px', flex: 1 }}>
      <Icon name={icon} size={24} color={c} sw={active ? 2.2 : 1.9} />
      <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, color: c, fontFamily: t.fontHead }}>{label}</span>
    </button>
  );
}

Object.assign(window, { PhoneApp });
