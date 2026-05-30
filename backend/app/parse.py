# parse.py — 音声テキスト → 発注明細 への構造化
# GEMINI_API_KEY があれば Gemini Flash を使い、無い/失敗時はローカル簡易解析にフォールバック。
import os
import re
import json
import httpx

# ───────────────────────── ローカル簡易解析(フォールバック) ─────────────────────────
KNOWN_MAKERS = [
    'パナソニック', 'Panasonic', '三菱電機', '三菱', '日立', '東芝', '富士電機', 'オムロン',
    '因幡電工', 'ネグロス', '未来工業', '河村電器', '日東工業', 'テンパール',
    'アメリカン電機', 'コイズミ', '遠藤照明', '大光電機', 'DAIKO', 'KOIZUMI', 'ENDO',
]


def _z2h(s: str) -> str:
    out = []
    for c in (s or ''):
        if '０' <= c <= '９':
            out.append(chr(ord(c) - 0xFEE0))
        elif c == '　':
            out.append(' ')
        else:
            out.append(c)
    return ''.join(out)


def local_parse(text: str):
    text = _z2h(text).strip()
    if not text:
        return []
    chunks = re.split(r'[、，,。\n]+|あと|それと|プラス|および|加えて', text)
    rows = []
    for s in chunks:
        s = (s or '').strip()
        if not s:
            continue
        qty, unit = '', '個'
        m = re.search(r'(\d+)\s*(個|台|枚|本|セット|箱|巻|束|袋|ケース|m|メートル|組|張|缶|面)', s)
        if m:
            qty = m.group(1)
            unit = 'm' if m.group(2) == 'メートル' else m.group(2)
            s = s.replace(m.group(0), ' ')
        else:
            m2 = re.search(r'(\d+)\s*$', s)
            if m2:
                qty = m2.group(1)
                s = s.replace(m2.group(0), ' ')
        maker = ''
        for mk in KNOWN_MAKERS:
            if mk in s:
                maker = mk
                s = s.replace(mk, ' ')
                break
        model = ''
        toks = re.findall(r'[A-Za-z][A-Za-z0-9\-]{2,}|\d+[A-Za-z][A-Za-z0-9\-]*', s)
        if toks:
            model = max(toks, key=len).upper()
            s = re.sub(re.escape(model), ' ', s, flags=re.IGNORECASE)
        name = re.sub(r'\s+', ' ', re.sub(r'[のをがにはへとや]', ' ', s)).strip()
        if not (maker or model or name or qty):
            continue
        rows.append({'maker': maker, 'model': model, 'name': name, 'qty': qty, 'unit': unit, 'note': ''})
    return rows


# ───────────────────────── Gemini Flash ─────────────────────────
# 「裏のシステムプロンプト」(設計時に用意したもの)
SYSTEM_PROMPT = (
    "あなたは電気工事会社の発注書アシスタントです。"
    "現場担当者が話した発注メモを、発注明細の配列に構造化してください。\n"
    "ルール:\n"
    "- メモ内の複数品目を分割する。\n"
    "- メーカー名と型式・品番を可能な限り分離する(maker と model)。\n"
    "- 数量(qty)は半角数字のみ。単位(unit)が無ければ「個」。\n"
    "- 品名は name、補足は note に入れる。\n"
    "- 推測で値段は付けない。不明な項目は空文字にする。"
)

_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "maker": {"type": "string"},
                    "model": {"type": "string"},
                    "name": {"type": "string"},
                    "qty": {"type": "string"},
                    "unit": {"type": "string"},
                    "note": {"type": "string"},
                },
                "required": ["maker", "model", "name", "qty", "unit", "note"],
            },
        }
    },
    "required": ["items"],
}


def _norm(it: dict) -> dict:
    g = lambda k: ("" if it.get(k) is None else str(it.get(k))).strip()
    qty = re.sub(r'[^\d.]', '', g('qty'))
    unit = g('unit') or '個'
    return {'maker': g('maker'), 'model': g('model'), 'name': g('name'), 'qty': qty, 'unit': unit, 'note': g('note')}


def _gemini(text: str, key: str, model: str):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    body = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": f'発注メモ:\n"""{text}"""'}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": _SCHEMA,
            "temperature": 0,
        },
    }
    r = httpx.post(url, json=body, timeout=30.0)
    r.raise_for_status()
    data = r.json()
    raw = data["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(raw).get("items", [])


def parse_items(text: str):
    text = (text or "").strip()
    if not text:
        return []
    key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    model = (os.environ.get("GEMINI_MODEL") or "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    if key:
        try:
            items = [_norm(it) for it in _gemini(text, key, model)]
            items = [it for it in items if it['maker'] or it['model'] or it['name'] or it['qty']]
            if items:
                return items
        except Exception:
            pass  # Gemini 失敗時はローカル解析へ
    return local_parse(text)
