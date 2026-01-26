# Controller実装ガイド (Phase 5)

このドキュメントは、Phase 5で実装したプレゼンテーション層（Controller層）の詳細な解説です。

---

## 📋 Phase 5で実装したクラス

### 1. GlobalExceptionHandler（例外ハンドリング）
- アプリケーション全体の例外を一箇所で管理
- カスタム例外をHTTPステータスコードに変換
- エラーレスポンスを統一フォーマットで返す

### 2. Controller（5クラス）
- **AuthController** - 認証API（登録、ログイン）
- **UserController** - ユーザー管理API
- **ServiceMenuController** - サービスメニュー管理API（CRUD）
- **SlotController** - スロット管理API
- **ReservationController** - 予約管理API

---

## 🎯 Controller層の役割

### Controllerとは

**Controller = プレゼンテーション層**

HTTPリクエストを受け取り、Serviceを呼び出して、HTTPレスポンスを返す役割を持ちます。

```
クライアント
    ↓ HTTPリクエスト（JSON）
Controller（プレゼンテーション層）
    ↓ Serviceメソッド呼び出し
Service（ビジネスロジック層）
    ↓ Repositoryメソッド呼び出し
Repository（データアクセス層）
    ↓ SQL実行
Database
    ↓ データ返却
Repository
    ↓ Entityオブジェクト返却
Service
    ↓ DTOに変換して返却
Controller
    ↓ HTTPレスポンス（JSON）
クライアント
```

### Controllerの責務

**やるべきこと:**
- HTTPリクエストを受け取る
- バリデーション実行（`@Valid`）
- Serviceメソッドを呼び出す
- HTTPレスポンスを返す

**やってはいけないこと:**
- ビジネスロジックを書く → Serviceに書く
- データベースアクセス → Repositoryに書く
- 複雑な計算 → Serviceに書く

**Controllerはシンプルに保つ！**

---

## 🔧 重要なアノテーション

### クラスレベルのアノテーション

#### `@RestController`

```java
@RestController
public class UserController {
```

**役割:**
- このクラスがREST APIのコントローラーであることを示す
- すべてのメソッドの戻り値が自動的にJSONに変換される

**`@Controller`との違い:**
- `@Controller` → ViewResolver（HTMLページ）を返す
- `@RestController` → JSON/XMLを返す（REST API用）

---

#### `@RequestMapping`

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
```

**役割:**
- コントローラーの**ベースURL**を指定
- すべてのエンドポイントはこのパスで始まる

**例:**
```java
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")  // 実際のURL: /api/users/{id}
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
    }
}
```

---

### メソッドレベルのアノテーション

#### HTTPメソッドマッピング

| アノテーション | HTTPメソッド | 用途 |
|--------------|-------------|------|
| `@GetMapping` | GET | データ取得 |
| `@PostMapping` | POST | 新規作成 |
| `@PutMapping` | PUT | 更新 |
| `@DeleteMapping` | DELETE | 削除 |

**例:**
```java
@GetMapping("/{id}")           // GET /api/users/123
@PostMapping                   // POST /api/users
@PutMapping("/{id}")          // PUT /api/users/123
@DeleteMapping("/{id}")       // DELETE /api/users/123
```

---

#### パラメータバインディング

##### `@PathVariable` - パスパラメータ

```java
@GetMapping("/{id}")
public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
```

**URL例:**
```
GET /api/users/123
           ↓
         id = 123
```

**用途:**
- リソースを一意に特定する（必須パラメータ）

---

##### `@RequestParam` - クエリパラメータ

```java
@GetMapping("/search")
public ResponseEntity<List<SlotResponse>> search(
    @RequestParam LocalDateTime startTime,
    @RequestParam LocalDateTime endTime
) {
```

**URL例:**
```
GET /api/slots/search?startTime=2025-12-27T00:00:00&endTime=2025-12-27T23:59:59
                     ↓
                     startTime = 2025-12-27T00:00:00
                     endTime   = 2025-12-27T23:59:59
```

**用途:**
- 検索・フィルタリング（オプションパラメータ）
- 複数の条件を指定

**オプション設定:**
```java
@RequestParam(required = false) String name           // 省略可能
@RequestParam(defaultValue = "10") Integer limit      // デフォルト値
```

---

##### `@RequestBody` - リクエストボディ

```java
@PostMapping
public ResponseEntity<UserResponse> createUser(
    @Valid @RequestBody RegisterRequest request
) {
```

**リクエスト例:**
```http
POST /api/users
Content-Type: application/json

{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "password": "password123"
}
```

**役割:**
- リクエストボディ（JSON）をJavaオブジェクトに変換

---

##### `@Valid` - バリデーション

```java
@PostMapping
public ResponseEntity<UserResponse> createUser(
    @Valid @RequestBody RegisterRequest request
) {
```

**役割:**
- DTOに定義したバリデーションルールをチェック
- `@NotBlank`, `@NotNull`, `@Email`, `@Size`, `@Min` など

**バリデーション失敗時:**
- `MethodArgumentNotValidException`がスローされる
- GlobalExceptionHandlerがキャッチして400 Bad Requestを返す

---

### `@DateTimeFormat` - 日時フォーマット

```java
@GetMapping("/search")
public ResponseEntity<List<SlotResponse>> search(
    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime
) {
```

**役割:**
- 文字列を`LocalDateTime`型に自動変換
- ISO 8601形式（`2025-12-27T10:00:00`）をパース

**このアノテーションがないと:**
- 文字列を`LocalDateTime`に変換できず、400 Bad Requestエラー

---

## 📦 ResponseEntity

### ResponseEntityとは

HTTPレスポンスを詳細に制御するためのクラス。

**構成要素:**
- HTTPステータスコード
- レスポンスヘッダー
- レスポンスボディ

### 基本的な使い方

#### ステータスコード + ボディ

```java
return ResponseEntity.status(HttpStatus.CREATED).body(response);
```

**HTTPレスポンス:**
```
HTTP/1.1 201 Created
Content-Type: application/json

{ "id": 1, "name": "..." }
```

---

#### ショートカットメソッド

```java
// 200 OK
return ResponseEntity.ok(response);

// 201 Created
return ResponseEntity.status(HttpStatus.CREATED).body(response);

// 204 No Content（ボディなし）
return ResponseEntity.noContent().build();
```

---

### HTTPステータスコードの使い分け

| ステータスコード | 名前 | 使用場面 | 例 |
|----------------|------|---------|-----|
| **200 OK** | 成功 | GET、PUT成功 | `ResponseEntity.ok(response)` |
| **201 Created** | 作成成功 | POST成功 | `ResponseEntity.status(HttpStatus.CREATED).body(response)` |
| **204 No Content** | 成功（レスポンスなし） | DELETE成功 | `ResponseEntity.noContent().build()` |
| **400 Bad Request** | リクエスト不正 | バリデーションエラー | GlobalExceptionHandler |
| **401 Unauthorized** | 認証エラー | 権限なし | GlobalExceptionHandler |
| **404 Not Found** | リソース未発見 | データなし | GlobalExceptionHandler |
| **409 Conflict** | リソース重複 | メール重複など | GlobalExceptionHandler |
| **500 Internal Server Error** | サーバーエラー | 予期しないエラー | GlobalExceptionHandler |

---

## 🛠️ GlobalExceptionHandler

### 役割

アプリケーション全体で発生した例外を一箇所でキャッチして、適切なHTTPステータスコードとエラーメッセージを返す。

### `@RestControllerAdvice`

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
```

**役割:**
- すべてのControllerで発生した例外をキャッチ
- JSON形式のエラーレスポンスを返す

---

### `@ExceptionHandler`

```java
@ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(
    ResourceNotFoundException ex
) {
```

**役割:**
- どの例外をキャッチするかを指定
- カッコ内の例外クラスが発生したときに、このメソッドが自動的に呼ばれる

---

### エラーレスポンスの構築

```java
Map<String, Object> errorResponse = new HashMap<>();
errorResponse.put("timestamp", LocalDateTime.now());
errorResponse.put("status", HttpStatus.NOT_FOUND.value());
errorResponse.put("error", "Not Found");
errorResponse.put("message", ex.getMessage());

return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
```

**JSONレスポンス:**
```json
{
  "timestamp": "2025-12-26T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "ユーザーが見つかりません: ID=123"
}
```

---

### 各例外ハンドラーの役割

| 例外 | HTTPステータス | 用途 |
|------|---------------|------|
| `ResourceNotFoundException` | 404 Not Found | リソースが見つからない |
| `DuplicateResourceException` | 409 Conflict | リソースが重複 |
| `InvalidRequestException` | 400 Bad Request | 無効なリクエスト |
| `UnauthorizedException` | 401 Unauthorized | 認証エラー |
| `MethodArgumentNotValidException` | 400 Bad Request | バリデーションエラー |
| `Exception` | 500 Internal Server Error | 予期しないエラー |

---

### バリデーションエラーのハンドリング

```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<Map<String, Object>> handleValidationException(
    MethodArgumentNotValidException ex
) {
    Map<String, Object> errorResponse = new HashMap<>();
    errorResponse.put("timestamp", LocalDateTime.now());
    errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
    errorResponse.put("error", "Validation Failed");

    Map<String, String> fieldErrors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error -> {
        fieldErrors.put(error.getField(), error.getDefaultMessage());
    });
    errorResponse.put("fieldErrors", fieldErrors);

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
}
```

**処理の流れ:**
1. `ex.getBindingResult()` → バリデーション結果を取得
2. `.getFieldErrors()` → フィールドごとのエラーリストを取得
3. `.forEach()` → 各エラーをループ処理
4. `error.getField()` → エラーが発生したフィールド名
5. `error.getDefaultMessage()` → DTOで定義したエラーメッセージ
6. `fieldErrors` Mapに格納

**エラーレスポンス例:**
```json
{
  "timestamp": "2025-12-26T10:30:00",
  "status": 400,
  "error": "Validation Failed",
  "fieldErrors": {
    "email": "メールアドレスは必須です",
    "password": "パスワードは8文字以上である必要があります"
  }
}
```

---

## 📝 各Controllerの詳細

### 1. AuthController

#### 役割
ユーザー登録とログインのためのREST APIエンドポイントを提供。

#### エンドポイント一覧

| HTTPメソッド | URL | メソッド名 | 説明 |
|------------|-----|-----------|------|
| POST | `/api/auth/register` | `register()` | ユーザー登録 |
| POST | `/api/auth/login` | `login()` | ログイン |

#### 実装例

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
        @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
```

#### リクエスト/レスポンス例

**ユーザー登録:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "password": "password123"
}

→ 201 Created
{
  "userId": 1,
  "email": "yamada@example.com",
  "name": "山田太郎",
  "role": "USER",
  "message": "登録に成功しました"
}
```

---

### 2. UserController

#### 役割
ユーザー情報の取得。

#### エンドポイント一覧

| HTTPメソッド | URL | メソッド名 | 説明 |
|------------|-----|-----------|------|
| GET | `/api/users/{id}` | `getUserById()` | ユーザー情報取得 |

#### 実装例

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }
}
```

#### リクエスト/レスポンス例

```http
GET /api/users/1

→ 200 OK
{
  "id": 1,
  "name": "山田太郎",
  "email": "yamada@example.com",
  "role": "USER"
}
```

---

### 3. ServiceMenuController

#### 役割
サービスメニューの完全なCRUD操作を提供。

#### エンドポイント一覧

| HTTPメソッド | URL | メソッド名 | 説明 |
|------------|-----|-----------|------|
| POST | `/api/service-menus` | `createServiceMenu()` | 新規作成 |
| GET | `/api/service-menus` | `getAllServiceMenus()` | 一覧取得 |
| GET | `/api/service-menus/{id}` | `getServiceMenuById()` | 単体取得 |
| PUT | `/api/service-menus/{id}` | `updateServiceMenu()` | 更新 |
| DELETE | `/api/service-menus/{id}` | `deleteServiceMenu()` | 削除 |

#### 実装例

```java
@RestController
@RequestMapping("/api/service-menus")
public class ServiceMenuController {

    private final ServiceMenuService serviceMenuService;

    public ServiceMenuController(ServiceMenuService serviceMenuService) {
        this.serviceMenuService = serviceMenuService;
    }

    @PostMapping
    public ResponseEntity<ServiceMenuResponse> createServiceMenu(
        @Valid @RequestBody ServiceMenuRequest request
    ) {
        ServiceMenuResponse response = serviceMenuService.createServiceMenu(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ServiceMenuResponse>> getAllServiceMenus() {
        List<ServiceMenuResponse> responses = serviceMenuService.getAllServiceMenus();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceMenuResponse> getServiceMenuById(@PathVariable Long id) {
        ServiceMenuResponse response = serviceMenuService.getServiceMenuById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceMenuResponse> updateServiceMenu(
        @PathVariable Long id,
        @Valid @RequestBody ServiceMenuRequest request
    ) {
        ServiceMenuResponse response = serviceMenuService.updateServiceMenu(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteServiceMenu(@PathVariable Long id) {
        serviceMenuService.deleteServiceMenu(id);
        return ResponseEntity.noContent().build();
    }
}
```

#### RESTful API設計

**リソース指向:**
- `/api/service-menus` → コレクション（複数形）
- `/api/service-menus/{id}` → 特定のリソース

**HTTPメソッドとCRUD操作の対応:**
- POST → Create（新規作成）
- GET → Read（取得）
- PUT → Update（更新）
- DELETE → Delete（削除）

---

### 4. SlotController

#### 役割
予約枠（スロット）の管理。クエリパラメータを使った検索機能が特徴。

#### エンドポイント一覧

| HTTPメソッド | URL | メソッド名 | 説明 |
|------------|-----|-----------|------|
| POST | `/api/slots` | `createSlot()` | 新規作成 |
| GET | `/api/slots/{id}` | `getSlotById()` | 単体取得 |
| GET | `/api/slots/search?startTime=...&endTime=...` | `getSlotsByDateRange()` | 検索 |
| DELETE | `/api/slots/{id}` | `deleteSlot()` | 削除 |

#### 実装例

```java
@RestController
@RequestMapping("/api/slots")
public class SlotController {

    private final SlotService slotService;

    public SlotController(SlotService slotService) {
        this.slotService = slotService;
    }

    @PostMapping
    public ResponseEntity<SlotResponse> createSlot(
        @Valid @RequestBody SlotRequest request
    ) {
        SlotResponse response = slotService.createSlot(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SlotResponse> getSlotById(@PathVariable Long id) {
        SlotResponse response = slotService.getSlotById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<List<SlotResponse>> getSlotsByDateRange(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime
    ) {
        List<SlotResponse> responses = slotService.getSlotsByDateRange(startTime, endTime);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        slotService.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }
}
```

#### クエリパラメータの使い方

**リクエスト例:**
```http
GET /api/slots/search?startTime=2025-12-27T00:00:00&endTime=2025-12-27T23:59:59
```

**パラメータの構造:**
```
?startTime=2025-12-27T00:00:00&endTime=2025-12-27T23:59:59
 ↓
startTime = "2025-12-27T00:00:00"
endTime   = "2025-12-27T23:59:59"
 ↓ @DateTimeFormatで自動変換
startTime = LocalDateTime.of(2025, 12, 27, 0, 0, 0)
endTime   = LocalDateTime.of(2025, 12, 27, 23, 59, 59)
```

**ISO 8601形式:**
```
2025-12-27T10:00:00
↓
年-月-日T時:分:秒
```

---

### 5. ReservationController

#### 役割
予約管理。ユーザー認証情報（userId）を扱う点が特徴。

#### エンドポイント一覧

| HTTPメソッド | URL | メソッド名 | 説明 |
|------------|-----|-----------|------|
| POST | `/api/reservations` | `createReservation()` | 予約作成 |
| GET | `/api/reservations/user/{userId}` | `getReservationsByUserId()` | ユーザーの予約一覧 |
| GET | `/api/reservations/{id}` | `getReservationById()` | 予約詳細 |
| DELETE | `/api/reservations/{id}` | `cancelReservation()` | 予約キャンセル |

#### 実装例

```java
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(
        @Valid @RequestBody ReservationRequest request
    ) {
        // TODO: 将来的にはSpring Securityから取得
        Long userId = 1L;

        ReservationResponse response = reservationService.createReservation(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReservationResponse>> getReservationsByUserId(
        @PathVariable Long userId
    ) {
        List<ReservationResponse> responses = reservationService.getReservationsByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationById(@PathVariable Long id) {
        ReservationResponse response = reservationService.getReservationById(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelReservation(@PathVariable Long id) {
        // TODO: 将来的にはSpring Securityから取得
        Long userId = 1L;

        reservationService.cancelReservation(id, userId);
        return ResponseEntity.noContent().build();
    }
}
```

#### userIdのハードコード

**現在の実装（一時的）:**
```java
Long userId = 1L;  // ハードコード
```

**理由:**
1. 現段階ではログイン機能が未実装
2. Phase 6以降でSpring Securityの認証を統合する予定
3. 今はController層の基本的な動作を確認するための一時的な実装

**将来的な実装（参考）:**
```java
@PostMapping
public ResponseEntity<ReservationResponse> createReservation(
    @Valid @RequestBody ReservationRequest request,
    @AuthenticationPrincipal CustomUserDetails userDetails  // ← Spring Securityから取得
) {
    Long userId = userDetails.getUser().getId();

    ReservationResponse response = reservationService.createReservation(request, userId);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

#### なぜuserIdをリクエストボディやパスパラメータから受け取らないのか？

**❌ 悪い例（セキュリティリスク）:**
```java
// これは危険！
@PostMapping
public ResponseEntity<ReservationResponse> createReservation(
    @Valid @RequestBody ReservationRequest request
) {
    Long userId = request.getUserId();  // ← リクエストボディから取得
    // 攻撃者が他人のuserIdを指定できてしまう！
}
```

**問題点:**
- クライアントが任意のuserIdを指定できてしまう
- 他人になりすまして予約できてしまう
- セキュリティホール

**✅ 正しい実装:**
```java
// userIdはサーバー側（Spring Security）から取得
Long userId = userDetails.getUser().getId();
```

**理由:**
- ログインしているユーザー情報はサーバー側で管理
- クライアントからは操作不能
- 安全性が保証される

---

## 💡 よくある質問

### Q1: `@RestController`と`@Controller`の違いは？

**A:**
- `@RestController` → JSON/XMLを返す（REST API用）
- `@Controller` → HTMLページを返す（Webアプリケーション用）

`@RestController`は`@Controller` + `@ResponseBody`の組み合わせです。

---

### Q2: パスパラメータとクエリパラメータの使い分けは？

**A:**

| 用途 | 使うべきもの | 例 |
|-----|------------|-----|
| リソース特定 | パスパラメータ | `/api/users/123` |
| フィルタリング | クエリパラメータ | `/api/users?role=ADMIN` |
| ページネーション | クエリパラメータ | `/api/users?page=2&size=20` |
| ソート | クエリパラメータ | `/api/users?sort=name,asc` |

**基本ルール:**
- **必須**パラメータ → パスパラメータ
- **オプション**パラメータ → クエリパラメータ

---

### Q3: ResponseEntityは必ず使う必要がある？

**A:** いいえ、必須ではありません。

**ResponseEntityを使わない場合:**
```java
@GetMapping("/{id}")
public UserResponse getUserById(@PathVariable Long id) {
    return userService.getUserById(id);
}
```
→ 自動的に200 OKで返される

**ResponseEntityを使う場合:**
```java
@PostMapping
public ResponseEntity<UserResponse> createUser(@Valid @RequestBody RegisterRequest request) {
    UserResponse response = userService.createUser(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```
→ 201 Createdを指定できる

**使い分け:**
- ステータスコードを制御したい場合 → ResponseEntity
- 200 OKで問題ない場合 → DTOを直接返す

---

### Q4: なぜControllerでtry-catchを書かないの？

**A:** GlobalExceptionHandlerに任せるため。

**❌ 悪い例:**
```java
@GetMapping("/{id}")
public ResponseEntity<?> getUserById(@PathVariable Long id) {
    try {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    } catch (ResourceNotFoundException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("status", 404);
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}
```

**問題点:**
- Controllerが複雑になる
- すべてのメソッドに同じtry-catchを書く必要がある
- エラーレスポンスの形式が統一されない

**✅ 良い例:**
```java
@GetMapping("/{id}")
public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
    UserResponse response = userService.getUserById(id);
    return ResponseEntity.ok(response);
}
```

**メリット:**
- Controllerがシンプル
- エラーハンドリングが一箇所に集約
- エラーレスポンスが統一される

---

### Q5: PUTとPATCHの違いは？

**A:**

**PUT（全体の置き換え）:**
```java
@PutMapping("/{id}")
public ResponseEntity<ServiceMenuResponse> updateServiceMenu(
    @PathVariable Long id,
    @Valid @RequestBody ServiceMenuRequest request
) {
```

**特徴:**
- リソース全体を置き換える
- すべてのフィールドを送信する必要がある

**リクエスト例:**
```json
{
  "name": "カット",
  "description": "カット施術",
  "durationMinutes": 30,
  "price": 3000
}
```

---

**PATCH（部分更新）:**
```java
@PatchMapping("/{id}")
public ResponseEntity<ServiceMenuResponse> partialUpdateServiceMenu(
    @PathVariable Long id,
    @RequestBody Map<String, Object> updates
) {
```

**特徴:**
- リソースの一部だけを更新
- 変更したいフィールドのみ送信

**リクエスト例:**
```json
{
  "price": 3500
}
```

**どちらを使うべきか:**
- シンプルなAPI → PUTで十分
- 部分更新が必要 → PATCHを追加

---

### Q6: DELETEで物理削除ではなくステータス変更する理由は？

**A:**

**物理削除（DELETE）:**
```java
reservationRepository.delete(reservation);  // データが完全に消える
```

**問題点:**
- データが完全に消える
- 履歴が残らない
- 統計・分析ができない
- 取り消せない

**論理削除（ステータス変更）:**
```java
reservation.setStatus(ReservationStatus.CANCELLED);  // ステータスを変更
```

**メリット:**
- データは残る
- 履歴を確認できる
- キャンセル率などの統計が取れる
- 必要に応じて復元可能

---

### Q7: バリデーションエラーのフィールド名はどうやって取得する？

**A:**

```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<Map<String, Object>> handleValidationException(
    MethodArgumentNotValidException ex
) {
    Map<String, String> fieldErrors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error -> {
        fieldErrors.put(error.getField(), error.getDefaultMessage());
        //              ↑ フィールド名      ↑ エラーメッセージ
    });
}
```

**処理の流れ:**
1. `ex.getBindingResult()` → バリデーション結果を取得
2. `.getFieldErrors()` → フィールドごとのエラーリストを取得
3. `.forEach()` → 各エラーをループ処理
4. `error.getField()` → エラーが発生したフィールド名（例: "email"）
5. `error.getDefaultMessage()` → DTOで定義したエラーメッセージ

---

## 🎓 Phase 5で学んだ重要な概念

### 1. REST APIの設計原則

**リソース指向のURL:**
```
/api/users           ← コレクション（複数形）
/api/users/{id}      ← 特定のリソース
```

**HTTPメソッドとCRUD操作の対応:**
- GET → Read（取得）
- POST → Create（新規作成）
- PUT → Update（更新）
- DELETE → Delete（削除）

**適切なHTTPステータスコード:**
- 200 OK → GET、PUT成功
- 201 Created → POST成功
- 204 No Content → DELETE成功
- 400 Bad Request → バリデーションエラー
- 404 Not Found → リソース未発見

---

### 2. Controller層の責務

**やるべきこと:**
- HTTPリクエストを受け取る
- バリデーション実行
- Serviceメソッドを呼び出す
- HTTPレスポンスを返す

**やってはいけないこと:**
- ビジネスロジックを書く
- データベースアクセス
- 複雑な計算

**Controllerはシンプルに保つ！**

---

### 3. エラーハンドリングの集約

**GlobalExceptionHandlerのメリット:**
- Controllerがシンプルになる
- エラーハンドリングが一箇所に集約される
- エラーレスポンスが統一される

**処理の流れ:**
```
Controller → 例外発生 → GlobalExceptionHandler → JSONレスポンス返却
```

---

### 4. パラメータバインディング

**3種類のパラメータ:**
1. **パスパラメータ** (`@PathVariable`) - リソース特定
2. **クエリパラメータ** (`@RequestParam`) - フィルタリング、検索
3. **リクエストボディ** (`@RequestBody`) - データ送信

**使い分けのルール:**
- 必須パラメータ → パスパラメータ
- オプションパラメータ → クエリパラメータ
- 複雑なデータ → リクエストボディ

---

### 5. セキュリティの基本

**userIdはクライアントから受け取らない:**
- サーバー側（Spring Security）から取得
- クライアントからは操作不能
- 安全性が保証される

**理由:**
- クライアントが任意のuserIdを指定できてしまうと、他人になりすませる
- セキュリティホールになる

---

## 📚 次のステップ

Phase 5が完了しました！次はPhase 6に進みます。

### Phase 6: 外部連携（予定）
- EmailService（メール送信）
- GoogleCalendarService（Googleカレンダー連携）

### Phase 7: テスト・動作確認（予定）
- Swagger UI確認
- 基本的な動作テスト

---

このドキュメントを参考に、Controller層の実装を深く理解してください。
何か不明点があれば、いつでも質問してください！
