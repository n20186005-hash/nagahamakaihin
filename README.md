# 長浜海浜ガイド — NagahamaKaihin.com

長浜海浜公園・長浜海水浴場を案内する、日本語単一言語の静的観光サイトです。

## 構成

- Astro + TypeScript
- Tailwind CSS v4
- pnpm
- Cloudflare Workers Static Assets
- データベース、ログイン、CMSなし
- GA4: `G-HXM22WWPKP`
- 独自ドメイン: `NagahamaKaihin.com`

## ページ

- `/` トップ
- `/beach/` 海水浴・設備・ルール
- `/family/` 子どもとの過ごし方
- `/access/` 電車・バス・車・駐車場
- `/food/` 周辺ランチ
- `/events/` 花火・特設市
- `/faq/` よくある質問
- `/privacy/` プライバシーポリシー
- `/credits/` 写真・情報出典

## ローカル開発

Node.js 22以上を推奨します。

```bash
corepack enable
pnpm install
pnpm dev
```

`http://localhost:4321` を開きます。

## ビルド

```bash
pnpm build
pnpm preview
```

生成先は `dist/` です。

## Cloudflare Workersへデプロイ

Cloudflareアカウントにログイン後、次を実行します。

```bash
pnpm deploy
```

`wrangler.jsonc` は `dist/` をWorkers Static Assetsとして配信する設定です。初回デプロイ後、Cloudflareダッシュボードでカスタムドメイン `NagahamaKaihin.com` と `www.NagahamaKaihin.com` を追加し、wwwからapexへの301リダイレクトを設定してください。

## 年次情報の更新

主な観光データは `src/data/site.json` に集約しています。海水浴場の開設日、料金、イベント日程、更新日を毎年見直してください。

更新後に確認する項目：

1. `site.updatedAt`
2. `season`
3. `events`
4. 周辺店舗の名称・営業状況
5. FAQ内の年度表記
6. `StatusBar.astro` の確認日表示

## 写真

写真は `public/images/` にローカル保存し、外部ホットリンクを使用していません。権利情報は `PHOTO-LICENSES.md` とサイト内 `/credits/` に記載しています。

## 注意

本サイトは非公式ガイドです。公開前に、当年の海水浴場・イベント・交通・店舗情報を必ず再確認してください。
