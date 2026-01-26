# Entity実装ガイド

このドキュメントでは、Spring BootのEntityクラス実装で学んだ重要な概念をまとめています。

---

## 📋 目次

1. [Entityとは](#entityとは)
2. [主要なアノテーション](#主要なアノテーション)
3. [@GeneratedValue - 主キーの自動生成](#generatedvalue---主キーの自動生成)
4. [Enumの保存方法 - @Enumerated](#enumの保存方法---enumerated)
5. [デフォルト値の設定](#デフォルト値の設定)
6. [リレーション（関連）](#リレーション関連)
7. [楽観的ロック - @Version](#楽観的ロック---version)
8. [監査機能 - @EntityListeners](#監査機能---entitylisteners)
9. [@Column と @JoinColumn の違い](#column-と-joincolumn-の違い)
10. [columnDefinition の使い方](#columndefinition-の使い方)
11. [Lombokアノテーション](#lombokアノテーション)
12. [よくある間違いと注意点](#よくある間違いと注意点)

---

## Entityとは

**Entity（エンティティ）** = データベースのテーブルに対応するJavaクラス

### 例: Userテーブル

**データベース:**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL
);
```

**Javaクラス:**
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;
}
```

### JPAの役割

- Javaのクラスとデータベースのテーブルを自動的にマッピング
- SQLを書かなくてもデータベース操作ができる
- フィールド名を自動的にカラム名に変換（`googleSub` → `google_sub`）

---

## 主要なアノテーション

### クラスレベルのアノテーション

| アノテーション | 意味 | 必須？ |
|--------------|------|--------|
| `@Entity` | このクラスがデータベースのテーブルに対応 | ✅ 必須 |
| `@Table(name = "users")` | テーブル名を指定 | ⚠️ 推奨 |
| `@Getter` | すべてのフィールドにgetterメソッドを生成（Lombok） | ✅ 推奨 |
| `@Setter` | すべてのフィールドにsetterメソッドを生成（Lombok） | ✅ 推奨 |
| `@NoArgsConstructor` | 引数なしコンストラクタを生成（Lombok） | ✅ 必須（JPA要件） |
| `@AllArgsConstructor` | 全フィールドを引数に持つコンストラクタを生成（Lombok） | ⚠️ 推奨 |
| `@Builder` | ビルダーパターンを生成（Lombok） | ✅ 推奨 |
| `@EntityListeners(AuditingEntityListener.class)` | 監査機能を有効化 | ✅ 推奨 |

### フィールドレベルのアノテーション

| アノテーション | 意味 | 用途 |
|--------------|------|------|
| `@Id` | 主キー | 必須 |
| `@GeneratedValue` | 主キーの自動生成 | 推奨 |
| `@Column` | カラムの詳細設定 | 必要に応じて |
| `@Enumerated` | Enum型のフィールド | Enum使用時 |
| `@ManyToOne` | 多対一の関連 | 外部キー |
| `@OneToOne` | 一対一の関連 | 外部キー |
| `@JoinColumn` | 外部キーのカラム名を指定 | リレーション使用時 |
| `@Version` | 楽観的ロック用 | 同時更新制御時 |
| `@CreatedDate` | 作成日時を自動設定 | 監査用 |
| `@LastModifiedDate` | 更新日時を自動設定 | 監査用 |

---

## @GeneratedValue - 主キーの自動生成

### 基本的な使い方

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

### 何をしているのか？

主キー（`id`）の値を**自動的に生成**する。手動で `id` を設定する必要がない。

### @GeneratedValue がない場合

```java
// 手動でIDを設定する必要がある
User user = new User();
user.setId(1L);  // ← 面倒、間違いやすい
user.setEmail("taro@example.com");
userRepository.save(user);
```

### @GeneratedValue がある場合

```java
// IDは自動採番される
User user = User.builder()
    .email("taro@example.com")
    .name("太郎")
    .build();
// id は設定しない（null のまま）

userRepository.save(user);
// データベースが自動的に id を採番してくれる

System.out.println(user.getId());  // 1（自動で設定される）
```

### GenerationType の種類

| 戦略 | 説明 | データベース |
|------|------|-------------|
| `IDENTITY` | データベースのAUTO_INCREMENT機能を使う | PostgreSQL, MySQL |
| `SEQUENCE` | シーケンスを使う | Oracle |
| `TABLE` | 専用のテーブルでIDを管理 | あまり使わない |
| `AUTO` | データベースに応じて自動選択 | デフォルト |

### 推奨: IDENTITY

```java
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

**理由:**
- PostgreSQL/MySQLで一般的
- シンプル
- パフォーマンスが良い

---

## Enumの保存方法 - @Enumerated

### 基本的な使い方

```java
@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20)
private UserRole role = UserRole.USER;
```

### EnumType.STRING vs EnumType.ORDINAL

#### EnumType.STRING（推奨）

```java
@Enumerated(EnumType.STRING)
private UserRole role;
```

**データベースに保存される値:**
```
"USER"
"STAFF"
"ADMIN"
```

**Enum定義:**
```java
public enum UserRole {
    USER,    // → "USER" として保存
    STAFF,   // → "STAFF" として保存
    ADMIN    // → "ADMIN" として保存
}
```

**メリット:**
- 見てすぐに何かわかる
- Enumの順序を変更しても、データの意味が変わらない ✅

---

#### EnumType.ORDINAL（非推奨）

```java
@Enumerated(EnumType.ORDINAL)
private UserRole role;
```

**データベースに保存される値:**
```
0  // USER
1  // STAFF
2  // ADMIN
```

**デメリット:**
- 数字だけでは何を意味するかわからない
- **Enumの順序を変更すると、データの意味が変わってしまう** ❌

---

### ORDINAL の危険性

**最初のEnum定義:**
```java
public enum UserRole {
    USER,    // 0
    STAFF,   // 1
    ADMIN    // 2
}
```

**Enumに新しい値を追加（GUESTを先頭に追加）:**
```java
public enum UserRole {
    GUEST,   // 0  ← 新しく追加
    USER,    // 1  ← 0 から 1 に変わった
    STAFF,   // 2  ← 1 から 2 に変わった
    ADMIN    // 3  ← 2 から 3 に変わった
}
```

**データベースはそのまま:**
```sql
+----+-------------------+------+
| id | email             | role |
+----+-------------------+------+
| 1  | taro@example.com  | 0    | ← これは今 GUEST になる（元は USER）
| 2  | staff@example.com | 1    | ← これは今 USER になる（元は STAFF）
| 3  | admin@example.com | 2    | ← これは今 STAFF になる（元は ADMIN）
+----+-------------------+------+
```

**🚨 大問題！データの意味が完全に変わってしまいました！**

### 結論: 必ず STRING を使う

```java
@Enumerated(EnumType.STRING)  // ← これを使う
@Column(nullable = false, length = 20)
private UserRole role = UserRole.USER;
```

---

## デフォルト値の設定

### 基本的な使い方

```java
@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20)
private UserRole role = UserRole.USER;  // ← デフォルト値
```

### 何をしているのか？

フィールドを設定しなかった場合に、**自動的に使われる値**。

### デフォルト値がない場合

```java
private UserRole role;  // デフォルト値なし
```

```java
User user = User.builder()
    .email("taro@example.com")
    .name("太郎")
    // role を設定しない
    .build();

System.out.println(user.getRole());  // null
// データベースに保存しようとすると、エラー（nullable = false なので）
```

### デフォルト値がある場合

```java
private UserRole role = UserRole.USER;  // デフォルト値あり
```

```java
User user = User.builder()
    .email("taro@example.com")
    .name("太郎")
    // role を設定しない
    .build();

System.out.println(user.getRole());  // USER（自動的に設定される）
```

### いつ使うのか？

| シーン | デフォルト値 | 理由 |
|--------|------------|------|
| 新規ユーザー登録 | `UserRole.USER` | 最初は必ず一般ユーザー |
| 予約枠作成 | `SlotStatus.AVAILABLE` | 最初は必ず予約可能 |
| メール認証フラグ | `false` | 最初は必ず未認証 |

### よくあるデフォルト値のパターン

#### Enum型

```java
private UserRole role = UserRole.USER;
private SlotStatus status = SlotStatus.AVAILABLE;
private ReservationStatus status = ReservationStatus.RESERVED;
```

#### Boolean型

```java
private Boolean emailVerified = false;
private Boolean isActive = true;
```

#### 数値型

```java
private Integer loginAttempts = 0;
```

---

## リレーション（関連）

### リレーションとは？

**リレーション** = テーブル同士の関係

### リレーションの種類

| 種類 | 説明 | 例 |
|------|------|-----|
| **@ManyToOne** | 多対一 | 複数の予約 → 1つの予約枠 |
| **@OneToOne** | 一対一 | 1つのトークン → 1人のユーザー |
| **@OneToMany** | 一対多 | 1つの予約枠 → 複数の予約 |
| **@ManyToMany** | 多対多 | 複数の学生 ←→ 複数の授業 |

---

### @ManyToOne - 多対一

```java
@ManyToOne
@JoinColumn(name = "slot_id", nullable = false)
private Slot slot;
```

**関係:**
```
Slot (1) ←─── (多) Reservation

12/20 10:00のカット枠    予約1: 太郎が予約
                         予約2: 花子が予約
```

**意味:**
- 複数の予約（Reservation）が、1つの予約枠（Slot）を参照する

**データベースの構造:**
```sql
CREATE TABLE reservations (
    id BIGINT PRIMARY KEY,
    slot_id BIGINT NOT NULL,  -- ← 外部キー
    user_id BIGINT NOT NULL,
    FOREIGN KEY (slot_id) REFERENCES slots(id)
);
```

**使用例:**
```java
Reservation reservation = reservationRepository.findById(1L).orElseThrow();

// Slotの情報に直接アクセスできる
System.out.println(reservation.getSlot().getStartTime());
System.out.println(reservation.getSlot().getServiceMenu().getName());
```

---

### @OneToOne - 一対一

```java
@OneToOne
@JoinColumn(name = "user_id", nullable = false, unique = true)
private User user;
```

**関係:**
```
User (1) ←→ (1) EmailVerificationToken

太郎            トークン: a1b2c3d4-e5f6...
```

**意味:**
- 1つのユーザーに対して、1つのトークンしか存在しない

**@ManyToOne との違い:**
- `@ManyToOne`: 複数対1（`unique` なし）
- `@OneToOne`: 1対1（`unique = true` で保証）

---

### @JoinColumn の属性

| 属性 | 意味 | 例 |
|------|------|-----|
| `name` | 外部キーのカラム名 | `name = "user_id"` |
| `nullable` | NULL可否 | `nullable = false` |
| `unique` | 一意制約 | `unique = true`（@OneToOneで使用） |

---

### なぜ Long ではなくエンティティ型を使うのか？

#### パターンA: Long型で保存（非推奨）

```java
@Column(name = "slot_id", nullable = false)
private Long slotId;
```

**問題点:**
```java
Reservation reservation = reservationRepository.findById(1L).orElseThrow();

// Slotの情報を取得したい
Long slotId = reservation.getSlotId();

// 手動でSlotを取得する必要がある
Slot slot = slotRepository.findById(slotId).orElseThrow();
System.out.println(slot.getStartTime());
```

**デメリット:**
- 毎回手動で取得する必要がある
- コードが冗長

---

#### パターンB: エンティティ型で保存（推奨）

```java
@ManyToOne
@JoinColumn(name = "slot_id", nullable = false)
private Slot slot;
```

**メリット:**
```java
Reservation reservation = reservationRepository.findById(1L).orElseThrow();

// 直接アクセスできる
System.out.println(reservation.getSlot().getStartTime());
```

**メリット:**
- シンプル
- JPAが自動的にJOINしてくれる
- コードが読みやすい

---

## 楽観的ロック - @Version

### 基本的な使い方

```java
@Version
private Integer version;
```

### 楽観的ロックとは？

同時に複数の人が同じデータを更新しようとしたときの**競合を防ぐ仕組み**。

### 問題のシナリオ（楽観ロックがない場合）

**状況: 定員2名の予約枠に、同時に3人が予約しようとする**

```
時刻  | ユーザーA         | ユーザーB         | ユーザーC         | データベース
------|------------------|------------------|------------------|-------------
10:00 | 予約画面を開く    | 予約画面を開く    | 予約画面を開く    | 残り2名
      | 「残り2名」表示   | 「残り2名」表示   | 「残り2名」表示   |
10:01 | 予約ボタンクリック | 予約ボタンクリック | 予約ボタンクリック|
10:02 | 予約完了         |                  |                  | 残り1名
10:02 |                  | 予約完了         |                  | 残り0名
10:02 |                  |                  | 予約完了         | 残り-1名 ← 定員オーバー！
```

**問題:**
- 3人とも予約が成功してしまう
- 定員2名なのに、3人が予約できてしまう
- **大問題！**

---

### 楽観的ロックの仕組み

```java
@Version
private Integer version;
```

1. **データ取得時、バージョン番号も一緒に取得**
   ```java
   Slot slot = slotRepository.findById(1L).orElseThrow();
   // slot.version = 0
   ```

2. **更新時、バージョン番号をチェック**
   ```sql
   UPDATE slots
   SET capacity = 1, version = version + 1
   WHERE id = 1 AND version = 0;  -- ← version が 0 の場合のみ更新
   ```

3. **バージョン番号が一致しない場合、エラー**
   ```java
   // バージョン番号が変わっていた場合
   throw new OptimisticLockException("データが他のユーザーによって更新されました");
   ```

---

### 楽観的ロックありのシナリオ

```
時刻  | ユーザーA         | ユーザーB         | ユーザーC         | データベース
------|------------------|------------------|------------------|-------------
10:00 | 予約画面を開く    | 予約画面を開く    | 予約画面を開く    | 残り2名, version=0
      | slot取得(v=0)    | slot取得(v=0)    | slot取得(v=0)    |
10:01 | 予約ボタンクリック | 予約ボタンクリック | 予約ボタンクリック|
10:02 | UPDATE version=0 |                  |                  |
      | 成功！           |                  |                  | 残り1名, version=1
10:02 |                  | UPDATE version=0 |                  |
      |                  | エラー！(v=1)    |                  | 残り1名, version=1
10:02 |                  |                  | UPDATE version=0 |
      |                  |                  | エラー！(v=1)    | 残り1名, version=1
```

**結果:**
- ユーザーAだけ成功
- ユーザーB、Cはエラー
- 定員オーバーを防げる ✅

---

### いつ使うのか？

| シーン | 使う？ | 理由 |
|--------|-------|------|
| Slot（予約枠） | ✅ 使う | 同時予約による定員オーバーを防ぐ |
| User | ❌ 不要 | 同時更新の競合は少ない |
| ServiceMenu | ❌ 不要 | スタッフしか編集しない |
| Reservation | ❌ 不要 | 予約は作成後、キャンセル以外の更新がない |

---

## 監査機能 - @EntityListeners

### 基本的な使い方

```java
@EntityListeners(AuditingEntityListener.class)
public class User {

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
```

### 何をしているのか？

`@CreatedDate` と `@LastModifiedDate` が**自動的に動作する**ようにする。

### @EntityListeners がない場合

```java
User user = User.builder()
    .email("taro@example.com")
    .name("太郎")
    .build();

userRepository.save(user);

System.out.println(user.getCreatedAt());  // null
System.out.println(user.getUpdatedAt());  // null
```

### @EntityListeners がある場合

```java
User user = User.builder()
    .email("taro@example.com")
    .name("太郎")
    .build();

userRepository.save(user);

System.out.println(user.getCreatedAt());  // 2025-12-16T15:30:00
System.out.println(user.getUpdatedAt());  // 2025-12-16T15:30:00
```

---

### 動作フロー

#### 新規保存時

```java
User user = User.builder()
    .email("taro@example.com")
    .name("太郎")
    .build();

userRepository.save(user);
```

**内部で起きていること:**

1. `@PrePersist` イベントが発火
2. `AuditingEntityListener.beforeSave()` が実行される
3. `@CreatedDate` フィールドに現在日時を設定
4. `@LastModifiedDate` フィールドに現在日時を設定
5. データベースに保存

---

#### 更新時

```java
User user = userRepository.findById(1L).orElseThrow();
user.setName("太郎2");

userRepository.save(user);
```

**内部で起きていること:**

1. `@PreUpdate` イベントが発火
2. `AuditingEntityListener.beforeUpdate()` が実行される
3. `@LastModifiedDate` フィールドのみ現在日時を設定
4. `@CreatedDate` は変更されない
5. データベースを更新

---

### 設定が必要

`@EntityListeners` を使うには、**メインクラスに `@EnableJpaAuditing` を追加**する必要があります。

```java
@SpringBootApplication
@EnableJpaAuditing  // ← これを追加
public class ReservationApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReservationApplication.class, args);
    }
}
```

これがないと、`@EntityListeners` があっても動作しません。

---

### なぜ使うのか？

#### メリット1: コードが簡潔になる

**手動設定の場合:**
```java
User user = User.builder()
    .email("taro@example.com")
    .name("太郎")
    .createdAt(LocalDateTime.now())  // ← 毎回書く
    .updatedAt(LocalDateTime.now())  // ← 毎回書く
    .build();
```

**自動設定の場合:**
```java
User user = User.builder()
    .email("taro@example.com")
    .name("太郎")
    // createdAt, updatedAt は自動設定
    .build();
```

#### メリット2: 一貫性が保たれる

手動だと、設定ミスや設定忘れが起きる可能性がある。

#### メリット3: 監査証跡が残る

```java
// いつユーザーが登録されたか？
System.out.println("登録日時: " + user.getCreatedAt());

// いつプロフィールが更新されたか？
System.out.println("最終更新日時: " + user.getUpdatedAt());
```

---

## @Column と @JoinColumn の違い

### @Column - 通常のカラム

```java
@Column(nullable = false, length = 255)
private String email;
```

**用途:**
- 普通のフィールド（文字列、数値、日時など）
- 他のテーブルを参照しない

---

### @JoinColumn - 外部キー

```java
@ManyToOne
@JoinColumn(name = "user_id", nullable = false)
private User user;
```

**用途:**
- 他のエンティティへの参照
- リレーション（`@ManyToOne`, `@OneToOne`）で使う

---

### 比較表

| アノテーション | 使う場面 | フィールドの型 | 例 |
|--------------|---------|--------------|-----|
| `@Column` | 通常のカラム | String, Integer, LocalDateTime など | `private String email;` |
| `@JoinColumn` | 外部キー | 他のエンティティ | `private User user;` |

### 覚え方

- フィールドが**他のエンティティ型**（User, Slot など） → `@JoinColumn`
- フィールドが**基本型**（String, Integer など） → `@Column`

---

## columnDefinition の使い方

### 属性指定 vs 型指定

#### パターン1: 属性で制御（推奨）

```java
@Column(nullable = false, length = 100)
private String name;
```

**どうなる？**
- JPAが属性に基づいてSQL型を決定
- PostgreSQLの場合: `VARCHAR(100) NOT NULL`

**メリット:**
- データベース非依存（PostgreSQL、MySQL、Oracleなど共通）
- 移植性が高い

---

#### パターン2: 型を直接指定

```java
@Column(columnDefinition = "TEXT")
private String description;
```

**どうなる？**
- そのまま `TEXT` 型になる
- JPAの型推測を無視

**メリット:**
- データベース固有の型を使える
- 細かい制御が可能

**デメリット:**
- データベース依存になる（移植性が低い）

---

### 使い分け

| ケース | 推奨する方法 | 理由 |
|--------|------------|------|
| **短い文字列（100文字以内）** | `@Column(length = 100)` | JPA標準で十分 |
| **長い文字列（説明文など）** | `@Column(columnDefinition = "TEXT")` | TEXT型が効率的 |
| **数値** | 何も指定しない | 自動推測で十分 |
| **日時** | 何も指定しない | 自動推測で十分 |
| **DB固有の型（JSON、配列など）** | `@Column(columnDefinition = "JSONB")` | 標準では対応していない |

---

### 具体例

#### 例1: 短い文字列（名前）

```java
@Column(nullable = false, length = 100)
private String name;
// → VARCHAR(100) NOT NULL
```

---

#### 例2: 長い文字列（説明文）

```java
@Column(columnDefinition = "TEXT")
private String description;
// → TEXT 型（無制限、効率的）
```

**なぜ TEXT 型が良いのか？**

| 型 | PostgreSQL の内部処理 |
|----|---------------------|
| `VARCHAR(10000)` | 固定長領域を確保（無駄が多い） |
| `TEXT` | 可変長で効率的に格納 |

---

#### 例3: PostgreSQL固有の型

```java
// JSON型
@Column(columnDefinition = "JSONB")
private String metadata;

// 配列型
@Column(columnDefinition = "TEXT[]")
private String tags;

// 高精度な小数
@Column(columnDefinition = "DECIMAL(10, 2)")
private BigDecimal price;
```

---

## Lombokアノテーション

### Lombokとは？

**Lombok** = ボイラープレート（定型的なコード）を自動生成するライブラリ

### 主要なアノテーション

| アノテーション | 生成されるコード | 使う？ |
|--------------|----------------|--------|
| `@Getter` | getter メソッド | ✅ 必須 |
| `@Setter` | setter メソッド | ✅ 必須 |
| `@NoArgsConstructor` | 引数なしコンストラクタ | ✅ 必須（JPA要件） |
| `@AllArgsConstructor` | 全フィールドを引数に持つコンストラクタ | ⚠️ 推奨 |
| `@Builder` | ビルダーパターン | ✅ 推奨 |

---

### @NoArgsConstructor - 引数なしコンストラクタ

```java
@NoArgsConstructor
public class User {
    private Long id;
    private String email;

    // Lombokが自動生成:
    public User() {
        // 何もしない
    }
}
```

**使用例:**
```java
User user = new User();
user.setEmail("taro@example.com");
user.setName("太郎");
```

**いつ使われる？**
- JPAがデータベースから取得するとき（必須）
- 段階的に値を設定したいとき

---

### @AllArgsConstructor - 全フィールドを引数に持つコンストラクタ

```java
@AllArgsConstructor
public class User {
    private Long id;
    private String email;
    private String name;

    // Lombokが自動生成:
    public User(Long id, String email, String name) {
        this.id = id;
        this.email = email;
        this.name = name;
    }
}
```

**使用例:**
```java
User user = new User(1L, "taro@example.com", "太郎");
```

**問題点:**
- 引数が多すぎて読みにくい
- 順番を間違えやすい

---

### @Builder - ビルダーパターン（推奨）

```java
@Builder
@AllArgsConstructor  // @Builder が内部的に使う
public class User {
    private Long id;
    private String email;
    private String name;
}
```

**使用例:**
```java
User user = User.builder()
    .email("taro@example.com")
    .name("太郎")
    .build();
```

**メリット:**
- 可読性が高い
- 必要なフィールドだけ設定できる
- 順番を気にしなくて良い

---

### 推奨する組み合わせ

```java
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor  // JPA必須
@AllArgsConstructor  // @Builder が使う
@Builder  // 可読性向上
@EntityListeners(AuditingEntityListener.class)
public class User {
    // フィールド...
}
```

---

## よくある間違いと注意点

### 1. YAMLのインデントと階層構造の間違い

#### ❌ 間違い

```yaml
spring:
  datasource:
    url: xxx
  logging:  # ✗ logging は spring の子要素ではない
    level:
```

#### ✅ 正しい

```yaml
spring:
  datasource:
    url: xxx

logging:  # ○ トップレベル
  level:
```

---

### 2. Enumerated で ORDINAL を使う

#### ❌ 間違い（危険）

```java
@Enumerated(EnumType.ORDINAL)  // ✗ 絶対に使わない
private UserRole role;
```

#### ✅ 正しい

```java
@Enumerated(EnumType.STRING)  // ○ 必ずSTRINGを使う
private UserRole role;
```

---

### 3. リレーションで @Column を使う

#### ❌ 間違い

```java
@OneToOne
@Column(name = "user_id", nullable = false)  // ✗ @Column は使わない
private User user;
```

#### ✅ 正しい

```java
@OneToOne
@JoinColumn(name = "user_id", nullable = false)  // ○ @JoinColumn を使う
private User user;
```

---

### 4. updatable = true を明示的に書く

#### ⚠️ 不要

```java
@Column(nullable = false, updatable = true)  // updatable=true は不要
private LocalDateTime updatedAt;
```

#### ✅ 正しい

```java
@Column(nullable = false)  // デフォルトで updatable=true
private LocalDateTime updatedAt;
```

**ただし、updatable = false は明示的に書く:**
```java
@Column(nullable = false, updatable = false)  // 更新不可
private LocalDateTime createdAt;
```

---

### 5. @EnableJpaAuditing を忘れる

`@EntityListeners` を使っているのに、`@CreatedDate` と `@LastModifiedDate` が動かない。

#### 原因

メインクラスに `@EnableJpaAuditing` がない。

#### ✅ 解決策

```java
@SpringBootApplication
@EnableJpaAuditing  // ← これを追加
public class ReservationApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReservationApplication.class, args);
    }
}
```

---

### 6. @NoArgsConstructor を忘れる

JPAがエンティティをインスタンス化できず、エラーになる。

#### ❌ 間違い

```java
@Entity
// @NoArgsConstructor がない
public class User {
    // フィールド...
}
```

#### ✅ 正しい

```java
@Entity
@NoArgsConstructor  // JPA必須
public class User {
    // フィールド...
}
```

---

### 7. Integer と int を混同する

#### int（プリミティブ型）

```java
private int capacity;  // null にできない
```

**問題:**
- null を許容しない
- データベースで nullable = true にできない

#### Integer（オブジェクト型）

```java
private Integer capacity;  // null にできる
```

**メリット:**
- null を許容できる
- Entityでは Integer を使うのが一般的

---

## まとめ

### Entity実装のチェックリスト

- [ ] `@Entity` と `@Table` を付ける
- [ ] `@Id` と `@GeneratedValue(strategy = GenerationType.IDENTITY)` を付ける
- [ ] Enum型のフィールドには `@Enumerated(EnumType.STRING)` を使う
- [ ] リレーションには `@JoinColumn` を使う（`@Column` ではない）
- [ ] 楽観ロックが必要な場合は `@Version` を付ける
- [ ] `@CreatedDate` と `@LastModifiedDate` のために `@EntityListeners` を付ける
- [ ] Lombokアノテーション（`@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`）を付ける
- [ ] メインクラスに `@EnableJpaAuditing` を追加する

### 重要なポイント

1. **Enumは必ず `EnumType.STRING` を使う**（`ORDINAL` は危険）
2. **リレーションには `@JoinColumn` を使う**（`@Column` ではない）
3. **JPAには `@NoArgsConstructor` が必須**
4. **`@Builder` を使うとコードが読みやすくなる**
5. **`@EntityListeners` を使うには `@EnableJpaAuditing` が必要**

---

このガイドを参考にして、正しくEntityを実装してください！
