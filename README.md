# タトゥーOK 温泉・サウナ ポータル（開発版）

概要
- Next.js + TypeScript
- DB: MySQL（Prisma を ORM として使用）
- まずは東京のデータにフォーカスして開発

セットアップ（ローカル）

1. リポジトリをクローン／作業ディレクトリへ移動
2. .env を作成して `DATABASE_URL` を設定（.env.example を参照）
3. 依存インストール

```bash
npm install
```

4. Prisma の生成とマイグレーション

```bash
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

5. 開発サーバ起動

```bash
npm run dev
```

API
- GET /api/facilities?prefecture=東京都&city=渋谷区&keyword=サウナ
- POST /api/submit  (施設情報の投稿。管理画面で承認されるまで status は pending)

今後のタスク
- 詳細検索 UI（条件フィルタ、タグ）
- 地図表示（Leaflet or Google Maps）とピン表示
- ユーザー投稿の承認フロー（管理画面）
- マネタイズ案検討（広告、プレミアム掲載など）

開発段階はまず東京のデータを集め、UI を優先して作ります。ご要望あれば機能優先度を調整します。