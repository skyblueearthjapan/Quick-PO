# 03 ─ PWA 化チェックリスト

レスポンシブな PWA（Progressive Web App）化のための必須要素・推奨設定をまとめます。

PWA を満たすことで以下が可能に：
- **iPhone / Android のホーム画面に追加**できる
- **オフラインでも開ける**（キャッシュした内容）
- **ネイティブアプリ風の起動**（フルスクリーン、スプラッシュ画面）
- **プッシュ通知**（実装すれば）

---

## 必須要素チェックリスト

### ✅ 1. HTTPS
- Cloudflare Tunnel 経由なら自動で HTTPS（Cloudflare が証明書発行）
- localhost 開発は HTTP でも PWA 機能の一部が動く

### ✅ 2. `manifest.json`
- `frontend/public/manifest.json` に配置
- ホーム画面追加時のアイコン・名前・テーマカラー等を定義

### ✅ 3. Service Worker
- オフラインキャッシュ・更新検知の心臓部
- vite-plugin-pwa が自動生成 → 自分で書かなくて OK

### ✅ 4. アイコン（複数サイズ）
- 192×192 と 512×512 は必須
- 180×180（Apple Touch Icon）も推奨

### ✅ 5. viewport meta タグ
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`

### ✅ 6. responsive layout
- @media クエリ or container query / Tailwind 等
- タップ領域 ≥ 44×44px

---

## Vite + vite-plugin-pwa での実装

### インストール
```powershell
cd frontend
npm install -D vite-plugin-pwa workbox-window
```

### `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: '発注書アプリ',
        short_name: '発注書',
        description: '株式会社 桜井電装 発注書管理',
        theme_color: '#1a3a52',
        background_color: '#f4f2ec',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        lang: 'ja',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // SPA fallback
        navigateFallback: '/index.html',
        // API は常に最新（キャッシュしない）
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // 開発時も SW を有効化（PWA 動作確認用）
      },
    }),
  ],
});
```

### `frontend/src/main.jsx`（更新検知）

```jsx
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('新しいバージョンがあります。再読み込みしますか？')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('オフラインでも使えるようになりました');
  },
});
```

### `frontend/index.html`（メタ）

```html
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#1a3a52" />

<!-- iOS Safari でホーム画面に追加した時の表示 -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="発注書" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />

<title>発注書アプリ｜株式会社桜井電装</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

---

## アイコン作成

### 必要なファイル

| ファイル | サイズ | 用途 |
|---|---|---|
| `frontend/public/icons/icon-192.png` | 192×192 | PWA 標準 |
| `frontend/public/icons/icon-512.png` | 512×512 | PWA 標準 / スプラッシュ |
| `frontend/public/icons/icon-512-maskable.png` | 512×512 | Android safe-zone 対応 |
| `frontend/public/icons/apple-touch-icon-180.png` | 180×180 | iOS ホーム画面 |
| `frontend/public/favicon.ico` | 32×32 | タブアイコン |

### 元画像から一括生成

ImageMagick を使う場合：
```powershell
# 元画像 (512x512 推奨) を logo.png として用意
magick logo.png -resize 192x192 frontend/public/icons/icon-192.png
magick logo.png -resize 512x512 frontend/public/icons/icon-512.png
magick logo.png -resize 180x180 frontend/public/icons/apple-touch-icon-180.png

# maskable は中央 80% に余白を入れる
magick logo.png -resize 410x410 -background "#1a3a52" -gravity center -extent 512x512 frontend/public/icons/icon-512-maskable.png

# favicon
magick logo.png -resize 32x32 frontend/public/favicon.ico
```

オンラインツールでも可：
- https://realfavicongenerator.net/
- https://maskable.app/editor

---

## レスポンシブ設計のポイント

### ブレークポイント目安

| 幅 | デバイス | 推奨レイアウト |
|---|---|---|
| ≤ 480px | スマホ縦 | 1カラム、大きいタップ領域 |
| 481〜768px | スマホ横 / タブレット縦 | 1〜2カラム |
| 769〜1024px | タブレット横 | 2カラム |
| ≥ 1025px | PC | 3カラム以上 |

### CSS 例

```css
:root {
  --gap: 12px;
}

/* モバイル優先（デフォルト） */
.container {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

/* タブレット以上 */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    flex-direction: row;
    flex-wrap: wrap;
  }
}

/* PC */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### タップ領域の最低サイズ
- **44×44px** 以上（Apple HIG）
- ボタン padding: 12px 以上推奨

### iOS Safe Area 対応
```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
.fixed-header {
  padding-top: calc(env(safe-area-inset-top) + 12px);
}
```

---

## 動作確認

### Chrome DevTools
1. F12 → Application タブ
2. **Manifest**: マニフェストが正しく認識されているか
3. **Service Workers**: SW が登録・active か
4. **Storage** → Cache Storage: キャッシュされたファイル一覧
5. **Lighthouse** → PWA 監査でスコア確認

### iPhone (Safari)
1. URL を開く
2. 共有ボタン → **「ホーム画面に追加」**
3. アイコン・名前が manifest 通りか確認
4. ホーム画面から開く → スタンドアロン表示か確認

### Android (Chrome)
1. URL を開く
2. 自動で **「ホーム画面に追加」** バナーが出る
3. インストール後にスタンドアロン起動

### オフライン確認
1. PWA をインストール
2. 一度開いて SW にキャッシュさせる
3. Wi-Fi / 通信を切る
4. もう一度開く → キャッシュから表示されるか

---

## よくある落とし穴

| 問題 | 対処 |
|---|---|
| iOS でホーム画面アイコンがぼやける | `apple-touch-icon` を 180×180 PNG で配置（角丸不要、iOSが自動で丸める） |
| Android で四角アイコン | `purpose: "maskable"` のアイコンを別途用意 |
| 更新が反映されない | SW のキャッシュ戦略が `CacheFirst` になってる/`updateSW(true)` を呼ぶ |
| iOS で起動毎にログイン求められる | Cloudflare Access のセッション 720h 化、`auto_redirect_to_identity: true` |
| SSE がモバイルでブツブツ切れる | プッシュ通知ベースに切替検討、または定期的に再接続 |
| Chrome で `Manifest: property 'short_name' is required` | manifest.json の `short_name` を 12文字以内で設定 |

---

## 参考：sakurai-dashboard との違い

桜井電装の所在ダッシュボードは **PWA 化していません**（社内利用・常時 PC 想定）。
発注書アプリは外出先からも使う想定なので PWA 化が活きます。

| 項目 | 所在ダッシュボード | 発注書アプリ（想定） |
|---|---|---|
| PWA | なし | あり |
| オフライン | 不可 | 可（キャッシュ） |
| モバイル UI | 専用 MobileApp.jsx | レスポンシブ + PWA |
| 更新方式 | SSE で即時同期 | 手動 or polling |

実装上の差分は frontend のみ。バックエンド・Cloudflare・デプロイ手順は完全に同じパターンです。
