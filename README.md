# 発注書アプリ ─ ドキュメント

レスポンシブ PWA を VPS にホスティングし、Cloudflare Tunnel + Access で公開する一連の手順をまとめています。

## ファイル一覧

| ファイル | 用途 |
|---|---|
| `README.md` | このファイル（全体構成・索引） |
| `01-VPS接続手順.md` | Hostinger VPS への SSH 接続と同居サービスの取り扱い |
| `02-新規アプリ立ち上げ手順.md` | プロジェクト作成 → Cloudflare 設定 → デプロイまでの一気通貫手順 |
| `03-PWA化チェックリスト.md` | manifest / service worker / アイコン等の PWA 必須要素 |
| `web/` | **本アプリ（A案・藍）** — フルスクリーンのレスポンシブPWA実装 |
| `mockup/` | 初期の単一HTMLモックアップ（参照用・履歴） |
| `フォーマットデータ/` | 発注書のテンプレート Excel など |

## web/（本アプリ）の起動・構成

A案（藍テーマ）の実装。ローカル確認は `web/` 直下で静的配信して開く（`file://` だと Babel が外部JSXを読めないため）:

```powershell
cd web ; python -m http.server 8765 --bind 127.0.0.1   # → http://127.0.0.1:8765/
```

- `index.html` … エントリ（React/Babel/jsPDF/html2canvas を CDN 読込 → `app/*.jsx` を描画）
- `app/core.jsx` … データ・日付/採番ヘルパー・`aiParse`（**`/api/parse`=Gemini Flash → 失敗時ローカル解析**にフォールバック）
- `app/themes.jsx` `app/ui.jsx` … 藍テーマトークン・共通UI（ロゴ＋社名ロックアップ）
- `app/screens-*.jsx` … ホーム/履歴・作成(音声入力)・プレビュー(PDFダウンロード)・発注先マスタ
- `app/PhoneApp.jsx` … 画面遷移・タブ・localStorage 永続化
- 音声は端末標準の Web Speech API（無料）。履歴は localStorage に保存。

> 次段階: `/api/parse`(FastAPI+Gemini Flash) 実装、Vite でのJSXプリコンパイル、`/opt/hachuusho/` への Cloudflare デプロイ。

---

## 全体アーキテクチャ（標準パターン）

```
[ユーザー端末]
    ↓ https://<app>.sakuraidenso.net （または独自ドメイン）
[Cloudflare Edge]
    ├ Cloudflare Access （メール許可リスト等で認証）
    └ Cloudflare Tunnel
            ↓ QUIC
[VPS 72.60.211.213 / /opt/<app-name>/]
    ├ cloudflared （サイドカーコンテナ）
    ├ web         （静的フロント or SSR、nginx で配信）
    ├ api         （バックエンド：FastAPI / Express など）
    └ db ボリューム（SQLite / Postgres）

[既存 CareFlow / kaipoke-api / 桜井電装ダッシュボード]
    ↑ それぞれ別の /opt/<name>/ で完全分離・干渉なし
```

## 1台の VPS で複数アプリを並行運用する原則

- **ディレクトリは `/opt/<アプリ名>/` で完全分離**
- **Docker Compose プロジェクト名（`name:`）を一意にする**（kaipoke-api 等と被らせない）
- **Cloudflare Tunnel は各アプリごとに独立**（cloudflared サイドカーをアプリ Compose 内に置く）
- **ホストポートは原則使わない**（Tunnel 経由なのでバインド不要、ポート競合がゼロ）
- **既存コンテナを停止・再起動しない**（kaipoke-api・CareFlow・cloudflared(systemd) 等は触らない）

## 既に運用中のアプリ

| 名称 | 所在 | アクセス |
|---|---|---|
| 桜井電装 所在ダッシュボード | `/opt/sakurai-dashboard/` | https://dashboard.sakuraidenso.net |
| CareFlow | `/opt/carelink/` 等（host） | https://carelink.kaipoke-api.net |
| kaipoke-api | Docker (`playwrighttest1-kaipoke-api`) | — |

→ 発注書アプリは別ディレクトリ `/opt/hachuusho/` などで起動し、上記いずれにも干渉させない。

---

## クイックスタート（だいたいの所要時間）

| 工程 | 所要時間 |
|---|---|
| ローカルでアプリのスケルトン作成 | 30〜60 分 |
| Docker 化・ローカル動作確認 | 30 分 |
| Cloudflare の Tunnel + DNS + Access 設定 | 20 分 |
| VPS への配置・起動 | 15 分 |
| PWA 化（manifest / SW / アイコン） | 30〜60 分 |
| **合計** | **約 2〜3 時間** |

詳細手順は `02-新規アプリ立ち上げ手順.md` を参照。
