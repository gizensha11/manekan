# マネカン v0.3.6 PWA

v0.3.5（未来カレンダー）をベースにPWA対応を追加した版です。

## 追加内容
- `manifest.webmanifest`
- PWA用アイコン（192 / 512 / maskable / Apple Touch Icon）
- Service Workerによるアプリシェルと同一オリジン資産のキャッシュ
- iPhone / Androidのホーム画面追加向けmeta設定
- 本番ビルド時のみService Workerを登録

## ローカル確認
```powershell
npm.cmd install
npm.cmd run dev
```

Service WorkerはViteの本番ビルド時のみ登録するため、PWAとしての最終確認はVercelへデプロイしたHTTPS URLで行ってください。

## スマホに追加
### iPhone
SafariでVercel URLを開く → 共有 → ホーム画面に追加

### Android (Chrome)
Vercel URLを開く → メニュー → アプリをインストール / ホーム画面に追加
