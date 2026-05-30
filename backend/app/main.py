# main.py — 発注書アプリ API (FastAPI)
from urllib.parse import quote

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from .pdf import render_order_pdf
from .parse import parse_items

app = FastAPI(title="発注書アプリ API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


class Item(BaseModel):
    maker: str = ""
    model: str = ""
    name: str = ""
    qty: str = ""
    unit: str = ""
    note: str = ""


class Order(BaseModel):
    no: str = ""
    orderDate: str = ""
    dueDate: str = ""
    vendorName: str = ""
    vendorHonor: str = "御中"
    deliv: str = ""
    items: list[Item] = []


class ParseReq(BaseModel):
    text: str = ""


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/parse")
def parse(req: ParseReq):
    # 音声テキスト → 明細配列。Gemini(キーあれば) → 失敗時ローカル解析
    return {"items": parse_items(req.text)}


@app.post("/api/pdf")
def make_pdf(order: Order):
    pdf = render_order_pdf(order.model_dump())
    safe = "".join(c for c in (order.no or "sakurai") if c.isalnum() or c in "-_")
    fname = f"発注書_{safe or 'sakurai'}.pdf"
    headers = {
        # 日本語ファイル名は RFC5987 (filename*) で渡す
        "Content-Disposition": f"attachment; filename=\"order.pdf\"; filename*=UTF-8''{quote(fname)}",
    }
    return Response(content=pdf, media_type="application/pdf", headers=headers)
