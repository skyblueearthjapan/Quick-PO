// screens-preview.jsx — プレビュー (A4 発注書) + PDF ダウンロード
async function downloadSheetPDF(draft, flash) {
  const el = document.getElementById('qp-sheet');
  if (!el) return;
  const safeNo = (draft.no || 'sakurai').replace(/[^A-Za-z0-9\-]/g, '');
  const fname = `発注書_${safeNo}.pdf`;
  if (window.html2canvas && window.jspdf) {
    try {
      flash && flash('PDFを作成しています…');
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (_) {} }
      // Clone the sheet at native size so an ancestor transform (fit-to-screen
      // scaling) can't distort the capture. All styles are inline → clone carries them.
      const clone = el.cloneNode(true);
      const w = el.offsetWidth || 380;
      clone.style.width = w + 'px';
      clone.style.margin = '0';
      const holder = document.createElement('div');
      holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:' + w + 'px;background:#fff;z-index:-1;';
      holder.appendChild(clone);
      document.body.appendChild(holder);
      const canvas = await window.html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      holder.remove();
      const JsPDF = window.jspdf.jsPDF;
      const pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = 210, margin = 12, availW = pageW - margin * 2;
      const imgH = availW * canvas.height / canvas.width;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', margin, margin, availW, imgH);
      pdf.save(fname);
      flash && flash('発注書PDFを保存しました');
      return true;
    } catch (e) { /* fall through to print */ }
  }
  flash && flash('印刷ダイアログから保存してください');
  window.print();
  return false;
}

function PreviewScreen({ t, draft, onBack, onSend, flash }) {
  const items = draft.items.filter(it => it.maker || it.model || it.name || it.qty);
  const MIN = 8;
  const empties = Math.max(0, MIN - items.length);
  const totalQty = items.reduce((s, it) => s + (parseInt(it.qty) || 0), 0);
  const [busy, setBusy] = React.useState(false);
  async function onDownload() { setBusy(true); await downloadSheetPDF(draft, flash); setBusy(false); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader t={t} title="プレビュー" left={<><Icon name="chevL" size={20} color={t.primary} />修正</>} onLeft={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: `${t.pad}px ${t.pad}px 130px`, background: t.dark ? '#0e1013' : t.surfaceAlt }}>
        {/* A4 sheet — always light, ink-on-paper regardless of theme */}
        <div id="qp-sheet" style={{
          background: '#fff', color: '#111', borderRadius: t.dark ? 8 : 4,
          boxShadow: '0 12px 40px rgba(0,0,0,.28)', padding: '30px 26px', fontSize: 11.5,
          fontFamily: t.fontSheet, lineHeight: 1.55,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '.5em', border: '2px solid #111', padding: '4px 22px 4px 28px', display: 'inline-block' }}>発注書</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, borderBottom: '1.5px solid #111', display: 'inline-block', paddingBottom: 2 }}>{draft.vendor.name}　{draft.vendor.honor}</div>
              <div style={{ marginTop: 8, fontSize: 11.5 }}>下記の通り、発注致します。</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.8, flexShrink: 0 }}>
              <div><span style={{ color: '#555', marginRight: 8 }}>発注年月日</span>{jpDate(draft.orderDate)}</div>
              <div><span style={{ color: '#555', marginRight: 8 }}>発注書No.</span><span style={{ fontFamily: t.mono }}>{draft.no}</span></div>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.7, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 9, marginBottom: 3 }}>
              <img src="brandkit/sakurai-logo-mark.png" alt="桜井電装" style={{ height: 26, width: 'auto' }} />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontFamily: t.serif, fontSize: 8.5, letterSpacing: '.08em', color: hexA(BRAND_NAVY, .6), fontWeight: 500 }}>SAKURAI DENSO CO., LTD.</div>
                <div style={{ fontFamily: t.serif, fontSize: 14, fontWeight: 700, color: BRAND_NAVY }}>{SELF.name}</div>
              </div>
            </div>
            <div>{SELF.zip}　{SELF.addr}</div>
            <div>{SELF.tel}　{SELF.fax}</div>
            <div>{SELF.staff}</div>
          </div>

          <div style={{ display: 'flex', border: '1px solid #111', marginBottom: 12 }}>
            <div style={{ display: 'flex', flex: 1, borderRight: '1px solid #111' }}>
              <div style={{ background: '#f0f0f0', padding: '7px 9px', fontWeight: 700, borderRight: '1px solid #111', whiteSpace: 'nowrap' }}>納品期限</div>
              <div style={{ padding: '7px 9px', flex: 1 }}>{jpDate(draft.dueDate)}</div>
            </div>
            <div style={{ display: 'flex', flex: 1 }}>
              <div style={{ background: '#f0f0f0', padding: '7px 9px', fontWeight: 700, borderRight: '1px solid #111', whiteSpace: 'nowrap' }}>納品場所</div>
              <div style={{ padding: '7px 9px', flex: 1 }}>{draft.deliv || draft.vendor.deliv}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {[['メーカー', '22%'], ['型式 / 品名', '40%'], ['数量', '15%'], ['備考', '23%']].map(([h, w]) => (
                  <th key={h} style={{ border: '1px solid #111', padding: '6px 7px', background: t.primary, color: t.onPrimary, fontWeight: 700, width: w, textAlign: 'center', fontFamily: t.fontHead }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td style={tdS}>{it.maker}</td>
                  <td style={tdS}><div style={{ fontWeight: 600, fontFamily: t.mono }}>{it.model}</div><div style={{ color: '#444', fontSize: 10.5 }}>{it.name}</div></td>
                  <td style={{ ...tdS, textAlign: 'center', whiteSpace: 'nowrap' }}>{it.qty} {it.unit}</td>
                  <td style={tdS}>{it.note}</td>
                </tr>
              ))}
              {Array.from({ length: empties }).map((_, i) => (
                <tr key={'e' + i}><td style={{ ...tdS, height: 26 }} /><td style={tdS} /><td style={tdS} /><td style={tdS} /></tr>
              ))}
              <tr>
                <td colSpan={2} style={{ ...tdS, textAlign: 'right', fontWeight: 700, background: '#f7f7f7' }}>合計数量</td>
                <td style={{ ...tdS, textAlign: 'center', fontWeight: 700, background: '#f7f7f7' }}>{totalQty}</td>
                <td style={{ ...tdS, background: '#f7f7f7' }} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, padding: `12px ${t.pad}px calc(env(safe-area-inset-bottom) + 14px)`, borderTop: `1px solid ${t.line}`, background: t.dark ? 'rgba(21,24,28,.92)' : 'transparent' }}>
        <Btn t={t} kind="ghost" size="lg" onClick={onSend}>保存して一覧へ</Btn>
        <Btn t={t} kind="primary" size="lg" full onClick={onDownload} disabled={busy}>
          {busy ? <><Spinner /> 作成中…</> : <><Icon name="download" size={20} color={t.onPrimary} />PDFをダウンロード</>}
        </Btn>
      </div>
    </div>
  );
}
const tdS = { border: '1px solid #111', padding: '6px 7px', verticalAlign: 'top' };

Object.assign(window, { PreviewScreen });
