# 01 ─ VPS 接続手順

最終更新: 2026-05-29

## 接続先 VPS 情報

| 項目 | 値 |
|---|---|
| プロバイダ | Hostinger (Malaysia) |
| ホスト名 | `srv1300618.hstgr.cloud` |
| IP アドレス | `72.60.211.213` |
| ログインユーザ | `root` |
| 認証方式 | SSH 公開鍵認証 (ed25519) |
| 秘密鍵パス (ローカル PC) | `C:\Users\imaizumi.LINEWORKS-NET\.ssh\id_ed25519` |
| ポート | `22` (デフォルト) |
| OS | Ubuntu 22.04 (kernel 5.15) |

> **重要**: この VPS には複数のサービスが**同居**しています。詳細は後述「同居サービス一覧」を参照。kaipoke-api 等を**絶対に止めない**ように。

## 接続コマンド

### 通常接続 (PowerShell / Windows Terminal)
```powershell
ssh root@72.60.211.213
```

### 鍵を明示する場合
```powershell
ssh -i C:\Users\imaizumi.LINEWORKS-NET\.ssh\id_ed25519 root@72.60.211.213
```

### ホスト名で接続する場合
```powershell
ssh root@srv1300618.hstgr.cloud
```

### `~/.ssh/config` への登録 (推奨)

`C:\Users\imaizumi.LINEWORKS-NET\.ssh\config` に以下を追記すると `ssh sakurai-vps` で接続できる。

```sshconfig
Host sakurai-vps
    HostName 72.60.211.213
    User root
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
```

## ファイル転送

### scp（単一ファイル）
```powershell
# ローカル → VPS
scp .\local-file.txt root@72.60.211.213:/opt/hachuusho/

# VPS → ローカル
scp root@72.60.211.213:/opt/hachuusho/backup.sql.gz .
```

### tar + ssh（ディレクトリ全体・推奨）
```powershell
# ローカルから VPS に転送（node_modules等を除外）
tar --exclude='./node_modules' --exclude='./.git' -czf - ./my-app `
  | ssh root@72.60.211.213 'tar -xzf - -C /opt/hachuusho'
```

---

## 同居サービス一覧（2026-05-29 時点）

### Docker コンテナ（`docker ps`）

| 名前 | 用途 | 触ってよいか |
|---|---|---|
| `kaipoke-api` | kaipoke 連携 API | ❌ 絶対停止禁止 |
| `carelink-frontend` / `carelink-backend` / `carelink-postgres` | CareFlow 本番 | ❌ 停止禁止 |
| `hermes-agent` | ホスティング系 | ❌ 触らない |
| `openclaw-src-openclaw-gateway-1` | ゲートウェイ | ❌ 触らない |
| `obsidian-couchdb` | Obsidian 同期 | ❌ 触らない |
| `n8n-n8n-1` | n8n ワークフロー | ❌ 触らない |
| `sd-cloudflared` / `sd-web` / `sd-api` | **桜井電装ダッシュボード**（自分のアプリ） | ✅ 自分で管理 |

### systemd サービス

| 名前 | 用途 | 触ってよいか |
|---|---|---|
| `cloudflared` | CareFlow 用 Tunnel | ❌ 停止禁止 |
| `ssh` / `ufw` 等 OS 標準 | システム | ❌ 触らない |

### ファイアウォール / Cloudflare Tunnel
- ホストの公開ポートは原則 22 (SSH) のみ
- 各アプリは **Cloudflare Tunnel 経由**で公開（ホストポートにバインドしない）
- 既存 cloudflared (systemd) は CareFlow 用。新規アプリは**別個に Docker サイドカー**で立てる

---

## 安全な操作のためのルール

### ✅ やってよいこと
- `/opt/<自分のアプリ名>/` 配下の自由な操作
- `docker compose -f docker-compose.yml up -d` （自分のコンテナのみ）
- `docker logs <自分のコンテナ>` で確認
- 自分の Cloudflare Tunnel・DNS・Access の管理

### ❌ やってはいけないこと
- `docker system prune -a` （他のイメージも消える）
- 既存コンテナ（`kaipoke-api` 等）の `stop` / `restart` / `rm`
- `systemctl stop cloudflared` （CareFlow が落ちる）
- `/opt/carelink/` 等 他アプリディレクトリの編集
- VPS の `apt upgrade` / `reboot` （他サービスに影響）
- `ufw` ルール変更（既存通信を壊しうる）
- 共通 Docker ボリュームの削除

### 必ず確認してから操作
- 新規ポートをホストでバインドする場合 → 既存ポート占有を `ss -tlnp` で確認
- 重い処理を流す場合 → `top` / `df -h` でリソース余裕確認

---

## 接続トラブル時のチェック

1. **公開鍵が VPS に登録されているか**
   ```powershell
   ssh root@72.60.211.213 'wc -l ~/.ssh/authorized_keys'
   ```

2. **ホスト鍵が変わっていないか**（MITM 検知）
   ```powershell
   # 既知の ed25519 fingerprint:
   # AAAAC3NzaC1lZDI1NTE5AAAAIO9yG+4mqApNKTZVAoscYQH3biCTrIA5q8/9T580m1OS
   ```
   変わっていたら、Hostinger コントロールパネルで再確認してから:
   ```powershell
   ssh-keygen -R 72.60.211.213
   ```

3. **VPS 側 sshd が落ちていないか**
   Hostinger コントロールパネル → VNC コンソール → `systemctl status ssh`

4. **ファイアウォール (ufw)**
   ```powershell
   ssh root@72.60.211.213 'ufw status'
   # 22/tcp が ALLOW なら問題なし
   ```

## SSH 鍵のローテーション（180日推奨）

```powershell
# 新鍵生成
ssh-keygen -t ed25519 -f $HOME\.ssh\sakurai_deploy_20260601 -N '""' -C "sakurai-deploy"

# 公開鍵を VPS に追加
type $HOME\.ssh\sakurai_deploy_20260601.pub `
  | ssh root@72.60.211.213 'cat >> ~/.ssh/authorized_keys'

# 新鍵で接続テスト
ssh -i $HOME\.ssh\sakurai_deploy_20260601 root@72.60.211.213

# 旧鍵を authorized_keys から削除
ssh root@72.60.211.213 'nano ~/.ssh/authorized_keys'
```
