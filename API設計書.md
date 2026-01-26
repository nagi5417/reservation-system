# API設計書

**プロジェクト名**: ミニ予約システム（定員あり）
**バージョン**: 1.0 (MVP)
**作成日**: 2025-12-13
**対象フェーズ**: 基本設計
**形式**: RESTful API (JSON)

---

## 目次

1. [API設計原則](#api設計原則)
2. [エンドポイント一覧](#エンドポイント一覧)
3. [認証API](#認証api)
4. [ユーザーAPI](#ユーザーapi)
5. [メニューAPI](#メニューapi)
6. [予約枠API](#予約枠api)
7. [予約API](#予約api)
8. [エラーレスポンス設計](#エラーレスポンス設計)
9. [HTTPステータスコード](#httpステータスコード)
10. [認証・認可](#認証認可)

---

## API設計原則

### 1. RESTful設計

- リソース指向のURL設計
- HTTPメソッドの適切な使用（GET/POST/PUT/PATCH/DELETE）
- ステートレスな通信

### 2. 命名規則

- エンドポイント：小文字、ハイフン区切り（例：`/api/service-menus`）
- JSONキー：キャメルケース（例：`userId`, `startAt`）
- 複数形リソース（例：`/api/slots`, `/api/reservations`）

### 3. バージョニング

- 現時点ではバージョン番号なし（`/api/...`）
- 将来的に破壊的変更があれば `/api/v2/...` を検討

### 4. レスポンス形式

- 成功時：リソースまたはリソース配列をJSON形式で返す
- エラー時：統一的なエラーレスポンス形式

### 5. 日時形式

- ISO 8601形式（例：`2025-12-13T10:30:00+09:00`）
- タイムゾーン：UTC または日本時間（JSTで統一推奨）

---

## エンドポイント一覧

### 認証API

| メソッド | パス | 説明 | 認証 | 機能ID |
|---------|------|------|------|--------|
| POST | `/api/auth/signup` | メール/パスワード新規登録 | 不要 | F-002 |
| GET | `/api/auth/verify` | メールアドレス確認 | 不要 | F-002-2 |
| POST | `/api/auth/login` | メール/パスワードログイン | 不要 | F-002-3 |
| POST | `/api/auth/logout` | ログアウト | 必須 | - |
| GET | `/api/auth/google` | Google OAuthログイン開始 | 不要 | F-001 |
| GET | `/api/auth/google/callback` | Google OAuthコールバック | 不要 | F-001 |

### ユーザーAPI

| メソッド | パス | 説明 | 認証 | 機能ID |
|---------|------|------|------|--------|
| GET | `/api/users/me` | ログインユーザー情報取得 | 必須 | F-013 |

### メニューAPI

| メソッド | パス | 説明 | 認証 | 機能ID |
|---------|------|------|------|--------|
| GET | `/api/menus` | メニュー一覧取得 | 不要 | - |
| POST | `/api/menus` | メニュー作成 | STAFF | F-003 |
| PATCH | `/api/menus/{menuId}` | メニュー更新 | STAFF | - |

### 予約枠API（スタッフ）

| メソッド | パス | 説明 | 認証 | 機能ID |
|---------|------|------|------|--------|
| GET | `/api/staff/slots` | 全予約枠一覧（STAFF） | STAFF | F-006 |
| POST | `/api/staff/slots` | 予約枠作成 | STAFF | F-004 |
| PATCH | `/api/staff/slots/{slotId}` | 予約枠編集 | STAFF | F-005 |
| GET | `/api/staff/reservations` | 全予約一覧（STAFF） | STAFF | F-007 |

### 予約枠API（公開）

| メソッド | パス | 説明 | 認証 | 機能ID |
|---------|------|------|------|--------|
| GET | `/api/slots` | 予約可能枠一覧（公開） | 不要 | F-008 |
| GET | `/api/slots/{slotId}` | 予約枠詳細 | 不要 | - |

### 予約API

| メソッド | パス | 説明 | 認証 | 機能ID |
|---------|------|------|------|--------|
| POST | `/api/reservations` | 予約作成 | USER | F-009, F-014 |
| GET | `/api/reservations/my` | 自分の予約一覧 | USER | F-010 |
| GET | `/api/reservations/history` | 予約履歴 | USER | F-011 |
| PATCH | `/api/reservations/{reservationId}/cancel` | 予約キャンセル | USER | F-012, F-014 |

---

## 認証API

### POST /api/auth/signup

**説明**: メール/パスワードで新規登録

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "山田太郎"
}
```

**レスポンス** (201 Created):
```json
{
  "message": "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。"
}
```

**エラー**:
- 400: バリデーションエラー（メール形式不正、パスワード8文字未満等）
- 409: メールアドレス重複

---

### GET /api/auth/verify

**説明**: メールアドレス確認（メール内のリンクから呼び出される）

**クエリパラメータ**:
- `token` (required): 確認トークン（UUID）

**レスポンス** (200 OK):
```json
{
  "message": "メールアドレスの確認が完了しました。ログインしてください。"
}
```

**エラー**:
- 400: トークン不正
- 404: トークンが存在しない
- 410: トークン有効期限切れ

---

### POST /api/auth/login

**説明**: メール/パスワードでログイン

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス** (200 OK):
```json
{
  "id": 123,
  "email": "user@example.com",
  "name": "山田太郎",
  "role": "USER",
  "isEmailVerified": true
}
```

**エラー**:
- 401: メールアドレスまたはパスワードが不正
- 403: メールアドレス未確認

---

### POST /api/auth/logout

**説明**: ログアウト

**リクエスト**: なし

**レスポンス** (204 No Content)

---

### GET /api/auth/google

**説明**: Google OAuthログイン開始（Spring Securityが自動でリダイレクト）

**レスポンス**: Googleの認証画面へリダイレクト

---

### GET /api/auth/google/callback

**説明**: Google OAuthコールバック（Spring Securityが自動処理）

**レスポンス**: フロントエンドのホーム画面へリダイレクト

---

## ユーザーAPI

### GET /api/users/me

**説明**: ログインユーザー情報取得

**認証**: 必須

**レスポンス** (200 OK):
```json
{
  "id": 123,
  "email": "user@example.com",
  "name": "山田太郎",
  "role": "USER",
  "isEmailVerified": true,
  "googleSub": null
}
```

**エラー**:
- 401: 未認証

---

## メニューAPI

### GET /api/menus

**説明**: 有効なメニュー一覧取得

**認証**: 不要

**レスポンス** (200 OK):
```json
[
  {
    "id": 1,
    "name": "30分コース",
    "durationMinutes": 30,
    "isActive": true
  },
  {
    "id": 2,
    "name": "60分コース",
    "durationMinutes": 60,
    "isActive": true
  }
]
```

---

### POST /api/menus

**説明**: メニュー作成

**認証**: STAFF

**リクエスト**:
```json
{
  "name": "90分コース",
  "durationMinutes": 90
}
```

**レスポンス** (201 Created):
```json
{
  "id": 3,
  "name": "90分コース",
  "durationMinutes": 90,
  "isActive": true,
  "createdAt": "2025-12-13T10:00:00+09:00"
}
```

**エラー**:
- 400: バリデーションエラー
- 403: 権限不足

---

## 予約枠API

### GET /api/slots

**説明**: 予約可能枠一覧取得（公開、未ログインでもOK）

**認証**: 不要

**クエリパラメータ**:
- `from` (optional): 検索開始日時（ISO 8601形式）
- `to` (optional): 検索終了日時（ISO 8601形式）
- `menuId` (optional): メニューID

**レスポンス** (200 OK):
```json
[
  {
    "id": 10,
    "menuId": 1,
    "menuName": "30分コース",
    "startAt": "2025-12-15T10:00:00+09:00",
    "endAt": "2025-12-15T10:30:00+09:00",
    "capacity": 5,
    "reservedCount": 3,
    "remainingCapacity": 2,
    "status": "OPEN"
  },
  {
    "id": 11,
    "menuId": 2,
    "menuName": "60分コース",
    "startAt": "2025-12-15T11:00:00+09:00",
    "endAt": "2025-12-15T12:00:00+09:00",
    "capacity": 3,
    "reservedCount": 0,
    "remainingCapacity": 3,
    "status": "OPEN"
  }
]
```

**備考**:
- `status=OPEN`, `remainingCapacity > 0`, `startAt > 現在時刻` のみ返す

---

### GET /api/slots/{slotId}

**説明**: 予約枠詳細取得

**認証**: 不要

**レスポンス** (200 OK):
```json
{
  "id": 10,
  "menuId": 1,
  "menuName": "30分コース",
  "startAt": "2025-12-15T10:00:00+09:00",
  "endAt": "2025-12-15T10:30:00+09:00",
  "capacity": 5,
  "reservedCount": 3,
  "remainingCapacity": 2,
  "status": "OPEN"
}
```

**エラー**:
- 404: 枠が存在しない

---

### GET /api/staff/slots

**説明**: 全予約枠一覧取得（STAFF向け）

**認証**: STAFF

**クエリパラメータ**:
- `from` (optional): 検索開始日時
- `to` (optional): 検索終了日時
- `menuId` (optional): メニューID
- `status` (optional): ステータス（OPEN/CLOSED/CANCELLED）

**レスポンス** (200 OK):
```json
[
  {
    "id": 10,
    "menuId": 1,
    "menuName": "30分コース",
    "startAt": "2025-12-15T10:00:00+09:00",
    "endAt": "2025-12-15T10:30:00+09:00",
    "capacity": 5,
    "reservedCount": 3,
    "remainingCapacity": 2,
    "status": "OPEN",
    "createdBy": 5,
    "createdByName": "スタッフ太郎",
    "createdAt": "2025-12-10T09:00:00+09:00"
  }
]
```

**エラー**:
- 403: 権限不足

---

### POST /api/staff/slots

**説明**: 予約枠作成

**認証**: STAFF

**リクエスト**:
```json
{
  "menuId": 1,
  "startAt": "2025-12-15T10:00:00+09:00",
  "endAt": "2025-12-15T10:30:00+09:00",
  "capacity": 5
}
```

**レスポンス** (201 Created):
```json
{
  "id": 12,
  "menuId": 1,
  "menuName": "30分コース",
  "startAt": "2025-12-15T10:00:00+09:00",
  "endAt": "2025-12-15T10:30:00+09:00",
  "capacity": 5,
  "reservedCount": 0,
  "remainingCapacity": 5,
  "status": "OPEN",
  "createdAt": "2025-12-13T10:00:00+09:00"
}
```

**エラー**:
- 400: バリデーションエラー（開始 >= 終了、定員 <= 0、過去日時等）
- 403: 権限不足
- 404: メニューが存在しない

---

### PATCH /api/staff/slots/{slotId}

**説明**: 予約枠編集

**認証**: STAFF

**リクエスト**:
```json
{
  "startAt": "2025-12-15T11:00:00+09:00",
  "endAt": "2025-12-15T11:30:00+09:00",
  "capacity": 10,
  "status": "OPEN"
}
```

**レスポンス** (200 OK):
```json
{
  "id": 12,
  "menuId": 1,
  "menuName": "30分コース",
  "startAt": "2025-12-15T11:00:00+09:00",
  "endAt": "2025-12-15T11:30:00+09:00",
  "capacity": 10,
  "reservedCount": 3,
  "remainingCapacity": 7,
  "status": "OPEN",
  "updatedAt": "2025-12-13T10:30:00+09:00"
}
```

**エラー**:
- 400: バリデーションエラー
- 403: 権限不足
- 404: 枠が存在しない
- 409: 定員を既存予約数未満に変更しようとした

---

### GET /api/staff/reservations

**説明**: 全予約一覧取得（STAFF向け）

**認証**: STAFF

**クエリパラメータ**:
- `from` (optional): 検索開始日時（枠の開始日時基準）
- `to` (optional): 検索終了日時
- `status` (optional): 予約ステータス（RESERVED/CANCELLED）
- `userName` (optional): 予約者名（部分一致検索）

**レスポンス** (200 OK):
```json
[
  {
    "id": 100,
    "slotId": 10,
    "slotStartAt": "2025-12-15T10:00:00+09:00",
    "slotEndAt": "2025-12-15T10:30:00+09:00",
    "menuName": "30分コース",
    "userId": 20,
    "userName": "山田太郎",
    "userEmail": "user@example.com",
    "status": "RESERVED",
    "createdAt": "2025-12-13T09:00:00+09:00"
  }
]
```

**エラー**:
- 403: 権限不足

---

## 予約API

### POST /api/reservations

**説明**: 予約作成（Google Calendar連携含む）

**認証**: USER

**リクエスト**:
```json
{
  "slotId": 10
}
```

**レスポンス** (201 Created):
```json
{
  "id": 101,
  "slotId": 10,
  "slotStartAt": "2025-12-15T10:00:00+09:00",
  "slotEndAt": "2025-12-15T10:30:00+09:00",
  "menuName": "30分コース",
  "status": "RESERVED",
  "googleCalendarEventId": "abc123xyz",
  "createdAt": "2025-12-13T10:00:00+09:00"
}
```

**備考**:
- `googleCalendarEventId`: Googleログインユーザーのみ値が入る
- カレンダー連携失敗でも予約は成功（`googleCalendarEventId`はnull）

**エラー**:
- 400: バリデーションエラー
- 401: 未認証
- 404: 枠が存在しない
- 409: 定員超過、重複予約、受付期限切れ
- 410: 枠のステータスが`OPEN`でない

---

### GET /api/reservations/my

**説明**: 自分の予約一覧（進行中のみ）

**認証**: USER

**レスポンス** (200 OK):
```json
[
  {
    "id": 101,
    "slotId": 10,
    "slotStartAt": "2025-12-15T10:00:00+09:00",
    "slotEndAt": "2025-12-15T10:30:00+09:00",
    "menuName": "30分コース",
    "status": "RESERVED",
    "canCancel": true,
    "createdAt": "2025-12-13T10:00:00+09:00"
  }
]
```

**備考**:
- `canCancel`: キャンセル可能かどうか（開始24時間前かつstatus=RESERVED）

**エラー**:
- 401: 未認証

---

### GET /api/reservations/history

**説明**: 予約履歴（キャンセル済み含む全予約）

**認証**: USER

**レスポンス** (200 OK):
```json
[
  {
    "id": 102,
    "slotId": 11,
    "slotStartAt": "2025-12-14T11:00:00+09:00",
    "slotEndAt": "2025-12-14T12:00:00+09:00",
    "menuName": "60分コース",
    "status": "CANCELLED",
    "canCancel": false,
    "createdAt": "2025-12-12T10:00:00+09:00",
    "updatedAt": "2025-12-13T09:00:00+09:00"
  },
  {
    "id": 101,
    "slotId": 10,
    "slotStartAt": "2025-12-15T10:00:00+09:00",
    "slotEndAt": "2025-12-15T10:30:00+09:00",
    "menuName": "30分コース",
    "status": "RESERVED",
    "canCancel": true,
    "createdAt": "2025-12-13T10:00:00+09:00",
    "updatedAt": "2025-12-13T10:00:00+09:00"
  }
]
```

**備考**:
- `createdAt`降順でソート（最新が上）

**エラー**:
- 401: 未認証

---

### PATCH /api/reservations/{reservationId}/cancel

**説明**: 予約キャンセル（Google Calendar連携含む）

**認証**: USER

**リクエスト**: なし

**レスポンス** (200 OK):
```json
{
  "id": 101,
  "slotId": 10,
  "slotStartAt": "2025-12-15T10:00:00+09:00",
  "slotEndAt": "2025-12-15T10:30:00+09:00",
  "menuName": "30分コース",
  "status": "CANCELLED",
  "cancelledAt": "2025-12-13T11:00:00+09:00"
}
```

**備考**:
- Google Calendar連携：`googleCalendarEventId`がある場合、イベント削除

**エラー**:
- 401: 未認証
- 403: 他人の予約をキャンセルしようとした
- 404: 予約が存在しない
- 409: 既にキャンセル済み
- 410: キャンセル期限切れ（開始24時間前を過ぎている）

---

## エラーレスポンス設計

### 統一エラーフォーマット

すべてのエラーは以下の形式で返す：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "ユーザー向けエラーメッセージ",
    "details": [
      {
        "field": "email",
        "message": "メールアドレスの形式が不正です"
      }
    ]
  }
}
```

**フィールド説明**:
- `code`: エラーコード（定数、大文字スネークケース）
- `message`: ユーザー向けメッセージ（日本語）
- `details` (optional): フィールド別の詳細エラー（バリデーションエラー時）

---

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|--------------|------|
| VALIDATION_ERROR | 400 | バリデーションエラー |
| UNAUTHORIZED | 401 | 未認証 |
| FORBIDDEN | 403 | 権限不足 |
| NOT_FOUND | 404 | リソースが存在しない |
| CONFLICT | 409 | リソースの競合 |
| SLOT_FULL | 409 | 定員超過 |
| DUPLICATE_RESERVATION | 409 | 重複予約 |
| DUPLICATE_EMAIL | 409 | メールアドレス重複 |
| GONE | 410 | リソースが期限切れ |
| CANCEL_DEADLINE_PASSED | 410 | キャンセル期限切れ |
| RESERVATION_DEADLINE_PASSED | 410 | 予約受付期限切れ |
| INTERNAL_SERVER_ERROR | 500 | サーバーエラー |

---

### エラーレスポンス例

#### バリデーションエラー（400）

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": [
      {
        "field": "email",
        "message": "メールアドレスの形式が不正です"
      },
      {
        "field": "password",
        "message": "パスワードは8文字以上である必要があります"
      }
    ]
  }
}
```

---

#### 未認証（401）

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "ログインが必要です"
  }
}
```

---

#### 権限不足（403）

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "この操作を実行する権限がありません"
  }
}
```

---

#### リソース未存在（404）

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "予約枠が見つかりません"
  }
}
```

---

#### 定員超過（409）

```json
{
  "error": {
    "code": "SLOT_FULL",
    "message": "満席になりました"
  }
}
```

---

#### 重複予約（409）

```json
{
  "error": {
    "code": "DUPLICATE_RESERVATION",
    "message": "既に予約済みです"
  }
}
```

---

#### キャンセル期限切れ（410）

```json
{
  "error": {
    "code": "CANCEL_DEADLINE_PASSED",
    "message": "開始24時間前を過ぎているためキャンセルできません"
  }
}
```

---

## HTTPステータスコード

| ステータスコード | 説明 | 使用例 |
|----------------|------|--------|
| 200 OK | 成功 | GET, PATCH成功時 |
| 201 Created | リソース作成成功 | POST成功時 |
| 204 No Content | 成功（レスポンスボディなし） | ログアウト、削除成功時 |
| 400 Bad Request | リクエスト不正 | バリデーションエラー |
| 401 Unauthorized | 未認証 | ログインしていない |
| 403 Forbidden | 権限不足 | ロールが不足 |
| 404 Not Found | リソース未存在 | 指定IDのリソースがない |
| 409 Conflict | リソース競合 | 定員超過、重複予約、メール重複 |
| 410 Gone | リソース期限切れ | キャンセル期限切れ |
| 500 Internal Server Error | サーバーエラー | 予期しないエラー |

---

## 認証・認可

### 認証方式

1. **セッション認証**（サーバーサイドセッション）
2. **CSRF保護**（CookieベースのCSRFトークン）

### 認可（ロール制御）

| エンドポイント | 必要ロール |
|--------------|-----------|
| `/api/auth/**` | なし（認証不要） |
| `/api/slots` | なし（公開API） |
| `/api/users/me` | 認証必須 |
| `/api/staff/**` | STAFF |
| `/api/reservations/**` | USER |
| `/api/menus` (GET) | なし（公開） |
| `/api/menus` (POST, PATCH) | STAFF |

### CORS設定

**開発環境**:
- 許可オリジン: `http://localhost:3000`
- 許可メソッド: GET, POST, PUT, PATCH, DELETE
- 認証情報送信: `credentials: include`

**本番環境**:
- 許可オリジン: デプロイ先ドメイン

---

## Swagger/OpenAPI設定

### Springdoc OpenAPI

**依存関係**:
```gradle
implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0'
```

**アクセス**:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

**アノテーション例**:
```java
@Tag(name = "予約API", description = "予約の作成・一覧・キャンセル")
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Operation(summary = "予約作成", description = "予約枠に対して予約を作成します")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "予約作成成功"),
        @ApiResponse(responseCode = "409", description = "定員超過または重複予約")
    })
    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(
        @Valid @RequestBody CreateReservationRequest request
    ) {
        // ...
    }
}
```

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0 | 2025-12-13 | 初版作成（API設計確定） |
