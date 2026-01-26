# Phase 10: セッションベース認証の完全実装解説

このドキュメントでは、予約システムにおけるセッションベース認証の完全実装について詳しく解説します。

---

## 📋 目次

1. [実装の背景](#実装の背景)
2. [発見された問題](#発見された問題)
3. [実装したコンポーネント](#実装したコンポーネント)
4. [詳細解説](#詳細解説)
5. [重要な概念](#重要な概念)
6. [動作確認](#動作確認)
7. [トラブルシューティング](#トラブルシューティング)
8. [まとめ](#まとめ)

---

## 実装の背景

### 🔴 発見された問題

フロントエンドのログアウトボタンを押すと、以下のエラーが発生していました：

```
Access to XMLHttpRequest at 'http://localhost:8080/login?logout'
(redirected from 'http://localhost:5173/api/auth/logout')
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### 🔍 根本原因の分析

1. **認証機能が「見かけだけ」だった**
   - `AuthService.login()`でパスワード検証は行っていた
   - しかし、Spring SecurityのSecurityContextに認証情報を設定していなかった
   - セッション管理が全く機能していなかった

2. **ログアウト処理がHTML向けだった**
   - Spring SecurityのデフォルトログアウトがHTMLページへリダイレクト
   - REST API（JSON形式）との相性が悪い

3. **セッション管理が無効だった**
   - SecurityContextに認証情報を設定してもセッションに保存されない
   - 次のHTTPリクエストでは「未認証」状態に戻る

---

## 実装したコンポーネント

### ✅ 実装・修正したファイル

| ファイル | 状態 | 役割 |
|---------|------|------|
| **CustomUserDetails.java** | ✅ 既存確認 | UserDetailsとOAuth2Userを実装 |
| **CustomUserDetailsService.java** | ✅ 既存確認 | DBからユーザー情報を取得 |
| **AuthService.java** | 🔧 修正 | SecurityContextをHTTPセッションに保存 |
| **AuthController.java** | 🔧 修正 | @AuthenticationPrincipalで現在のユーザー取得 |
| **SecurityConfig.java** | 🔧 修正 | セッション管理とカスタムログアウトハンドラー |

---

## 詳細解説

### 1️⃣ CustomUserDetails.java

**ファイルパス**: `src/main/java/com/example/reservation/security/CustomUserDetails.java`

#### 役割

Spring Securityは`UserDetails`インターフェースを通してユーザー情報を扱います。このクラスは、データベースの`User`エンティティをSpring Securityが理解できる形式に変換するアダプターです。

#### コード解説

```java
public class CustomUserDetails implements UserDetails, OAuth2User {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    // ユーザーの権限を返す
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );
    }

    // パスワードを返す
    @Override
    public String getPassword() {
        return user.getPassword(); // BCrypt暗号化済み
    }

    // ユーザー名を返す（メールアドレス）
    @Override
    public String getUsername() {
        return user.getEmail();
    }

    // アカウントが有効かどうか
    @Override
    public boolean isEnabled() {
        return user.isEmailVerified(); // メール認証済みの場合のみ有効
    }

    // 元のUserエンティティを取得
    public User getUser() {
        return user;
    }

    // OAuth2User のメソッド実装
    @Override
    public Map<String, Object> getAttributes() {
        return Collections.emptyMap();
    }

    @Override
    public String getName() {
        return user.getName();
    }
}
```

#### 重要なポイント

1. **2つのインターフェースを実装**
   - `UserDetails`: フォームログイン（メール＋パスワード）用
   - `OAuth2User`: OAuth2ログイン（Google）用

2. **権限のプレフィックス**
   ```java
   new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
   ```
   - Spring Securityの権限は`ROLE_`プレフィックスが必要
   - `user.getRole()`が`USER`の場合 → `ROLE_USER`
   - SecurityConfig.javaで`.hasRole("USER")`と書くと、内部的には`ROLE_USER`を持つユーザーかチェックされる

3. **isEnabled()でメール認証チェック**
   ```java
   public boolean isEnabled() {
       return user.isEmailVerified();
   }
   ```
   - `false`を返すと、パスワードが正しくてもログインできない
   - メール認証が完了していないユーザーはログイン不可

4. **getUser()メソッド**
   - Spring SecurityのAPIにない独自メソッド
   - AuthController.javaで`userDetails.getUser()`として使用
   - 元のUserエンティティの全情報にアクセス可能

---

### 2️⃣ CustomUserDetailsService.java

**ファイルパス**: `src/main/java/com/example/reservation/security/CustomUserDetailsService.java`

#### 役割

Spring Securityが「このメールアドレスのユーザー情報を教えて」と聞いてきたときに、データベースから検索して返すサービスクラスです。

#### コード解説

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

#### 動作フロー

1. Spring Securityが「test@example.comのユーザー情報をください」と呼ぶ
2. `userRepository.findByEmail(email)`でDBを検索
3. 見つからなければ`UsernameNotFoundException`をスロー → ログイン失敗
4. 見つかれば、`CustomUserDetails`でラップして返す
5. Spring Securityがパスワード照合などを自動で行う

#### 重要なポイント

- **メソッド名は`loadUserByUsername`だが、実際はメールアドレスを受け取る**
  - Spring Securityでは「ユーザー名 = 識別子」という意味で使われる
  - このアプリではメールアドレスがユーザー名の役割を果たす

---

### 3️⃣ AuthService.java

**ファイルパス**: `src/main/java/com/example/reservation/service/AuthService.java`

#### 修正内容

ログイン成功時に、SecurityContextをHTTPセッションに保存する処理を追加しました。

#### コード解説

```java
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    // ★★★追加★★★
    private final SecurityContextRepository securityContextRepository =
        new HttpSessionSecurityContextRepository();

    // login()メソッドのシグネチャ変更
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        // ユーザー検索
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UnauthorizedException(
                "メールアドレスまたはパスワードが正しくありません"
            ));

        // パスワード照合
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException(
                "メールアドレスまたはパスワードが正しくありません"
            );
        }

        // ★★★Spring SecurityのSecurityContextに認証情報を設定★★★
        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
            );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // ★★★SecurityContextをセッションに保存★★★
        securityContextRepository.saveContext(
            SecurityContextHolder.getContext(),
            httpRequest,
            null
        );

        // レスポンスDTO作成
        return AuthResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole().name())
            .message("ログインに成功しました")
            .build();
    }
}
```

#### 重要なポイント

1. **SecurityContextRepository**
   ```java
   private final SecurityContextRepository securityContextRepository =
       new HttpSessionSecurityContextRepository();
   ```
   - SecurityContextとHTTPセッションの橋渡し役
   - `saveContext()`: SecurityContextをセッションに保存
   - `loadContext()`: セッションからSecurityContextを読み込み

2. **HttpServletRequestを引数に追加**
   ```java
   public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest)
   ```
   - HTTPセッションにアクセスするために必要
   - `httpRequest.getSession(true)`でセッションを取得（なければ作成）

3. **UsernamePasswordAuthenticationToken**
   ```java
   UsernamePasswordAuthenticationToken authentication =
       new UsernamePasswordAuthenticationToken(
           userDetails,      // Principal（認証主体）
           null,             // Credentials（パスワード - 既に検証済みなのでnull）
           userDetails.getAuthorities()  // 権限リスト（ROLE_USER等）
       );
   ```
   - Spring Securityの認証トークン
   - 第1引数: `principal` = 認証されたユーザー情報
   - 第2引数: `credentials` = パスワード（認証後は不要なので`null`）
   - 第3引数: `authorities` = 権限リスト

4. **saveContext()の3つの引数**
   ```java
   securityContextRepository.saveContext(
       SecurityContextHolder.getContext(),  // 第1引数: 保存するSecurityContext
       httpRequest,                         // 第2引数: HTTPリクエスト（セッション取得用）
       null                                 // 第3引数: HTTPレスポンス（今回は不要）
   );
   ```

#### なぜこのコードが必要なのか？

**修正前の問題**:
```java
// 修正前（これだけでは不十分）
SecurityContextHolder.getContext().setAuthentication(authentication);
```

このコードが行うこと：
- ✅ **現在のスレッド（HTTPリクエスト処理中）**のメモリに認証情報を保存
- ❌ **HTTPセッション**には保存されない

結果：
- ログインAPIの処理中は認証済み状態
- しかし、**レスポンスを返した瞬間に認証情報が消える**
- 次のHTTPリクエストでは「認証されていない」状態に戻る
- **Set-Cookieヘッダーも発行されない**（セッションが作られていないため）

**修正後（完全な実装）**:
```java
// SecurityContextHolderに保存
SecurityContextHolder.getContext().setAuthentication(authentication);

// HTTPセッションにも保存
securityContextRepository.saveContext(
    SecurityContextHolder.getContext(),
    httpRequest,
    null
);
```

このコードが行うこと：
1. **HTTPリクエストからセッションを取得**（なければ新規作成）
2. **SecurityContextをセッションに保存**
3. **JSESSIONIDクッキーを発行**（Set-Cookieヘッダー）

結果：
- ✅ ログイン成功時に`JSESSIONID`クッキーが発行される
- ✅ 次のHTTPリクエストでもセッションから認証情報が復元される
- ✅ `/api/auth/me`で現在のユーザー情報を取得できる

---

### 4️⃣ AuthController.java

**ファイルパス**: `src/main/java/com/example/reservation/controller/AuthController.java`

#### 修正内容

1. ログインメソッドにHttpServletRequestを追加
2. `/me`エンドポイントを実装（ダミーデータから実際のユーザー情報取得に変更）

#### コード解説

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    // ログインメソッド（HttpServletRequestを追加）
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest  // ★★★追加★★★
    ) {
        AuthResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(response);
    }

    // /me エンドポイント（実装）
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        // ログインしていない場合はnullが返される
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userDetails.getUser();

        AuthResponse response = AuthResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole().name())
            .message("ユーザー情報取得")
            .build();

        return ResponseEntity.ok(response);
    }
}
```

#### 重要なポイント

1. **@AuthenticationPrincipal**
   ```java
   @GetMapping("/me")
   public ResponseEntity<AuthResponse> getCurrentUser(
       @AuthenticationPrincipal CustomUserDetails userDetails
   ) {
   ```
   - Spring Securityから現在のユーザーを取得するアノテーション
   - 自動的にセッションから認証情報を取得
   - `SecurityContext`に保存されている`Authentication`の`principal`を引数に渡す
   - ログインしていない場合は`null`が渡される

2. **ログインチェック**
   ```java
   if (userDetails == null) {
       return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
   }
   ```
   - ログインしていない場合は`401 Unauthorized`を返す
   - フロントエンドがこのエラーを受け取ると、ログインページにリダイレクト可能

3. **Userエンティティの取得**
   ```java
   User user = userDetails.getUser();
   ```
   - `CustomUserDetails.getUser()`で元のUserエンティティを取得
   - これでデータベースの全情報にアクセス可能

---

### 5️⃣ SecurityConfig.java

**ファイルパス**: `src/main/java/com/example/reservation/security/SecurityConfig.java`

#### 修正内容

1. セッション管理を有効化
2. カスタムログアウトハンドラーを実装（JSON返却、リダイレクトなし）

#### コード解説

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;

    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService) {
        this.customOAuth2UserService = customOAuth2UserService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CSRF対策（今回は無効化、本番環境では有効化を検討）
            .csrf(csrf -> csrf.disable())

            // ★★★セッション管理（セッションベース認証を有効化）★★★
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )

            // URLごとのアクセス制御
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api-docs/**").permitAll()
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").permitAll()  // テスト用
                .anyRequest().permitAll()
            )

            // フォームログイン（メール＋パスワード）
            .formLogin(form -> form
                .loginPage("/login")
                .permitAll()
            )

            // OAuth2ログイン（Google）
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
            )

            // ★★★カスタムログアウトハンドラー★★★
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(new LogoutSuccessHandler() {
                    @Override
                    public void onLogoutSuccess(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        org.springframework.security.core.Authentication authentication
                    ) throws IOException {
                        // JSON形式でレスポンスを返す
                        response.setStatus(HttpServletResponse.SC_OK);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");

                        ObjectMapper objectMapper = new ObjectMapper();
                        String jsonResponse = objectMapper.writeValueAsString(
                            java.util.Map.of("message", "ログアウトしました")
                        );

                        response.getWriter().write(jsonResponse);
                        response.getWriter().flush();
                    }
                })
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

#### 重要なポイント

1. **セッション管理の有効化**
   ```java
   .sessionManagement(session -> session
       .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
   )
   ```
   - `IF_REQUIRED`: 必要に応じてセッションを作成
   - これがないとセッションが作成されず、認証状態が維持されない

2. **ログアウトURL**
   ```java
   .logoutUrl("/api/auth/logout")
   ```
   - `POST /api/auth/logout`でログアウト処理が実行される
   - フロントエンドの`authApi.logout()`と一致

3. **LogoutSuccessHandlerのカスタマイズ**
   ```java
   .logoutSuccessHandler(new LogoutSuccessHandler() {
       @Override
       public void onLogoutSuccess(...) throws IOException {
           response.setStatus(HttpServletResponse.SC_OK);
           response.setContentType("application/json");
           response.setCharacterEncoding("UTF-8");

           ObjectMapper objectMapper = new ObjectMapper();
           String jsonResponse = objectMapper.writeValueAsString(
               java.util.Map.of("message", "ログアウトしました")
           );

           response.getWriter().write(jsonResponse);
           response.getWriter().flush();
       }
   })
   ```
   - **デフォルト動作**: `/login?logout`にリダイレクト → CORSエラー
   - **カスタム動作**: JSON返却 → フロントエンドが正しく処理可能

---

## 重要な概念

### 🔑 SecurityContextHolder vs HTTPセッション

#### SecurityContextHolder（ThreadLocal）

- **スレッドごと**に独立したデータを保存
- 1つのHTTPリクエスト = 1つのスレッド
- リクエスト処理が終わると、データはクリアされる
- **揮発性**（消えてしまう）

#### HTTPセッション

- **ユーザーごと**にサーバー側で保存
- JSESSIONIDクッキーで識別
- リクエストをまたいで永続化される
- **永続性**（次のリクエストでも使える）

### 📊 認証フロー比較

#### ❌ 修正前：SecurityContextHolderのみ

```
1. POST /api/auth/login
   ↓
2. AuthService.login()実行
   ↓
3. SecurityContextHolder.getContext().setAuthentication(authentication)
   ↓ ✅ 現在のスレッドのメモリに保存
   ↓
4. レスポンス返却
   ↓ ❌ スレッド終了と同時にSecurityContextがクリアされる
   ↓
5. 次のリクエスト（GET /api/auth/me）
   ↓ ❌ SecurityContextは空 → 認証されていない状態
```

#### ✅ 修正後：SecurityContextをHTTPセッションに保存

```
1. POST /api/auth/login
   ↓
2. AuthService.login()実行
   ↓
3. SecurityContextHolder.getContext().setAuthentication(authentication)
   ↓ ✅ 現在のスレッドのメモリに保存
   ↓
4. securityContextRepository.saveContext(...)
   ↓ ✅ HTTPセッションに保存
   ↓ ✅ Set-Cookie: JSESSIONID=... ヘッダー発行
   ↓
5. レスポンス返却（クッキー付き）
   ↓ ✅ ブラウザがJSESSIONIDクッキーを保存
   ↓
6. 次のリクエスト（GET /api/auth/me）
   ↓ ✅ Cookie: JSESSIONID=... を送信
   ↓ ✅ Spring Securityがセッションから認証情報を復元
   ↓ ✅ @AuthenticationPrincipalで取得可能
```

### 🆚 Spring Securityの「通常の動作」との違い

#### フォームログイン（通常の動作）

```
1. POST /login（フォーム送信）
   ↓
2. UsernamePasswordAuthenticationFilter（Spring Securityのフィルター）
   ↓ ① ユーザー名・パスワードを取得
   ↓ ② AuthenticationManagerで認証
   ↓ ③ 認証成功 → Authentication作成
   ↓ ④ SecurityContextHolderに保存
   ↓ ⑤ **SecurityContextPersistenceFilterが自動的にセッションに保存**
   ↓
3. レスポンス返却（Set-Cookie: JSESSIONID=...）
```

**自動的にやってくれること**:
- SecurityContextPersistenceFilterが各リクエストの最後に自動でセッション保存
- SecurityContextHolderに変更があれば、自動的にHTTPセッションに反映

#### REST API（手動認証 - 今回のケース）

```
1. POST /api/auth/login（JSON）
   ↓
2. AuthController.login()
   ↓ ① AuthService.login()を呼ぶ
   ↓
3. AuthService.login()
   ↓ ② DBからユーザー検索
   ↓ ③ パスワード検証
   ↓ ④ Authentication作成
   ↓ ⑤ SecurityContextHolderに保存
   ↓ ⑥ **手動でsecurityContextRepository.saveContext()を呼ぶ** ← 今回追加
   ↓
4. レスポンス返却（Set-Cookie: JSESSIONID=...）
```

**なぜ手動で呼ぶ必要？**
- SecurityContextPersistenceFilterは「SecurityContextに変更があったか」を検知できない
- REST APIでは、UsernamePasswordAuthenticationFilterを使わず、独自の認証ロジックを実装
- そのため、**明示的にセッション保存を呼ぶ必要がある**

---

## 動作確認

### ✅ テスト結果

| テスト | コマンド | 期待される結果 | 実際の結果 |
|--------|---------|---------------|-----------|
| **ログイン** | `POST /api/auth/login` | `Set-Cookie: JSESSIONID=...` | ✅ 成功 |
| **Cookie保存** | クッキーファイル確認 | JSESSIONIDが保存される | ✅ 成功 |
| **ユーザー情報取得** | `GET /api/auth/me` | 実際のユーザー情報を返す | ✅ 成功 |
| **ログアウト** | `POST /api/auth/logout` | `{"message":"ログアウトしました"}` | ✅ 成功 |
| **ログアウト後認証** | `GET /api/auth/me` | `401 Unauthorized` | ✅ 成功 |

### 🧪 cURLテスト例

```bash
# 1. ログイン（JSESSIONIDクッキーを保存）
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c /tmp/session_cookies.txt \
  -v

# 期待される出力:
# < Set-Cookie: JSESSIONID=64E3D9A29B8CA33970B1F7ABE0E79165; Path=/; HttpOnly
# {"userId":1,"email":"test@example.com","name":"Test User","role":"USER","message":"ログインに成功しました"}

# 2. 認証済みユーザー情報の取得
curl -X GET http://localhost:8080/api/auth/me \
  -b /tmp/session_cookies.txt

# 期待される出力:
# {"userId":1,"email":"test@example.com","name":"Test User","role":"USER","message":"ユーザー情報取得"}

# 3. ログアウト
curl -X POST http://localhost:8080/api/auth/logout \
  -b /tmp/session_cookies.txt

# 期待される出力:
# {"message":"ログアウトしました"}

# 4. ログアウト後の認証確認
curl -X GET http://localhost:8080/api/auth/me \
  -b /tmp/session_cookies.txt \
  -w "\nHTTP Status: %{http_code}\n"

# 期待される出力:
# HTTP Status: 401
```

---

## トラブルシューティング

### 🔴 問題1: Set-Cookieヘッダーが発行されない

**症状**:
- ログイン成功するが、`Set-Cookie`ヘッダーがない
- 次のリクエストで認証が失われる

**原因**:
- `SecurityContextRepository.saveContext()`を呼んでいない
- セッション管理が無効化されている

**解決策**:
1. AuthService.login()で`saveContext()`を呼ぶ
2. SecurityConfig.javaでセッション管理を有効化
   ```java
   .sessionManagement(session -> session
       .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
   )
   ```

### 🔴 問題2: ログアウト時にCORSエラー

**症状**:
```
Access to XMLHttpRequest at 'http://localhost:8080/login?logout'
(redirected from 'http://localhost:5173/api/auth/logout')
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**原因**:
- Spring SecurityのデフォルトログアウトがHTMLページにリダイレクト
- REST APIとの相性が悪い

**解決策**:
- カスタムLogoutSuccessHandlerを実装してJSON返却
   ```java
   .logout(logout -> logout
       .logoutUrl("/api/auth/logout")
       .logoutSuccessHandler(new LogoutSuccessHandler() {
           @Override
           public void onLogoutSuccess(...) throws IOException {
               response.setStatus(HttpServletResponse.SC_OK);
               response.setContentType("application/json");
               response.setCharacterEncoding("UTF-8");

               ObjectMapper objectMapper = new ObjectMapper();
               String jsonResponse = objectMapper.writeValueAsString(
                   java.util.Map.of("message", "ログアウトしました")
               );

               response.getWriter().write(jsonResponse);
               response.getWriter().flush();
           }
       })
       .permitAll()
   )
   ```

### 🔴 問題3: /api/auth/meが常にダミーデータを返す

**症状**:
- ログインしても常に同じテストユーザーが返される
- セッションから実際のユーザー情報を取得できない

**原因**:
- `@AuthenticationPrincipal`を使っていない
- ダミー実装のまま

**解決策**:
- AuthController.getCurrentUser()を修正
   ```java
   @GetMapping("/me")
   public ResponseEntity<AuthResponse> getCurrentUser(
       @AuthenticationPrincipal CustomUserDetails userDetails
   ) {
       if (userDetails == null) {
           return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
       }

       User user = userDetails.getUser();

       AuthResponse response = AuthResponse.builder()
           .userId(user.getId())
           .email(user.getEmail())
           .name(user.getName())
           .role(user.getRole().name())
           .message("ユーザー情報取得")
           .build();

       return ResponseEntity.ok(response);
   }
   ```

### 🔴 問題4: メール未認証ユーザーがログインできない

**症状**:
- パスワードは正しいのにログインできない
- `User account is disabled`エラー

**原因**:
- CustomUserDetails.isEnabled()が`false`を返している
- メール認証が完了していない

**解決策**:
- テスト用にメール認証フラグを有効化
   ```sql
   UPDATE users SET email_verified = true WHERE email = 'test@example.com';
   ```

---

## まとめ

### ✅ 実装完了したもの

| コンポーネント | 役割 |
|--------------|------|
| **CustomUserDetails.java** | UserDetailsとOAuth2Userを実装 |
| **CustomUserDetailsService.java** | DBからユーザー情報を取得 |
| **AuthService.java** | SecurityContextをHTTPセッションに保存 |
| **AuthController.java** | @AuthenticationPrincipalで現在のユーザー取得 |
| **SecurityConfig.java** | セッション管理とカスタムログアウトハンドラー |

### 📚 学んだ重要な概念

1. **SecurityContextHolder vs HTTPセッション**
   - SecurityContextHolder = ThreadLocal（一時的）
   - HTTPセッション = 永続ストレージ

2. **SecurityContextRepository**
   - SecurityContextとHTTPセッションの橋渡し
   - `saveContext()`で明示的にセッション保存

3. **@AuthenticationPrincipal**
   - セッションから現在のユーザーを取得
   - Spring Securityが自動でやってくれる

4. **LogoutSuccessHandler**
   - デフォルトはリダイレクト
   - カスタマイズしてJSON返却に変更

5. **REST APIでは手動でセッション保存が必要**
   - フォームログインは自動
   - REST APIでは`securityContextRepository.saveContext()`を明示的に呼ぶ

### 🎯 次のステップ

- フロントエンド Phase 6: 統合テスト・最終調整
- 全画面の動作確認
- エラーハンドリング確認
- E2Eテスト（オプション）

---

**作成日**: 2026-01-18
**バージョン**: 1.0
**ステータス**: 完了 ✅
