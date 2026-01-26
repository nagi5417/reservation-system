# 予約システム (Reservation System)

Spring Boot + React で構築された予約管理システムです。

## 機能

### ユーザー向け機能
- ユーザー登録・ログイン（メール認証付き）
- Google OAuth2 ログイン
- 予約枠の検索・閲覧
- 予約の作成・キャンセル
- 予約履歴の確認
- Google カレンダー連携

### スタッフ向け機能
- ダッシュボード
- サービスメニュー管理（CRUD）
- 予約枠管理（CRUD）
- 全予約一覧・管理

## 技術スタック

### バックエンド
- Java 21
- Spring Boot 3.4
- Spring Security（セッション認証 + OAuth2）
- Spring Data JPA
- PostgreSQL
- Gradle

### フロントエンド
- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### 外部連携
- Google OAuth2
- Google Calendar API
- MailHog（開発用メールサーバー）

## セットアップ

### 前提条件
- Java 21
- Node.js 20+
- Docker & Docker Compose

### 1. リポジトリのクローン

```bash
git clone https://github.com/YOUR_USERNAME/reservation-system.git
cd reservation-system
```

### 2. 環境変数の設定

```bash
# バックエンド
cp reservation/.env.example reservation/.env
# .env ファイルを編集して、実際の値を設定
```

### 3. Docker コンテナの起動（PostgreSQL, MailHog）

```bash
cd reservation
docker compose up -d
```

### 4. バックエンドの起動

```bash
cd reservation
./gradlew bootRun
```

バックエンドは http://localhost:8080 で起動します。
Swagger UI: http://localhost:8080/swagger-ui.html

### 5. フロントエンドの起動

```bash
cd reservation-frontend
npm install
npm run dev
```

フロントエンドは http://localhost:5173 で起動します。

## 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| DB_HOST | データベースホスト | localhost |
| DB_PORT | データベースポート | 5432 |
| DB_NAME | データベース名 | reservation_db |
| DB_USERNAME | データベースユーザー | reservation_user |
| DB_PASSWORD | データベースパスワード | reservation_pass |
| GOOGLE_CLIENT_ID | Google OAuth2 クライアントID | - |
| GOOGLE_CLIENT_SECRET | Google OAuth2 クライアントシークレット | - |
| APP_BASE_URL | アプリケーションのベースURL | http://localhost:5173 |

## 開発用ツール

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **MailHog UI**: http://localhost:8025

## ライセンス

MIT License
