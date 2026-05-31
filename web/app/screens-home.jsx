// screens-home.jsx — ホーム / 発注履歴 + 発注先マスタ
const { useState: useStateH } = React;

// ───────────────────────── history row ─────────────────────────
function OrderRow({ t, o, onOpen, onDelete }) {
  const head = o.items[0] || {};
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: t.radius,
      marginBottom: t.gap, boxShadow: t.card, overflow: 'hidden',
    }}>
      <button onClick={() => onOpen(o)} style={{
        all: 'unset', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        flex: 1, minWidth: 0, boxSizing: 'border-box', padding: `${t.pad - 4}px ${t.pad - 2}px`,
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
            {head.name || head.model || '（明細なし）'}{o.lines > 1 ? ` 他${o.lines - 1}件` : ''} ・ {o.qty}点
          </span>
          <span style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11.5, color: t.faint, fontFamily: t.mono }}>
            <span>{o.no}</span><span>{jpDateShort(o.date)}発注</span>
          </span>
        </span>
      </button>
      {onDelete ? (
        <button onClick={() => { if (window.confirm(`「${o.vendor}」(${o.no})の履歴を削除しますか？`)) onDelete(o); }}
          aria-label="削除" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: t.danger, padding: 10, flexShrink: 0, display: 'flex', alignSelf: 'stretch', alignItems: 'center' }}>
          <Icon name="trash" size={18} color={t.danger} />
        </button>
      ) : null}
    </div>
  );
}

// ───────────────────────── home ─────────────────────────
function HomeScreen({ t, history, vendorCount = 0, onNew, onOpen, onDelete }) {
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
          {[['今月の発注', thisMonth, '件'], ['下書き', drafts.length, '件'], ['発注先', vendorCount, '社']].map(([k, n, u]) => (
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
            {drafts.map(o => <OrderRow key={o.id} t={t} o={o} onOpen={onOpen} onDelete={onDelete} />)}
          </>
        ) : null}

        <SectionLabel t={t}>最近の発注</SectionLabel>
        {done.map(o => <OrderRow key={o.id} t={t} o={o} onOpen={onOpen} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

function SectionLabel({ t, children }) {
  return <div style={{ fontFamily: t.fontHead, fontWeight: 700, fontSize: 13, color: t.sub, margin: '4px 2px 10px', letterSpacing: '.04em' }}>{children}</div>;
}

// ───────────────────────── master hub: 発注先 + 納品場所 ─────────────────────────
function blankVendor(delivs) {
  return {
    id: 'v' + Date.now(), name: '', kana: '', honor: '御中', tel: '', staff: '—',
    deliv: (delivs[0] && delivs[0].name) || '', tags: [], pinned: false, last: todayISO(), _new: true,
  };
}
const tagsToStr = (tags) => (tags || []).join('、');
const strToTags = (s) => (s || '').split(/[、,\s]+/).map(x => x.trim()).filter(Boolean);

function Segmented({ t, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: t.surfaceAlt, border: `1.5px solid ${t.line}`, borderRadius: t.radius, padding: 4, marginBottom: t.pad }}>
      {options.map(([val, label]) => {
        const on = val === value;
        return (
          <button key={val} onClick={() => onChange(val)} style={{
            flex: 1, border: 'none', cursor: 'pointer', borderRadius: t.radiusSm, padding: '10px 0',
            background: on ? t.surface : 'transparent', color: on ? t.primary : t.sub,
            fontFamily: t.fontHead, fontWeight: 700, fontSize: 14, boxShadow: on ? t.card : 'none',
          }}>{label}</button>
        );
      })}
    </div>
  );
}

function AddTile({ t, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', border: `2px dashed ${hexA(t.primary, .5)}`, background: hexA(t.primary, .05), color: t.primary,
      fontFamily: t.fontHead, fontWeight: 700, fontSize: 15, padding: 15, borderRadius: t.radius, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4,
    }}><Icon name="plus" size={18} color={t.primary} />{label}</button>
  );
}

function MasterScreen({ t, vendors, setVendors, delivs, setDelivs, defaultId, setDefaultId, onUse, flash }) {
  const [tab, setTab] = useStateH('vendors');
  const [q, setQ] = useStateH('');
  const [detail, setDetail] = useStateH(null);
  const [vForm, setVForm] = useStateH(null);   // 編集/新規の発注先 (null=閉)
  const [dForm, setDForm] = useStateH(null);    // 編集/新規の納品場所 (null=閉)

  const list = vendors
    .filter(v => !q || (v.name + v.kana + (v.tags || []).join('')).includes(q))
    .sort((a, b) => (b.id === defaultId) - (a.id === defaultId) || (b.pinned - a.pinned));

  function saveVendor(v) {
    const exists = vendors.some(x => x.id === v.id);
    const clean = { ...v }; delete clean._new;
    setVendors(prev => exists ? prev.map(x => x.id === v.id ? clean : x) : [clean, ...prev]);
    setVForm(null); setDetail(null);
    flash(exists ? '発注先を更新しました' : '発注先を追加しました');
  }
  function removeVendor(v) {
    setVendors(prev => prev.filter(x => x.id !== v.id));
    if (v.id === defaultId) { const nx = vendors.find(x => x.id !== v.id); if (nx) setDefaultId(nx.id); }
    setDetail(null); flash('発注先を削除しました');
  }
  function saveDeliv(d) {
    const name = (d.name || '').trim();
    if (!name) { flash('名称を入力してください'); return; }
    const addr = (d.addr || '').trim();
    const exists = delivs.some(x => x.id === d.id);
    setDelivs(prev => exists ? prev.map(x => x.id === d.id ? { ...x, name, addr } : x) : [...prev, { id: 'dl' + Date.now(), name, addr }]);
    setDForm(null); flash(exists ? '納品場所を更新しました' : '納品場所を追加しました');
  }
  function removeDeliv(d) {
    if (delivs.length <= 1) { flash('最後の1件は削除できません'); return; }
    setDelivs(prev => prev.filter(x => x.id !== d.id));
    flash('納品場所を削除しました');
  }

  // 編集は全画面（保存はヘッダー右上＝キーボードに隠れない）。vForm/dForm を最優先で表示。
  if (vForm) {
    return <VendorEditScreen t={t} draft={vForm} delivs={delivs}
      onCancel={() => setVForm(null)} onSave={saveVendor} />;
  }
  if (dForm) {
    return <DelivEditScreen t={t} draft={dForm}
      onCancel={() => setDForm(null)} onSave={saveDeliv} />;
  }
  if (detail) {
    return <VendorDetail t={t} v={detail} isDefault={detail.id === defaultId}
      onBack={() => setDetail(null)} onUse={() => onUse(detail)}
      onEdit={() => setVForm(detail)} onDelete={() => removeVendor(detail)}
      onSetDefault={() => { setDefaultId(detail.id); flash(`${detail.name}を既定に設定`); }} />;
  }

  const onAdd = () => tab === 'vendors' ? setVForm(blankVendor(delivs)) : setDForm({ id: '', name: '', addr: '' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader t={t} title="マスタ管理" big
        right={<button onClick={onAdd} aria-label="追加" style={{ border: 'none', cursor: 'pointer', width: 40, height: 40, borderRadius: 999, background: hexA(t.primary, .1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={22} color={t.primary} /></button>} />
      <div style={{ flex: 1, overflowY: 'auto', padding: `${t.pad}px ${t.pad}px 150px` }}>
        <Segmented t={t} value={tab} onChange={setTab} options={[['vendors', '発注先'], ['delivs', '納品場所']]} />

        {tab === 'vendors' ? (
          <>
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
                  <span style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    {(v.tags || []).map(tag => <span key={tag} style={{ fontSize: 11, color: t.sub, background: t.surfaceAlt, border: `1px solid ${t.line}`, padding: '2px 8px', borderRadius: 999 }}>{tag}</span>)}
                  </span>
                </span>
                <Icon name="chevR" size={18} color={t.faint} />
              </button>
            ))}
            <AddTile t={t} label="発注先を追加" onClick={() => setVForm(blankVendor(delivs))} />
          </>
        ) : (
          <>
            {delivs.map(d => (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: `${t.pad - 6}px ${t.pad - 2}px`,
                background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: t.radius, marginBottom: t.gap, boxShadow: t.card,
              }}>
                <span style={{ width: 40, height: 40, borderRadius: t.radiusSm, background: hexA(t.primary, .1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="truck" size={20} color={t.primary} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: t.fontHead, fontWeight: 700, color: t.ink, fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                  {d.addr ? <span style={{ display: 'block', fontSize: 12, color: t.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.addr}</span> : null}
                </span>
                <button onClick={() => setDForm(d)} aria-label="編集" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6, display: 'flex' }}><Icon name="edit" size={18} color={t.primary} /></button>
                <button onClick={() => removeDeliv(d)} aria-label="削除" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6, display: 'flex' }}><Icon name="trash" size={18} color={t.danger} /></button>
              </div>
            ))}
            <AddTile t={t} label="納品場所を追加" onClick={() => setDForm({ id: '', name: '' })} />
          </>
        )}
      </div>
    </div>
  );
}

// ヘッダー右上の「保存」ボタン（キーボードに隠れない）
function SaveHeaderBtn({ t, canSave, onSave }) {
  return (
    <button onClick={() => canSave && onSave()} disabled={!canSave} style={{
      border: 'none', background: 'transparent', cursor: canSave ? 'pointer' : 'default',
      color: canSave ? t.primary : t.faint, fontFamily: t.fontHead, fontWeight: 700, fontSize: 16, padding: 4,
    }}>保存</button>
  );
}

// 発注先の編集（全画面）
function VendorEditScreen({ t, draft, delivs, onCancel, onSave }) {
  const [f, setF] = useStateH(() => ({ ...draft }));
  React.useEffect(() => { setF({ ...draft }); }, [draft]);
  const set = (k, val) => setF(p => ({ ...p, [k]: val }));
  const canSave = (f.name || '').trim().length > 0;
  const save = () => { if (canSave) onSave(f); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader t={t} title={f._new ? '発注先を追加' : '発注先を編集'}
        left={<>キャンセル</>} onLeft={onCancel}
        right={<SaveHeaderBtn t={t} canSave={canSave} onSave={save} />} />
      <div style={{ flex: 1, overflowY: 'auto', padding: `${t.pad}px ${t.pad}px calc(env(safe-area-inset-bottom) + 28px)` }}>
        <Field t={t} label="会社名" req><TextInput t={t} value={f.name || ''} placeholder="例）中西電機株式会社" onChange={e => set('name', e.target.value)} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: t.gap }}>
          <Field t={t} label="フリガナ"><TextInput t={t} value={f.kana || ''} placeholder="なかにしでんき" onChange={e => set('kana', e.target.value)} /></Field>
          <Field t={t} label="敬称"><SelectInput t={t} value={f.honor || '御中'} onChange={e => set('honor', e.target.value)}><option value="御中">御中</option><option value="様">様</option></SelectInput></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: t.gap }}>
          <Field t={t} label="電話"><TextInput t={t} mono value={f.tel || ''} placeholder="03-0000-0000" onChange={e => set('tel', e.target.value)} /></Field>
          <Field t={t} label="担当"><TextInput t={t} value={f.staff || ''} placeholder="営業部 ○○様" onChange={e => set('staff', e.target.value)} /></Field>
        </div>
        <Field t={t} label="既定の納品場所">
          <SelectInput t={t} value={f.deliv || ''} onChange={e => set('deliv', e.target.value)}>
            {(delivs || []).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </SelectInput>
        </Field>
        <Field t={t} label="タグ" hint="「、」区切りで複数（例：分電盤、ブレーカー）">
          <TextInput t={t} value={tagsToStr(f.tags)} placeholder="分電盤、ブレーカー" onChange={e => set('tags', strToTags(e.target.value))} />
        </Field>
        <Btn t={t} kind="primary" full size="lg" style={{ marginTop: 6 }} disabled={!canSave} onClick={save}>
          <Icon name="check" size={20} color={t.onPrimary} sw={2.4} />保存する
        </Btn>
      </div>
    </div>
  );
}

// 納品場所の編集（全画面）
function DelivEditScreen({ t, draft, onCancel, onSave }) {
  const init = () => ({ name: (draft && draft.name) || '', addr: (draft && draft.addr) || '' });
  const [f, setF] = useStateH(init);
  React.useEffect(() => { setF(init()); }, [draft]);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const editing = !!(draft && draft.id);
  const canSave = !!f.name.trim();
  const save = () => { if (canSave) onSave({ id: draft ? draft.id : '', name: f.name, addr: f.addr }); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader t={t} title={editing ? '納品場所を編集' : '納品場所を追加'}
        left={<>キャンセル</>} onLeft={onCancel}
        right={<SaveHeaderBtn t={t} canSave={canSave} onSave={save} />} />
      <div style={{ flex: 1, overflowY: 'auto', padding: `${t.pad}px ${t.pad}px calc(env(safe-area-inset-bottom) + 28px)` }}>
        <Field t={t} label="納品場所名" req>
          <TextInput t={t} value={f.name} placeholder="例）弊社（東京）／現場直送／倉庫（埼玉）" onChange={e => set('name', e.target.value)} />
        </Field>
        <Field t={t} label="住所" hint="弊社などは空欄でOK。住所が固定の場所はここに登録（現場直送は作成時にその都度入力できます）">
          <TextInput t={t} value={f.addr} placeholder="例）埼玉県〇〇市〇〇 1-2-3" onChange={e => set('addr', e.target.value)} />
        </Field>
        <Btn t={t} kind="primary" full size="lg" style={{ marginTop: 6 }} disabled={!canSave} onClick={save}>
          <Icon name="check" size={20} color={t.onPrimary} sw={2.4} />保存する
        </Btn>
      </div>
    </div>
  );
}

function VendorDetail({ t, v, isDefault, onBack, onUse, onSetDefault, onEdit, onDelete }) {
  const rows = [['電話', v.tel, 'phone'], ['担当', v.staff, 'building'], ['既定の納品場所', v.deliv, 'truck']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader t={t} title={v.name} left={<><Icon name="chevL" size={20} color={t.primary} />マスタ</>} onLeft={onBack}
        right={<button onClick={onEdit} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: t.primary, fontFamily: t.fontHead, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 4, padding: 4 }}><Icon name="edit" size={18} color={t.primary} />編集</button>} />
      <div style={{ flex: 1, overflowY: 'auto', padding: `${t.pad}px ${t.pad}px 130px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <span style={{ width: 60, height: 60, borderRadius: t.radius, background: hexA(t.primary, .1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="building" size={30} color={t.primary} />
          </span>
          <div>
            <div style={{ fontFamily: t.fontHead, fontWeight: 800, color: t.ink, fontSize: 20 }}>{v.name}　{v.honor}</div>
            <div style={{ fontSize: 12.5, color: t.sub, marginTop: 2 }}>{v.kana || '—'}</div>
          </div>
        </div>

        <div style={{ background: t.surface, border: `1.5px solid ${t.line}`, borderRadius: t.radius, overflow: 'hidden', boxShadow: t.card, marginBottom: t.pad }}>
          {rows.map(([k, val, ic], i) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `13px ${t.pad - 2}px`, borderBottom: i < rows.length - 1 ? `1px solid ${t.line}` : 'none' }}>
              <Icon name={ic} size={18} color={t.faint} />
              <span style={{ fontSize: 13, color: t.sub, width: 96 }}>{k}</span>
              <span style={{ fontSize: 15, color: t.ink, flex: 1, textAlign: 'right', fontFamily: k === '電話' ? t.mono : t.fontBody }}>{val || '—'}</span>
            </div>
          ))}
        </div>

        <button onClick={onSetDefault} disabled={isDefault} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: isDefault ? 'default' : 'pointer',
          padding: 14, borderRadius: t.radius, border: `1.5px solid ${isDefault ? t.accentLine : t.line}`,
          background: isDefault ? hexA(t.accent, .12) : t.surface, color: isDefault ? (t.dark ? t.accent : '#1c6b56') : t.ink,
          fontFamily: t.fontHead, fontWeight: 700, fontSize: 15, marginBottom: t.gap,
        }}>
          <Icon name={isDefault ? 'checkCircle' : 'star'} size={19} color={isDefault ? (t.dark ? t.accent : '#1c6b56') : t.sub} />
          {isDefault ? 'この発注先が既定です' : '既定の発注先にする'}
        </button>

        <Btn t={t} kind="danger" full onClick={() => { if (window.confirm(`「${v.name}」を削除しますか？`)) onDelete(); }}>
          <Icon name="trash" size={18} color={t.danger} />この発注先を削除
        </Btn>
      </div>

      <div style={{ padding: `12px ${t.pad}px calc(env(safe-area-inset-bottom) + 14px)`, borderTop: `1px solid ${t.line}`, background: t.dark ? 'rgba(21,24,28,.92)' : 'rgba(255,255,255,.0)' }}>
        <Btn t={t} kind="primary" full size="lg" onClick={onUse}><Icon name="doc" size={20} color={t.onPrimary} />この発注先で作成</Btn>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, MasterScreen, VendorDetail, VendorEditScreen, DelivEditScreen, SaveHeaderBtn, Segmented, AddTile, OrderRow });
