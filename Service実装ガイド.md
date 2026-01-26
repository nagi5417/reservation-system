# Service実装ガイド

このドキュメントは、Phase 4で作成したServiceクラスについての詳細な解説です。

---

## 📋 目次

1. [Serviceクラスとは？](#serviceクラスとは)
2. [Serviceクラスの役割](#serviceクラスの役割)
3. [作成したServiceクラス一覧](#作成したserviceクラス一覧)
4. [各Serviceクラスの詳細](#各serviceクラスの詳細)
5. [@Transactionalの使い方](#transactionalの使い方)
6. [Repositoryメソッドの活用](#repositoryメソッドの活用)
7. [ビジネスルールの検証](#ビジネスルールの検証)
8. [Entity→DTO変換パターン](#entitydto変換パターン)
9. [よくある質問](#よくある質問)

---

## Serviceクラスとは？

**Service = ビジネスロジック層**

アプリケーションの中核となる処理を実装する層です。

### アーキテクチャ全体像

```
Controller（プレゼンテーション層）
    ↓ リクエストDTO
Service（ビジネスロジック層）  ← 今回作成！
    ↓ Entity
Repository（データアクセス層）
    ↓ SQL
Database（データベース）
```

---

## Serviceクラスの役割

### 1. ビジネスロジックの実装

```java
// ビジネスルール：予約可能なスロットのみ予約できる
if (slot.getStatus() != SlotStatus.AVAILABLE) {
    throw new InvalidRequestException("このスロットは予約できません");
}
```

### 2. トランザクション管理

```java
@Transactional  // すべて成功 or すべて失敗
public ReservationResponse createReservation(...) {
    // 予約を保存
    // スロットのステータスを更新
}
```

### 3. EntityとDTOの変換

```java
// Entity → DTO
private UserResponse convertToResponse(User user) {
    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .name(user.getName())
        .build();
}
```

### 4. Repositoryの活用

```java
User user = userRepository.findById(id)
    .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません"));
```

### 5. カスタム例外のスロー

```java
if (userRepository.findByEmail(email).isPresent()) {
    throw new DuplicateResourceException("このメールアドレスは既に登録されています");
}
```

---

## 作成したServiceクラス一覧

| No | クラス名 | 役割 | 主な機能 |
|----|---------|------|---------|
| 1 | `AuthService` | 認証・登録 | ユーザー登録、ログイン |
| 2 | `UserService` | ユーザー管理 | ユーザー情報取得 |
| 3 | `ServiceMenuService` | サービスメニュー管理 | CRUD操作 |
| 4 | `SlotService` | スロット管理 | スロット作成、検索、削除 |
| 5 | `ReservationService` | 予約管理 | 予約作成、キャンセル |

---

## 各Serviceクラスの詳細

### 1. AuthService.java

**役割：** ユーザー登録とログイン処理

**主な機能：**
- ユーザー登録（メール＋パスワード）
- ログイン
- メールアドレス重複チェック
- パスワードハッシュ化

**使用するRepository：**
- `UserRepository`
- `PasswordEncoder`

**主なメソッド：**

#### register() - ユーザー登録

```java
@Transactional
public AuthResponse register(RegisterRequest request) {
    // 1. メールアドレスの重複チェック
    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
        throw new DuplicateResourceException("このメールアドレスは既に登録されています");
    }

    // 2. パスワードをハッシュ化
    User user = User.builder()
        .email(request.getEmail())
        .password(passwordEncoder.encode(request.getPassword()))  // ハッシュ化
        .name(request.getName())
        .role(UserRole.USER)
        .emailVerified(false)
        .build();

    // 3. データベースに保存
    User savedUser = userRepository.save(user);

    // 4. レスポンスDTO作成
    return AuthResponse.builder()
        .userId(savedUser.getId())
        .email(savedUser.getEmail())
        .name(savedUser.getName())
        .role(savedUser.getRole().name())
        .message("登録に成功しました")
        .build();
}
```

**ポイント：**
- パスワードを平文で保存せず、ハッシュ化する
- メールアドレスの重複をチェック
- デフォルトでUSER権限を設定

#### login() - ログイン

```java
public AuthResponse login(LoginRequest request) {
    // 1. ユーザー検索
    User user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new UnauthorizedException("メールアドレスまたはパスワードが正しくありません"));

    // 2. パスワード照合
    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new UnauthorizedException("メールアドレスまたはパスワードが正しくありません");
    }

    // 3. レスポンスDTO作成
    return AuthResponse.builder()
        .userId(user.getId())
        .email(user.getEmail())
        .name(user.getName())
        .role(user.getRole().name())
        .message("ログインに成功しました")
        .build();
}
```

**ポイント：**
- セキュリティのため、エラーメッセージを曖昧にする
- `passwordEncoder.matches()` でハッシュ化されたパスワードを照合

---

### 2. UserService.java

**役割：** ユーザー情報の管理

**主な機能：**
- ユーザーIDで検索
- ユーザー情報取得

**使用するRepository：**
- `UserRepository`

**主なメソッド：**

#### getUserById() - ユーザー情報取得

```java
public UserResponse getUserById(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません: ID=" + id));

    return convertToResponse(user);
}
```

#### convertToResponse() - Entity→DTO変換

```java
private UserResponse convertToResponse(User user) {
    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .name(user.getName())
        .role(user.getRole().name())
        .emailVerified(user.isEmailVerified())
        .build();
}
```

**ポイント：**
- `private`メソッドで変換ロジックを共通化
- パスワードやトークンなど、機密情報は含めない

---

### 3. ServiceMenuService.java

**役割：** サービスメニュー管理

**主な機能：**
- サービスメニュー作成
- サービスメニュー一覧取得
- サービスメニュー更新
- サービスメニュー削除

**使用するRepository：**
- `ServiceMenuRepository`

**CRUD操作の完全な実装例**

#### Create - 作成

```java
@Transactional
public ServiceMenuResponse createServiceMenu(ServiceMenuRequest request) {
    ServiceMenu serviceMenu = ServiceMenu.builder()
        .name(request.getName())
        .description(request.getDescription())
        .durationMinutes(request.getDurationMinutes())
        .price(request.getPrice())
        .build();

    ServiceMenu savedServiceMenu = serviceMenuRepository.save(serviceMenu);

    return convertToResponse(savedServiceMenu);
}
```

#### Read - 読み取り

```java
// 全件取得
public List<ServiceMenuResponse> getAllServiceMenus() {
    return serviceMenuRepository.findAll()
        .stream()
        .map(this::convertToResponse)
        .collect(Collectors.toList());
}

// ID検索
public ServiceMenuResponse getServiceMenuById(Long id) {
    ServiceMenu serviceMenu = serviceMenuRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("サービスメニューが見つかりません: ID=" + id));

    return convertToResponse(serviceMenu);
}
```

#### Update - 更新

```java
@Transactional
public ServiceMenuResponse updateServiceMenu(Long id, ServiceMenuRequest request) {
    // 既存のエンティティを取得
    ServiceMenu serviceMenu = serviceMenuRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("サービスメニューが見つかりません: ID=" + id));

    // フィールドを更新
    serviceMenu.setName(request.getName());
    serviceMenu.setDescription(request.getDescription());
    serviceMenu.setDurationMinutes(request.getDurationMinutes());
    serviceMenu.setPrice(request.getPrice());

    // 保存
    ServiceMenu updatedServiceMenu = serviceMenuRepository.save(serviceMenu);

    return convertToResponse(updatedServiceMenu);
}
```

#### Delete - 削除

```java
@Transactional
public void deleteServiceMenu(Long id) {
    ServiceMenu serviceMenu = serviceMenuRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("サービスメニューが見つかりません: ID=" + id));

    serviceMenuRepository.delete(serviceMenu);
}
```

**ポイント：**
- streamとmapでリスト変換
- 更新時はsetterで各フィールドを更新
- 削除前に存在チェック

---

### 4. SlotService.java

**役割：** スロット管理

**主な機能：**
- スロット作成
- 日付範囲でスロット検索
- スロットIDで検索
- スロット削除

**使用するRepository：**
- `SlotRepository`
- `ServiceMenuRepository`

**主なメソッド：**

#### createSlot() - スロット作成

```java
@Transactional
public SlotResponse createSlot(SlotRequest request) {
    // 1. サービスメニューを取得
    ServiceMenu serviceMenu = serviceMenuRepository.findById(request.getServiceMenuId())
        .orElseThrow(() -> new ResourceNotFoundException("サービスメニューが見つかりません"));

    // 2. ビジネスルール検証：開始時刻 < 終了時刻
    if (request.getStartTime().isAfter(request.getEndTime())) {
        throw new InvalidRequestException("開始時刻は終了時刻より前である必要があります");
    }

    // 3. スロット作成（リレーション設定）
    Slot slot = Slot.builder()
        .serviceMenu(serviceMenu)  // EntityをセットServiceMenuEntity
        .startTime(request.getStartTime())
        .endTime(request.getEndTime())
        .status(SlotStatus.AVAILABLE)
        .build();

    Slot savedSlot = slotRepository.save(slot);

    return convertToResponse(savedSlot);
}
```

**ポイント：**
- 複数のRepositoryを使用
- ビジネスルールの検証
- リレーションを持つEntityの作成

#### getSlotsByDateRange() - 日付範囲検索

```java
public List<SlotResponse> getSlotsByDateRange(LocalDateTime startTime, LocalDateTime endTime) {
    return slotRepository.findByStartTimeBetween(startTime, endTime)
        .stream()
        .map(this::convertToResponse)
        .collect(Collectors.toList());
}
```

#### convertToResponse() - リレーションから情報取得

```java
private SlotResponse convertToResponse(Slot slot) {
    return SlotResponse.builder()
        .id(slot.getId())
        .serviceMenuId(slot.getServiceMenu().getId())
        .serviceMenuName(slot.getServiceMenu().getName())  // リレーションから取得
        .startTime(slot.getStartTime())
        .endTime(slot.getEndTime())
        .status(slot.getStatus().name())
        .build();
}
```

**ポイント：**
- `slot.getServiceMenu().getName()` でリレーション先の情報を取得
- JPAが自動的にJOINしてくれる

---

### 5. ReservationService.java

**役割：** 予約管理

**主な機能：**
- 予約作成
- ユーザーの予約一覧取得
- 予約詳細取得
- 予約キャンセル

**使用するRepository：**
- `ReservationRepository`
- `UserRepository`
- `SlotRepository`

**主なメソッド：**

#### createReservation() - 予約作成

```java
@Transactional
public ReservationResponse createReservation(ReservationRequest request, Long userId) {
    // 1. ユーザー取得
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません"));

    // 2. スロット取得
    Slot slot = slotRepository.findById(request.getSlotId())
        .orElseThrow(() -> new ResourceNotFoundException("スロットが見つかりません"));

    // 3. ビジネスルール検証：予約可能なスロットのみ
    if (slot.getStatus() != SlotStatus.AVAILABLE) {
        throw new InvalidRequestException("このスロットは予約できません");
    }

    // 4. 予約作成（2つのEntityを紐づけ）
    Reservation reservation = Reservation.builder()
        .user(user)
        .slot(slot)
        .status(ReservationStatus.CONFIRMED)
        .notes(request.getNotes())
        .build();

    Reservation savedReservation = reservationRepository.save(reservation);

    // 5. スロットのステータスを「予約済み」に変更
    slot.setStatus(SlotStatus.RESERVED);
    slotRepository.save(slot);

    return convertToResponse(savedReservation);
}
```

**ポイント：**
- 3つのRepositoryを使用
- userIdはログイン情報から取得（リクエストに含めない）
- 複数テーブルを更新（@Transactionalで整合性保証）

#### cancelReservation() - 予約キャンセル

```java
@Transactional
public void cancelReservation(Long id, Long userId) {
    Reservation reservation = reservationRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("予約が見つかりません"));

    // 権限チェック：本人確認
    if (!reservation.getUser().getId().equals(userId)) {
        throw new UnauthorizedException("この予約をキャンセルする権限がありません");
    }

    // 予約のステータスをキャンセルに変更（削除しない）
    reservation.setStatus(ReservationStatus.CANCELLED);
    reservationRepository.save(reservation);

    // スロットのステータスを「予約可能」に戻す
    Slot slot = reservation.getSlot();
    slot.setStatus(SlotStatus.AVAILABLE);
    slotRepository.save(slot);
}
```

**ポイント：**
- 本人確認（権限チェック）
- 削除せずステータス変更（履歴保持）
- スロットを予約可能に戻す

---

## @Transactionalの使い方

### @Transactionalとは？

**トランザクション = 一連の処理を「全部成功」or「全部失敗」として扱う仕組み**

### いつ使うか？

**複数のデータベース操作がある場合に必須**

| 操作 | @Transactional必要？ | 理由 |
|------|-------------------|------|
| 単純な読み取り | 不要 | データ更新がないため |
| 単純な保存 | 推奨 | 安全のため |
| 複数テーブルの更新 | **必須** | データ整合性を保つため |

### 例：予約作成

```java
@Transactional
public ReservationResponse createReservation(...) {
    // ステップ1: 予約を保存
    reservationRepository.save(reservation);

    // ステップ2: スロットのステータスを更新
    slotRepository.save(slot);
}
```

**@Transactionalがない場合の問題：**
```
ステップ1成功 → ステップ2失敗
→ 予約は作成されたが、スロットは「予約可能」のまま
→ データ不整合！
```

**@Transactionalがある場合：**
```
ステップ1成功 → ステップ2失敗
→ すべてロールバック（予約も作成されない）
→ データ整合性を保つ！
```

### @Transactionalの配置

```java
@Service
public class ReservationService {

    // ✅ メソッドレベルで指定
    @Transactional
    public ReservationResponse createReservation(...) {
        // 複数のデータベース操作
    }

    // ✅ 読み取り専用の場合は不要（または@Transactional(readOnly = true)）
    public List<ReservationResponse> getReservationsByUserId(...) {
        // 読み取りのみ
    }
}
```

---

## Repositoryメソッドの活用

### JpaRepositoryが提供するメソッド

すべてのRepositoryで自動的に使えるメソッド：

```java
// 保存・更新
T save(T entity)

// ID検索
Optional<T> findById(ID id)

// 全件取得
List<T> findAll()

// 削除
void delete(T entity)
void deleteById(ID id)

// 存在チェック
boolean existsById(ID id)

// 件数取得
long count()
```

### カスタムメソッド

Phase 2で作成したカスタムメソッドを活用：

```java
// UserRepository
Optional<User> findByEmail(String email)

// SlotRepository
List<Slot> findByStartTimeBetween(LocalDateTime start, LocalDateTime end)

// ReservationRepository
List<Reservation> findByUserIdOrderBySlot_StartTimeDesc(Long userId)
```

### 使用例

```java
// Optional の活用
User user = userRepository.findById(id)
    .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません"));

// 存在チェック
if (userRepository.findByEmail(email).isPresent()) {
    throw new DuplicateResourceException("メールアドレスが既に登録されています");
}

// リスト取得 → stream → map → collect
List<SlotResponse> slots = slotRepository.findByStartTimeBetween(start, end)
    .stream()
    .map(this::convertToResponse)
    .collect(Collectors.toList());
```

---

## ビジネスルールの検証

### ビジネスルールとは？

**アプリケーション固有のルール・制約**

データベースの制約では表現できないロジックをService層で検証します。

### 検証パターン

#### 1. 重複チェック

```java
if (userRepository.findByEmail(email).isPresent()) {
    throw new DuplicateResourceException("このメールアドレスは既に登録されています");
}
```

#### 2. 日時の妥当性チェック

```java
if (request.getStartTime().isAfter(request.getEndTime())) {
    throw new InvalidRequestException("開始時刻は終了時刻より前である必要があります");
}
```

#### 3. ステータスチェック

```java
if (slot.getStatus() != SlotStatus.AVAILABLE) {
    throw new InvalidRequestException("このスロットは予約できません");
}
```

#### 4. 権限チェック

```java
if (!reservation.getUser().getId().equals(userId)) {
    throw new UnauthorizedException("この予約をキャンセルする権限がありません");
}
```

### ビジネスルールの配置場所

```
❌ Controller層：NG（プレゼンテーション層なので）
✅ Service層：OK（ビジネスロジック層）
❌ Repository層：NG（データアクセス層なので）
```

---

## Entity→DTO変換パターン

### なぜ変換が必要？

**Entity（データベース）とDTO（API）は別物**

| 層 | 使用するクラス | 目的 |
|----|-------------|------|
| データベース層 | Entity | データベース構造を表現 |
| API層 | DTO | API入出力を表現 |

### 変換パターン1: 単純な変換

```java
private UserResponse convertToResponse(User user) {
    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .name(user.getName())
        .role(user.getRole().name())  // Enum → String
        .emailVerified(user.isEmailVerified())
        .build();
}
```

### 変換パターン2: リレーションから情報取得

```java
private SlotResponse convertToResponse(Slot slot) {
    return SlotResponse.builder()
        .id(slot.getId())
        .serviceMenuId(slot.getServiceMenu().getId())
        .serviceMenuName(slot.getServiceMenu().getName())  // ← リレーション
        .startTime(slot.getStartTime())
        .endTime(slot.getEndTime())
        .status(slot.getStatus().name())
        .build();
}
```

### 変換パターン3: 複数のリレーションから取得

```java
private ReservationResponse convertToResponse(Reservation reservation) {
    return ReservationResponse.builder()
        .id(reservation.getId())
        .userId(reservation.getUser().getId())
        .userName(reservation.getUser().getName())  // ← User から
        .slotId(reservation.getSlot().getId())
        .serviceMenuName(reservation.getSlot().getServiceMenu().getName())  // ← Slot → ServiceMenu
        .startTime(reservation.getSlot().getStartTime())
        .endTime(reservation.getSlot().getEndTime())
        .status(reservation.getStatus().name())
        .notes(reservation.getNotes())
        .build();
}
```

### 変換パターン4: リスト変換

```java
public List<ServiceMenuResponse> getAllServiceMenus() {
    return serviceMenuRepository.findAll()
        .stream()                          // Stream<ServiceMenu>
        .map(this::convertToResponse)      // Stream<ServiceMenuResponse>
        .collect(Collectors.toList());     // List<ServiceMenuResponse>
}
```

---

## よくある質問

### Q1: @Transactionalはすべてのメソッドに必要ですか？

**A:** いいえ、必要ありません。

**必要な場合：**
- 複数のデータベース操作がある
- データ更新がある

**不要な場合：**
- 単純な読み取りのみ

```java
// 不要
public UserResponse getUserById(Long id) {
    return convertToResponse(userRepository.findById(id).orElseThrow(...));
}

// 必要
@Transactional
public ReservationResponse createReservation(...) {
    reservationRepository.save(...);
    slotRepository.save(...);  // 複数の更新
}
```

---

### Q2: convertToResponse() はpublicではなくprivateにする理由は？

**A:** カプセル化のためです。

**理由：**
- 変換ロジックはService内部の実装詳細
- 外部から呼ばれる必要がない
- privateにすることで、内部実装を隠蔽できる

```java
// ✅ 良い
private UserResponse convertToResponse(User user) { ... }

// ❌ 悪い（不必要にpublic）
public UserResponse convertToResponse(User user) { ... }
```

---

### Q3: リクエストDTOにuserIdを含めない理由は？

**A:** セキュリティのためです。

**リクエストに含めると：**
```json
{
  "userId": 999,  // ← 他人のIDを指定できてしまう
  "slotId": 1
}
```

**ログイン情報から取得：**
```java
// Controller層
Long userId = userDetails.getUser().getId();  // ← ログインユーザーのID

// Service層
public ReservationResponse createReservation(ReservationRequest request, Long userId) {
    // userIdはログイン情報から取得したものを使用
}
```

---

### Q4: なぜ削除せずにステータスを変更するのですか？

**A:** 履歴を残すためです。

**削除する場合：**
```java
reservationRepository.delete(reservation);  // データが消える
```

**ステータス変更する場合：**
```java
reservation.setStatus(ReservationStatus.CANCELLED);  // データは残る
```

**メリット：**
- キャンセル履歴を残せる
- 統計データに使える
- 監査（Audit）に使える
- 復元できる

---

### Q5: stream().map().collect() の意味は？

**A:** リストの各要素を変換する処理です。

**処理の流れ：**
```java
List<ServiceMenu> menus = serviceMenuRepository.findAll();
// → [ServiceMenu1, ServiceMenu2, ServiceMenu3]

List<ServiceMenuResponse> responses = menus.stream()
    .map(this::convertToResponse)
    .collect(Collectors.toList());
// → [ServiceMenuResponse1, ServiceMenuResponse2, ServiceMenuResponse3]
```

**展開すると：**
```java
List<ServiceMenuResponse> responses = new ArrayList<>();
for (ServiceMenu menu : menus) {
    responses.add(convertToResponse(menu));
}
return responses;
```

stream を使うと、よりシンプルに書けます。

---

### Q6: Enum.name() と Enum.toString() の違いは？

**A:** `name()` を使うことを推奨します。

```java
ReservationStatus status = ReservationStatus.CONFIRMED;

status.name()      // → "CONFIRMED"（Enumの名前）
status.toString()  // → "CONFIRMED"（通常は同じだが、オーバーライド可能）
```

**理由：**
- `name()` は最終メソッドでオーバーライドできない（安全）
- `toString()` はオーバーライドできる（予期しない挙動の可能性）

---

### Q7: 複数のRepositoryを使う場合の順序は？

**A:** 基本的にどの順序でも問題ありませんが、論理的な順序で書くことを推奨します。

**推奨順序：**
```java
// 1. 関連エンティティの取得
User user = userRepository.findById(userId).orElseThrow(...);
Slot slot = slotRepository.findById(slotId).orElseThrow(...);

// 2. ビジネスルールの検証
if (slot.getStatus() != SlotStatus.AVAILABLE) { ... }

// 3. 新しいエンティティの作成・保存
Reservation reservation = Reservation.builder()...
reservationRepository.save(reservation);

// 4. 関連エンティティの更新
slot.setStatus(SlotStatus.RESERVED);
slotRepository.save(slot);
```

---

## まとめ

### Serviceクラスのポイント

1. **@Serviceアノテーション**で登録
2. **コンストラクタインジェクション**でRepositoryを取得
3. **@Transactional**で複数操作の整合性を保証
4. **ビジネスルール**をService層で検証
5. **カスタム例外**で適切なエラーを返す
6. **Entity→DTO変換**でAPIレスポンスを作成
7. **private メソッド**で共通処理を抽出

### Phase 4で学んだ技術要素

- Serviceクラスの作成
- @Transactionalの使い方
- Repositoryメソッドの活用
- ビジネスルールの検証
- Entity→DTO変換
- streamとmapによるリスト変換
- 複数Repositoryの組み合わせ
- リレーションからの情報取得
- 権限チェック
- ステータス管理

---

これでServiceクラスの実装は完璧です！次はControllerクラスで、これらのServiceを呼び出してAPIを公開していきます。
