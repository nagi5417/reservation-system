# PostgreSQL接続エラー トラブルシューティング

このドキュメントは、アプリケーション起動時に発生した「role "reservation_user" does not exist」エラーの調査と解決の記録です。

---

## 🔴 発生したエラー

### エラーメッセージ

```
FATAL: role "reservation_user" does not exist
org.hibernate.exception.AuthException: Unable to obtain isolated JDBC connection
```

### 症状

- アプリケーションが起動しない
- Spring Bootがデータベースに接続できない
- PostgreSQLコンテナ内では`reservation_user`が存在することを確認済み

---

## 🔍 調査の流れ

### 1. PostgreSQLコンテナの状態確認

**実行したコマンド：**
```bash
docker compose ps
```

**結果：**
```
NAME                   IMAGE                    COMMAND                  SERVICE    CREATED         STATUS         PORTS
reservation-mailhog    mailhog/mailhog:latest   "MailHog"                mailhog    4 minutes ago   Up 4 minutes   0.0.0.0:1025->1025/tcp
reservation-postgres   postgres:16-alpine       "docker-entrypoint.s…"   postgres   4 minutes ago   Up 4 minutes   0.0.0.0:5432->5432/tcp
```

**確認できたこと：**
- ✅ PostgreSQLコンテナは正常に起動している
- ✅ ポート5432が正しく公開されている

---

### 2. PostgreSQLログの確認

**実行したコマンド：**
```bash
docker compose logs postgres
```

**確認できたこと：**
- ✅ `CREATE DATABASE` は実行されている
- ❌ `CREATE USER reservation_user` のログがない
- ⚠️ デフォルトユーザーは`reservation_user`で作成されている

---

### 3. データベースとユーザーの存在確認

**実行したコマンド：**
```bash
docker compose exec postgres psql -U reservation_user -d reservation_db
```

**PostgreSQL内で実行：**
```sql
\du
```

**結果：**
```
                                 List of roles
    Role name     |                         Attributes
------------------+------------------------------------------------------------
 reservation_user | Superuser, Create role, Create DB, Replication, Bypass RLS
```

**確認できたこと：**
- ✅ `reservation_user`は存在する
- ✅ 適切な権限を持っている

---

### 4. データベース一覧の確認

**PostgreSQL内で実行：**
```sql
\l
```

**結果：**
```
      Name      |      Owner       | Encoding | Locale Provider |  Collate   |   Ctype
----------------+------------------+----------+-----------------+------------+------------
 postgres       | reservation_user | UTF8     | libc            | en_US.utf8 | en_US.utf8
 reservation_db | reservation_user | UTF8     | libc            | en_US.utf8 | en_US.utf8
```

**確認できたこと：**
- ✅ `reservation_db`は存在する
- ✅ 所有者は`reservation_user`

---

### 5. テーブルの存在確認

**PostgreSQL内で実行：**
```sql
\dt
```

**結果：**
```
Did not find any relations.
```

**確認できたこと：**
- ❌ テーブルはまだ作成されていない
- これは想定通り（アプリケーション起動時に作成される）

---

### 6. PostgreSQLから抜けて接続テスト

**実行したコマンド：**
```bash
docker compose exec postgres psql -U reservation_user -d reservation_db -c "SELECT 1;"
```

**結果：**
```
 ?column?
----------
        1
(1 row)
```

**確認できたこと：**
- ✅ PostgreSQLコンテナ内からの接続は成功する

---

### 7. localhostを指定した接続テスト

**実行したコマンド：**
```bash
docker compose exec postgres psql -h localhost -U reservation_user -d reservation_db -c "SELECT 1;"
```

**結果：**
```
 ?column?
----------
        1
(1 row)
```

**確認できたこと：**
- ✅ localhost経由でも接続は成功する
- ⚠️ しかし、アプリケーションからは接続できない

---

### 8. 【重要】ポート5432の使用状況確認

**実行したコマンド：**
```bash
lsof -i :5432
```

**結果：**
```
COMMAND     PID          USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
postgres   1523 yanagitanaoki    7u  IPv6 0xd5f98a9d0ec22d62      0t0  TCP localhost:postgresql (LISTEN)
postgres   1523 yanagitanaoki    8u  IPv4  0xdf6fb00bad2e604      0t0  TCP localhost:postgresql (LISTEN)
com.docke 65426 yanagitanaoki  180u  IPv6 0xb943ed640cfc221b      0t0  TCP *:postgresql (LISTEN)
```

**🎯 問題発見！**
- ❌ Mac上にインストールされたPostgreSQL（PID 1523）がポート5432を使用している
- ❌ Dockerコンテナ（PID 65426）も同じポートを使用している
- ❌ アプリケーションは`localhost:5432`に接続しようとして、Mac上のPostgreSQLに接続している
- ❌ Mac上のPostgreSQLには`reservation_user`が存在しない

---

## 🔧 解決方法

### Step 1: Homebrewで管理されているPostgreSQLサービスの確認

**実行したコマンド：**
```bash
brew services list
```

**結果：**
```
Name          Status  User          File
mysql         none
postgresql@15 started yanagitanaoki ~/Library/LaunchAgents/homebrew.mxcl.postgresql@15.plist
tomcat        none
```

**確認できたこと：**
- `postgresql@15`が起動している

---

### Step 2: Mac上のPostgreSQLを停止

**実行したコマンド：**
```bash
brew services stop postgresql@15
```

**結果：**
```
Stopping `postgresql@15`... (might take a while)
==> Successfully stopped `postgresql@15` (label: homebrew.mxcl.postgresql@15)
```

---

### Step 3: ポート5432の再確認

**実行したコマンド：**
```bash
lsof -i :5432
```

**結果：**
```
COMMAND     PID          USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
com.docke 65426 yanagitanaoki  180u  IPv6 0xb943ed640cfc221b      0t0  TCP *:postgresql (LISTEN)
```

**確認できたこと：**
- ✅ Dockerコンテナだけがポート5432を使用している
- ✅ Mac上のPostgreSQLは停止した

---

### Step 4: アプリケーション起動

**実行したコマンド：**
```bash
./gradlew bootRun
```

**結果：**
```
HikariPool-1 - Start completed.
Database JDBC URL [jdbc:postgresql://localhost:5432/reservation_db]
Database version: 16.11

create table email_verification_tokens (...)
create table reservations (...)
create table service_menus (...)
create table slots (...)
create table users (...)

Tomcat started on port 8080 (http) with context path '/'
Started ReservationApplication in 3.195 seconds
```

**🎉 成功！**

---

## 📊 根本原因

### 問題の全体像

```
┌─────────────────────────────────────────┐
│ Spring Boot Application                 │
│ (localhost:5432に接続しようとする)      │
└──────────────┬──────────────────────────┘
               │
               ├─────────────────────────┐
               │                         │
               ▼                         ▼
┌──────────────────────────┐  ┌────────────────────────┐
│ Mac上のPostgreSQL        │  │ DockerコンテナのPostgreSQL │
│ (PID 1523)               │  │ (PID 65426)              │
│ ポート: localhost:5432   │  │ ポート: *:5432            │
│ ユーザー: postgres       │  │ ユーザー: reservation_user│
│ ❌ reservation_user なし │  │ ✅ reservation_user あり │
└──────────────────────────┘  └────────────────────────┘
      ↑ ここに接続していた         本来はここに接続すべき
```

### なぜこの問題が起きたか？

1. **Mac上にPostgreSQL 15がインストールされていた**
   - Homebrewでインストール済み
   - 自動起動設定されていた

2. **Mac上のPostgreSQLがポート5432を先に占有**
   - `localhost:5432`に接続すると、Mac上のPostgreSQLに接続される
   - DockerコンテナのPostgreSQLには到達できない

3. **Mac上のPostgreSQLには`reservation_user`が存在しない**
   - Dockerコンテナとは別のデータベースインスタンス
   - 環境が完全に異なる

---

## 🛠️ トラブルシューティングで使用したコマンド一覧

### Dockerコンテナ関連

```bash
# コンテナの状態確認
docker compose ps

# コンテナのログ確認
docker compose logs postgres

# コンテナ内でコマンド実行
docker compose exec postgres psql -U reservation_user -d reservation_db

# コンテナとボリュームを削除して再作成
docker compose down -v
docker compose up -d
```

### PostgreSQL関連

```bash
# データベースに接続
docker compose exec postgres psql -U reservation_user -d reservation_db

# PostgreSQL内でのコマンド
\du                    # ユーザー一覧
\l                     # データベース一覧
\dt                    # テーブル一覧
\q                     # 終了

# SQL実行（ワンライナー）
docker compose exec postgres psql -U reservation_user -d reservation_db -c "SELECT 1;"
```

### ポート確認関連

```bash
# ポート5432を使用しているプロセスを確認
lsof -i :5432

# プロセスを終了（危険！必要な場合のみ）
kill <PID>
```

### Homebrew関連

```bash
# Homebrewサービスの一覧
brew services list

# PostgreSQLサービスの停止
brew services stop postgresql@15

# PostgreSQLサービスの起動（必要な場合）
brew services start postgresql@15
```

### Gradle/Spring Boot関連

```bash
# ビルド（テストスキップ）
./gradlew build -x test

# クリーンビルド
./gradlew clean build -x test

# アプリケーション起動
./gradlew bootRun
```

---

## 📝 今後の対策

### 1. 開発環境のポート管理

**推奨事項：**
- Docker使用時は、Mac上のPostgreSQLを停止する
- または、Dockerコンテナのポートを変更する（例: 5433:5432）

**docker-compose.ymlの例：**
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5433:5432"  # ホスト側を5433に変更
```

**application.ymlの変更：**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/reservation_db
```

---

### 2. 環境の確認手順

**プロジェクト開始時に実行するチェックリスト：**

```bash
# 1. ポート5432の使用状況確認
lsof -i :5432

# 2. Dockerコンテナの状態確認
docker compose ps

# 3. PostgreSQL接続テスト
docker compose exec postgres psql -U reservation_user -d reservation_db -c "SELECT 1;"
```

---

### 3. PostgreSQLの使い分け

**開発スタイル別の推奨：**

| 開発スタイル | 推奨環境 | 理由 |
|-------------|---------|------|
| Spring Boot学習 | Dockerのみ | 環境の再現性が高い |
| 複数プロジェクト開発 | Mac上のPostgreSQL | プロジェクト間でDBを使い分けやすい |
| チーム開発 | Dockerのみ | 全員同じ環境で開発できる |

---

## 🎓 学んだこと

### 技術的な学び

1. **ポート競合の診断方法**
   - `lsof -i :<ポート番号>`で使用状況を確認
   - 複数プロセスが同じポートを使うケースがある

2. **PostgreSQLの接続先の違い**
   - `localhost:5432`と`*:5432`の違い
   - Dockerネットワークとホストネットワークの関係

3. **データベース接続のトラブルシューティング**
   - 段階的に切り分ける（コンテナ内 → localhost → アプリケーション）
   - ログとエラーメッセージを丁寧に読む

### デバッグプロセスの学び

1. **仮説検証の重要性**
   - 「ユーザーが存在しない」→ 実際は存在していた
   - 「接続設定が間違っている」→ 実際は別のPostgreSQLに接続していた

2. **問題の切り分け**
   - PostgreSQL側の問題か？ → No（接続テスト成功）
   - アプリケーション側の問題か？ → No（設定は正しい）
   - **環境の問題か？** → Yes（ポート競合）

3. **ツールの活用**
   - `lsof`でポート使用状況を可視化
   - `docker compose logs`で初期化ログを確認
   - `psql`で直接データベースを確認

---

## ⚠️ 注意事項

### killコマンドの使用について

```bash
kill <PID>
```

**注意点：**
- 重要なプロセスを誤って停止しないよう注意
- `brew services stop`など、より安全な方法を優先
- バックグラウンドで動作しているプロセスの役割を確認してから停止

### データの永続化について

```bash
docker compose down -v
```

**注意点：**
- `-v`フラグはボリューム（データ）も削除する
- データベースのデータが完全に消える
- 本番環境では絶対に実行しない

---

## 📚 参考リンク

### 公式ドキュメント

- [Docker Compose公式ドキュメント](https://docs.docker.com/compose/)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [Spring Boot Database Initialization](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization)

### トラブルシューティング関連

- `lsof`コマンドの使い方
- PostgreSQLの権限管理
- Dockerネットワークの仕組み

---

このドキュメントは、同じ問題に遭遇した場合の参考資料として保管してください。
