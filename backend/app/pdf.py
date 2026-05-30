# pdf.py — お客様フォーマット準拠の発注書を WeasyPrint で生成
# レイアウトは A4 上の絶対座標(pt)で配置し、基準フォーマットの矩形・文字サイズに合わせる。
from html import escape
from jinja2 import Template
from weasyprint import HTML

SELF = {
    "name": "株式会社　桜井電装",
    "zip": "〒125-0032",
    "addr": "東京都葛飾区水元1-14-4",
    "tel": "TEL：03-3600-2012",
    "fax": "FAX：03-3600-2743",
    "staff": "櫻井(光)",
}

MIN_ROWS = 21  # ヘッダー下〜y≈814.7 を 23.04pt 行で充填


def jp_date(iso: str) -> str:
    if not iso:
        return ""
    try:
        y, m, d = iso.split("-")
        return f"{y}年 {int(m)}月 {int(d)}日"
    except Exception:
        return iso


# 基準フォーマットの座標(pt)。原点=左上。A4 = 595.28 x 841.89 pt
TEMPLATE = Template(r"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Noto Sans CJK JP", "Noto Sans JP", sans-serif; color: #000; }
  .page { position: relative; width: 595.28pt; height: 841.89pt; }
  .abs { position: absolute; }
  table { border-collapse: collapse; }
  .b { font-weight: 700; }

  /* タイトル枠 */
  .title { left: 13.2pt; top: 24.5pt; width: 559.8pt; height: 33.6pt; border: 1pt solid #000; }
  .title > div { height: 33.6pt; line-height: 33.6pt; text-align: center; font-size: 20pt; font-weight: 700; }

  /* 宛先 */
  .addr { left: 73.44pt; top: 121pt; font-size: 18pt; font-weight: 700; }
  .addr .u { border-bottom: 1.6pt solid #000; padding-bottom: 2pt; }
  /* 案内文 */
  .note { left: 104.16pt; top: 171pt; font-size: 12pt; }

  /* 右上：発注年月日 / 発注書No. */
  .meta { left: 348.8pt; top: 68.2pt; width: 222.8pt; }
  .meta td { border: 0.8pt solid #000; height: 23pt; font-size: 11.04pt; text-align: center; padding: 0 3pt; }
  .meta .k { background: #ededed; font-weight: 700; width: 73.5pt; }

  /* 右：発注元情報枠 */
  .seller { left: 348.8pt; top: 125.8pt; width: 222.8pt; height: 92.1pt; border: 0.8pt solid #000; }
  .seller .body { height: 65.2pt; overflow: hidden; padding: 3pt 0 0 4pt; font-size: 11.04pt; line-height: 20pt; }
  .seller .staff { position: absolute; left: 0; right: 0; bottom: 0; height: 26.9pt; width: 100%; border-top: 0.8pt solid #000; }
  .seller .staff td { height: 26.9pt; font-size: 11.04pt; text-align: center; vertical-align: middle; }
  .seller .staff .k { width: 73.5pt; border-right: 0.8pt solid #000; font-weight: 700; }

  /* 納品期限 / 納品場所 */
  .deliv { left: 14.6pt; top: 227.2pt; width: 557pt; }
  .deliv td { border: 0.8pt solid #000; height: 69.1pt; font-size: 11.04pt; text-align: center; vertical-align: middle; }
  .deliv .k { background: #ededed; font-weight: 700; }

  /* 明細表 */
  .items { left: 14.6pt; top: 307.8pt; width: 557pt; }
  .items th { border: 0.8pt solid #000; height: 23pt; background: #ededed; font-weight: 700; font-size: 11.04pt; text-align: center; }
  .items td { border: 0.8pt solid #000; height: 23.04pt; font-size: 10.5pt; vertical-align: middle; padding: 0 4pt; }
  .items td.c { text-align: center; white-space: nowrap; }
  .items td.note { font-size: 9pt; }
  .items .model { font-weight: 700; }
</style></head><body>
<div class="page">

  <div class="abs title"><div>発注書</div></div>

  <div class="abs addr"><span class="u">{{ vendor_name }}　{{ vendor_honor }}</span></div>
  <div class="abs note">下記の通り、発注致します。</div>

  <table class="abs meta">
    <colgroup><col style="width:73.5pt"><col style="width:149.3pt"></colgroup>
    <tbody>
      <tr><td class="k">発注年月日</td><td>{{ order_date }}</td></tr>
      <tr><td class="k">発注書No.</td><td>{{ no }}</td></tr>
    </tbody>
  </table>

  <div class="abs seller">
    <div class="body">{{ self_name }}<br>{{ self_zip }}　{{ self_addr }}<br>{{ self_tel }}　{{ self_fax }}</div>
    <table class="staff"><tbody><tr><td class="k">担当：</td><td>{{ self_staff }}</td></tr></tbody></table>
  </div>

  <table class="abs deliv">
    <colgroup><col style="width:80pt"><col style="width:140.4pt"><col style="width:80pt"><col style="width:256.6pt"></colgroup>
    <tbody><tr>
      <td class="k">納品期限</td><td>{{ due_date }}</td>
      <td class="k">納品場所</td><td>{{ deliv }}</td>
    </tr></tbody>
  </table>

  <table class="abs items">
    <colgroup><col style="width:96.2pt"><col style="width:311.5pt"><col style="width:37.9pt"><col style="width:111.4pt"></colgroup>
    <thead><tr>
      <th>ﾒｰｶｰ / ｻｲｽﾞ</th><th>型式 / 名称</th><th>数量</th><th>備考</th>
    </tr></thead>
    <tbody>
      {% for r in rows %}
      <tr>
        <td>{{ r.maker }}</td>
        <td>{% if r.model %}<span class="model">{{ r.model }}</span>{% endif %}{% if r.model and r.name %}　{% endif %}{{ r.name }}</td>
        <td class="c">{{ r.qty }}</td>
        <td class="note">{{ r.note }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

</div>
</body></html>""")


def render_order_pdf(order: dict) -> bytes:
    items = order.get("items") or []
    rows = []
    for it in items:
        maker = (it.get("maker") or "").strip()
        model = (it.get("model") or "").strip()
        name = (it.get("name") or "").strip()
        qty = (it.get("qty") or "").strip()
        unit = (it.get("unit") or "").strip()
        note = (it.get("note") or "").strip()
        if not (maker or model or name or qty):
            continue
        rows.append({
            "maker": escape(maker),
            "model": escape(model),
            "name": escape(name),
            "qty": escape(f"{qty} {unit}".strip() if qty else ""),
            "note": escape(note),
        })
    while len(rows) < MIN_ROWS:
        rows.append({"maker": "", "model": "", "name": "", "qty": "", "note": ""})

    html = TEMPLATE.render(
        vendor_name=escape(order.get("vendorName") or ""),
        vendor_honor=escape(order.get("vendorHonor") or "御中"),
        order_date=escape(jp_date(order.get("orderDate") or "")),
        no=escape(order.get("no") or ""),
        due_date=escape(jp_date(order.get("dueDate") or "")),
        deliv=escape(order.get("deliv") or ""),
        self_name=escape(SELF["name"]),
        self_zip=escape(SELF["zip"]),
        self_addr=escape(SELF["addr"]),
        self_tel=escape(SELF["tel"]),
        self_fax=escape(SELF["fax"]),
        self_staff=escape(SELF["staff"]),
        rows=rows,
    )
    return HTML(string=html).write_pdf()
