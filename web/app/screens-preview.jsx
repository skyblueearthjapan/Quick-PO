// screens-preview.jsx — プレビュー (A4 発注書・お客様フォーマット準拠) + PDF ダウンロード
async function downloadSheetPDF(draft, flash) {
  const safeNo = (draft.no || 'sakurai').replace(/[^A-Za-z0-9\-]/g, '');
  const fname = `発注書_${safeNo}.pdf`;
  // 1) サーバーのベクターPDF(/api/pdf・WeasyPrint)を最優先（文字＝テキスト/罫線＝ベクター）
  try {
    flash && flash('PDFを作成しています…');
    const payload = {
      no: draft.no, orderDate: draft.orderDate, dueDate: draft.dueDate,
      vendorName: draft.vendor.name, vendorHonor: draft.vendor.honor || '御中',
      deliv: draft.deliv || draft.vendor.deliv || '',
      items: draft.items.filter(it => it.maker || it.model || it.name || it.qty),
    };
    const res = await fetch('/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      flash && flash('発注書PDFを保存しました');
      return true;
    }
  } catch (e) { /* サーバー未接続 → クライアント生成にフォールバック */ }
  return clientPdfFallback(draft, fname, flash);
}

// フォールバック: サーバーが使えないときだけ、画面を画像化してPDFにする
async function clientPdfFallback(draft, fname, flash) {
  const el = document.getElementById('qp-sheet');
  if (!el) return false;
  if (window.html2canvas && window.jspdf) {
    try {
      flash && flash('PDFを作成しています…');
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (_) {} }
      // 重要: 画面はスマホ幅だが、PDFは A4 幅で出したい。
      // そこでキャプチャ専用に「A4 相当の幅広 DOM」を生成してから画像化する。
      // (画面のスマホ幅のまま撮ると縦長になり、ページに合わせて縮小→中央寄せの小さな帳票になる)
      const CW = 980;                                  // A4本文相当の描画幅(px)
      const clone = el.cloneNode(true);
      clone.style.width = CW + 'px';
      clone.style.margin = '0';
      clone.style.boxShadow = 'none';
      clone.style.borderRadius = '0';
      clone.style.padding = '0';                       // 余白はPDF側のマージンで取る
      const holder = document.createElement('div');
      holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:' + CW + 'px;background:#fff;z-index:-1;';
      holder.appendChild(clone);
      document.body.appendChild(holder);
      const canvas = await window.html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: CW });
      holder.remove();
      const JsPDF = window.jspdf.jsPDF;
      const pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      // A4 幅いっぱい(左右マージン約6.5mm)に配置。左端をフォーマットに合わせる。
      const pageW = 210, pageH = 297, mx = 6.5, my = 8;
      const availW = pageW - mx * 2;                   // ≈197mm
      const availH = pageH - my * 2;                   // ≈281mm
      let iw = availW, ih = iw * canvas.height / canvas.width;
      if (ih > availH) { ih = availH; iw = ih * canvas.width / canvas.height; } // 念のため1ページに収める
      const x = mx + (availW - iw) / 2;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', x, my, iw, ih);
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
  const MIN = 18;                                   // 空行を含め1ページを埋める(フォーマット準拠)
  const empties = Math.max(0, MIN - items.length);
  const [busy, setBusy] = React.useState(false);
  async function onDownload() { setBusy(true); await downloadSheetPDF(draft, flash); setBusy(false); }
  const staffName = (SELF.staff || '').replace(/^担当[:：]\s*/, '');

  // ── 帳票内の共通セルスタイル（黒インク・お客様フォーマット準拠） ──
  const B = '1px solid #000';
  const lblCell = { border: B, background: '#efefef', fontWeight: 700, fontFamily: t.fontHead, fontSize: 11, textAlign: 'center', padding: '5px 8px', whiteSpace: 'nowrap', width: 92 };
  const valCell = { border: B, fontSize: 11.5, textAlign: 'center', padding: '5px 8px' };
  const delivLbl = { background: '#efefef', fontWeight: 700, fontFamily: t.fontHead, fontSize: 11, borderRight: B, padding: '0 10px', width: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' };
  const delivVal = { flex: 1, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 48 };
  const thS = { border: B, background: '#efefef', color: '#000', fontWeight: 700, fontFamily: t.fontHead, fontSize: 10.5, textAlign: 'center', padding: '6px 6px' };
  const tdS = { border: B, padding: '5px 7px', verticalAlign: 'middle', height: 24, fontSize: 11 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader t={t} title="プレビュー" left={<><Icon name="chevL" size={20} color={t.primary} />修正</>} onLeft={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: `${t.pad}px ${t.pad}px 130px`, background: t.dark ? '#0e1013' : t.surfaceAlt }}>
        {/* A4 sheet — お客様フォーマット準拠（常に紙＝白地・黒インク） */}
        <div id="qp-sheet" style={{
          background: '#fff', color: '#000', borderRadius: t.dark ? 8 : 4,
          boxShadow: '0 12px 40px rgba(0,0,0,.28)', padding: '26px 26px 30px', fontSize: 11,
          fontFamily: t.fontSheet, lineHeight: 1.5,
        }}>
          {/* タイトル：ページ全幅の枠囲み */}
          <div style={{ border: '1.5px solid #000', padding: '9px 0', textAlign: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '.5em', paddingLeft: '.5em' }}>発注書</span>
          </div>

          {/* 上段：左＝発注先 / 右＝発注年月日・No. ＋ 自社情報 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 30 }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 17, fontWeight: 700, borderBottom: '2px solid #000', paddingBottom: 3, display: 'inline-block' }}>
                  {draft.vendor.name}　{draft.vendor.honor}
                </span>
              </div>
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12 }}>下記の通り、発注致します。</div>
            </div>

            <div style={{ width: '52%', flexShrink: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
                <tbody>
                  <tr><td style={lblCell}>発注年月日</td><td style={valCell}>{jpDate(draft.orderDate)}</td></tr>
                  <tr><td style={lblCell}>発注書No.</td><td style={{ ...valCell, fontFamily: t.mono }}>{draft.no}</td></tr>
                </tbody>
              </table>

              <div style={{ border: '1px solid #000', fontSize: 10.5, lineHeight: 1.65 }}>
                <div style={{ padding: '7px 9px 6px' }}>
                  <div>{SELF.name}</div>
                  <div>{SELF.zip}　{SELF.addr}</div>
                  <div>{SELF.tel}　{SELF.fax}</div>
                </div>
                <div style={{ display: 'flex', borderTop: '1px solid #000' }}>
                  <div style={{ padding: '6px 9px', borderRight: '1px solid #000', whiteSpace: 'nowrap', fontFamily: t.fontHead }}>担当：</div>
                  <div style={{ padding: '6px 9px', flex: 1, textAlign: 'center' }}>{staffName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 納品期限 / 納品場所 */}
          <div style={{ display: 'flex', border: '1px solid #000', marginBottom: 14 }}>
            <div style={delivLbl}>納品期限</div>
            <div style={{ ...delivVal, borderRight: '1px solid #000' }}>{jpDate(draft.dueDate)}</div>
            <div style={delivLbl}>納品場所</div>
            <div style={delivVal}>{draft.deliv || draft.vendor.deliv}</div>
          </div>

          {/* 明細表 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '17%' }} /><col style={{ width: '56%' }} /><col style={{ width: '9%' }} /><col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thS}>ﾒｰｶｰ / ｻｲｽﾞ</th>
                <th style={thS}>型式 / 名称</th>
                <th style={thS}>数量</th>
                <th style={thS}>備考</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, wordBreak: 'break-all' }}>{it.maker}</td>
                  <td style={tdS}>
                    <span style={{ fontFamily: t.mono, fontWeight: 600 }}>{it.model}</span>
                    {it.model && it.name ? '　' : ''}
                    <span>{it.name}</span>
                  </td>
                  <td style={{ ...tdS, textAlign: 'center', whiteSpace: 'nowrap' }}>{it.qty}{it.qty && it.unit ? ' ' + it.unit : ''}</td>
                  <td style={{ ...tdS, wordBreak: 'break-all' }}>{it.note}</td>
                </tr>
              ))}
              {Array.from({ length: empties }).map((_, i) => (
                <tr key={'e' + i}><td style={tdS} /><td style={tdS} /><td style={tdS} /><td style={tdS} /></tr>
              ))}
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

Object.assign(window, { PreviewScreen });
