# DTO実装ガイド

このドキュメントは、Phase 4で作成したDTOクラスについての詳細な解説です。

---

## 📋 目次

1. [DTOとは？](#dtoとは)
2. [なぜDTOを使うのか？](#なぜdtoを使うのか)
3. [作成したDTOクラス一覧](#作成したdtoクラス一覧)
4. [各DTOクラスの詳細](#各dtoクラスの詳細)
5. [Lombokアノテーション解説](#lombokアノテーション解説)
6. [バリデーションアノテーション解説](#バリデーションアノテーション解説)
7. [int vs Integer の使い分け](#int-vs-integer-の使い分け)
8. [よくある質問](#よくある質問)

---

## DTOとは？

**DTO = Data Transfer Object（データ転送オブジェクト）**

APIのリクエスト/レスポンスでデータをやり取りするための専用クラスです。

**特徴：**
- API の入出力専用
- ビジネスロジックを持たない
- データの入れ物（コンテナ）としての役割

---

## なぜDTOを使うのか？

### 理由1: セキュリティ

**Entity（User.java）:**
```java
@Entity
public class User {
    private Long id;
    private String email;
    private String password;           // ← 機密情報！
    private String googleSub;           // ← 機密情報！
    private String googleAccessToken;   // ← 機密情報！
    private String googleRefreshToken;  // ← 機密情報！
    private String name;
    private UserRole role;
    private boolean emailVerified;
}
```

**DTO（UserResponse.java）:**
```java
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String role;
    private boolean emailVerified;
    // パスワードやトークンは含まない！
}
```

→ **外部に公開しても安全な情報だけを含める**

---

### 理由2: API設計の柔軟性

- Entityの構造が変わっても、DTOを変えなければAPIは影響を受けない
- APIの安定性を保てる
- バージョニングが容易

**例：Entityにフィールドを追加**
```java
@Entity
public class User {
    private Long id;
    private String email;
    private String name;
    private String internalCode;  // ← 新しいフィールド追加
}
```

→ DTOを変更しなければ、APIのレスポンスは変わらない（後方互換性を保てる）

---

### 理由3: バリデーション

リクエストDTOにバリデーションアノテーションを付けることで、自動的に入力チェックができる。

```java
public class RegisterRequest {
    @NotBlank(message = "名前は必須です")
    private String name;

    @Email(message = "メールアドレスの形式が正しくありません")
    private String email;

    @Size(min = 8, message = "パスワードは8文字以上である必要があります")
    private String password;
}
```

---

### 理由4: レスポンスの最適化

必要な情報を1つのレスポンスにまとめることで、APIコール回数を削減できる。

**例：SlotResponse**
```java
public class SlotResponse {
    private Long id;
    private Long serviceMenuId;
    private String serviceMenuName;  // ← サービス名も含める
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
}
```

→ フロントエンドで「カット 10:00-11:00」と1回のAPIコールで表示できる

---

## 作成したDTOクラス一覧

全10個のDTOクラスを作成しました。

| カテゴリ | クラス名 | 用途 | ファイルパス |
|---------|---------|------|------------|
| **認証関連** | `RegisterRequest` | ユーザー登録リクエスト | `dto/RegisterRequest.java` |
| **認証関連** | `LoginRequest` | ログインリクエスト | `dto/LoginRequest.java` |
| **認証関連** | `AuthResponse` | 認証レスポンス | `dto/AuthResponse.java` |
| **ユーザー関連** | `UserResponse` | ユーザー情報レスポンス | `dto/UserResponse.java` |
| **サービスメニュー関連** | `ServiceMenuRequest` | サービスメニュー作成/更新リクエスト | `dto/ServiceMenuRequest.java` |
| **サービスメニュー関連** | `ServiceMenuResponse` | サービスメニューレスポンス | `dto/ServiceMenuResponse.java` |
| **スロット関連** | `SlotRequest` | スロット作成リクエスト | `dto/SlotRequest.java` |
| **スロット関連** | `SlotResponse` | スロットレスポンス | `dto/SlotResponse.java` |
| **予約関連** | `ReservationRequest` | 予約作成リクエスト | `dto/ReservationRequest.java` |
| **予約関連** | `ReservationResponse` | 予約レスポンス | `dto/ReservationResponse.java` |

---

## 各DTOクラスの詳細

### 1. RegisterRequest.java

**用途：** ユーザー登録時に受け取るリクエストデータ

**取り扱う情報：**
- `name` - ユーザー名
- `email` - メールアドレス
- `password` - パスワード

**バリデーション：**
- すべてのフィールドが必須
- メールアドレス形式チェック
- パスワードは8文字以上

**リクエストJSON例：**
```json
{
  "name": "山田太郎",
  "email": "test@example.com",
  "password": "password123"
}
```

**使用場面：**
- POST `/api/auth/register` - 新規ユーザー登録

**コード：**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "名前は必須です")
    private String name;

    @NotBlank(message = "メールアドレスは必須です")
    @Email(message = "メールアドレスの形式が正しくありません")
    private String email;

    @NotBlank(message = "パスワードは必須です")
    @Size(min = 8, message = "パスワードは8文字以上である必要があります")
    private String password;
}
```

---

### 2. LoginRequest.java

**用途：** ログイン時に受け取るリクエストデータ

**取り扱う情報：**
- `email` - メールアドレス
- `password` - パスワード

**バリデーション：**
- すべてのフィールドが必須
- メールアドレス形式チェック

**RegisterRequestとの違い：**
- `name` フィールドがない（ログインには名前は不要）

**リクエストJSON例：**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**使用場面：**
- POST `/api/auth/login` - ログイン

**コード：**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "メールアドレスは必須です")
    @Email(message = "メールアドレスの形式が正しくありません")
    private String email;

    @NotBlank(message = "パスワードは必須です")
    private String password;
}
```

---

### 3. AuthResponse.java

**用途：** 認証成功時に返すレスポンスデータ

**取り扱う情報：**
- `userId` - ユーザーID
- `email` - メールアドレス
- `name` - ユーザー名
- `role` - ロール（USER、ADMINなど）
- `message` - メッセージ（「登録に成功しました」など）

**バリデーション：**
- なし（レスポンス用のため）

**レスポンスJSON例：**
```json
{
  "userId": 1,
  "email": "test@example.com",
  "name": "山田太郎",
  "role": "USER",
  "message": "登録に成功しました"
}
```

**使用場面：**
- POST `/api/auth/register` のレスポンス
- POST `/api/auth/login` のレスポンス

**特徴：**
- `@Builder` アノテーションでBuilderパターンを使える

**コード：**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private Long userId;
    private String email;
    private String name;
    private String role;
    private String message;
}
```

---

### 4. UserResponse.java

**用途：** ユーザー情報を返すレスポンスデータ

**取り扱う情報：**
- `id` - ユーザーID
- `email` - メールアドレス
- `name` - ユーザー名
- `role` - ロール
- `emailVerified` - メール認証済みかどうか

**Entityとの違い：**
- パスワードやトークンなど、機密情報を含まない

**レスポンスJSON例：**
```json
{
  "id": 1,
  "email": "test@example.com",
  "name": "山田太郎",
  "role": "USER",
  "emailVerified": true
}
```

**使用場面：**
- GET `/api/users/{id}` - ユーザー情報取得
- GET `/api/users/me` - 自分の情報取得

**コード：**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private String role;
    private boolean emailVerified;
}
```

---

### 5. ServiceMenuRequest.java

**用途：** サービスメニュー作成/更新時に受け取るリクエストデータ

**取り扱う情報：**
- `name` - サービス名（例：「カット」）
- `description` - 説明（任意）
- `durationMinutes` - 所要時間（分）
- `price` - 料金（円）

**バリデーション：**
- `name` は必須（空白不可）
- `description` は任意（バリデーションなし）
- `durationMinutes` は必須、1分以上
- `price` は必須、0円以上

**リクエストJSON例：**
```json
{
  "name": "カット",
  "description": "髪を切るサービスです",
  "durationMinutes": 60,
  "price": 3000
}
```

**使用場面：**
- POST `/api/service-menus` - サービスメニュー作成
- PUT `/api/service-menus/{id}` - サービスメニュー更新

**コード：**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceMenuRequest {

    @NotBlank(message = "サービス名は必須です")
    private String name;

    private String description;

    @NotNull(message = "所要時間は必須です")
    @Min(value = 1, message = "所要時間は1分以上である必要があります")
    private Integer durationMinutes;

    @NotNull(message = "料金は必須です")
    @Min(value = 0, message = "料金は0円以上である必要があります")
    private Integer price;
}
```

---

### 6. ServiceMenuResponse.java

**用途：** サービスメニュー情報を返すレスポンスデータ

**取り扱う情報：**
- `id` - サービスメニューID
- `name` - サービス名
- `description` - 説明
- `durationMinutes` - 所要時間
- `price` - 料金

**レスポンスJSON例：**
```json
{
  "id": 1,
  "name": "カット",
  "description": "髪を切るサービスです",
  "durationMinutes": 60,
  "price": 3000
}
```

**使用場面：**
- GET `/api/service-menus` - サービスメニュー一覧取得
- GET `/api/service-menus/{id}` - サービスメニュー詳細取得

**コード：**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceMenuResponse {

    private Long id;
    private String name;
    private String description;
    private Integer durationMinutes;
    private Integer price;
}
```

---

### 7. SlotRequest.java

**用途：** スロット作成時に受け取るリクエストデータ

**取り扱う情報：**
- `serviceMenuId` - どのサービスメニューのスロットか
- `startTime` - 開始時刻
- `endTime` - 終了時刻

**バリデーション：**
- すべてのフィールドが必須

**リクエストJSON例：**
```json
{
  "serviceMenuId": 1,
  "startTime": "2025-12-23T10:00:00",
  "endTime": "2025-12-23T11:00:00"
}
```

**使用場面：**
- POST `/api/slots` - スロット作成（管理者のみ）

**日時のフォーマット：**
- ISO 8601形式（`YYYY-MM-DDTHH:mm:ss`）
- 例：`2025-12-23T10:00:00` = 2025年12月23日 10時00分

**コード：**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlotRequest {

    @NotNull(message = "サービスメニューIDは必須です")
    private Long serviceMenuId;

    @NotNull(message = "開始時刻は必須です")
    private LocalDateTime startTime;

    @NotNull(message = "終了時刻は必須です")
    private LocalDateTime endTime;
}
```

---

### 8. SlotResponse.java

**用途：** スロット情報を返すレスポンスデータ

**取り扱う情報：**
- `id` - スロットID
- `serviceMenuId` - サービスメニューID
- `serviceMenuName` - サービスメニュー名（便利！）
- `startTime` - 開始時刻
- `endTime` - 終了時刻
- `status` - ステータス（AVAILABLE、RESERVED、CANCELLEDなど）

**レスポンスJSON例：**
```json
{
  "id": 1,
  "serviceMenuId": 1,
  "serviceMenuName": "カット",
  "startTime": "2025-12-23T10:00:00",
  "endTime": "2025-12-23T11:00:00",
  "status": "AVAILABLE"
}
```

**使用場面：**
- GET `/api/slots` - スロット一覧取得
- GET `/api/slots/{id}` - スロット詳細取得

**特徴：**
- `serviceMenuName` を含めることで、フロントエンドで追加APIコール不要

**コード：**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotResponse {

    private Long id;
    private Long serviceMenuId;
    private String serviceMenuName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
}
```

---

### 9. ReservationRequest.java

**用途：** 予約作成時に受け取るリクエストデータ

**取り扱う情報：**
- `slotId` - どのスロットを予約するか
- `notes` - 備考（任意）

**バリデーション：**
- `slotId` は必須
- `notes` は任意

**リクエストJSON例：**
```json
{
  "slotId": 1,
  "notes": "初めての利用です。よろしくお願いします。"
}
```

**使用場面：**
- POST `/api/reservations` - 予約作成

**シンプルな理由：**
- ユーザー情報はログインユーザーから取得（リクエストに含めない）
- スロットIDだけで予約可能

**コード：**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequest {

    @NotNull(message = "スロットIDは必須です")
    private Long slotId;

    private String notes;
}
```

---

### 10. ReservationResponse.java

**用途：** 予約情報を返すレスポンスデータ

**取り扱う情報：**
- `id` - 予約ID
- `userId` - ユーザーID
- `userName` - ユーザー名（便利！）
- `slotId` - スロットID
- `serviceMenuName` - サービスメニュー名（便利！）
- `startTime` - 開始時刻
- `endTime` - 終了時刻
- `status` - ステータス（CONFIRMED、CANCELLED など）
- `notes` - 備考

**レスポンスJSON例：**
```json
{
  "id": 1,
  "userId": 5,
  "userName": "山田太郎",
  "slotId": 10,
  "serviceMenuName": "カット",
  "startTime": "2025-12-23T10:00:00",
  "endTime": "2025-12-23T11:00:00",
  "status": "CONFIRMED",
  "notes": "初めての利用です。よろしくお願いします。"
}
```

**使用場面：**
- GET `/api/reservations` - 予約一覧取得
- GET `/api/reservations/{id}` - 予約詳細取得

**特徴：**
- 必要な情報をすべて含めることで、1回のAPIコールで全情報を表示可能

**コード：**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long slotId;
    private String serviceMenuName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String notes;
}
```

---

## Lombokアノテーション解説

Lombokは、ボイラープレートコード（定型的なコード）を自動生成してくれるライブラリです。

### @Data

**自動生成されるもの：**
- すべてのフィールドのgetter
- すべてのfinalでないフィールドのsetter
- `toString()`
- `equals()`
- `hashCode()`

**使用例：**
```java
@Data
public class UserResponse {
    private Long id;
    private String name;
}
```

**自動生成されるコード：**
```java
public Long getId() {
    return id;
}

public void setId(Long id) {
    this.id = id;
}

public String getName() {
    return name;
}

public void setName(String name) {
    this.name = name;
}

@Override
public String toString() {
    return "UserResponse(id=" + id + ", name=" + name + ")";
}

// equals(), hashCode() も生成される
```

---

### @NoArgsConstructor

**自動生成されるもの：**
```java
public ClassName() {
    // 引数なしコンストラクタ
}
```

**なぜ必要？**
- Spring BootがJSONをJavaオブジェクトに変換するときに使う
- デフォルトコンストラクタがないとエラーになる

**使用例：**
```java
@NoArgsConstructor
public class RegisterRequest {
    private String name;
    private String email;
}
```

**自動生成されるコード：**
```java
public RegisterRequest() {
}
```

---

### @AllArgsConstructor

**自動生成されるもの：**
```java
public ClassName(Type1 field1, Type2 field2, ...) {
    this.field1 = field1;
    this.field2 = field2;
    ...
}
```

**使用例：**
```java
@AllArgsConstructor
public class RegisterRequest {
    private String name;
    private String email;
}
```

**自動生成されるコード：**
```java
public RegisterRequest(String name, String email) {
    this.name = name;
    this.email = email;
}
```

**使い道：**
- テストコードで便利
- `new RegisterRequest("山田太郎", "test@example.com")`

---

### @Builder

**自動生成されるもの：**
Builderパターンを使ってオブジェクトを作成できるようになります。

**使用例：**
```java
@Builder
public class AuthResponse {
    private Long userId;
    private String email;
    private String name;
    private String role;
    private String message;
}
```

**使い方：**
```java
AuthResponse response = AuthResponse.builder()
    .userId(1L)
    .email("test@example.com")
    .name("山田太郎")
    .role("USER")
    .message("登録に成功しました")
    .build();
```

**メリット：**
- 可読性が高い（どの値がどのフィールドか明確）
- 順序を気にしなくていい
- 必要なフィールドだけ設定できる

**@Builderなしの場合：**
```java
// コンストラクタを使う場合
AuthResponse response = new AuthResponse(
    1L,
    "test@example.com",
    "山田太郎",
    "USER",
    "登録に成功しました"
);
// ↑ 順序を間違えやすい、何の値か分かりにくい
```

---

## バリデーションアノテーション解説

### @NotBlank

**対象型：** String型のみ

**チェック内容：**
- `null` → NG
- `""` → NG（空文字）
- `"   "` → NG（空白のみ）
- `"山田"` → OK

**使用例：**
```java
@NotBlank(message = "名前は必須です")
private String name;
```

**使う場面：**
- 必須の文字列フィールド

---

### @NotNull

**対象型：** すべての型

**チェック内容：**
- `null` → NG
- その他 → OK

**使用例：**
```java
@NotNull(message = "所要時間は必須です")
private Integer durationMinutes;
```

**使う場面：**
- 数値型（Integer、Longなど）の必須チェック
- 日時型（LocalDateTimeなど）の必須チェック

---

### @Email

**対象型：** String型

**チェック内容：**
- `"test@example.com"` → OK
- `"invalid-email"` → NG
- `"test@"` → NG
- `"@example.com"` → NG

**使用例：**
```java
@Email(message = "メールアドレスの形式が正しくありません")
private String email;
```

---

### @Size

**対象型：** String、Collection、配列

**チェック内容：**
- 最小文字数、最大文字数をチェック

**使用例：**
```java
@Size(min = 8, message = "パスワードは8文字以上である必要があります")
private String password;

@Size(max = 255, message = "説明は255文字以内である必要があります")
private String description;

@Size(min = 1, max = 10, message = "タグは1個以上10個以内である必要があります")
private List<String> tags;
```

---

### @Min

**対象型：** 数値型（Integer、Long、Doubleなど）

**チェック内容：**
- 最小値をチェック

**使用例：**
```java
@Min(value = 1, message = "所要時間は1分以上である必要があります")
private Integer durationMinutes;

@Min(value = 0, message = "料金は0円以上である必要があります")
private Integer price;
```

---

### @Max（参考）

**対象型：** 数値型

**チェック内容：**
- 最大値をチェック

**使用例：**
```java
@Max(value = 1000, message = "数量は1000以下である必要があります")
private Integer quantity;
```

---

### バリデーションの組み合わせ

複数のアノテーションを組み合わせることができます。

```java
@NotBlank(message = "メールアドレスは必須です")
@Email(message = "メールアドレスの形式が正しくありません")
private String email;
```

**チェック順序：**
1. まず `@NotBlank` で空かどうかチェック
2. 次に `@Email` でメールアドレス形式かチェック

**両方満たす必要がある！**

---

### バリデーションの使い分け

| フィールドの型 | 使うアノテーション | 理由 |
|-------------|-----------------|------|
| `String name` | `@NotBlank` | 空文字・空白もチェックしたい |
| `Integer price` | `@NotNull` | nullチェックだけで十分 |
| `Long id` | `@NotNull` | nullチェックだけで十分 |
| `Boolean active` | `@NotNull` | nullチェックだけで十分 |
| `LocalDateTime startTime` | `@NotNull` | nullチェックだけで十分 |
| `List<String> tags` | `@NotEmpty` | 空のリストも拒否したい |

---

## int vs Integer の使い分け

### int と Integer の違い

| 型 | null許容 | デフォルト値 | 用途 |
|----|---------|------------|------|
| `int` | **不可** | `0` | nullにならないことが保証されている場合 |
| `Integer` | **可能** | `null` | nullを表現する必要がある場合 |

---

### なぜリクエストDTOはIntegerを使うのか？

**int の場合の問題：**
```java
private int price;  // デフォルト値は 0

// リクエストで price が送られてこなかった場合
// price = 0 となり、「0円」なのか「未入力」なのか区別できない！
```

**Integer の場合：**
```java
private Integer price;  // デフォルト値は null

// リクエストで price が送られてこなかった場合
// price = null となり、「未入力」だと明確に分かる
// @NotNull でバリデーションエラーにできる
```

---

### なぜレスポンスDTOでもIntegerを使うのか？

**理由1: Entityとの型統一**
```java
// Entity
@Entity
public class ServiceMenu {
    private Integer durationMinutes;
    private Integer price;
}

// Response DTO
public class ServiceMenuResponse {
    private Integer durationMinutes;  // ← Entityと同じ型
    private Integer price;            // ← Entityと同じ型
}
```

→ EntityからDTOへの変換がシンプル

---

**理由2: null値を表現できる（将来の拡張性）**

```java
// Integer型のレスポンス
{
  "id": 1,
  "name": "カット",
  "durationMinutes": null,  // ← nullを表現できる
  "price": 3000
}

// int型のレスポンス
{
  "id": 1,
  "name": "カット",
  "durationMinutes": 0,  // ← 0が「データなし」なのか「0分」なのか曖昧
  "price": 3000
}
```

---

### まとめ

| 用途 | 推奨型 | 理由 |
|-----|-------|------|
| **リクエストDTO** | `Integer` | null検証が必要 |
| **レスポンスDTO** | `Integer`（推奨）または `int` | Entityとの型統一、null表現の柔軟性 |
| **Entity** | `Integer`（推奨） | データベースのNULL許容に対応 |
| **ループカウンタなど** | `int` | nullにならないことが保証されている |

---

## よくある質問

### Q1: リクエストDTOとレスポンスDTOを1つのクラスにまとめられませんか？

**A:** まとめることは可能ですが、推奨しません。

**理由：**
1. リクエストにはバリデーションが必要だが、レスポンスには不要
2. リクエストとレスポンスでフィールドが異なることが多い
3. 責任の分離（Single Responsibility Principle）

**例：**
```java
// リクエストには id がない
public class ServiceMenuRequest {
    private String name;
    private Integer durationMinutes;
    private Integer price;
}

// レスポンスには id がある
public class ServiceMenuResponse {
    private Long id;  // ← レスポンスだけにある
    private String name;
    private Integer durationMinutes;
    private Integer price;
}
```

---

### Q2: @Dataだけでいいのに、@NoArgsConstructorと@AllArgsConstructorも必要ですか？

**A:** 必要です。

**理由：**
- `@Data` はデフォルトコンストラクタを生成しません
- Spring Bootが JSON → Javaオブジェクトに変換するときにデフォルトコンストラクタが必要
- `@AllArgsConstructor` はテストコードで便利

**補足：**
`@Data` と `@AllArgsConstructor` を同時に使う場合、`@NoArgsConstructor` を明示的に書かないとデフォルトコンストラクタが生成されません。

---

### Q3: @Builderはいつ使うべきですか？

**A:** レスポンスDTOで使うと便利です。

**使う場面：**
- レスポンスDTO（AuthResponse、UserResponse、ServiceMenuResponseなど）
- フィールド数が多いクラス
- オプショナルなフィールドが多いクラス

**使わない場面：**
- リクエストDTO（@Builderなしでも問題ない）
- フィールド数が少ないクラス

---

### Q4: バリデーションのmessage属性は必須ですか？

**A:** 必須ではありませんが、設定することを強く推奨します。

**理由：**
- message属性がない場合、デフォルトの英語メッセージが返される
- ユーザーにわかりやすい日本語メッセージを返せる

**例：**
```java
// message属性なし
@NotBlank
private String name;
// → デフォルトメッセージ: "must not be blank"

// message属性あり
@NotBlank(message = "名前は必須です")
private String name;
// → カスタムメッセージ: "名前は必須です"
```

---

### Q5: LocalDateTimeの代わりにStringを使ってもいいですか？

**A:** 使えますが、推奨しません。

**理由：**
1. 型安全性が失われる
2. バリデーションが難しい
3. 日時計算ができない

**LocalDateTimeを使う場合：**
```java
@NotNull(message = "開始時刻は必須です")
private LocalDateTime startTime;

// 日時計算が簡単
startTime.plusHours(1);  // 1時間後
startTime.isBefore(endTime);  // 時刻比較
```

**Stringを使う場合：**
```java
private String startTime;  // "2025-12-23T10:00:00"

// 日時計算が面倒
// 文字列をLocalDateTimeに変換する必要がある
```

---

### Q6: DTOからEntityへ変換するメソッドは必要ですか？

**A:** 必要に応じて作成します。Service層で変換します。

**パターン1: Builderで変換（推奨）**
```java
// Service層
public ServiceMenu createServiceMenu(ServiceMenuRequest request) {
    ServiceMenu entity = ServiceMenu.builder()
        .name(request.getName())
        .description(request.getDescription())
        .durationMinutes(request.getDurationMinutes())
        .price(request.getPrice())
        .build();

    return serviceMenuRepository.save(entity);
}
```

**パターン2: DTOにtoEntity()メソッドを追加**
```java
// DTOクラス内
public ServiceMenu toEntity() {
    return ServiceMenu.builder()
        .name(this.name)
        .description(this.description)
        .durationMinutes(this.durationMinutes)
        .price(this.price)
        .build();
}

// Service層
public ServiceMenu createServiceMenu(ServiceMenuRequest request) {
    ServiceMenu entity = request.toEntity();
    return serviceMenuRepository.save(entity);
}
```

**どちらでもOKですが、パターン1の方がDTOをシンプルに保てます。**

---

### Q7: レスポンスDTOにserviceMenuNameなど、関連エンティティの情報を含めるべきですか？

**A:** 含めることを推奨します（フロントエンドの利便性向上）。

**理由：**
- APIコール回数を削減できる
- フロントエンドの実装が楽になる
- パフォーマンス向上

**例：SlotResponse**
```java
public class SlotResponse {
    private Long id;
    private Long serviceMenuId;
    private String serviceMenuName;  // ← 関連情報を含める
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
}
```

**フロントエンドでの表示：**
```
カット 10:00-11:00  ← 1回のAPIコールで表示可能
```

**serviceMenuNameがない場合：**
1. スロット一覧を取得
2. 各スロットのserviceMenuIdでサービスメニュー情報を取得（N+1問題）

---

## まとめ

### DTO作成のポイント

1. **リクエストとレスポンスは別クラス**
   - 責任の分離
   - バリデーションの有無

2. **Lombokを活用**
   - `@Data` でボイラープレートコード削減
   - `@Builder` でレスポンスDTO作成を簡単に

3. **バリデーションアノテーションを適切に使う**
   - String型 → `@NotBlank`
   - 数値型 → `@NotNull`
   - message属性で日本語メッセージ

4. **Integer型を使う**
   - リクエスト：null検証のため必須
   - レスポンス：一貫性・将来性のため推奨

5. **レスポンスに関連情報を含める**
   - APIコール回数削減
   - フロントエンドの利便性向上

---

これでDTOの実装は完璧です！次はServiceクラスで、これらのDTOを活用したビジネスロジックを実装していきます。
