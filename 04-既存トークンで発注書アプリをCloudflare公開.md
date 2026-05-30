# 04 ─ 既存 Cloudflare トークンで発注書アプリを公開する手順

> 桜井電装ダッシュボード構築時に発行した API トークンを使い、`hachuusho.sakuraidenso.net` の Tunnel / DNS / Access を一気に作成します。

---

## トークン状態（2026-05-30 時点）

| 項目 | 値 |
|---|---|
| Token ID | `2bd3e42f1471b462287d4600f1fa5b57` |
| 状態 | **active**（有効） |
| 有効開始 | 2026-05-28 00:00 UTC |
| **有効期限** | **2026-05-31 23:59 UTC**（残り約 1.5 日） |
| 権限 | Cloudflare Tunnel / Access / Access Groups / Zone DNS（Edit） |

### ⚠️ 期限切れ前に終わらせる

- 残り時間が短いため、**この手順は一気通貫で 30 分以内に終わらせる**こと
- 期限が切れた場合は、本ドキュメント末尾「期限切れ時の新規トークン発行」を参照

---

## 既存リソース ID（コピペ用）

```
TOKEN      = cfut_＜REDACTED＞   # 一時トークン(2026-05-31失効)。git にコミットしないこと
ACCOUNT_ID = f9e0fac29fc82b9ea283b1e9c6c655cc
ZONE_ID    = 7ed56a2721023a0837b78b437f1fb822          (sakuraidenso.net)
IDP_ID     = eb0bf31c-fd10-497c-b80f-63c78a57d046      (One-time PIN)
AUTH_DOMAIN= skyblue2025.cloudflareaccess.com          (Zero Trust)
```

これから作成するもの：
- Tunnel `hachuusho`
- DNS CNAME: `hachuusho.sakuraidenso.net` → Tunnel
- Access Group `Hachuusho Users`（初期メール: `info@sakuraidensou.com`）
- Access Application（30日セッション・One-time PIN）
- Access Policy（Group 紐付け）

---

## STEP 1 ─ PowerShell に環境変数をセット

```powershell
$env:TOKEN      = "cfut_＜REDACTED＞   # 一時トークン(2026-05-31失効)。git にコミットしないこと"
$env:ACCOUNT_ID = "f9e0fac29fc82b9ea283b1e9c6c655cc"
$env:ZONE_ID    = "7ed56a2721023a0837b78b437f1fb822"
$env:IDP_ID     = "eb0bf31c-fd10-497c-b80f-63c78a57d046"
```

### 動作確認（トークンが今もアクティブか）

```powershell
curl.exe -sS "https://api.cloudflare.com/client/v4/user/tokens/verify" `
  -H "Authorization: Bearer $env:TOKEN" `
| python -m json.tool
```

期待する結果: `"status": "active"` が返れば OK。期限切れなら `expired` と出るのでその時は末尾の手順へ。

---

## STEP 2 ─ Cloudflare Tunnel を作成

```powershell
$body = '{"name": "hachuusho", "config_src": "cloudflare"}'

$tunnel = curl.exe -sS -X POST `
  "https://api.cloudflare.com/client/v4/accounts/$env:ACCOUNT_ID/cfd_tunnel" `
  -H "Authorization: Bearer $env:TOKEN" `
  -H "Content-Type: application/json" `
  -d $body | ConvertFrom-Json

$env:TUNNEL_ID    = $tunnel.result.id
$env:TUNNEL_TOKEN = $tunnel.result.token

"TUNNEL_ID    = $env:TUNNEL_ID"
"TUNNEL_TOKEN = $env:TUNNEL_TOKEN"
```

**`TUNNEL_TOKEN` は VPS の `.env` に書き込む値**なので、忘れずにメモ。

---

## STEP 3 ─ DNS CNAME を追加

`hachuusho.sakuraidenso.net` → Tunnel に向ける。

```powershell
$dns = @{
  type    = "CNAME"
  name    = "hachuusho"
  content = "$env:TUNNEL_ID.cfargotunnel.com"
  proxied = $true
  comment = "hachuusho via Cloudflare Tunnel"
} | ConvertTo-Json

curl.exe -sS -X POST `
  "https://api.cloudflare.com/client/v4/zones/$env:ZONE_ID/dns_records" `
  -H "Authorization: Bearer $env:TOKEN" `
  -H "Content-Type: application/json" `
  -d $dns | python -m json.tool | Select-Object -First 10
```

`"success": true` が出れば OK。

---

## STEP 4 ─ Tunnel ingress を設定（hostname → サービス）

`hachuusho.sakuraidenso.net` を VPS の `web` コンテナ（nginx）にルーティング。

```powershell
$ingress = @'
{
  "config": {
    "ingress": [
      { "hostname": "hachuusho.sakuraidenso.net", "service": "http://web:80" },
      { "service": "http_status:404" }
    ]
  }
}
'@

curl.exe -sS -X PUT `
  "https://api.cloudflare.com/client/v4/accounts/$env:ACCOUNT_ID/cfd_tunnel/$env:TUNNEL_ID/configurations" `
  -H "Authorization: Bearer $env:TOKEN" `
  -H "Content-Type: application/json" `
  -d $ingress | python -m json.tool | Select-Object -First 12
```

---

## STEP 5 ─ Cloudflare Access (認証) を設定

### 5-1. Access Group 作成（許可メール初期値）

```powershell
$group = '{"name": "Hachuusho Users", "include": [{"email": {"email": "info@sakuraidensou.com"}}]}'

$g = curl.exe -sS -X POST `
  "https://api.cloudflare.com/client/v4/accounts/$env:ACCOUNT_ID/access/groups" `
  -H "Authorization: Bearer $env:TOKEN" `
  -H "Content-Type: application/json" `
  -d $group | ConvertFrom-Json

$env:GROUP_ID = $g.result.id
"GROUP_ID = $env:GROUP_ID"
```

### 5-2. Access Application 作成（30日セッション）

```powershell
$app = @"
{
  "name": "Hachuusho",
  "domain": "hachuusho.sakuraidenso.net",
  "type": "self_hosted",
  "session_duration": "720h",
  "allowed_idps": ["$env:IDP_ID"],
  "auto_redirect_to_identity": true,
  "app_launcher_visible": false
}
"@

$a = curl.exe -sS -X POST `
  "https://api.cloudflare.com/client/v4/accounts/$env:ACCOUNT_ID/access/apps" `
  -H "Authorization: Bearer $env:TOKEN" `
  -H "Content-Type: application/json" `
  -d $app | ConvertFrom-Json

$env:APP_ID = $a.result.id
"APP_ID = $env:APP_ID"
```

### 5-3. Access Policy 作成（Group を許可）

```powershell
$policy = @"
{
  "name": "Allow Hachuusho Users",
  "decision": "allow",
  "include": [{"group": {"id": "$env:GROUP_ID"}}]
}
"@

curl.exe -sS -X POST `
  "https://api.cloudflare.com/client/v4/accounts/$env:ACCOUNT_ID/access/apps/$env:APP_ID/policies" `
  -H "Authorization: Bearer $env:TOKEN" `
  -H "Content-Type: application/json" `
  -d $policy | python -m json.tool | Select-Object -First 15
```

---

## STEP 6 ─ 取得した値を発注書アプリのローカル設定に保存

`web/` でも `app/` でも構いません。秘密情報なので **絶対に git にコミットしない**設定ファイルに保存：

```powershell
$config = @"
# 発注書アプリ Cloudflare 設定値（VPS デプロイ時に使用）
# このファイルは .gitignore 必須
CF_TUNNEL_ID=$env:TUNNEL_ID
CF_TUNNEL_NAME=hachuusho
TUNNEL_TOKEN=$env:TUNNEL_TOKEN
CF_ACCOUNT_ID=$env:ACCOUNT_ID
CF_ZONE_ID=$env:ZONE_ID
HOSTNAME=hachuusho.sakuraidenso.net
CF_ZT_AUTH_DOMAIN=skyblue2025.cloudflareaccess.com
CF_ZT_IDP_ID=$env:IDP_ID
CF_ACCESS_GROUP_ID=$env:GROUP_ID
CF_ACCESS_APP_ID=$env:APP_ID
INITIAL_EMAIL=info@sakuraidensou.com
"@

Set-Content -Encoding utf8 `
  "C:\Users\imaizumi.LINEWORKS-NET\Documents\SDプランニング\発注書アプリ\.cloudflare-config.local" `
  $config

Get-Item "C:\Users\imaizumi.LINEWORKS-NET\Documents\SDプランニング\発注書アプリ\.cloudflare-config.local"
```

`.gitignore` に必ず追加：
```
.cloudflare-config.local
.env
.env.*
```

---

## STEP 7 ─ VPS デプロイの直前準備

VPS 側に Compose 一式を配置した後、`/opt/hachuusho/.env` を作る：

```powershell
ssh root@72.60.211.213
```

VPS 上で：
```bash
mkdir -p /opt/hachuusho/data

cat > /opt/hachuusho/.env <<EOF
TUNNEL_TOKEN=<STEP 2 で取得した TUNNEL_TOKEN>
CF_API_TOKEN=<長期トークン推奨。短期なら今のを流用も可>
CF_ACCOUNT_ID=f9e0fac29fc82b9ea283b1e9c6c655cc
CF_ACCESS_GROUP_ID=<STEP 5-1 で取得した GROUP_ID>
EOF

chmod 600 /opt/hachuusho/.env
```

あとは `docker-compose.prod.yml` を配置して：
```bash
cd /opt/hachuusho
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

詳細は `02-新規アプリ立ち上げ手順.md` の STEP 4 以降を参照。

---

## STEP 8 ─ 動作確認

```powershell
curl.exe -sI "https://hachuusho.sakuraidenso.net/" | Select-Object -First 12
```

期待する応答:
- **302 Found** で `Location` が `https://skyblue2025.cloudflareaccess.com/cdn-cgi/access/login/...` に向く

→ Cloudflare Access のログイン画面に飛ばされていれば成功。

ブラウザで `https://hachuusho.sakuraidenso.net/` を開く → メール入力 → 6桁コード → アプリ表示。

---

## 完了後にやること

### A. 管理画面で許可メールを増やす（推奨）

桜井電装ダッシュボードと同じパターンで、`/api/access-emails` を実装すれば管理画面から追加・削除できます。実装は `sakurai-dashboard` リポジトリの `backend/app/cloudflare.py` を流用可能。

### B. 長期 API トークンを発行（必須・期限切れ前に！）

現トークンは 2026-05-31 で失効するので、長期用に最小権限トークンを発行：

1. https://dash.cloudflare.com/profile/api-tokens
2. 「Create Custom Token」
3. 設定：
   - **Token name**: `hachuusho-runtime`
   - **Permissions**: `Account` → `Access: Organizations, Identity Providers, and Groups` → `Edit` のみ
   - **Account Resources**: 自アカウント
   - **TTL**: 無期限
4. 発行されたトークンを `/opt/hachuusho/.env` の `CF_API_TOKEN=` に書き換え
5. `docker compose restart api`

これで許可メール管理が継続的に動きます。

---

## トラブルシュート

| 症状 | 確認 |
|---|---|
| `401 Unauthorized` | トークン期限切れ → 末尾の新規発行手順へ |
| `400 Bad Request` Tunnel 作成時 | 同じ名前 (`hachuusho`) の Tunnel が既存。違う名前にするか既存を削除 |
| DNS が反映されない | DNS 伝播待ち（30秒〜数分）。`nslookup hachuusho.sakuraidenso.net` で確認 |
| 302 が出ず Tunnel に直接届く | Access Application の `domain` が hostname と完全一致しているか確認 |

---

## 期限切れ時の新規トークン発行

トークン (`cfut_...`) が 2026-05-31 を過ぎて無効化されたら：

1. https://dash.cloudflare.com/profile/api-tokens → 「Create Custom Token」
2. **Token name**: `hachuusho-setup`
3. **Permissions**：
   - `Account` → `Cloudflare Tunnel` → `Edit`
   - `Account` → `Access: Apps and Policies` → `Edit`
   - `Account` → `Access: Organizations, Identity Providers, and Groups` → `Edit`
   - `Zone` → `DNS` → `Edit`
4. **Account Resources**: 自アカウント
5. **Zone Resources**: `sakuraidenso.net`
6. **TTL**: 24時間
7. 「Continue to summary」→ 「Create Token」→ コピー
8. 本ドキュメント STEP 1 の `$env:TOKEN` に新トークンを入れて再実行

桜井電装ダッシュボード構築時とまったく同じ手順なので、`所在ダッシュボード` プロジェクトの `.cloudflare-config.local`（既存）の構造を参考にしてください。
