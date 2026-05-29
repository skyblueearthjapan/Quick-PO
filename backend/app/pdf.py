# pdf.py — お客様フォーマット準拠の発注書を WeasyPrint でベクターPDF化する
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

MIN_ROWS = 18  # 空行を含めページを充填


def jp_date(iso: str) -> str:
    if not iso:
        return ""
    try:
        y, m, d = iso.split("-")
        return f"{y}年 {int(m)}月 {int(d)}日"
    except Exception:
        return iso


# ── HTML テンプレート（A4・mm 指定でフォーマットの座標を再現）──
TEMPLATE = Template(r"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><style>
  @page { size: A4 portrait; margin: 6mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Noto Sans CJK JP", "Noto Sans JP", sans-serif; color: #000; font-size: 9pt; line-height: 1.4; }
  table { border-collapse: collapse; }

  .title { border: 1.1pt solid #000; text-align: center; padding: 2.6mm 0; margin-bottom: 3.2mm; }
  .title span { font-size: 20pt; font-weight: 700; letter-spacing: .5em; padding-left: .5em; }

  .top { width: 100%; table-layout: fixed; }
  .top > tbody > tr > td { vertical-align: top; padding: 0; }
  .left { padding: 7mm 6mm 0 1mm; }
  .addr { text-align: center; }
  .addr .to { font-size: 13.5pt; font-weight: 700; border-bottom: 1.3pt solid #000; padding-bottom: 1mm; display: inline-block; }
  .addr .note { margin-top: 6mm; font-size: 10pt; }
  .right { width: 82mm; }

  .meta { width: 100%; margin-bottom: 2.2mm; }
  .meta td { border: .8pt solid #000; padding: 1.5mm 2mm; font-size: 9pt; }
  .meta .lbl { background: #ededed; font-weight: 700; text-align: center; white-space: nowrap; width: 26mm; }
  .meta .val { text-align: center; }

  .seller { width: 100%; border: .8pt solid #000; }
  .seller .body { padding: 2mm 2.5mm; font-size: 8.6pt; line-height: 1.55; }
  .seller .staff { width: 100%; border-top: .8pt solid #000; border-collapse: collapse; }
  .seller .staff .k { width: 24mm; border-right: .8pt solid #000; padding: 1.5mm 2mm; white-space: nowrap; font-weight: 700; }
  .seller .staff .v { padding: 1.5mm 2mm; text-align: center; }

  .deliv { width: 100%; margin: 3.2mm 0; border-collapse: collapse; }
  .deliv td { border: .8pt solid #000; height: 15mm; }
  .deliv .k { background: #ededed; font-weight: 700; text-align: center; width: 22mm; white-space: nowrap; }
  .deliv .v { text-align: center; }

  .items { width: 100%; border-collapse: collapse; }
  .items th, .items td { border: .8pt solid #000; padding: 1.3mm 1.8mm; }
  .items th { background: #ededed; font-weight: 700; text-align: center; font-size: 8.6pt; }
  .items td { height: 8.6mm; vertical-align: middle; font-size: 9pt; }
  .items td.c { text-align: center; }
  .items .model { font-weight: 700; }
</style></head><body>

  <div class="title"><span>発注書</span></div>

  <table class="top"><tbody><tr>
    <td class="left">
      <div class="addr">
        <span class="to">{{ vendor_name }}　{{ vendor_honor }}</span>
        <div class="note">下記の通り、発注致します。</div>
      </div>
    </td>
    <td class="right">
      <table class="meta"><tbody>
        <tr><td class="lbl">発注年月日</td><td class="val">{{ order_date }}</td></tr>
        <tr><td class="lbl">発注書No.</td><td class="val">{{ no }}</td></tr>
      </tbody></table>
      <div class="seller">
        <div class="body">
          {{ self_name }}<br>
          {{ self_zip }}　{{ self_addr }}<br>
          {{ self_tel }}　{{ self_fax }}
        </div>
        <table class="staff"><tbody><tr>
          <td class="k">担当：</td><td class="v">{{ self_staff }}</td>
        </tr></tbody></table>
      </div>
    </td>
  </tr></tbody></table>

  <table class="deliv"><tbody><tr>
    <td class="k">納品期限</td><td class="v">{{ due_date }}</td>
    <td class="k">納品場所</td><td class="v">{{ deliv }}</td>
  </tr></tbody></table>

  <table class="items">
    <colgroup>
      <col style="width:18%"><col style="width:55%"><col style="width:8%"><col style="width:19%">
    </colgroup>
    <thead><tr>
      <th>ﾒｰｶｰ / ｻｲｽﾞ</th><th>型式 / 名称</th><th>数量</th><th>備考</th>
    </tr></thead>
    <tbody>
      {% for r in rows %}
      <tr>
        <td>{{ r.maker }}</td>
        <td>{% if r.model %}<span class="model">{{ r.model }}</span>{% endif %}{% if r.model and r.name %}　{% endif %}{{ r.name }}</td>
        <td class="c">{{ r.qty }}</td>
        <td>{{ r.note }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

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
    # 空行で MIN_ROWS まで埋める
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
