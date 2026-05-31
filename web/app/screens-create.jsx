// screens-create.jsx — 発注書作成 screen + voice capture (3 UX variants) + line items
const { useState: useStateC, useEffect: useEffectC, useRef: useRefC } = React;

// ───────────────────────── speech hook (real, with graceful fallback) ─────────────────────────
function useVoice(initial = '') {
  const [rec, setRec] = React.useState(false);
  const [text, setText] = React.useState(initial);
  const [elapsed, setElapsed] = React.useState(0);
  const recogRef = React.useRef(null);
  const timerRef = React.useRef(null);
  const baseRef = React.useRef('');
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = !!SR;

  function start() {
    setRec(true); setElapsed(0);
    baseRef.current = text ? text.trim() + '　' : '';
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    if (SR) {
      try {
        const r = new SR(); r.lang = 'ja-JP'; r.continuous = true; r.interimResults = true;
        r.onresult = (e) => {
          let s = '';
          for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
          setText(baseRef.current + s);
        };
        r.onerror = () => {};
        r.start(); recogRef.current = r;
      } catch (_) {}
    }
  }
  function stop() {
    setRec(false);
    clearInterval(timerRef.current);
    if (recogRef.current) { try { recogRef.current.stop(); } catch (_) {} recogRef.current = null; }
  }
  React.useEffect(() => () => { clearInterval(timerRef.current); if (recogRef.current) try { recogRef.current.stop(); } catch (_) {} }, []);
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  return { rec, text, setText, elapsed, mmss, start, stop, supported };
}

// ───────────────────────── line item card ─────────────────────────
function LineItemCard({ t, idx, item, onChange, onDelete, fresh }) {
  const set = (k, v) => onChange({ ...item, [k]: v });
  const subLabel = (s) => (
    <span style={{ display: 'block', fontSize: 11.5, color: t.sub, fontWeight: 600, margin: '9px 0 4px', fontFamily: t.fontBody }}>{s}</span>
  );
  return (
    <div style={{
      background: t.surface, border: `1.5px solid ${fresh ? t.accentLine : t.line}`, borderRadius: t.radius,
      padding: t.pad - 2, marginBottom: t.gap, boxShadow: t.card, position: 'relative',
      transition: 'border-color .4s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: t.onPrimary, background: t.primary,
          borderRadius: 999, padding: '3px 12px', fontFamily: t.fontHead,
        }}>No.{idx + 1}</span>
        <button onClick={onDelete} aria-label="削除" style={{
          border: 'none', background: 'transparent', cursor: 'pointer', color: t.danger,
          padding: 6, margin: -6, display: 'flex',
        }}><Icon name="trash" size={19} color={t.danger} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: t.gap }}>
        <div>{subLabel('メーカー')}<TextInput t={t} value={item.maker} placeholder="例）パナソニック" onChange={e => set('maker', e.target.value)} /></div>
        <div>{subLabel('型式・品番')}<TextInput t={t} mono value={item.model} placeholder="BQR34204" onChange={e => set('model', e.target.value)} /></div>
      </div>
      {subLabel('品名')}
      <TextInput t={t} value={item.name} placeholder="例）住宅分電盤" onChange={e => set('name', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: t.gap }}>
        <div>{subLabel('数量')}
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <TextInput t={t} type="number" inputMode="numeric" value={item.qty} placeholder="0" onChange={e => set('qty', e.target.value)} style={{ flex: 1 }} />
            <select value={item.unit} onChange={e => set('unit', e.target.value)} style={{
              border: `1.5px solid ${t.line}`, borderRadius: t.radiusSm, background: t.surface, color: t.ink,
              fontSize: 15, fontFamily: t.fontBody, padding: '0 8px', minWidth: 64, cursor: 'pointer',
            }}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
          </div>
        </div>
        <div>{subLabel('備考')}<TextInput t={t} value={item.note} placeholder="（任意）" onChange={e => set('note', e.target.value)} /></div>
      </div>
    </div>
  );
}

// ───────────────────────── voice: variant A · inline bar (藍) ─────────────────────────
function VoiceBar({ t, onItems, flash }) {
  const v = useVoice();
  const [busy, setBusy] = useStateC(false);
  async function convert() {
    if (!v.text.trim()) { flash('テキストが空です'); return; }
    setBusy(true);
    const items = await aiParse(v.text);
    setBusy(false);
    if (!items.length) { flash('うまく解析できませんでした'); return; }
    onItems(items); v.setText('');
    flash(`${items.length}件を明細に変換しました`);
  }
  return (
    <div style={{ background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: t.radius, padding: t.pad, boxShadow: t.card }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon name="mic" size={20} color={t.primary} />
        <span style={{ fontFamily: t.fontHead, fontWeight: 700, color: t.ink, fontSize: 15 }}>話して入力</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: t.faint }}>{v.supported ? 'マイク対応' : '音声→手入力'}</span>
      </div>

      {v.rec ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', marginBottom: 12,
          background: hexA(t.primary, .06), border: `1.5px solid ${hexA(t.primary, .25)}`, borderRadius: t.radiusSm,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: t.danger, animation: 'qpBlink 1s infinite' }} />
          <div style={{ flex: 1, overflow: 'hidden' }}><Waveform t={t} active height={28} bars={22} /></div>
          <span style={{ fontFamily: t.mono, fontSize: 14, color: t.primary, fontWeight: 600 }}>{v.mmss}</span>
        </div>
      ) : null}

      <textarea value={v.text} onChange={e => v.setText(e.target.value)}
        placeholder="例）パナソニックの分電盤BQR34204を2面、テンパールのブレーカB-32を3個…"
        style={{
          width: '100%', boxSizing: 'border-box', minHeight: 76, padding: 12, resize: 'vertical',
          border: `1.5px solid ${t.line}`, borderRadius: t.radiusSm, background: t.surfaceAlt, color: t.ink,
          fontSize: 15, fontFamily: t.fontBody, lineHeight: 1.6, outline: 'none',
        }} />

      <div style={{ display: 'flex', gap: 9, marginTop: 11 }}>
        <Btn t={t} kind={v.rec ? 'danger' : 'soft'} size="md" onClick={v.rec ? v.stop : v.start}
          style={v.rec ? { background: hexA(t.danger, .12), borderColor: t.danger } : {}}>
          <Icon name="mic" size={18} color={v.rec ? t.danger : t.ink} />{v.rec ? '停止' : '録音'}
        </Btn>
        <Btn t={t} kind="ghost" size="md" onClick={() => v.setText(SAMPLE_UTTERANCE)}>例文</Btn>
        <Btn t={t} kind="accent" size="md" full onClick={convert} disabled={busy}>
          {busy ? <><Spinner /> 解析中…</> : <><Icon name="sparkle" size={18} color="#fff" /> AIで変換</>}
        </Btn>
      </div>
    </div>
  );
}

// ───────────────────────── voice: variant B · bottom sheet (霧) ─────────────────────────
function VoiceSheet({ t, onItems, flash }) {
  const [open, setOpen] = useStateC(false);
  const v = useVoice();
  const [busy, setBusy] = useStateC(false);
  async function convert() {
    if (!v.text.trim()) { flash('テキストが空です'); return; }
    setBusy(true);
    const items = await aiParse(v.text);
    setBusy(false);
    if (!items.length) { flash('解析できませんでした'); return; }
    onItems(items); v.setText(''); v.stop(); setOpen(false);
    flash(`${items.length}件を明細に変換しました`);
  }
  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: t.radius, cursor: 'pointer',
        boxShadow: t.card, textAlign: 'left',
      }}>
        <span style={{ width: 40, height: 40, borderRadius: 999, background: hexA(t.accent, .14), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="mic" size={22} color={t.accent} />
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontFamily: t.fontHead, fontWeight: 700, color: t.ink, fontSize: 15 }}>話して明細を入力</span>
          <span style={{ display: 'block', fontSize: 12, color: t.sub, marginTop: 2 }}>AIが品名・型式・数量に整理します</span>
        </span>
        <Icon name="chevR" size={18} color={t.faint} />
      </button>

      <Sheet t={t} open={open} onClose={() => { v.stop(); setOpen(false); }}>
        <div style={{ padding: `8px ${t.pad}px calc(env(safe-area-inset-bottom) + ${t.pad}px)`, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 14px' }}>
            <span style={{ fontFamily: t.fontHead, fontWeight: 700, fontSize: 17, color: t.ink }}>話して入力</span>
            <button onClick={() => { v.stop(); setOpen(false); }} style={{ border: 'none', background: t.surfaceAlt, borderRadius: 999, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={17} color={t.sub} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0 18px' }}>
            <button onClick={v.rec ? v.stop : v.start} style={{
              width: 88, height: 88, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: v.rec ? t.danger : t.accent, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              boxShadow: v.rec ? `0 0 0 0 ${hexA(t.danger, .4)}` : t.fabShadow,
              animation: v.rec ? 'qpPulse 1.4s infinite' : 'none',
            }}>
              <Icon name={v.rec ? 'doc' : 'mic'} size={36} color="#fff" sw={2} />
            </button>
            <div style={{ height: 30 }}><Waveform t={t} active={v.rec} color={t.accent} height={30} bars={24} /></div>
            <span style={{ fontFamily: t.mono, fontSize: 14, color: v.rec ? t.danger : t.faint, fontWeight: 600 }}>
              {v.rec ? `● 録音中  ${v.mmss}` : (v.supported ? 'タップして話す' : 'タップ後、下に入力もできます')}
            </span>
          </div>

          <textarea value={v.text} onChange={e => v.setText(e.target.value)} placeholder="認識テキスト（編集できます）"
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 84, padding: 12, resize: 'vertical', border: `1.5px solid ${t.line}`, borderRadius: t.radiusSm, background: t.surfaceAlt, color: t.ink, fontSize: 15, fontFamily: t.fontBody, lineHeight: 1.6, outline: 'none' }} />
          <button onClick={() => v.setText(SAMPLE_UTTERANCE)} style={{ marginTop: 8, border: 'none', background: 'transparent', color: t.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>＋ 例文を入れる</button>

          <Btn t={t} kind="accent" full size="lg" style={{ marginTop: 14 }} onClick={convert} disabled={busy}>
            {busy ? <><Spinner /> 解析中…</> : <><Icon name="sparkle" size={20} color="#fff" /> AIで明細に変換</>}
          </Btn>
        </div>
      </Sheet>
    </>
  );
}

// ───────────────────────── voice: variant C · fullscreen takeover (現場) ─────────────────────────
function VoiceFull({ t, onItems, flash }) {
  const [open, setOpen] = useStateC(false);
  const [stage, setStage] = useStateC('rec'); // rec | busy | confirm
  const [items, setItems] = useStateC([]);
  const v = useVoice();
  function launch() { setOpen(true); setStage('rec'); setItems([]); v.setText(''); setTimeout(v.start, 250); }
  async function done() {
    v.stop(); setStage('busy');
    const r = await aiParse(v.text);
    if (!r.length) { setStage('rec'); flash('もう一度話してください'); v.start(); return; }
    setItems(r); setStage('confirm');
  }
  function commit() { onItems(items); setOpen(false); flash(`${items.length}件を追加しました`); }
  return (
    <>
      <button onClick={launch} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: '20px 16px', background: t.primary, color: t.onPrimary, border: 'none',
        borderRadius: t.radiusLg, cursor: 'pointer', boxShadow: t.fabShadow,
        fontFamily: t.fontHead, fontWeight: 900, fontSize: 20,
      }}>
        <Icon name="mic" size={28} color={t.onPrimary} sw={2.2} />話して入力する
      </button>

      {open ? (
        <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: t.bg, display: 'flex', flexDirection: 'column' }}>
          <div style={{ paddingTop: 56, paddingLeft: t.pad, paddingRight: t.pad, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => { v.stop(); setOpen(false); }} style={{ border: 'none', background: t.surface, borderRadius: 999, width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: t.card }}>
              <Icon name="x" size={22} color={t.ink} sw={2.2} />
            </button>
          </div>

          {stage === 'rec' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, padding: t.pad }}>
              <span style={{ fontFamily: t.fontHead, fontWeight: 900, fontSize: 24, color: t.ink, textAlign: 'center' }}>
                {v.rec ? '聞いています…' : '準備中'}
              </span>
              <div style={{ width: '100%' }}><Waveform t={t} active={v.rec} color={t.primary} height={70} bars={30} /></div>
              <span style={{ fontFamily: t.mono, fontSize: 18, color: t.primary, fontWeight: 700 }}>● {v.mmss}</span>
              <div style={{ minHeight: 64, width: '100%', background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: t.radius, padding: 14, color: v.text ? t.ink : t.faint, fontSize: 16, lineHeight: 1.5, maxHeight: 140, overflowY: 'auto' }}>
                {v.text || (v.supported ? '例）パナソニックの分電盤を2面、ブレーカを3個…' : 'マイクが使えない場合は「例文」で試せます')}
              </div>
              {!v.text && !v.supported ? (
                <Btn t={t} kind="ghost" onClick={() => v.setText(SAMPLE_UTTERANCE)}>例文を入れる</Btn>
              ) : null}
              <button onClick={done} disabled={!v.text.trim()} style={{
                width: 96, height: 96, borderRadius: 999, border: 'none', cursor: v.text.trim() ? 'pointer' : 'default',
                background: t.primary, color: t.onPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: t.fabShadow, opacity: v.text.trim() ? 1 : 0.4, animation: v.rec ? 'qpPulse 1.4s infinite' : 'none',
              }}>
                <Icon name="check" size={44} color={t.onPrimary} sw={3} />
              </button>
              <span style={{ fontSize: 14, color: t.sub }}>話し終えたら ✓ をタップ</span>
            </div>
          ) : null}

          {stage === 'busy' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <Spinner big color={t.primary} />
              <span style={{ fontFamily: t.fontHead, fontWeight: 800, fontSize: 20, color: t.ink }}>AIが明細に整理中…</span>
              <span style={{ fontSize: 14, color: t.sub, maxWidth: 240, textAlign: 'center' }}>{v.text}</span>
            </div>
          ) : null}

          {stage === 'confirm' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: `4px ${t.pad}px 10px` }}>
                <span style={{ fontFamily: t.fontHead, fontWeight: 900, fontSize: 22, color: t.ink }}>これで合ってますか？</span>
                <span style={{ display: 'block', fontSize: 14, color: t.sub, marginTop: 3 }}>{items.length}件を認識しました</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${t.pad}px` }}>
                {items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: t.radius, padding: 14, marginBottom: 10 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: t.primary, fontFamily: t.mono, minWidth: 40, textAlign: 'right' }}>{it.qty || '?'}</span>
                    <span style={{ fontSize: 13, color: t.sub }}>{it.unit}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 800, color: t.ink, fontSize: 17 }}>{it.name || it.model || '（品名）'}</span>
                      <span style={{ display: 'block', fontSize: 13, color: t.sub, fontFamily: t.mono }}>{[it.maker, it.model].filter(Boolean).join(' / ') || '—'}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, padding: `12px ${t.pad}px calc(env(safe-area-inset-bottom) + 16px)` }}>
                <Btn t={t} kind="ghost" size="lg" onClick={() => { setStage('rec'); v.start(); }}>やり直す</Btn>
                <Btn t={t} kind="primary" size="lg" full onClick={commit}><Icon name="plus" size={22} color={t.onPrimary} sw={2.4} />明細に追加</Btn>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function Spinner({ big, color = '#fff' }) {
  const s = big ? 44 : 17;
  return <span style={{ width: s, height: s, borderRadius: 999, border: `${big ? 4 : 2.5}px solid ${hexA(color, .25)}`, borderTopColor: color, display: 'inline-block', animation: 'qpSpin .8s linear infinite' }} />;
}

// ───────────────────────── create screen ─────────────────────────
function CreateScreen({ t, draft, setDraft, vendors = [], delivs = [], onPreview, onHome, flash }) {
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setItem = (i, it) => setDraft(d => ({ ...d, items: d.items.map((x, j) => j === i ? it : x) }));
  const delItem = (i) => setDraft(d => ({ ...d, items: d.items.filter((_, j) => j !== i) }));
  const addItem = () => setDraft(d => ({ ...d, items: [...d.items, { maker: '', model: '', name: '', qty: '', unit: '個', note: '', fresh: true }] }));
  const addItems = (arr) => setDraft(d => ({ ...d, items: [...d.items.filter(x => x.maker || x.model || x.name || x.qty), ...arr.map(a => ({ ...a, fresh: true }))] }));

  const Voice = t.voiceStyle === 'sheet' ? VoiceSheet : t.voiceStyle === 'fullscreen' ? VoiceFull : VoiceBar;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader t={t} title="発注書を作成" left={<><Icon name="chevL" size={20} color={t.primary} />一覧</>} onLeft={onHome} />
      <div style={{ flex: 1, overflowY: 'auto', padding: `${t.pad}px ${t.pad}px 120px` }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: t.gap }}>
          <Field t={t} label="発注年月日"><TextInput t={t} type="date" value={draft.orderDate} onChange={e => set('orderDate', e.target.value)} /></Field>
          <Field t={t} label="納品期限"><TextInput t={t} type="date" value={draft.dueDate} onChange={e => set('dueDate', e.target.value)} /></Field>
        </div>

        <Field t={t} label="発注書No.">
          <ReadRow t={t} kind="auto" badge={<>自動採番</>}>{draft.no}</ReadRow>
        </Field>

        <Field t={t} label="発注先" hint="マスタに登録された発注先から選べます">
          <SelectInput t={t} value={draft.vendor.id}
            onChange={e => {
              const v = vendors.find(x => x.id === e.target.value) || draft.vendor;
              setDraft(d => ({ ...d, vendor: v, deliv: v.deliv || d.deliv }));
            }}>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}　{v.honor}</option>)}
            {vendors.every(v => v.id !== draft.vendor.id) ? <option value={draft.vendor.id}>{draft.vendor.name}　{draft.vendor.honor}</option> : null}
          </SelectInput>
        </Field>
        <Field t={t} label="納品場所">
          <SelectInput t={t} value={draft.deliv} onChange={e => {
            const name = e.target.value;
            const dl = delivs.find(d => d.name === name);
            setDraft(d => ({ ...d, deliv: name, delivAddr: dl ? (dl.addr || '') : (d.delivAddr || '') }));
          }}>
            {delivs.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            {draft.deliv && delivs.every(d => d.name !== draft.deliv) ? <option value={draft.deliv}>{draft.deliv}</option> : null}
          </SelectInput>
        </Field>
        <Field t={t} label="納品先住所" hint="現場直送など、住所が必要な場合に入力（弊社などは空欄でOK）">
          <TextInput t={t} value={draft.delivAddr || ''} placeholder="例）東京都〇〇区〇〇 1-2-3 〇〇現場" onChange={e => set('delivAddr', e.target.value)} />
        </Field>

        <SectionRule t={t}>明　細</SectionRule>
        <div style={{ marginBottom: t.gap + 2 }}><Voice t={t} onItems={addItems} flash={flash} /></div>

        {draft.items.map((it, i) => (
          <LineItemCard key={i} t={t} idx={i} item={it} fresh={it.fresh} onChange={x => setItem(i, x)} onDelete={() => delItem(i)} />
        ))}

        <button onClick={addItem} style={{
          width: '100%', border: `2px dashed ${hexA(t.primary, .5)}`, background: hexA(t.primary, .05),
          color: t.primary, fontFamily: t.fontHead, fontWeight: 700, fontSize: 15, padding: 15,
          borderRadius: t.radius, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}><Icon name="plus" size={18} color={t.primary} />行を追加</button>
      </div>

      <div style={{
        padding: `12px ${t.pad}px calc(env(safe-area-inset-bottom) + 14px)`,
        background: t.dark ? 'rgba(21,24,28,.92)' : (t.key === 'kiri' ? 'rgba(255,255,255,.92)' : 'rgba(243,241,234,.94)'),
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: `1px solid ${t.line}`,
      }}>
        <Btn t={t} kind="primary" full size="lg" onClick={onPreview}><Icon name="doc" size={22} color={t.onPrimary} />プレビュー・PDFを作成</Btn>
      </div>
    </div>
  );
}

Object.assign(window, { CreateScreen, LineItemCard, useVoice, Spinner });
