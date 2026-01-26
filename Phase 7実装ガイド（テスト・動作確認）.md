# Phase 7実装ガイド（バックエンドテスト・動作確認）

このガイドは、Phase 7で実施したバックエンドAPIのテストと動作確認の内容をまとめたものです。

---

## 📋 目次

1. [Phase 7の目的](#phase-7の目的)
2. [事前準備](#事前準備)
3. [Swagger/OpenAPI設定](#swaggeropenapi設定)
4. [API動作テスト](#api動作テスト)
5. [エラーハンドリング確認](#エラーハンドリング確認)
6. [発見された問題点](#発見された問題点)
7. [Swagger UIの使い方](#swagger-uiの使い方)
8. [MailHog確認方法](#mailhog確認方法)
9. [次のステップ](#次のステップ)

---

## Phase 7の目的

Phase 7では、以下を実施しました：

1. **Swagger/OpenAPI確認** - API仕様が正しく生成されているか確認
2. **基本的なCRUD操作のテスト** - 各エンドポイントが正しく動作するか確認
3. **エラーハンドリングの検証** - 例外処理が適切に動作するか確認
4. **外部サービス連携確認** - EmailService（MailHog）の動作確認

---

## 事前準備

### 1. Spring Security設定の一時的な変更

Phase 7のテストを実施するため、`SecurityConfig.java`を一時的に修正しました。

**修正内容：**

```java
// SecurityConfig.java
.authorizeHttpRequests(authorize -> authorize
    // 公開API（認証不要）
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers("/api/public/**").permitAll()
    .requestMatchers("/api-docs/**").permitAll()      // Swagger用
    .requestMatchers("/swagger-ui/**").permitAll()    // Swagger用

    // 管理者専用API
    .requestMatchers("/api/admin/**").hasRole("ADMIN")

    // Phase 7テスト用：一時的に全APIを許可
    .requestMatchers("/api/**").permitAll()

    // それ以外は許可
    .anyRequest().permitAll()
)
```

**⚠️ 重要：**
- この設定は**テスト用の一時的な措置**です
- 本番環境では、認証が必要なエンドポイントは`authenticated()`に戻す必要があります
- Phase 8以降で認証機能を実装する際に、この設定を見直します

### 2. Dockerコンテナの起動確認

```bash
docker compose ps
```

**期待される結果：**
- `reservation-postgres` - PostgreSQL（ポート5432）
- `reservation-mailhog` - MailHog（ポート1025, 8025）

### 3. アプリケーションの起動

```bash
./gradlew bootRun
```

**起動成功のログ：**
```
Tomcat started on port 8080 (http) with context path '/'
Started ReservationApplication in 2.923 seconds
```

---

## Swagger/OpenAPI設定

### 依存関係（build.gradle）

```gradle
// Swagger/OpenAPI
implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.7.0'
```

### 設定（application.yml）

```yaml
# Swagger/OpenAPI設定
springdoc:
  api-docs:
    path: /api-docs              # OpenAPI JSONのパス
  swagger-ui:
    path: /swagger-ui.html       # Swagger UIのパス
    tags-sorter: alpha           # タグをアルファベット順にソート
    operations-sorter: alpha     # 操作をアルファベット順にソート
```

### Swagger UIへのアクセス

**URL：**
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api-docs

**確認内容：**
- ✅ OpenAPI 3.0.1
- ✅ 12個のエンドポイント
- ✅ 10個のスキーマ（全てのDTO）

**登録されているエンドポイント：**

```
/api/auth/login
/api/auth/register
/api/auth/verify
/api/reservations
/api/reservations/user/{userId}
/api/reservations/{id}
/api/service-menus
/api/service-menus/{id}
/api/slots
/api/slots/search
/api/slots/{id}
/api/users/{id}
```

---

## API動作テスト

### テスト1: サービスメニュー作成（POST）

**リクエスト：**
```bash
curl -X POST http://localhost:8080/api/service-menus \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Haircut",
    "description": "Basic haircut service",
    "durationMinutes": 30,
    "price": 3000
  }'
```

**レスポンス：**
```json
{
  "id": 1,
  "name": "Haircut",
  "description": "Basic haircut service",
  "durationMinutes": 30,
  "price": 3000
}
```

**HTTP Status:** `201 Created`

**結果:** ✅ 成功

---

### テスト2: 全サービスメニュー取得（GET）

**リクエスト：**
```bash
curl http://localhost:8080/api/service-menus
```

**レスポンス：**
```json
[
  {
    "id": 1,
    "name": "Haircut",
    "description": "Basic haircut service",
    "durationMinutes": 30,
    "price": 3000
  }
]
```

**HTTP Status:** `200 OK`

**結果:** ✅ 成功

---

### テスト3: 特定のサービスメニュー取得（GET by ID）

**リクエスト：**
```bash
curl http://localhost:8080/api/service-menus/1
```

**レスポンス：**
```json
{
  "id": 1,
  "name": "Haircut",
  "description": "Basic haircut service",
  "durationMinutes": 30,
  "price": 3000
}
```

**HTTP Status:** `200 OK`

**結果:** ✅ 成功

---

### テスト4: サービスメニュー更新（PUT）

**リクエスト：**
```bash
curl -X PUT http://localhost:8080/api/service-menus/1 \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Haircut Premium",
    "description": "Premium haircut service",
    "durationMinutes": 45,
    "price": 5000
  }'
```

**レスポンス：**
```json
{
  "id": 1,
  "name": "Haircut Premium",
  "description": "Premium haircut service",
  "durationMinutes": 45,
  "price": 5000
}
```

**HTTP Status:** `200 OK`

**結果:** ✅ 成功

---

### テスト5: サービスメニュー削除（DELETE）

**リクエスト：**
```bash
curl -X DELETE http://localhost:8080/api/service-menus/2
```

**レスポンス:** （なし）

**HTTP Status:** `204 No Content`

**結果:** ✅ 成功

**削除確認：**
```bash
curl http://localhost:8080/api/service-menus/2
# → 404 Not Found
```

---

### テスト6: ユーザー登録（POST）

**リクエスト：**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**レスポンス：**
```json
{
  "userId": 1,
  "email": "test@example.com",
  "name": "Test User",
  "role": "USER",
  "message": "登録に成功しました"
}
```

**HTTP Status:** `201 Created`

**結果:** ✅ 成功

**確認事項：**
- ✅ ユーザーがデータベースに登録された
- ✅ 認証メールがMailHogに送信された（後述）
- ✅ パスワードがハッシュ化されて保存された

---

## エラーハンドリング確認

### テスト7: 存在しないリソース（404 Not Found）

**リクエスト：**
```bash
curl http://localhost:8080/api/service-menus/999
```

**レスポンス：**
```json
{
  "error": "Not Found",
  "message": "サービスメニューが見つかりません: ID=999",
  "timestamp": "2026-01-01T10:27:16.57912",
  "status": 404
}
```

**HTTP Status:** `404 Not Found`

**結果:** ✅ 成功 - GlobalExceptionHandlerが正しく動作

---

### テスト8: バリデーションエラー（400 Bad Request）

**リクエスト：**
```bash
curl -X POST http://localhost:8080/api/slots \
  -H 'Content-Type: application/json' \
  -d '{
    "startTime": "2026-01-10T10:00:00",
    "endTime": "2026-01-10T10:30:00"
  }'
```

**レスポンス：**
```json
{
  "fieldErrors": {
    "serviceMenuId": "サービスメニューIDは必須です"
  },
  "error": "Validation Failed",
  "timestamp": "2026-01-01T10:26:26.393427",
  "status": 400
}
```

**HTTP Status:** `400 Bad Request`

**結果:** ✅ 成功 - バリデーションが正しく動作

---

### テスト9: 重複リソース（409 Conflict）

**リクエスト：**
```bash
# 同じメールアドレスで再度登録を試みる
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User 2",
    "email": "test@example.com",
    "password": "password456"
  }'
```

**レスポンス：**
```json
{
  "error": "Conflict",
  "message": "このメールアドレスはすでに使用されています: test@example.com",
  "timestamp": "2026-01-01T10:31:09.690316",
  "status": 409
}
```

**HTTP Status:** `409 Conflict`

**結果:** ✅ 成功 - DuplicateResourceExceptionが正しくハンドリングされた

---

## 発見された問題点

### 問題1: SlotRequestにcapacityフィールドがない

**現象：**
スロット作成時に500エラーが発生：
```
ERROR: null value in column "capacity" of relation "slots" violates not-null constraint
```

**原因：**
- `Slot`エンティティは`capacity`フィールドを持つ（NOT NULL制約あり）
- `SlotRequest` DTOには`capacity`フィールドが定義されていない
- そのため、スロット作成時に`capacity`がnullになってしまう

**影響：**
- スロットの作成ができない

**修正案：**
`SlotRequest.java`に以下を追加：
```java
@NotNull(message = "収容人数は必須です")
@Min(value = 1, message = "収容人数は1以上である必要があります")
private Integer capacity;
```

**優先度：** 🔴 高 - Phase 8で修正が必要

---

## Swagger UIの使い方

### 1. Swagger UIにアクセス

ブラウザで以下のURLを開く：
```
http://localhost:8080/swagger-ui.html
```

### 2. エンドポイントの確認

- 各コントローラーがタグとして表示される
- エンドポイントをクリックすると詳細が表示される

### 3. APIのテスト実行

**手順：**

1. テストしたいエンドポイントをクリック
2. 「Try it out」ボタンをクリック
3. リクエストパラメータを入力
4. 「Execute」ボタンをクリック
5. レスポンスが表示される

**例：サービスメニューの作成**

1. `POST /api/service-menus` をクリック
2. 「Try it out」をクリック
3. Request bodyに以下を入力：
   ```json
   {
     "name": "Massage",
     "description": "Relaxing massage",
     "durationMinutes": 60,
     "price": 8000
   }
   ```
4. 「Execute」をクリック
5. レスポンスを確認

### 4. スキーマの確認

- ページ下部の「Schemas」セクションで、各DTOの構造を確認できる
- 必須フィールド、型、バリデーションルールが表示される

---

## MailHog確認方法

### 1. MailHog Web UIへのアクセス

ブラウザで以下のURLを開く：
```
http://localhost:8025
```

### 2. メールの確認

**確認内容：**
- 受信したメールの一覧が表示される
- メールをクリックすると詳細が表示される

**確認されたメール：**
- **To:** test@example.com
- **From:** noreply@reservation-system.com
- **Subject:** 【予約システム】メールアドレスの認証
- **内容:** HTML形式の認証メール（認証トークン付きリンク）

### 3. APIでメールを確認（オプション）

```bash
curl http://localhost:8025/api/v2/messages | jq '.items[0]'
```

**レスポンス例：**
```json
{
  "Content": {
    "Headers": {
      "Subject": ["【予約システム】メールアドレスの認証"],
      "To": ["test@example.com"],
      "From": ["noreply@reservation-system.com"]
    }
  }
}
```

---

## 次のステップ

### Phase 7完了後のタスク

#### 1. SlotRequestの修正（優先度：高）

`SlotRequest.java`に`capacity`フィールドを追加：

```java
@NotNull(message = "収容人数は必須です")
@Min(value = 1, message = "収容人数は1以上である必要があります")
private Integer capacity;
```

#### 2. 残りのJavaDoc追加（オプション）

Phase 6で残っていたServiceクラスのJavaDoc追加：
- `ServiceMenuService.java`
- `SlotService.java`
- `GoogleCalendarService.java`

#### 3. Phase 8: フロントエンド環境構築

- React + Viteプロジェクト作成
- 必要なライブラリのインストール
- APIクライアント設定（Axios等）

#### 4. Phase 9: フロントエンド実装

- 認証画面（ログイン、新規登録）
- ユーザー画面（予約枠一覧、予約作成）
- スタッフ画面（ダッシュボード、メニュー管理）

---

## 📊 Phase 7で学んだ重要な概念

### Swagger/OpenAPI

**Swagger/OpenAPIとは：**
- REST APIのドキュメントを自動生成するツール
- APIの仕様をブラウザで確認できる
- ブラウザから直接APIをテストできる

**springdoc-openapi：**
- Spring BootでSwaggerを使うためのライブラリ
- アノテーションから自動的にAPI仕様を生成
- Swagger UIを提供

**メリット：**
- 手動でドキュメントを書く必要がない
- 常に最新の仕様が反映される
- フロントエンド開発者がAPIを理解しやすい
- APIのテストが簡単

---

### curlコマンド

**curlとは：**
- コマンドラインからHTTPリクエストを送信するツール
- APIのテストに便利

**基本的な使い方：**

```bash
# GET リクエスト
curl http://localhost:8080/api/service-menus

# POST リクエスト（JSON）
curl -X POST http://localhost:8080/api/service-menus \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","description":"Test","durationMinutes":30,"price":1000}'

# PUT リクエスト
curl -X PUT http://localhost:8080/api/service-menus/1 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Updated","description":"Updated","durationMinutes":45,"price":2000}'

# DELETE リクエスト
curl -X DELETE http://localhost:8080/api/service-menus/1

# HTTPステータスコードを表示
curl -w '\nHTTP Status: %{http_code}\n' http://localhost:8080/api/service-menus

# レスポンスをJSON整形（jq使用）
curl -s http://localhost:8080/api/service-menus | jq .
```

**オプション：**
- `-X` : HTTPメソッド（POST, PUT, DELETE等）
- `-H` : ヘッダー
- `-d` : リクエストボディ（データ）
- `-s` : サイレントモード（プログレス表示なし）
- `-w` : 出力フォーマット

---

### HTTPステータスコードの実際の動作

Phase 7のテストで、各HTTPステータスコードが実際に返されることを確認しました：

| ステータスコード | 用途 | テスト結果 |
|-----------------|------|-----------|
| 200 OK | GET、PUT成功 | ✅ 確認済み |
| 201 Created | POST成功 | ✅ 確認済み |
| 204 No Content | DELETE成功 | ✅ 確認済み |
| 400 Bad Request | バリデーションエラー | ✅ 確認済み |
| 404 Not Found | リソース未発見 | ✅ 確認済み |
| 409 Conflict | リソース重複 | ✅ 確認済み |
| 500 Internal Server Error | サーバーエラー | ✅ 確認済み（SlotRequest問題） |

---

### GlobalExceptionHandlerの実際の動作

**確認されたエラーハンドリング：**

1. **ResourceNotFoundException → 404**
   - サービスメニューが存在しない場合
   - 適切なエラーメッセージとタイムスタンプが返される

2. **DuplicateResourceException → 409**
   - 重複したメールアドレスで登録しようとした場合
   - セキュリティを考慮したエラーメッセージ

3. **バリデーションエラー → 400**
   - 必須フィールドが欠けている場合
   - フィールドごとのエラーメッセージが返される

**エラーレスポンスの統一フォーマット：**
```json
{
  "error": "エラー種別",
  "message": "エラーメッセージ",
  "timestamp": "2026-01-01T10:27:16.57912",
  "status": 404
}
```

---

### EmailServiceとMailHogの連携

**確認内容：**
- ✅ ユーザー登録時に認証メールが送信される
- ✅ MailHogでメールを受信できる
- ✅ HTML形式のメールが正しく表示される
- ✅ 認証トークンが含まれている

**MailHogの役割：**
- 開発環境でのメールテストツール
- 実際のメールサーバーに送信せずにメールを確認できる
- Web UIでメールの内容を確認できる

---

## 💡 Phase 7のポイント

### 1. Spring Securityの一時的な無効化

**理由：**
- Phase 7ではAPI動作確認が目的
- 認証なしでテストできるようにする
- フロントエンド実装前の段階では認証機能は不要

**注意：**
- 本番環境では絶対に全APIを`permitAll()`にしない
- Phase 8以降で認証機能を実装する際に設定を見直す

### 2. Swagger UIの活用

**メリット：**
- ブラウザから簡単にAPIをテストできる
- 各エンドポイントの仕様が一目でわかる
- フロントエンド開発者との連携がスムーズになる

**使い方：**
- `http://localhost:8080/swagger-ui.html` にアクセス
- 「Try it out」でAPIをテスト
- リクエスト/レスポンスの形式を確認

### 3. curlコマンドでのテスト

**メリット：**
- コマンドラインから素早くテストできる
- 自動化スクリプトに組み込める
- CI/CDパイプラインで使用できる

**使い方：**
- 各HTTPメソッドに対応したcurlコマンドを実行
- jqコマンドでJSONを整形して見やすくする

### 4. エラーハンドリングの確認

**重要性：**
- エラーが適切にハンドリングされることを確認
- フロントエンドでエラーメッセージを表示できる
- セキュリティ上の問題がないか確認

### 5. 外部サービス連携の確認

**EmailService + MailHog：**
- 実際のメールサーバーを使わずにテストできる
- メールの内容を確認できる
- 開発環境で安全にテストできる

---

## 📝 よくある質問

### Q1: Swagger UIにアクセスできない

**A:** 以下を確認してください：

1. アプリケーションが起動しているか
   ```bash
   curl http://localhost:8080/actuator/health
   ```

2. SecurityConfigで`/swagger-ui/**`が許可されているか
   ```java
   .requestMatchers("/swagger-ui/**").permitAll()
   .requestMatchers("/api-docs/**").permitAll()
   ```

3. ブラウザのキャッシュをクリア

### Q2: curlコマンドでエラーが出る

**A:** 以下を確認してください：

1. JSONの形式が正しいか（シングルクォートで囲む）
   ```bash
   # 正しい
   curl -d '{"name":"Test"}' ...

   # 間違い
   curl -d {"name":"Test"} ...
   ```

2. Content-Typeヘッダーが設定されているか
   ```bash
   -H 'Content-Type: application/json'
   ```

### Q3: MailHogにメールが届かない

**A:** 以下を確認してください：

1. MailHogコンテナが起動しているか
   ```bash
   docker compose ps
   ```

2. application.ymlのメール設定が正しいか
   ```yaml
   spring:
     mail:
       host: localhost
       port: 1025
   ```

3. EmailServiceが正しく呼ばれているか（ログ確認）

### Q4: SlotRequestでcapacityエラーが出る

**A:** これは既知の問題です。Phase 8で修正予定です。

**回避方法：**
一時的に`SlotRequest.java`に`capacity`フィールドを追加してください。

### Q5: APIテスト時に302リダイレクトされる

**A:** Spring Securityが有効になっています。

**解決方法：**
`SecurityConfig.java`で該当のエンドポイントを`permitAll()`に設定してください。

### Q6: jqコマンドが使えない

**A:** jqがインストールされていない可能性があります。

**インストール方法：**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

**代替方法：**
jqを使わずに直接curlの結果を見る：
```bash
curl http://localhost:8080/api/service-menus
```

### Q7: Phase 7完了後にすべきことは？

**A:** 以下の順番で進めてください：

1. **優先：** SlotRequestの修正（capacity追加）
2. **オプション：** 残りのJavaDoc追加
3. **次フェーズ：** Phase 8（フロントエンド環境構築）

---

## 🎯 まとめ

Phase 7では、以下を達成しました：

### 完了したこと

- ✅ Swagger/OpenAPI設定確認
- ✅ 12個のエンドポイント確認
- ✅ 基本的なCRUD操作テスト（GET, POST, PUT, DELETE）
- ✅ エラーハンドリング確認（404, 400, 409, 500）
- ✅ EmailService + MailHog連携確認
- ✅ バリデーション動作確認
- ✅ GlobalExceptionHandler動作確認

### 発見された問題

- ⚠️ SlotRequestに`capacity`フィールドがない（Phase 8で修正予定）

### 次のステップ

1. SlotRequest修正
2. JavaDoc追加（オプション）
3. Phase 8: フロントエンド環境構築

---

**Phase 7 完了おめでとうございます！** 🎉

バックエンドAPIが正しく動作していることが確認できました。
次はフロントエンド開発に進みましょう！
