# Spring Security実装ガイド

このドキュメントは、Phase 3（インフラ層）でSpring Securityを実装した際に学んだ概念と実装のポイントをまとめたものです。

---

## 📚 目次

1. [Spring Securityとは](#spring-securityとは)
2. [Phase 3で作成したクラス](#phase-3で作成したクラス)
3. [CustomUserDetails](#customuserdetails)
4. [CustomUserDetailsService](#customuserdetailsservice)
5. [CustomOAuth2UserService](#customoauth2userservice)
6. [SecurityConfig](#securityconfig)
7. [DI（Dependency Injection）](#didependency-injection)
8. [質問と回答](#質問と回答)
9. [実装のポイント](#実装のポイント)
10. [よくある間違い](#よくある間違い)

---

## Spring Securityとは

### 定義

**Spring Security = Spring Frameworkの認証・認可を担当するライブラリ**

### 役割

- **認証（Authentication）**：「あなたは誰ですか？」
  - ログイン処理
  - メール＋パスワード認証
  - OAuth2認証（Google、Facebook など）

- **認可（Authorization）**：「あなたは何ができますか？」
  - アクセス制御
  - 権限チェック（ADMIN、USER など）

---

## Phase 3で作成したクラス

### 全体像

```
Phase 3（インフラ層）
├── CustomUserDetails.java
│   └── UserDetailsとOAuth2Userを実装
│       ├── メール＋パスワード認証で使われる
│       └── Google OAuth2認証で使われる
│
├── CustomUserDetailsService.java
│   └── UserDetailsServiceを実装
│       └── メール＋パスワード認証時にユーザーを検索
│
├── CustomOAuth2UserService.java
│   └── DefaultOAuth2UserServiceを継承
│       └── Google OAuth2認証時にユーザー情報を処理
│
└── SecurityConfig.java
    └── Spring Securityの全体設定
        ├── URLアクセス制御
        ├── 認証方法の設定
        └── パスワードエンコーダーの登録
```

---

## CustomUserDetails

### 役割

**Userエンティティをラップして、Spring Securityが扱える形にする**

### なぜ必要なのか？

Spring Securityは`UserDetails`インターフェースを期待している。しかし、私たちの`User`エンティティは`UserDetails`を実装していない。そこで、`User`をラップする`CustomUserDetails`を作成する。

### 実装のポイント

```java
public class CustomUserDetails implements UserDetails, OAuth2User {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    // UserDetailsのメソッド実装
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );
    }

    @Override
    public String getPassword() {
        return user.getPassword();  // メール＋パスワード認証で使用
    }

    @Override
    public String getUsername() {
        return user.getEmail();  // メールアドレスをユーザー名として使用
    }

    @Override
    public boolean isEnabled() {
        return user.isEmailVerified();  // メール認証済みかチェック
    }

    // OAuth2Userのメソッド実装
    @Override
    public Map<String, Object> getAttributes() {
        return Collections.emptyMap();  // 今回は使わない
    }

    @Override
    public String getName() {
        return user.getName();
    }

    // カスタムメソッド
    public User getUser() {
        return user;  // 元のUserエンティティを取得
    }
}
```

### 重要なポイント

#### ① UserDetailsとOAuth2Userの両方を実装

```java
public class CustomUserDetails implements UserDetails, OAuth2User {
```

**理由：**
- メール＋パスワード認証 → `UserDetails`が必要
- Google OAuth2認証 → `OAuth2User`が必要
- 両方に対応するため、両方を実装

---

#### ② getAuthorities()の実装

```java
@Override
public Collection<? extends GrantedAuthority> getAuthorities() {
    return Collections.singletonList(
        new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
    );
}
```

**ポイント：**
- `user.getRole()`は`UserRole` enum（USER, ADMIN）
- `"ROLE_"`というプレフィックスをつける
- Spring Securityは`"ROLE_"`を期待している

**例：**
- `UserRole.USER` → `"ROLE_USER"`
- `UserRole.ADMIN` → `"ROLE_ADMIN"`

---

#### ③ isEnabled()の実装

```java
@Override
public boolean isEnabled() {
    return user.isEmailVerified();
}
```

**ポイント：**
- メール認証が済んでいるユーザーだけ有効
- `emailVerified = false` → ログインできない

---

#### ④ Collection<? extends GrantedAuthority> の意味

```java
Collection<? extends GrantedAuthority>
```

**意味：**
- `Collection`：複数の要素を持つ入れ物
- `<...>`：ジェネリクス（型を指定）
- `? extends GrantedAuthority`：ワイルドカード（GrantedAuthority またはそのサブクラス）

**つまり：**
「GrantedAuthority型（またはそのサブクラス）を要素として持つCollectionの何らかの実装」

---

## CustomUserDetailsService

### 役割

**メールアドレスからユーザー情報を取得して、CustomUserDetailsを返す**

### いつ使われるか？

**メール＋パスワードでログインするとき**

```
1. ユーザーがログインフォームに入力
   Email: user@example.com
   Password: mypassword123
   ↓
2. Spring Securityが認証を開始
   ↓
3. CustomUserDetailsService.loadUserByUsername("user@example.com") が呼ばれる ← ここ！
   ↓
4. データベースからUserを検索
   ↓
5. CustomUserDetailsにラップして返す
   ↓
6. Spring Securityがパスワード照合
   ↓
7. 認証成功 → ログイン完了
```

### 実装のポイント

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException(
                "ユーザーが見つかりません: " + email
            ));

        return new CustomUserDetails(user);
    }
}
```

### 重要なポイント

#### ① @Serviceアノテーション

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {
```

**役割：**
- Spring BootのDIコンテナに登録
- 他のクラスから自動的に注入できる

---

#### ② コンストラクタインジェクション

```java
private final UserRepository userRepository;

public CustomUserDetailsService(UserRepository userRepository) {
    this.userRepository = userRepository;
}
```

**役割：**
- `UserRepository`を外部から注入（DI）
- `new UserRepository()`と書かない
- 疎結合な設計

---

#### ③ orElseThrow()

```java
User user = userRepository.findByEmail(email)
    .orElseThrow(() -> new UsernameNotFoundException(
        "ユーザーが見つかりません: " + email
    ));
```

**意味：**
- Optionalに値がある → その値を返す
- Optionalが空 → 例外をスロー

**展開すると：**
```java
Optional<User> optionalUser = userRepository.findByEmail(email);
User user;
if (optionalUser.isPresent()) {
    user = optionalUser.get();
} else {
    throw new UsernameNotFoundException("ユーザーが見つかりません: " + email);
}
```

---

## CustomOAuth2UserService

### 役割

**Google OAuth2でログインした際に、Googleから取得したユーザー情報を処理してデータベースに保存する**

### いつ使われるか？

**Google OAuth2でログインするとき**

```
1. ユーザーが「Googleでログイン」をクリック
   ↓
2. Googleの認証画面に遷移
   ↓
3. ユーザーがGoogleアカウントでログイン
   ↓
4. Googleが認証情報を返す
   ↓
5. CustomOAuth2UserService.loadUser(userRequest) が呼ばれる ← ここ！
   ↓
6. Googleからユーザー情報を取得（email, name, sub など）
   ↓
7. データベースにユーザーが存在するか確認
   ├─ 存在する → ユーザー情報を更新
   └─ 存在しない → 新規登録
   ↓
8. CustomUserDetailsにラップして返す
   ↓
9. 認証成功 → ログイン完了
```

### 実装のポイント

```java
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Googleからユーザー情報を取得
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // Googleから取得した情報を抽出
        String googleSub = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // データベースからユーザーを検索（3つのケースを処理）
        User user = userRepository.findByGoogleSub(googleSub)
            .orElseGet(() -> {
                return userRepository.findByEmail(email)
                    .map(existingUser -> {
                        // ケース2: メール＋パスワードで登録済み → GoogleSubを追加
                        existingUser.setGoogleSub(googleSub);
                        return userRepository.save(existingUser);
                    })
                    .orElseGet(() -> {
                        // ケース3: 完全に新規ユーザー → 新規登録
                        User newUser = User.builder()
                            .googleSub(googleSub)
                            .email(email)
                            .name(name)
                            .role(UserRole.USER)
                            .emailVerified(true)  // Googleで認証済み
                            .build();
                        return userRepository.save(newUser);
                    });
            });

        // アクセストークンを保存
        user.setGoogleAccessToken(userRequest.getAccessToken().getTokenValue());
        userRepository.save(user);

        return new CustomUserDetails(user);
    }
}
```

### 重要なポイント

#### ① extends DefaultOAuth2UserService

```java
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
```

**役割：**
- 親クラスの基本機能を継承
- `loadUser()`メソッドをオーバーライドしてカスタマイズ

---

#### ② @Transactional

```java
@Override
@Transactional
public OAuth2User loadUser(OAuth2UserRequest userRequest) {
```

**役割：**
- このメソッド内のデータベース操作をトランザクション管理
- エラーが発生した場合、すべての変更をロールバック（元に戻す）

**例：**
```
1. 新規ユーザーを作成 → users テーブルに INSERT
2. アクセストークンを保存 → users テーブルを UPDATE
3. もし2でエラーが発生
   ↓
   @Transactionalがあれば → 1の INSERT もロールバック ✅
   @Transactionalがなければ → 1の INSERT は残る（中途半端なデータ）❌
```

---

#### ③ super.loadUser(userRequest)

```java
OAuth2User oAuth2User = super.loadUser(userRequest);
```

**意味：**
- 親クラス（DefaultOAuth2UserService）のメソッドを呼び出す
- Googleからユーザー情報を取得する

**取得できる情報：**
```java
{
  "sub": "1234567890",           // GoogleユーザーID
  "email": "user@example.com",   // メールアドレス
  "name": "山田太郎",             // 名前
  "picture": "https://..."       // プロフィール画像URL
}
```

---

#### ④ 3つのケースを処理

```java
// ケース1: GoogleSubで見つかった（Google OAuth2で登録済み）
userRepository.findByGoogleSub(googleSub)  // → そのまま使う

// ケース2: GoogleSubで見つからないが、Emailで見つかった（メール＋パスワードで登録済み）
.orElseGet(() -> {
    return userRepository.findByEmail(email)
        .map(existingUser -> {
            existingUser.setGoogleSub(googleSub);  // GoogleSubを追加
            return userRepository.save(existingUser);
        })

// ケース3: 完全に新規ユーザー
        .orElseGet(() -> {
            User newUser = User.builder()
                .googleSub(googleSub)
                .email(email)
                .name(name)
                .role(UserRole.USER)
                .emailVerified(true)  // Googleで認証済み
                .build();
            return userRepository.save(newUser);
        });
});
```

---

#### ⑤ .map()とは？

**Optionalの中身を変換するメソッド**

```java
Optional<User> optionalUser = userRepository.findByEmail(email);

// mapで中身を変換
optionalUser.map(existingUser -> {
    existingUser.setGoogleSub(googleSub);
    return userRepository.save(existingUser);
});
```

**動作：**
- Optionalに値がある → ラムダ式を実行
- Optionalが空 → 何もしない

---

## SecurityConfig

### 役割

**Spring Securityの全体設定を行う**

これまで作成した3つのクラス（CustomUserDetails、CustomUserDetailsService、CustomOAuth2UserService）を組み合わせて、認証・認可の仕組みを完成させる。

### 実装のポイント

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final CustomOAuth2UserService customOAuth2UserService;

    public SecurityConfig(
        CustomUserDetailsService customUserDetailsService,
        CustomOAuth2UserService customOAuth2UserService
    ) {
        this.customUserDetailsService = customUserDetailsService;
        this.customOAuth2UserService = customOAuth2UserService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )

            .formLogin(form -> form
                .loginPage("/login")
                .permitAll()
            )

            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
            )

            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 重要なポイント

#### ① @Configurationと@EnableWebSecurity

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
```

**@Configuration：**
- このクラスは設定クラス
- Spring Bootが起動時に読み込む
- `@Bean`メソッドを持つことができる

**@EnableWebSecurity：**
- Spring Securityを有効化
- セキュリティフィルターチェーンが動き始める

---

#### ② URLアクセス制御の評価順序

```java
.authorizeHttpRequests(authorize -> authorize
    .requestMatchers("/api/auth/**").permitAll()      // ① 具体的
    .requestMatchers("/api/public/**").permitAll()    // ②
    .requestMatchers("/api/admin/**").hasRole("ADMIN") // ③
    .requestMatchers("/api/**").authenticated()        // ④ 抽象的
    .anyRequest().permitAll()                          // ⑤ 最も抽象的
)
```

**重要：Spring Securityは上から順番に評価する**

```
リクエスト: /api/auth/login
   ↓
① /api/auth/** → マッチ ✅ → permitAll() → 評価終了

リクエスト: /api/reservations
   ↓
① /api/auth/** → マッチせず
② /api/public/** → マッチせず
③ /api/admin/** → マッチせず
④ /api/** → マッチ ✅ → authenticated() → 認証チェック
```

**ポイント：より具体的なパターンを先に書く！**

---

#### ③ hasRole() と権限の関係

```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```

**注意：`"ROLE_"`は付けない**

```java
// SecurityConfigでは
.hasRole("ADMIN")  // ← "ROLE_" は付けない

// CustomUserDetails.getAuthorities() では
return Collections.singletonList(
    new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
);
// → "ROLE_ADMIN" が返る

// Spring Securityが自動的に "ROLE_" を追加してマッチング
```

---

#### ④ permitAll()の意味

```java
.requestMatchers("/api/auth/**").permitAll()
```

**意味：**
- 誰でもアクセス可能
- 未ログインユーザーもアクセスできる

**例：**
- `/api/auth/register` → 誰でもアクセス可能（ユーザー登録）
- `/api/auth/login` → 誰でもアクセス可能（ログイン）

---

#### ⑤ authenticated()の意味

```java
.requestMatchers("/api/**").authenticated()
```

**意味：**
- 認証済みユーザーのみアクセス可能
- 未ログインユーザーがアクセス → 401 Unauthorized

**例：**
- `/api/reservations` → ログイン必要

---

#### ⑥ ログアウトURLのpermitAll()

```java
.logout(logout -> logout
    .logoutUrl("/api/auth/logout")
    .permitAll()  // ← 誰でもアクセス可能
)
```

**なぜpermitAll()？**

- セッションが期限切れの場合でもログアウトできるように
- 未ログインユーザーがアクセスしても害はない
- Spring Securityの推奨設定

---

#### ⑦ PasswordEncoder

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

**役割：**
- パスワードをハッシュ化（暗号化）する

**使い方：**

```java
// ハッシュ化
String rawPassword = "mypassword123";
String hashedPassword = encoder.encode(rawPassword);
// → "$2a$10$abcdefghijklmnopqrstuvwxyz..."

// 照合
boolean matches = encoder.matches("mypassword123", hashedPassword);
// → true
```

**なぜハッシュ化するのか？**
- データベースが漏洩しても、パスワードが分からないようにするため

---

## DI（Dependency Injection）

### 定義

**DI = 依存性の注入（いぞんせいのちゅうにゅう）**

もっと簡単に言うと：**「必要なものを外部から渡してもらう仕組み」**

### DIを使わない場合（悪い例）

```java
public class CustomUserDetailsService implements UserDetailsService {

    private UserRepository userRepository;

    public CustomUserDetailsService() {
        // 自分でUserRepositoryを作る
        this.userRepository = new UserRepositoryImpl();  // ❌
    }
}
```

**問題点：**
- CustomUserDetailsServiceがUserRepositoryの作り方を知っている必要がある
- UserRepositoryを変更できない
- テストしにくい

---

### DIを使う場合（良い例）

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // コンストラクタで受け取る
    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;  // 外部から渡してもらう ✅
    }
}
```

**メリット：**
- CustomUserDetailsServiceは「ユーザーを検索する」ことだけに集中できる
- UserRepositoryを簡単に変更できる
- テストしやすい（モックに差し替えられる）

---

### Spring BootのDIコンテナ

**Spring Boot起動時に自動的に実行される処理：**

```
1. @Repositoryがついたクラスを探す
   → UserRepositoryを見つける
   → インスタンスを作成
   → DIコンテナに登録

2. @Serviceがついたクラスを探す
   → CustomUserDetailsServiceを見つける
   → コンストラクタを見る
   → 「UserRepositoryが必要だな」と認識
   → DIコンテナからUserRepositoryを取得
   → CustomUserDetailsServiceのインスタンスを作成（UserRepositoryを注入）
   → DIコンテナに登録

3. @Configurationがついたクラスを探す
   → SecurityConfigを見つける
   → コンストラクタを見る
   → 「CustomUserDetailsServiceとCustomOAuth2UserServiceが必要だな」と認識
   → DIコンテナから取得
   → SecurityConfigのインスタンスを作成（2つのServiceを注入）
   → DIコンテナに登録
```

---

### DIコンテナとは？

**DIコンテナ = オブジェクトを管理する箱**

```
┌─────────────────────────────────────────┐
│          DIコンテナ                      │
│                                         │
│  ┌────────────────────┐                 │
│  │ UserRepository     │                 │
│  └────────────────────┘                 │
│                                         │
│  ┌────────────────────┐                 │
│  │ CustomUserDetails  │                 │
│  │ Service            │                 │
│  └────────────────────┘                 │
│                                         │
│  ┌────────────────────┐                 │
│  │ SecurityConfig     │                 │
│  └────────────────────┘                 │
│                                         │
└─────────────────────────────────────────┘
```

**DIコンテナの役割：**
1. オブジェクトを作成する
2. オブジェクトの依存関係を解決する（必要なものを注入する）
3. オブジェクトのライフサイクルを管理する（シングルトンなど）

---

## 質問と回答

### Q1. getPassword()はnullでいいんですか？

**質問の背景：**
テンプレートコードでは`getPassword()`が`null`を返していたが、メールアドレス＋パスワードで登録した場合はパスワードを使用するのでは？

**回答：**
その通りです！修正が必要です。

```java
@Override
public String getPassword() {
    return user.getPassword();  // Userエンティティからパスワードを取得
}
```

**理由：**
- メール＋パスワード登録の場合：ハッシュ化されたパスワードが返る
- Google OAuth2登録の場合：`null`が返る（パスワードを使わない）

どちらの場合でも、`return user.getPassword();`で正しく動作します。

---

### Q2. Collection<? extends GrantedAuthority> はどういう意味ですか？

**回答：**

```java
Collection<? extends GrantedAuthority>
```

これを3つのパーツに分けます：

| パーツ | 意味 |
|-------|------|
| `Collection` | 複数の要素を持つ入れ物 |
| `<...>` | ジェネリクス（どんな型を入れるか指定） |
| `? extends GrantedAuthority` | ワイルドカード（GrantedAuthority またはそのサブクラス） |

**つまり：**
「GrantedAuthority型（またはそのサブクラス）を要素として持つCollectionの何らかの実装」

---

### Q3. CustomUserDetailsはいつ処理を通るのか？

**回答：**

#### メール＋パスワードでログイン

```
1. ユーザーがログインフォームに入力
2. Spring Securityが認証を開始
3. CustomUserDetailsService.loadUserByUsername(email) が呼ばれる
4. データベースからUserを取得
5. return new CustomUserDetails(user); ← ここで作られる！
6. Spring Securityがパスワード照合
7. 認証成功 → ログイン完了
```

#### Google OAuth2でログイン

```
1. ユーザーが「Googleでログイン」をクリック
2. Googleの認証画面に遷移
3. ユーザーがGoogleアカウントでログイン
4. Googleが認証情報を返す
5. CustomOAuth2UserService.loadUser(userRequest) が呼ばれる
6. return new CustomUserDetails(user); ← ここで作られる！
7. 認証成功 → ログイン完了
```

---

### Q4. loadUser()はどこで呼び出しているのか？

**回答：**

**Spring Securityが自動的に呼び出します。私たちが直接呼び出すことはありません。**

#### いつ呼び出される？

- **loadUserByUsername()**: メール＋パスワードでログインが発生したとき
- **loadUser()**: Google OAuth2ログインが発生したとき

#### どうやって呼び出される？

```
1. Spring Bootが起動時に@Serviceを検索
2. CustomOAuth2UserServiceをDIコンテナに登録
3. SecurityConfigでcustomOAuth2UserServiceを設定
4. Spring Securityが必要なタイミングでloadUser()を呼び出す
```

---

### Q5. api/auth/** と api/** の順番は問題ないか？

**質問の背景：**
`api/**`をログイン済ユーザーにアクセスさせて、`api/auth/**`を誰でもアクセス可能とした場合、ログインしていないユーザーは`api/**`がログインできないため、`api/auth/**`にログインすることはできないのではないか？

**回答：**

問題ありません！Spring Securityは、URLパターンを**上から順番に評価**します。

```java
// 正しい順番 ✅
.requestMatchers("/api/auth/**").permitAll()      // 具体的なパターンを先に
.requestMatchers("/api/**").authenticated()        // 抽象的なパターンを後に
```

**評価の流れ：**

```
リクエスト: /api/auth/login
   ↓
① /api/auth/** → マッチ ✅ → permitAll() → 評価終了（以降のルールは見ない）

リクエスト: /api/reservations
   ↓
① /api/auth/** → マッチせず
④ /api/** → マッチ ✅ → authenticated() → 認証チェック
```

---

### Q6. ログアウトURLは誰でもアクセス可能で良いのか？

**質問の背景：**
ログイン済ユーザーしかログアウトできないため、そもそも画面表示を制限する必要があるのではないか？

**回答：**

`permitAll()`で問題ありません。

**理由：**
- セッションが期限切れの場合でもログアウトできるように
- 未ログインユーザーがアクセスしても害はない（何も起こらない）
- Spring Securityの推奨設定

**ログアウト画面とログアウトAPIの違い：**

| 対象 | アクセス制御 | 理由 |
|------|------------|------|
| ログアウト画面（GET /logout） | `.authenticated()` | ログインユーザーのみ表示すべき |
| ログアウトAPI（POST /api/auth/logout） | `.permitAll()` | セッション切れでもログアウトできるように |

---

### Q7. DIについて詳しく教えてください

**回答は上記「DI（Dependency Injection）」セクションを参照**

---

## 実装のポイント

### 1. CustomUserDetailsは2つのインターフェースを実装

```java
public class CustomUserDetails implements UserDetails, OAuth2User {
```

- メール＋パスワード認証 → `UserDetails`が必要
- Google OAuth2認証 → `OAuth2User`が必要
- 両方に対応するため、両方を実装

---

### 2. Spring Securityが自動的に呼び出すメソッド

以下のメソッドは、Spring Securityが自動的に呼び出します：

- `CustomUserDetailsService.loadUserByUsername()`
- `CustomOAuth2UserService.loadUser()`
- `CustomUserDetails.getPassword()`
- `CustomUserDetails.getAuthorities()`
- `CustomUserDetails.isEnabled()`

私たちが直接呼び出すことはありません。

---

### 3. URLアクセス制御の順序が重要

```java
// 正しい順番 ✅
.requestMatchers("/api/auth/**").permitAll()      // 具体的
.requestMatchers("/api/**").authenticated()        // 抽象的

// 間違った順番 ❌
.requestMatchers("/api/**").authenticated()        // 抽象的
.requestMatchers("/api/auth/**").permitAll()      // 具体的（到達しない！）
```

**ポイント：より具体的なパターンを先に書く！**

---

### 4. @Serviceアノテーションを忘れない

```java
@Service  // ← これを忘れると、DIコンテナに登録されない
public class CustomUserDetailsService implements UserDetailsService {
```

---

### 5. パスワードはハッシュ化して保存

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

**使い方：**
```java
// ユーザー登録時（後でServiceクラスで実装）
String hashedPassword = passwordEncoder.encode("mypassword123");
user.setPassword(hashedPassword);  // ハッシュ化されたパスワードを保存
```

---

### 6. OAuth2の3つのケースを処理

CustomOAuth2UserServiceでは、以下の3つのケースを処理します：

1. **GoogleSubで見つかった** → そのまま使う
2. **Emailで見つかった** → GoogleSubを追加
3. **完全に新規ユーザー** → 新規登録（emailVerified = true）

---

### 7. トランザクション管理

```java
@Transactional
public OAuth2User loadUser(OAuth2UserRequest userRequest) {
```

データベース操作が複数ある場合は、`@Transactional`をつけて、エラー時にロールバックできるようにする。

---

## よくある間違い

### 1. @Serviceアノテーションを忘れる

```java
// ❌ 間違い
public class CustomUserDetailsService implements UserDetailsService {
```

```java
// ✅ 正しい
@Service
public class CustomUserDetailsService implements UserDetailsService {
```

**エラー：**
Spring BootがこのクラスをDIコンテナに登録しない → 他のクラスから使えない

---

### 2. OAuth2Userを実装し忘れる

```java
// ❌ 間違い（UserDetailsだけ）
public class CustomUserDetails implements UserDetails {
```

```java
// ✅ 正しい（両方実装）
public class CustomUserDetails implements UserDetails, OAuth2User {
```

**エラー：**
`CustomOAuth2UserService.loadUser()`の戻り値の型が合わない

---

### 3. URLアクセス制御の順序が間違っている

```java
// ❌ 間違い（抽象的なパターンを先に書いている）
.requestMatchers("/api/**").authenticated()
.requestMatchers("/api/auth/**").permitAll()  // ← 到達しない
```

```java
// ✅ 正しい（具体的なパターンを先に書く）
.requestMatchers("/api/auth/**").permitAll()
.requestMatchers("/api/**").authenticated()
```

---

### 4. hasRole()に"ROLE_"を付けてしまう

```java
// ❌ 間違い
.requestMatchers("/api/admin/**").hasRole("ROLE_ADMIN")
```

```java
// ✅ 正しい
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```

**理由：**
Spring Securityが自動的に`"ROLE_"`を追加するため、付けると`"ROLE_ROLE_ADMIN"`になってしまう。

---

### 5. User.emailVerifiedの型がBooleanのまま

```java
// ❌ 間違い（Booleanオブジェクト型）
private Boolean emailVerified = false;
```

```java
// ✅ 正しい（booleanプリミティブ型）
private boolean emailVerified = false;
```

**理由：**
- `Boolean`型の場合 → `getEmailVerified()`メソッドが生成される
- `boolean`型の場合 → `isEmailVerified()`メソッドが生成される（推奨）

---

## まとめ

### Phase 3で学んだこと

1. **Spring Securityの仕組み**
   - UserDetails / OAuth2User
   - UserDetailsService / OAuth2UserService
   - SecurityFilterChain

2. **認証の流れ**
   - メール＋パスワード認証
   - Google OAuth2認証
   - Spring Securityが自動的に呼び出す

3. **アクセス制御**
   - requestMatchers()
   - permitAll() / authenticated() / hasRole()
   - 評価順序の重要性

4. **パスワードハッシュ化**
   - BCryptPasswordEncoder
   - ソルトの役割

5. **DI（Dependency Injection）**
   - 依存性の注入
   - DIコンテナ
   - コンストラクタインジェクション

---

### 次のステップ

Phase 3が完了したので、次は **Phase 4（アプリケーション層）** に進みます。

**Phase 4で作成するもの：**
1. DTOクラス（Data Transfer Object）
2. カスタム例外クラス
3. Serviceクラス（ビジネスロジック）

---

このドキュメントは、Phase 3の実装で学んだことを整理したものです。次のフェーズに進む前に、このドキュメントを参照して復習してください。
