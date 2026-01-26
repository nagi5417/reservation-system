# Spring Boot環境構築手順（実践版）

このドキュメントでは、Spring Bootプロジェクトをゼロから作成し、環境構築を完了するまでの手順を説明します。
**実際の環境構築作業で経験した躓きポイントと解決策を含めています。**

---

## 📋 目次

1. [前提条件](#前提条件)
2. [プロジェクト作成](#プロジェクト作成)
3. [Gradle設定](#gradle設定)
4. [application.yml設定](#applicationyml設定)
5. [Docker Compose設定](#docker-compose設定)
6. [開発中のセキュリティ設定](#開発中のセキュリティ設定)
7. [動作確認](#動作確認)
8. [トラブルシューティング](#トラブルシューティング)
9. [躓きポイントと注意点](#躓きポイントと注意点)

---

## 前提条件

以下がインストールされていることを確認してください:

### Java 17以上

```bash
java -version
```

**⚠️ 重要な注意点:**
- macOSに複数のJavaバージョンがインストールされている場合、古いバージョン（Java 11など）が優先されることがある
- Gradle 9.x系は**Java 17以上が必須**です

**Javaバージョンの確認と切り替え:**

```bash
# インストール済みのJavaバージョンを確認
/usr/libexec/java_home -V

# Java 17に切り替え（このターミナルセッションのみ）
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# 確認
java -version
```

**恒久的にJava 17を使う場合:**

```bash
# ~/.zshrc に追加
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Java 17がインストールされていない場合:**

```bash
# Homebrewでインストール
brew install openjdk@17

# シンボリックリンクを作成
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

---

### Docker Desktop

```bash
docker --version
docker compose version
```

**⚠️ 重要な注意点:**
- 最新のDocker Desktopでは、`docker-compose`（ハイフン）ではなく**`docker compose`（スペース）**を使います
- 古い記事やドキュメントでは `docker-compose` が使われていますが、新しい環境では `docker compose` が正しいです

**Dockerがインストールされていない場合:**

```bash
# Homebrewでインストール
brew install --cask docker

# アプリケーションフォルダからDocker.appを起動
open /Applications/Docker.app
```

---

### curl

macOSには標準でインストール済みです。

```bash
curl --version
```

---

## プロジェクト作成

### 1. Spring Initializrでプロジェクトを生成

ターミナルで以下のコマンドを実行します:

```bash
curl https://start.spring.io/starter.zip \
  -d type=gradle-project \
  -d language=java \
  -d baseDir=reservation \
  -d groupId=com.example \
  -d artifactId=reservation \
  -d name=reservation \
  -d packageName=com.example.reservation \
  -d packaging=jar \
  -d javaVersion=17 \
  -d dependencies=web,data-jpa,security,oauth2-client,postgresql,lombok,validation,devtools \
  -o reservation.zip
```

**⚠️ 注意点:**
- `bootVersion` パラメータは**指定しない**でください（最新の安定版が自動選択されます）
- 特定のバージョンを指定すると、互換性エラーが発生する可能性があります
  - 例: `bootVersion=3.2.0` → エラー: "Invalid Spring Boot version '3.2.0', Spring Boot compatibility range is >=3.4.0"

**パラメータの説明:**

| パラメータ | 説明 | 例 |
|-----------|------|-----|
| `type` | ビルドツール | `gradle-project` または `maven-project` |
| `language` | プログラミング言語 | `java`, `kotlin`, `groovy` |
| `baseDir` | プロジェクトのルートディレクトリ名 | `reservation` |
| `groupId` | プロジェクトのグループID | `com.example` |
| `artifactId` | プロジェクトのアーティファクトID | `reservation` |
| `name` | プロジェクト名 | `reservation` |
| `packageName` | Javaのパッケージ名 | `com.example.reservation` |
| `packaging` | パッケージング形式 | `jar` または `war` |
| `javaVersion` | Javaバージョン | `17`, `21` など |
| `dependencies` | 依存関係（カンマ区切り） | 下記参照 |

**主要な依存関係:**

| 依存関係名 | 説明 |
|-----------|------|
| `web` | Spring Web (REST API作成) |
| `data-jpa` | Spring Data JPA (データベースアクセス) |
| `security` | Spring Security (認証・認可) |
| `oauth2-client` | OAuth2クライアント (Google OAuth) |
| `postgresql` | PostgreSQLドライバ |
| `lombok` | Lombok (ボイラープレートコード削減) |
| `validation` | Bean Validation (バリデーション) |
| `devtools` | 開発者ツール (自動再起動など) |

---

### 2. ZIPファイルを展開

```bash
unzip reservation.zip
cd reservation
```

---

### 3. プロジェクト構造の確認

```bash
ls -la
```

以下のような構造になっているはずです:

```
reservation/  ← これが「プロジェクトルート」
├── gradle/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/reservation/
│   │   │       └── ReservationApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── build.gradle
├── gradlew
├── gradlew.bat
└── settings.gradle
```

**📝 用語解説:**
- **プロジェクトルート**: `reservation/` フォルダのこと
- **プロジェクトルート直下**: `build.gradle` と同じ階層にファイルを配置すること

---

## Gradle設定

### 1. build.gradleの確認

現在の `build.gradle` を確認します:

```bash
cat build.gradle
```

---

### 2. 追加の依存関係を追加

`build.gradle` の `dependencies` ブロックに以下を追加します:

**⚠️ 重要な注意点:**
- **インデントはタブで統一**してください（スペースとタブが混在するとコードが読みにくい）
- 既存のコードと同じインデント方式を使う

```gradle
dependencies {
	// 既存の依存関係...

	// メール送信
	implementation 'org.springframework.boot:spring-boot-starter-mail'

	// Google Calendar API
	implementation 'com.google.api-client:google-api-client:2.2.0'
	implementation 'com.google.apis:google-api-services-calendar:v3-rev20220715-2.0.0'
	implementation 'com.google.auth:google-auth-library-oauth2-http:1.19.0'

	// Swagger/OpenAPI
	implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.7.0'
}
```

**📚 依存関係の説明:**

| ライブラリ | 説明 | バージョン選定の注意点 |
|-----------|------|---------------------|
| `spring-boot-starter-mail` | JavaMailを使ったメール送信機能 | Spring Bootが自動管理 |
| `google-api-client` | Google APIクライアントライブラリ | 安定版を使用 |
| `google-api-services-calendar` | Google Calendar API | `v3-revYYYYMMDD` 形式、存在確認が必要 |
| `google-auth-library-oauth2-http` | OAuth認証用クライアント | 最新版を推奨 |
| `springdoc-openapi-starter-webmvc-ui` | Swagger UI (API仕様書の自動生成) | 最新版を推奨 |

**💡 ライブラリのバージョン確認方法:**

1. **Maven Central Repository**: https://search.maven.org/
   - 検索ボックスに `g:com.google.api-client a:google-api-client` のように入力
   - 最新版と利用可能なバージョンが確認できる

2. **Gradle Plugin: Versions Plugin** (オプション)
   ```gradle
   plugins {
       id "com.github.ben-manes.versions" version "0.51.0"
   }
   ```
   実行: `./gradlew dependencyUpdates`

**⚠️ Google Calendar APIの注意点:**
- `google-api-services-calendar` のバージョンは頻繁に更新されます
- `v3-rev20241104-2.0.0` のような新しすぎるバージョンは、Maven Centralに存在しない場合があります
- エラーが出た場合は、Maven Centralで実際に存在するバージョンを確認してください

---

### 3. 依存関係のダウンロード

```bash
./gradlew build --refresh-dependencies
```

**⚠️ Java 11のエラーが出た場合:**

```
Gradle requires JVM 17 or later to run. Your build is currently configured to use JVM 11.
```

→ [前提条件](#前提条件)のJava 17切り替え手順を実行してください。

**初回実行時の注意:**
- Gradleラッパーのダウンロードと依存関係のダウンロードが行われるため、時間がかかります（数分）
- 正常に完了すると `BUILD SUCCESSFUL` と表示されます

---

## application.yml設定

### 1. application.propertiesをapplication.ymlに変更

Spring Bootの設定ファイルは `.properties` 形式よりも `.yml` 形式の方が読みやすいため、変更します。

```bash
rm src/main/resources/application.properties
```

---

### 2. application.ymlを作成

`src/main/resources/application.yml` を作成し、以下の内容を記述します:

**⚠️ YAMLファイルの重要な注意点:**
- **インデントはスペース2つ**（タブは使えません）
- **大文字・小文字を区別**します（`springdoc` ○、`Springdoc` ✗）
- **階層構造が重要**（`logging` は `spring` の子要素ではなく、トップレベル）

```yaml
spring:
  application:
    name: reservation

  # データソース設定
  datasource:
    url: jdbc:postgresql://localhost:5432/reservation_db
    username: reservation_user
    password: reservation_pass
    driver-class-name: org.postgresql.Driver

  # JPA/Hibernate設定
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect

  # メール設定 (MailHog)
  mail:
    host: localhost
    port: 1025
    username:
    password:
    properties:
      mail:
        smtp:
          auth: false
          starttls:
            enable: false

  # OAuth2設定 (Google)
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID:dummy-client-id}
            client-secret: ${GOOGLE_CLIENT_SECRET:dummy-client-secret}
            scope:
              - email
              - profile
              - https://www.googleapis.com/auth/calendar
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/v2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://www.googleapis.com/oauth2/v3/userinfo
            user-name-attribute: sub

  # セキュリティ設定を一時的に無効化（開発中のみ）
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration

# Swagger/OpenAPI設定
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    tags-sorter: alpha
    operations-sorter: alpha

# ログ設定
logging:
  level:
    com.example.reservation: DEBUG
    org.springframework.security: DEBUG
    org.hibernate.SQL: DEBUG
```

**📝 設定項目の説明:**

| 項目 | 説明 |
|------|------|
| `spring.datasource.url` | PostgreSQLの接続URL |
| `spring.jpa.hibernate.ddl-auto` | `update`: テーブルを自動作成/更新<br>`create`: 起動時に削除して再作成<br>`none`: 何もしない |
| `spring.jpa.show-sql` | SQLログを表示 |
| `spring.mail.host` | メールサーバーのホスト (MailHog) |
| `spring.mail.port` | MailHogのSMTPポート (1025) |
| `GOOGLE_CLIENT_ID` | 環境変数から取得、なければ `dummy-client-id` を使用 |
| `spring.autoconfigure.exclude` | 開発中はセキュリティを無効化 |
| `springdoc.swagger-ui.path` | Swagger UIのパス |

**⚠️ YAMLの階層構造の注意点:**

```yaml
# 正しい例
spring:          # トップレベル
  datasource:    # spring の子要素
    url: xxx     # datasource の子要素

logging:         # トップレベル（spring とは別）
  level:         # logging の子要素
```

```yaml
# 間違った例
spring:
  datasource:
    url: xxx
  logging:       # ✗ logging は spring の子要素ではない
    level:
```

**🔒 セキュリティ上の注意:**
- Google OAuth認証情報は環境変数で管理します
- `application.yml` に直接書かないでください
- 本番環境では `spring.autoconfigure.exclude` の設定を**削除**してください

---

## Docker Compose設定

### 1. docker-compose.ymlを作成

**プロジェクトルート直下**（`build.gradle` と同じ階層）に `docker-compose.yml` を作成します:

**⚠️ 重要な注意点:**
- `services`, `volumes`, `networks` は**トップレベル**（インデントなし）に配置
- Docker Compose v2では `version: '3.8'` の記述は不要（警告が出る）

```yaml
services:
  # PostgreSQLデータベース
  postgres:
    image: postgres:16-alpine
    container_name: reservation-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: reservation_db
      POSTGRES_USER: reservation_user
      POSTGRES_PASSWORD: reservation_pass
      TZ: Asia/Tokyo
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - reservation-network

  # MailHog (メールテスト用)
  mailhog:
    image: mailhog/mailhog:latest
    container_name: reservation-mailhog
    ports:
      - "1025:1025"  # SMTPポート
      - "8025:8025"  # Web UIポート
    networks:
      - reservation-network

volumes:
  postgres-data:

networks:
  reservation-network:
    driver: bridge
```

**📝 サービスの説明:**

| サービス | ポート | 説明 |
|---------|--------|------|
| `postgres` | 5432 | PostgreSQLデータベース |
| `mailhog` (SMTP) | 1025 | メール送信用SMTPサーバー |
| `mailhog` (Web UI) | 8025 | 送信メール確認用UI（ブラウザでアクセス） |

**💡 Docker Composeの基本概念:**

- **Docker**: アプリケーションをコンテナという隔離された環境で実行する技術
- **Docker Compose**: 複数のDockerコンテナをまとめて管理するツール
- **コンテナ**: 仮想的な小さなコンピュータのようなもの
- **イメージ**: コンテナの設計図（`postgres:16-alpine` など）
- **ボリューム**: データを永続化する仕組み（コンテナを削除してもデータは残る）
- **ネットワーク**: コンテナ間の通信を可能にする仕組み

**📚 Web UIとは:**
- **UI（ユーザーインターフェース）**: ユーザーが操作する画面や仕組み
- **Web UI**: ブラウザでアクセスできる画面
- MailHogのWeb UI（http://localhost:8025）では、アプリケーションから送信したメールを確認できます
- 実際のユーザーにはメールは届かず、開発中のテストに最適です

---

### 2. Dockerコンテナを起動

```bash
docker compose up -d
```

**⚠️ コマンドの注意点:**
- 新しいDocker Desktopでは `docker compose`（スペース）を使います
- 古いバージョンでは `docker-compose`（ハイフン）でしたが、現在は非推奨です

**コマンドの説明:**
- `up`: コンテナを作成・起動
- `-d`: デタッチドモード（バックグラウンドで実行）

**⚠️ 初回実行時の警告:**

```
the attribute `version` is obsolete, it will be ignored
```

→ `version: '3.8'` の行がある場合は削除してください（Docker Compose v2では不要）

---

### 3. コンテナの状態確認

```bash
docker compose ps
```

以下のように表示されればOKです:

```
NAME                    IMAGE                   STATUS
reservation-mailhog     mailhog/mailhog:latest  Up (running)
reservation-postgres    postgres:16-alpine      Up (running)
```

---

### 4. PostgreSQLに接続確認

```bash
docker exec -it reservation-postgres psql -U reservation_user -d reservation_db
```

**コマンドの説明:**
- `docker exec -it`: 起動中のコンテナ内でコマンドを実行
- `reservation-postgres`: コンテナ名
- `psql`: PostgreSQLのクライアントツール
- `-U reservation_user`: ユーザー名
- `-d reservation_db`: データベース名

**成功すると以下のように表示されます:**
```
psql (16.x)
Type "help" for help.

reservation_db=#
```

テーブル一覧を確認:

```sql
\dt
```

まだテーブルは作成していないので、以下のように表示されるはずです:
```
Did not find any relations.
```

終了:

```sql
\q
```

---

## 開発中のセキュリティ設定

環境構築段階では、まだEntityやControllerを作成していないため、セキュリティ機能は一時的に無効化します。

### 方法1: application.ymlで無効化（推奨）

上記の `application.yml` に記載済みです:

```yaml
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration
```

**⚠️ この方法が機能しない場合は、方法2を使用してください。**

---

### 方法2: build.gradleでセキュリティ依存関係をコメントアウト

`build.gradle` の以下の行をコメントアウト（行の先頭に `//` を追加）:

```gradle
// implementation 'org.springframework.boot:spring-boot-starter-security'
// implementation 'org.springframework.boot:spring-boot-starter-security-oauth2-client'

// testImplementation 'org.springframework.boot:spring-boot-starter-security-oauth2-client-test'
// testImplementation 'org.springframework.boot:spring-boot-starter-security-test'
```

**この方法のメリット:**
- セキュリティライブラリ自体が読み込まれないため、確実に認証が発生しない
- 開発中は無効、本番では有効にできる（コメントを外すだけ）

**再ビルドが必要:**

```bash
./gradlew clean build
```

**⚠️ Phase 3でセキュリティ設定を実装する際は、コメントを外してください。**

---

## 動作確認

### 1. Spring Bootアプリケーションを起動

```bash
./gradlew bootRun
```

以下のようなログが表示されれば起動成功です:

```
Started ReservationApplication in X.XXX seconds (process running; press CTRL+C to stop)
```

---

### 2. Swagger UIにアクセス

ブラウザで以下のURLを開きます:

```
http://localhost:8080/swagger-ui.html
```

**✅ 成功した場合:**
- Swagger UIの画面が表示される
- まだControllerを作成していないため、API一覧は空っぽ（正常）

**❌ 失敗した場合（Googleログイン画面が表示される）:**
- セキュリティが無効化されていません
- [開発中のセキュリティ設定](#開発中のセキュリティ設定)を再確認してください

---

### 3. MailHog Web UIにアクセス

ブラウザで以下のURLを開きます:

```
http://localhost:8025
```

MailHogの管理画面が表示されればOKです。

---

### 4. アプリケーションの停止

ターミナルで `Ctrl + C` を押します。

または、別のターミナルで:

```bash
./gradlew --stop
```

---

### 5. Dockerコンテナの停止

```bash
docker compose down
```

データを削除したい場合:

```bash
docker compose down -v
```

**⚠️ `-v` オプションを使うと、データベースのデータもすべて削除されます。**

---

## トラブルシューティング

### Java 11のエラー

**エラー例:**
```
Gradle requires JVM 17 or later to run. Your build is currently configured to use JVM 11.
```

**原因:**
- macOSに複数のJavaバージョンがインストールされており、古いバージョンが優先されている

**解決方法:**

```bash
# インストール済みのJavaバージョンを確認
/usr/libexec/java_home -V

# Java 17に切り替え
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# 確認
java -version
```

**恒久的な設定:**

```bash
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

### Spring Boot バージョン互換性エラー

**エラー例:**
```json
{"timestamp":"2025-12-15T23:07:38.459+00:00","status":400,"error":"Bad Request","message":"Invalid Spring Boot version '3.2.0', Spring Boot compatibility range is >=3.4.0","path":"/starter.zip"}
```

**原因:**
- `bootVersion` パラメータに古いバージョンを指定した

**解決方法:**
- `bootVersion` パラメータを削除して、最新の安定版を使用する

```bash
# 正しいコマンド（bootVersionパラメータなし）
curl https://start.spring.io/starter.zip \
  -d type=gradle-project \
  ...
  -o reservation.zip
```

---

### Google Calendar APIのバージョンエラー

**エラー例:**
```
Could not find com.google.apis:google-api-services-calendar:v3-rev20241104-2.0.0.
```

**原因:**
- 指定したバージョンがMaven Centralリポジトリに存在しない

**解決方法:**
- Maven Central（https://search.maven.org/）で実際に存在するバージョンを確認する
- 安定版を使用する: `v3-rev20220715-2.0.0`

```gradle
implementation 'com.google.apis:google-api-services-calendar:v3-rev20220715-2.0.0'
```

---

### データベース接続エラー

**エラー例:**
```
Caused by: org.springframework.boot.jdbc.autoconfigure.DataSourceProperties$DataSourceBeanCreationException
```

**原因:**
- `application.yml` が作成されていない
- PostgreSQLが起動していない

**解決方法:**

1. `application.yml` を作成する
2. Dockerコンテナを起動する:

```bash
docker compose up -d
docker compose ps  # 状態確認
```

---

### Google OAuth 認証エラー

**エラー例:**
```
Error 401: invalid_client
The OAuth client was not found.
```

**原因:**
- Spring Securityが有効で、Google OAuthの設定がダミー値のまま

**解決方法:**
- [開発中のセキュリティ設定](#開発中のセキュリティ設定)に従って、セキュリティを一時的に無効化する

---

### ポートがすでに使用されている

**エラー例:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use
```

**解決方法:**

```bash
# macOSの場合
lsof -i :5432
kill -9 [PID]
```

---

### Gradleの権限エラー

**エラー例:**
```
Permission denied: ./gradlew
```

**解決方法:**

```bash
chmod +x gradlew
```

---

### 依存関係のダウンロードエラー

**解決方法:**

```bash
./gradlew clean build --refresh-dependencies
```

---

### Docker Composeコマンドが見つからない

**エラー例:**
```
zsh: command not found: docker-compose
```

**原因:**
- 最新のDocker Desktopを使用している

**解決方法:**
- `docker-compose`（ハイフン）ではなく、`docker compose`（スペース）を使う

```bash
docker compose up -d
```

---

## 躓きポイントと注意点

### 📌 ポイント1: Javaバージョンの管理

**躓きポイント:**
- macOSに複数のJavaバージョンがインストールされていると、古いバージョンが優先される
- 環境変数 `JAVA_HOME` が設定されていないと、デフォルトのJavaが使われる

**解決策:**
- 毎回 `export JAVA_HOME=$(/usr/libexec/java_home -v 17)` を実行するのは面倒
- `~/.zshrc` に追加して、ターミナル起動時に自動設定する

**確認方法:**
```bash
echo $JAVA_HOME
java -version
```

---

### 📌 ポイント2: YAMLファイルのインデントと階層構造

**躓きポイント:**
- YAMLはインデントで階層構造を表現するため、スペース・タブの違いに敏感
- `springdoc` と `Springdoc` は別物（大文字・小文字を区別）
- `logging` は `spring` の子要素ではなく、トップレベル

**解決策:**
- エディタの設定で「タブをスペースに変換」を有効にする
- YAMLのバリデーターを使う（多くのエディタに組み込まれている）

**間違いやすい例:**

```yaml
# ✗ 間違い
spring:
  logging:  # logging は spring の子要素ではない
    level:
```

```yaml
# ○ 正しい
spring:
  datasource:
    ...

logging:  # トップレベル
  level:
```

---

### 📌 ポイント3: Gradleファイルのインデント統一

**躓きポイント:**
- 既存のコード（Spring Initializr生成）はタブインデント
- 手動で追加したコードがスペースインデントになると、見た目がズレる

**解決策:**
- 既存のコードと同じインデント方式（タブ or スペース）を使う
- エディタの設定で統一する

---

### 📌 ポイント4: Docker Composeのコマンド形式

**躓きポイント:**
- 古いドキュメントでは `docker-compose`（ハイフン）
- 新しいDocker Desktopでは `docker compose`（スペース）

**解決策:**
- `docker compose version` で確認
- エラーが出たら、スペース区切りを試す

---

### 📌 ポイント5: ライブラリのバージョン管理

**躓きポイント:**
- Google Calendar APIのバージョンは頻繁に更新される
- 最新版と思って指定したバージョンが存在しないことがある

**解決策:**
- Maven Central（https://search.maven.org/）で実際に存在するバージョンを確認する
- 安定版を使用する（最新版ではなく、少し前の枯れたバージョン）

---

### 📌 ポイント6: 開発中のセキュリティ設定

**躓きポイント:**
- Spring Securityの依存関係があると、自動的に認証が有効になる
- `application.yml` の `autoconfigure.exclude` だけでは無効化できない場合がある

**解決策:**
- より確実な方法: `build.gradle` でセキュリティ依存関係をコメントアウト
- Phase 3でセキュリティ設定を実装する際に、コメントを外す

---

### 📌 ポイント7: Docker Composeの `version` 属性

**躓きポイント:**
- 古いドキュメントでは `version: '3.8'` が必須だった
- Docker Compose v2では不要で、警告が出る

**解決策:**
- `version: '3.8'` の行を削除する
- 警告が出ても動作に問題はないが、削除した方がスッキリする

---

## 次のステップ

環境構築が完了したら、以下の順序で実装を進めます:

1. **Phase 2: ドメイン層** - Enum、Entity、Repositoryの作成
2. **Phase 3: インフラ層** - Security設定
3. **Phase 4: アプリケーション層** - Service、DTOの作成
4. **Phase 5: プレゼンテーション層** - Controllerの作成
5. **Phase 6: 外部連携** - メール送信、Google Calendar連携

---

## 参考リンク

- [Spring Initializr](https://start.spring.io/)
- [Spring Boot公式ドキュメント](https://spring.io/projects/spring-boot)
- [Docker公式ドキュメント](https://docs.docker.com/)
- [Docker Compose公式ドキュメント](https://docs.docker.com/compose/)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [MailHog GitHub](https://github.com/mailhog/MailHog)
- [SpringDoc OpenAPI](https://springdoc.org/)
- [Maven Central Repository](https://search.maven.org/)

---

## チェックリスト

環境構築が完了したか確認するためのチェックリストです:

- [ ] Java 17以上がインストールされている
- [ ] `java -version` でJava 17が表示される
- [ ] Docker Desktopがインストールされている
- [ ] Spring Bootプロジェクトが作成されている
- [ ] `build.gradle` に依存関係が追加されている
- [ ] `./gradlew build` が成功する
- [ ] `application.yml` が作成されている
- [ ] `docker-compose.yml` が作成されている
- [ ] `docker compose up -d` でコンテナが起動する
- [ ] `docker compose ps` で2つのコンテナが `Up` 状態
- [ ] PostgreSQLに接続できる
- [ ] `./gradlew bootRun` でアプリケーションが起動する
- [ ] http://localhost:8080/swagger-ui.html にアクセスできる
- [ ] http://localhost:8025 にアクセスできる

すべてチェックできたら、Phase 2に進みましょう！
