# Repository実装ガイド

このドキュメントは、Spring Data JPAのRepositoryインターフェース実装時に学んだ概念と実装のポイントをまとめたものです。

---

## 📚 目次

1. [Repositoryとは](#repositoryとは)
2. [JpaRepositoryの基本](#jparepositoryの基本)
3. [カスタムメソッドの命名規則](#カスタムメソッドの命名規則)
4. [戻り値の使い分け](#戻り値の使い分け)
5. [質問と回答](#質問と回答)
6. [実装のポイント](#実装のポイント)
7. [よくある間違い](#よくある間違い)

---

## Repositoryとは

### 定義

**Repository = データベースへのアクセスを担当するインターフェース**

### 役割

- データベースのCRUD操作（Create, Read, Update, Delete）
- データの検索・取得
- ビジネスロジックは含めない（単純なデータの出し入れのみ）

### 特徴

- **インターフェースだけで実装は不要**
- Spring Data JPAが自動的に実装クラスを生成
- メソッド名から自動的にSQLを生成

---

## JpaRepositoryの基本

### 基本的な宣言

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // 何も書かなくても基本的なCRUD操作が使える
}
```

### ジェネリクス（型パラメータ）の意味

```java
JpaRepository<User, Long>
              ↑     ↑
              │     └─ 主キー（@Id）の型
              └─ 対象のEntityクラス
```

**例：**
```java
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // ← これが主キー（Long型）
}
```

---

### 自動的に使えるメソッド

JpaRepositoryを継承するだけで、以下のメソッドが使えます：

| メソッド | 説明 | 生成されるSQL |
|---------|------|--------------|
| `save(entity)` | 新規登録または更新 | `INSERT` または `UPDATE` |
| `findById(id)` | IDで検索 | `SELECT * FROM ... WHERE id = ?` |
| `findAll()` | 全件取得 | `SELECT * FROM ...` |
| `delete(entity)` | 削除 | `DELETE FROM ... WHERE id = ?` |
| `deleteById(id)` | IDで削除 | `DELETE FROM ... WHERE id = ?` |
| `count()` | 件数取得 | `SELECT COUNT(*) FROM ...` |
| `existsById(id)` | ID存在確認 | `SELECT COUNT(*) > 0 FROM ... WHERE id = ?` |

### save()メソッドの動作

```java
User user = new User();
user.setName("田中太郎");
userRepository.save(user);
// → INSERT（IDがnullの場合）

user.setName("田中次郎");
userRepository.save(user);
// → UPDATE（IDがある場合）
```

**ポイント：**
- IDがnull → `INSERT`
- IDがある → `UPDATE`
- 自動的に判断してくれる

---

## カスタムメソッドの命名規則

### なぜカスタムメソッドが必要か？

JpaRepositoryで提供されていない、特殊な検索条件の場合だけカスタムメソッドを書きます。

```java
// ✅ これは書かなくてもある
findById(1L)

// ❌ これは書かないと使えない
findByEmail(String email)
```

---

### 基本的なキーワード

| キーワード | 意味 | SQL |
|-----------|------|-----|
| `findBy` | 検索 | `SELECT * FROM ... WHERE` |
| `existsBy` | 存在確認 | `SELECT COUNT(*) > 0 FROM ... WHERE` |
| `countBy` | カウント | `SELECT COUNT(*) FROM ... WHERE` |
| `deleteBy` | 削除 | `DELETE FROM ... WHERE` |

### 検索条件のキーワード

| キーワード | 意味 | 例 |
|-----------|------|-----|
| `And` | AND条件 | `findByEmailAndPassword` |
| `Or` | OR条件 | `findByEmailOrGoogleSub` |
| `Between` | 範囲（以上〜以下） | `findByStartTimeBetween` |
| `Before` | より前（未満） | `findByExpiresAtBefore` |
| `After` | より後（超過） | `findByCreatedAtAfter` |
| `LessThan` | より小さい | `findByPriceLessThan` |
| `GreaterThan` | より大きい | `findByPriceGreaterThan` |

### ソートのキーワード

| キーワード | 意味 | 例 |
|-----------|------|-----|
| `OrderBy...Asc` | 昇順（古い順・小さい順） | `findAllByOrderByCreatedAtAsc` |
| `OrderBy...Desc` | 降順（新しい順・大きい順） | `findAllByOrderByCreatedAtDesc` |

---

### 具体例：UserRepository

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // メールアドレスでユーザーを検索
    Optional<User> findByEmail(String email);
    // → SELECT * FROM users WHERE email = ?

    // Google Subでユーザーを検索
    Optional<User> findByGoogleSub(String googleSub);
    // → SELECT * FROM users WHERE google_sub = ?

    // メールアドレスの存在確認
    boolean existsByEmail(String email);
    // → SELECT COUNT(*) > 0 FROM users WHERE email = ?
}
```

---

### 具体例：ServiceMenuRepository

```java
@Repository
public interface ServiceMenuRepository extends JpaRepository<ServiceMenu, Long> {

    // すべてのサービスメニューを取得（作成日時の降順）
    List<ServiceMenu> findAllByOrderByCreatedAtDesc();
    // → SELECT * FROM service_menus ORDER BY created_at DESC
}
```

**ポイント：**
- `findAllBy` = 全件取得（WHERE条件なし）
- `OrderByCreatedAtDesc` = created_atで降順ソート

---

### 具体例：SlotRepository

```java
@Repository
public interface SlotRepository extends JpaRepository<Slot, Long> {

    // 開始時刻の範囲とステータスで予約枠を検索
    List<Slot> findByStartTimeBetweenAndStatus(
        LocalDateTime startTime,
        LocalDateTime endTime,
        SlotStatus status
    );
    // → SELECT * FROM slots
    //    WHERE start_time BETWEEN ? AND ?
    //      AND status = ?

    // サービスメニューIDで予約枠を検索
    List<Slot> findByServiceMenuIdOrderByStartTimeAsc(Long serviceMenuId);
    // → SELECT * FROM slots
    //    WHERE service_menu_id = ?
    //    ORDER BY start_time ASC
}
```

**ポイント：**
- `Between` は「以上〜以下」（両端を含む）
- `ServiceMenuId` = リレーションの`.id`を自動的に参照

---

### 具体例：ReservationRepository

```java
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // ユーザーIDとステータスで予約を検索
    List<Reservation> findByUserIdAndStatus(Long userId, ReservationStatus status);
    // → SELECT * FROM reservations WHERE user_id = ? AND status = ?

    // ユーザーIDで予約を検索（作成日時の降順）
    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);
    // → SELECT * FROM reservations WHERE user_id = ? ORDER BY created_at DESC

    // 予約枠IDとユーザーIDとステータスで予約を検索
    Optional<Reservation> findBySlotIdAndUserIdAndStatus(
        Long slotId,
        Long userId,
        ReservationStatus status
    );
    // → SELECT * FROM reservations
    //    WHERE slot_id = ? AND user_id = ? AND status = ?

    // 予約枠IDとステータスで予約数をカウント
    long countBySlotIdAndStatus(Long slotId, ReservationStatus status);
    // → SELECT COUNT(*) FROM reservations WHERE slot_id = ? AND status = ?
}
```

**ポイント：**
- `And`は複数回使える（3つ以上の条件も可能）
- `countBy...`の戻り値は`long`

---

### 具体例：EmailVerificationTokenRepository

```java
@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    // トークン文字列で検索
    Optional<EmailVerificationToken> findByToken(String token);
    // → SELECT * FROM email_verification_tokens WHERE token = ?

    // ユーザーIDで検索
    Optional<EmailVerificationToken> findByUserId(Long userId);
    // → SELECT * FROM email_verification_tokens WHERE user_id = ?

    // 有効期限切れのトークンを削除（バッチ処理用）
    List<EmailVerificationToken> findByExpiresAtBefore(LocalDateTime dateTime);
    // → SELECT * FROM email_verification_tokens WHERE expires_at < ?
}
```

**ポイント：**
- `Before` = より前（`<`）
- バッチ処理で期限切れトークンを一括削除する際に使用

---

## 戻り値の使い分け

### Optional<T> - 0件または1件

**使うケース：**
- 検索結果が0件または1件の想定
- null安全性を確保したい

**例：**
```java
Optional<User> findByEmail(String email);
```

**使い方：**
```java
Optional<User> userOpt = userRepository.findByEmail("test@example.com");

// パターン1: isPresent()で確認
if (userOpt.isPresent()) {
    User user = userOpt.get();
    // ...
} else {
    // 見つからない場合
}

// パターン2: orElseで デフォルト値
User user = userOpt.orElse(null);

// パターン3: orElseThrowで例外
User user = userOpt.orElseThrow(() -> new RuntimeException("ユーザーが見つかりません"));
```

---

### List<T> - 複数件

**使うケース：**
- 検索結果が複数件の想定
- 全件取得

**例：**
```java
List<Reservation> findByUserIdAndStatus(Long userId, ReservationStatus status);
```

**使い方：**
```java
List<Reservation> reservations = reservationRepository.findByUserIdAndStatus(1L, ReservationStatus.RESERVED);

if (reservations.isEmpty()) {
    System.out.println("予約がありません");
} else {
    for (Reservation r : reservations) {
        System.out.println(r.getId());
    }
}
```

**ポイント：**
- 0件の場合は空のリスト`[]`が返る（`null`ではない）
- `null`チェックは不要

---

### boolean - 存在確認のみ

**使うケース：**
- データの存在確認だけしたい
- データ自体は不要

**例：**
```java
boolean existsByEmail(String email);
```

**使い方：**
```java
if (userRepository.existsByEmail("test@example.com")) {
    throw new RuntimeException("このメールアドレスは既に使用されています");
}
```

**パフォーマンス：**
- `findBy...`より軽い（COUNT文だけ実行）
- データ全体を取得しない

---

### long - カウント

**使うケース：**
- 件数だけ知りたい
- データ自体は不要

**例：**
```java
long countBySlotIdAndStatus(Long slotId, ReservationStatus status);
```

**使い方：**
```java
// 予約枠ID=10の「予約中」の予約数をカウント
long reservedCount = reservationRepository.countBySlotIdAndStatus(10L, ReservationStatus.RESERVED);

// 定員と比較
Slot slot = slotRepository.findById(10L).get();
if (reservedCount >= slot.getCapacity()) {
    // 満席
    slot.setStatus(SlotStatus.FULL);
}
```

---

### 戻り値の使い分けまとめ

| 戻り値 | 使い分け | 例 |
|-------|---------|-----|
| `Optional<T>` | 0件または1件 | `findByEmail` |
| `List<T>` | 複数件 | `findByUserIdAndStatus` |
| `boolean` | 存在確認のみ | `existsByEmail` |
| `long` | 件数のみ | `countBySlotIdAndStatus` |

---

## 質問と回答

### Q1: なぜinterfaceなのに実装を書かないのか？

**A:** Spring Data JPAが自動的に実装クラスを生成するからです。

**仕組み：**
1. アプリケーション起動時にRepositoryインターフェースを検出
2. メソッド名を解析（`findByEmail` → "emailで検索"）
3. SQLを自動生成（`SELECT * FROM users WHERE email = ?`）
4. 実装クラスを動的に作成
5. DIコンテナに登録

**従来のJava開発との比較：**

```java
// ❌ 従来：全部手書き
public class UserRepositoryImpl {
    public User findByEmail(String email) {
        Connection conn = DriverManager.getConnection(...);
        PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
        ps.setString(1, email);
        ResultSet rs = ps.executeQuery();
        // ... 結果をUserオブジェクトに変換
        return user;
    }
}

// ✅ Spring Data JPA：宣言だけ
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
```

---

### Q2: save()やdelete()などのメソッドはどこで使うのか？

**A:** Serviceクラスで使います。

**3層アーキテクチャ：**

```
Controller（プレゼンテーション層）
    ↓ リクエストを受け取る
Service（ビジネスロジック層）← ここで save() や delete() を使う
    ↓ データベース操作を依頼
Repository（データアクセス層）← save() や delete() が定義されている
    ↓ SQL実行
Database
```

**例：**

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    // ユーザー登録処理
    public User registerUser(String email, String password, String name) {
        // 1. 重複チェック（Repositoryのメソッドを使用）
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("このメールアドレスは既に使用されています");
        }

        // 2. ユーザーを作成
        User user = User.builder()
            .email(email)
            .password(passwordEncoder.encode(password))
            .name(name)
            .build();

        // 3. 保存（Repositoryのsave()を使用）
        return userRepository.save(user);
    }
}
```

---

### Q3: Optionalとは何か？なぜ使うのか？

**A:** 値が存在するかもしれないし、しないかもしれない場合に使う、null安全な型です。

**問題：**
```java
// ❌ 危険（NullPointerExceptionのリスク）
User user = userRepository.findByEmail("test@example.com");
String name = user.getName();  // userがnullだとエラー！
```

**解決：**
```java
// ✅ 安全（Optionalを使う）
Optional<User> userOpt = userRepository.findByEmail("test@example.com");

if (userOpt.isPresent()) {
    User user = userOpt.get();
    String name = user.getName();  // 安全
} else {
    // ユーザーが見つからない場合の処理
}
```

---

### Q4: リレーションのIDで検索するメソッド名はどう書くのか？

**A:** `findBy<リレーション名>Id` という形式で書きます。

**例：**

```java
// Slot.java
@ManyToOne
@JoinColumn(name = "service_menu_id")
private ServiceMenu serviceMenu;
```

```java
// SlotRepository.java
List<Slot> findByServiceMenuId(Long serviceMenuId);
//               ↑          ↑
//               │          └─ リレーションのID
//               └─ リレーションのフィールド名
```

**自動生成されるSQL：**
```sql
SELECT * FROM slots WHERE service_menu_id = ?
```

**ポイント：**
- Spring Data JPAが`serviceMenu.id`を自動的に参照してくれる
- `service_menu_id`というカラム名も自動的に認識

---

### Q5: Between の範囲は「以上〜以下」か「より大きい〜より小さい」か？

**A:** 「以上〜以下」（両端を含む）です。

**SQL：**
```sql
WHERE start_time >= ? AND start_time <= ?
```

**例：**
```java
// 2024-12-20 10:00 以上、18:00 以下
List<Slot> slots = slotRepository.findByStartTimeBetweenAndStatus(
    LocalDateTime.of(2024, 12, 20, 10, 0),  // 10:00 ← これも含む
    LocalDateTime.of(2024, 12, 20, 18, 0),  // 18:00 ← これも含む
    SlotStatus.AVAILABLE
);
```

---

## 実装のポイント

### 1. @Repositoryアノテーション

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
}
```

**役割：**
- このインターフェースがRepositoryであることを明示
- Spring BootがDIコンテナに登録
- データベース例外をSpring例外に変換

**省略可能だが、書くべき理由：**
- コードの可読性向上
- 将来的な拡張性
- IDEのサポート向上

---

### 2. インポート文

```java
import com.example.reservation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
```

**分類：**
- `com.example.reservation.entity.*` → 自作のEntityクラス
- `org.springframework.*` → Spring Framework
- `java.util.*` → Java標準ライブラリ

---

### 3. メソッド名の命名規則

**ルール：**
1. キーワード（`findBy`, `countBy`など）で始める
2. フィールド名を続ける（camelCase）
3. 条件を追加（`And`, `Or`, `Between`など）
4. ソート指定（`OrderBy...Asc/Desc`）

**正しい例：**
```java
findByUserIdAndStatusOrderByCreatedAtDesc
```

**間違った例：**
```java
findByUserIDAndStatus  // ❌ userID（Dが大文字）
findByuserIdAndStatus  // ❌ userid（小文字始まり）
findBy_user_id         // ❌ スネークケース
```

---

### 4. パラメータ名は自由

```java
// パラメータ名は自由（メソッド名と一致しなくてもOK）
Optional<User> findByEmail(String email);        // ✅
Optional<User> findByEmail(String mailAddress);  // ✅
Optional<User> findByEmail(String e);            // ✅（推奨はしない）
```

**ただし、可読性のために一致させるのがベストプラクティス**

---

### 5. リレーションの扱い

```java
// Reservation.java
@ManyToOne
@JoinColumn(name = "user_id")
private User user;

// ReservationRepository.java
List<Reservation> findByUserId(Long userId);      // ✅ user.id
List<Reservation> findByUserName(String name);    // ✅ user.name
List<Reservation> findByUserEmail(String email);  // ✅ user.email
```

**ポイント：**
- `User`（リレーション）+ `Id`（フィールド名）
- Spring Data JPAが自動的に`user.id`を参照

---

## よくある間違い

### 1. @Repositoryの書き忘れ

```java
// ❌ アノテーションがない
public interface UserRepository extends JpaRepository<User, Long> {
}

// ✅ アノテーションを追加
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
}
```

**影響：**
- 動作はするが、ベストプラクティスではない
- IDEの警告が出る場合がある

---

### 2. ジェネリクスの型が間違っている

```java
// ❌ 主キーの型が間違っている
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    // User.idはLong型なのに、Integerを指定
}

// ✅ 正しい型
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
}
```

---

### 3. メソッド名の大文字小文字ミス

```java
// ❌ 間違い
Optional<User> findByemail(String email);     // email（小文字始まり）
Optional<User> findByEmail(String email);     // ✅ Email（大文字始まり）

// ❌ 間違い
Optional<User> findByGoogleSUB(String googleSub);  // SUB（全部大文字）
Optional<User> findByGoogleSub(String googleSub);  // ✅ Sub（camelCase）
```

---

### 4. リレーションのメソッド名ミス

```java
// Entity
@ManyToOne
@JoinColumn(name = "service_menu_id")
private ServiceMenu serviceMenu;  // ← フィールド名

// ❌ 間違い
List<Slot> findByServiceMenu(ServiceMenu serviceMenu);  // ServiceMenuオブジェクトで検索

// ✅ 正しい（IDで検索）
List<Slot> findByServiceMenuId(Long serviceMenuId);
```

---

### 5. パラメータの順序ミス

```java
// メソッド名の順序
findByStartTimeBetweenAndStatus(...)

// ❌ パラメータの順序が間違っている
List<Slot> findByStartTimeBetweenAndStatus(
    SlotStatus status,        // ← 順序が逆
    LocalDateTime startTime,
    LocalDateTime endTime
);

// ✅ メソッド名の順序と一致
List<Slot> findByStartTimeBetweenAndStatus(
    LocalDateTime startTime,  // ← Between の開始
    LocalDateTime endTime,    // ← Between の終了
    SlotStatus status         // ← And の条件
);
```

---

## まとめ

### Repositoryの役割

1. **データベースアクセスの抽象化**
   - SQLを直接書かなくてよい
   - メソッド名から自動生成

2. **3層アーキテクチャの一部**
   - Repository: データアクセス
   - Service: ビジネスロジック
   - Controller: HTTPリクエスト処理

3. **Spring Data JPAの恩恵**
   - 定型的なコードを書かなくてよい
   - テストしやすい
   - 保守性が高い

---

### 次のステップ

Repository作成後は、以下のフェーズに進みます：

1. **Phase 3: インフラ層**
   - SecurityConfig
   - CustomUserDetails
   - OAuth2設定

2. **Phase 4: アプリケーション層**
   - DTOクラス
   - **Serviceクラス** ← ここでRepository のメソッドを使う
   - カスタム例外

3. **Phase 5: プレゼンテーション層**
   - Controllerクラス
   - GlobalExceptionHandler

---

このドキュメントを参考に、Repositoryの実装を進めてください！
