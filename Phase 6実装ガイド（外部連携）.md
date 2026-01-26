# Phase 6実装ガイド（外部連携）

このドキュメントは、Phase 6で実装した外部連携サービス（EmailServiceとGoogleCalendarService）の詳細な解説です。

---

## 📋 目次

1. [Phase 6の概要](#phase-6の概要)
2. [EmailService（メール送信）](#emailserviceメール送信)
3. [GoogleCalendarService（カレンダー連携）](#googlecalendarserviceカレンダー連携)
4. [HTTPトランスポートとJSONパーサー](#httpトランスポートとjsonパーサー)
5. [日時の変換が必要な理由](#日時の変換が必要な理由)
6. [JavaDocの書き方](#javadocの書き方)
7. [よくある質問](#よくある質問)

---

## Phase 6の概要

### 目的

外部サービスとの連携機能を実装し、ユーザー体験を向上させる。

### 作成したクラス

| No | クラス名 | 役割 | 主な機能 |
|----|---------|------|---------|
| 1 | `EmailService` | メール送信 | メール認証用メール送信 |
| 2 | `GoogleCalendarService` | カレンダー連携 | Googleカレンダーへのイベント作成・削除 |

### 使用技術

- **Spring Boot Mail**: メール送信機能
- **JavaMailSender**: メール送信インターフェース
- **Google Calendar API**: Googleカレンダー操作
- **Text Blocks**: HTML本文の記述（Java 15+）

---

## EmailService（メール送信）

### 📌 役割

ユーザー登録時にメールアドレス確認用のメールを送信する。

### 📂 ファイルパス

```
reservation/src/main/java/com/example/reservation/service/EmailService.java
```

### 🔧 主なメソッド

#### sendVerificationEmail()

```java
public void sendVerificationEmail(String email, String token)
```

**役割**: メール認証用のメールを送信

**処理の流れ:**
1. MimeMessageの作成
2. MimeMessageHelperで設定を追加
3. 送信先、件名、送信元を設定
4. HTML本文を生成
5. メール送信
6. ログ出力

---

### 📧 実装の詳細

#### 1. JavaMailSenderのDI

```java
private final JavaMailSender mailSender;

public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
}
```

**JavaMailSenderとは:**
- Spring Bootが提供するメール送信インターフェース
- `spring-boot-starter-mail`を依存関係に追加すると自動設定される
- application.ymlの設定（MailHog）を読み込む

---

#### 2. MimeMessageの作成

```java
MimeMessage message = mailSender.createMimeMessage();
MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
```

**MimeMessageとは:**
- MIME形式のメール（HTML、添付ファイル対応）

**MimeMessageHelperとは:**
- MimeMessageを簡単に操作するヘルパークラス

**引数の意味:**
- `message` = 操作対象のMimeMessage
- `true` = マルチパート対応（HTML、添付ファイル）
- `"UTF-8"` = 文字エンコーディング

---

#### 3. メール設定

```java
helper.setTo(email);
helper.setSubject("【予約システム】メールアドレスの確認");
helper.setFrom("noreply@reservation-system.com");
```

- `setTo()` = 送信先メールアドレス
- `setSubject()` = メールの件名
- `setFrom()` = 送信元メールアドレス

---

#### 4. HTML本文の生成（Text Blocks使用）

```java
private String buildVerificationEmailHtml(String verificationUrl) {
    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                /* CSS */
            </style>
        </head>
        <body>
            <div class="container">
                <h2>予約システムへようこそ！</h2>
                <a href="%s" class="button">メールアドレスを確認する</a>
            </div>
        </body>
        </html>
        """.formatted(verificationUrl, verificationUrl);
}
```

**Text Blocksとは:**
- Java 15以降で使える機能
- 複数行の文字列を簡潔に書ける
- エスケープ不要（`\"`を書かなくて良い）

**従来の書き方:**
```java
String html = "<html>\n" +
              "  <body>\n" +
              "    <h1>こんにちは</h1>\n" +
              "  </body>\n" +
              "</html>";
```

**Text Blocksを使った書き方:**
```java
String html = """
    <html>
      <body>
        <h1>こんにちは</h1>
      </body>
    </html>
    """;
```

---

#### 5. .formatted()メソッド

```java
""".formatted(verificationUrl, verificationUrl);
```

**役割:**
- 文字列内の`%s`を引数の値で置き換える
- `String.format()`の代わり（Java 15以降）

**例:**
```java
String message = "こんにちは、%sさん！".formatted("山田太郎");
// → "こんにちは、山田太郎さん！"
```

---

#### 6. 例外処理

```java
} catch (MessagingException e) {
    log.error("確認メール送信失敗: {}", email, e);
    throw new RuntimeException("メール送信に失敗しました", e);
}
```

**MessagingException:**
- メール送信時に発生する可能性のある例外
- SMTP接続エラー、メールアドレス不正など

**処理:**
1. エラーログを出力
2. RuntimeExceptionでラップして再スロー
3. 呼び出し元でキャッチ可能

---

## GoogleCalendarService（カレンダー連携）

### 📌 役割

Googleログインユーザーの予約をGoogleカレンダーに自動連携する。

### 📂 ファイルパス

```
reservation/src/main/java/com/example/reservation/service/GoogleCalendarService.java
```

### 🔧 主なメソッド

| メソッド | 役割 | 戻り値 |
|---------|------|--------|
| `createEvent()` | カレンダーイベント作成 | イベントID（失敗時null） |
| `deleteEvent()` | カレンダーイベント削除 | なし |
| `buildCalendarService()` | APIクライアント構築 | Calendarサービス |

---

### 📧 createEvent（イベント作成）

#### 処理の流れ

```
1. Googleログインユーザーのチェック
   ↓
2. Calendar APIクライアント構築
   ↓
3. イベントオブジェクト作成
   ↓
4. 開始・終了時刻の設定
   ↓
5. イベント作成API実行
   ↓
6. イベントID返却
```

---

#### 1. Googleログインユーザーのチェック

```java
if (user.getGoogleAccessToken() == null) {
    log.info("Googleログインユーザーではないため、カレンダー連携をスキップ: userId={}", user.getId());
    return null;
}
```

**ポイント:**
- `googleAccessToken`がnull = メール/パスワードログインユーザー
- カレンダー連携をスキップして`null`を返す
- **予約処理自体は成功扱い**

---

#### 2. イベントオブジェクトの作成

```java
Event event = new Event()
        .setSummary("予約：" + reservation.getSlot().getServiceMenu().getName())
        .setDescription("予約ID: " + reservation.getId() + "\n予約システムより");
```

**Eventとは:**
- Google Calendar APIのイベントクラス
- カレンダーに表示されるイベント情報

**設定内容:**
- `setSummary()` = イベントのタイトル（例：「予約：カット」）
- `setDescription()` = イベントの説明（予約IDなど）

---

#### 3. 開始時刻の設定

```java
EventDateTime start = new EventDateTime()
        .setDateTime(new com.google.api.client.util.DateTime(
                Date.from(reservation.getSlot().getStartTime()
                        .atZone(ZoneId.systemDefault()).toInstant())
        ));
event.setStart(start);
```

**日時の変換フロー:**
```
LocalDateTime（データベース）
    ↓ atZone()
ZonedDateTime（タイムゾーン付き）
    ↓ toInstant()
Instant（世界標準時刻）
    ↓ Date.from()
java.util.Date
    ↓ new com.google.api.client.util.DateTime()
Google API形式
```

---

#### 4. イベント作成API実行

```java
Event createdEvent = calendarService.events()
        .insert("primary", event)
        .execute();
```

**処理:**
- `events()` = イベント操作API
- `insert("primary", event)` = プライマリカレンダーにイベント挿入
- `execute()` = API実行

**"primary"とは:**
- ユーザーのメインカレンダー（デフォルトカレンダー）

---

#### 5. 例外処理

```java
} catch (Exception e) {
    log.error("Googleカレンダーイベント作成失敗: userId={}, reservationId={}",
        user.getId(), reservation.getId(), e);
    return null;
}
```

**重要なポイント:**
- 例外をキャッチしてログ出力
- **nullを返す**（例外を再スローしない）
- → カレンダー連携失敗でも**予約処理は成功扱い**

---

### 🗑️ deleteEvent（イベント削除）

#### 処理の流れ

```
1. eventIdの存在チェック
   ↓
2. Googleログインユーザーのチェック
   ↓
3. Calendar APIクライアント構築
   ↓
4. イベント削除API実行
```

---

#### イベント削除API実行

```java
calendarService.events()
        .delete("primary", eventId)
        .execute();
```

**処理:**
- `delete("primary", eventId)` = 指定したイベントを削除
- プライマリカレンダーから削除

---

### 🔧 buildCalendarService（APIクライアント構築）

```java
private Calendar buildCalendarService(String accessToken) throws IOException {
    HttpRequestInitializer requestInitializer = request -> {
        request.getHeaders().setAuthorization("Bearer " + accessToken);
    };

    return new Calendar.Builder(
            new NetHttpTransport(),
            GsonFactory.getDefaultInstance(),
            requestInitializer
    )
            .setApplicationName("Reservation System")
            .build();
}
```

---

#### HttpRequestInitializer

```java
HttpRequestInitializer requestInitializer = request -> {
    request.getHeaders().setAuthorization("Bearer " + accessToken);
};
```

**役割:**
- すべてのHTTPリクエストに対して、認証ヘッダーを自動設定
- `Authorization: Bearer {アクセストークン}`の形式

---

#### Calendar.Builder

```java
return new Calendar.Builder(
        new NetHttpTransport(),              // ① HTTPトランスポート
        GsonFactory.getDefaultInstance(),    // ② JSONパーサー
        requestInitializer                   // ③ リクエスト初期化処理
)
        .setApplicationName("Reservation System")
        .build();
```

---

## HTTPトランスポートとJSONパーサー

### 📡 HTTPトランスポートとは

**例え話：郵便配達員**

HTTPトランスポート = インターネット経由でデータを送受信する「郵便配達員」

```
あなた（Javaアプリ）
    ↓ 手紙を渡す
郵便配達員（HTTPトランスポート）
    ↓ インターネット経由で配達
Googleさん（Google Calendar API）
    ↓ 返事を書く
郵便配達員（HTTPトランスポート）
    ↓ 返事を持ち帰る
あなた（Javaアプリ）
```

**NetHttpTransportの役割:**
1. データの送信: Javaアプリ → Googleサーバー
2. データの受信: Googleサーバー → Javaアプリ
3. 通信プロトコル: HTTP/HTTPS規格に従って通信

---

### 📦 JSONパーサーとは

**例え話：翻訳者**

JSONパーサー = Javaオブジェクト⇔JSON を変換する「翻訳者」

#### Javaオブジェクト → JSON（送信時）

```java
// Javaオブジェクト（人間にはわかりやすい）
Event event = new Event()
    .setSummary("予約：カット")
    .setDescription("予約ID: 123");

// ↓ GsonFactoryが変換

// JSON（Google APIが理解できる形式）
{
  "summary": "予約：カット",
  "description": "予約ID: 123"
}
```

#### JSON → Javaオブジェクト（受信時）

```java
// Googleから返ってきたJSON
{
  "id": "abc123xyz",
  "summary": "予約：カット"
}

// ↓ GsonFactoryが変換

// Javaオブジェクト
Event createdEvent = ...
createdEvent.getId()  // → "abc123xyz"
```

---

### なぜJSONを使うのか？

**JSON = 世界共通語**

- Java、Python、JavaScript、PHPなど、どのプログラミング言語でも理解できる
- インターネット上のデータ交換の標準形式

---

## 日時の変換が必要な理由

### 📅 Javaの日時型の役割

同じ時刻でも、**状況によって表現方法が変わる**：

1. **「2025年12月30日 10時」**（日常会話）
2. **「2025-12-30T10:00:00」**（正式な記録）
3. **「1735538400000」**（コンピュータ内部の数値）

---

### 1. LocalDateTime（日常会話）

```java
LocalDateTime startTime = LocalDateTime.of(2025, 12, 30, 10, 0);
// = 「2025年12月30日 10時0分」
```

**特徴:**
- **タイムゾーンなし**
- 「何時？」という質問に答える
- データベースに保存する形式

**問題点:**
- 東京の10時？ニューヨークの10時？ロンドンの10時？
- タイムゾーンが分からない

---

### 2. ZonedDateTime（場所付きの時刻）

```java
ZonedDateTime zonedTime = startTime.atZone(ZoneId.systemDefault());
// = 「2025年12月30日 10時0分（日本標準時）」
```

**特徴:**
- **タイムゾーン付き**
- 「東京の10時」と明確に分かる

**追加情報:**
- JST（Japan Standard Time）= UTC+9時間
- システムのタイムゾーンを使用

---

### 3. Instant（世界標準時刻）

```java
Instant instant = zonedTime.toInstant();
// = 「2025-12-30T01:00:00Z」（UTC）
```

**特徴:**
- **世界共通の瞬間**を表す
- UTC（協定世界時）基準
- 東京の10時 = UTCの1時

**なぜ必要？**
- 世界中のどこでも同じ瞬間を指せる
- タイムゾーンの違いを気にしなくて良い

---

### 4. java.util.Date（古い形式）

```java
Date date = Date.from(instant);
```

**特徴:**
- Java 8以前の古いクラス
- Google Calendar APIが求める形式（古いライブラリのため）

---

### 5. com.google.api.client.util.DateTime（Google API専用）

```java
com.google.api.client.util.DateTime googleDateTime =
    new com.google.api.client.util.DateTime(date);
```

**特徴:**
- Google Calendar API専用の日時クラス
- Googleが理解できる形式

---

### 🔄 変換の流れ（詳細版）

```
【データベース】
LocalDateTime（タイムゾーンなし）
「2025年12月30日 10時0分」
    ↓ atZone(ZoneId.systemDefault())
【タイムゾーン追加】
ZonedDateTime（タイムゾーン付き）
「2025年12月30日 10時0分（日本標準時）」
    ↓ toInstant()
【世界標準時刻】
Instant（UTC）
「2025-12-30T01:00:00Z」
※ 東京10時 = UTC 1時
    ↓ Date.from()
【古い形式】
java.util.Date
    ↓ new com.google.api.client.util.DateTime()
【Google API形式】
com.google.api.client.util.DateTime
「Googleカレンダーに送信可能な形式」
```

---

### 🌍 具体例：タイムゾーンの重要性

```java
// 東京で「2025年12月30日 10時に会議」を予約
LocalDateTime tokyo = LocalDateTime.of(2025, 12, 30, 10, 0);

// アメリカの人が見ると...
// 「2025年12月29日 17時（ニューヨーク時間）」
// ※ 時差が16時間
```

**だから変換が必要：**
1. `LocalDateTime` → タイムゾーン情報なし（曖昧）
2. `ZonedDateTime` → 「東京の10時」と明確に
3. `Instant` → 世界標準時刻に変換（世界中で同じ瞬間）
4. Google APIに送信 → 世界中どこからでも正しい時刻で表示される

---

## JavaDocの書き方

### 基本構造

```java
/**
 * メソッドの簡潔な説明（1行）
 * <p>
 * 詳細な説明（複数行可）
 * 処理の流れや注意点などを記述
 * </p>
 *
 * @param パラメータ名 パラメータの説明
 * @param パラメータ名2 パラメータ2の説明
 * @return 戻り値の説明
 * @throws 例外クラス 例外が発生する条件
 */
```

---

### よく使うタグ

| タグ | 用途 | 例 |
|------|------|-----|
| `@param` | パラメータの説明 | `@param user ユーザー情報` |
| `@return` | 戻り値の説明 | `@return イベントID` |
| `@throws` | 例外の説明 | `@throws IOException 通信エラー` |
| `<p>` | 段落の区切り | `<p>詳細説明</p>` |
| `<ul><li>` | 箇条書き | `<ul><li>項目1</li></ul>` |
| `{@code }` | コード表記 | `{@code null}` |

---

### クラスレベルのJavaDoc例

```java
/**
 * Googleカレンダー連携サービス。
 * <p>
 * Googleログインユーザーの予約をGoogleカレンダーに自動連携します。
 * 予約作成時にカレンダーイベントを作成し、予約キャンセル時にイベントを削除します。
 * </p>
 * <p>
 * 対象ユーザー：Googleログインユーザーのみ（メール/パスワードログインユーザーは対象外）
 * </p>
 *
 * @author Your Name
 * @since 1.0
 */
@Service
@Slf4j
public class GoogleCalendarService {
```

---

### メソッドレベルのJavaDoc例

```java
/**
 * Googleカレンダーにイベントを作成する。
 * <p>
 * Googleログインユーザーの予約情報を元に、Googleカレンダーにイベントを自動作成します。
 * メール/パスワードログインユーザーの場合は、カレンダー連携をスキップします。
 * </p>
 * <p>
 * エラー時の扱い：カレンダー連携に失敗しても予約処理自体は成功扱いとし、
 * nullを返してログ出力のみ行います。
 * </p>
 *
 * @param user ユーザー情報（Googleアクセストークンを含む）
 * @param reservation 予約情報（予約枠、メニュー情報を含む）
 * @return 作成されたカレンダーイベントID。作成失敗時またはスキップ時はnull
 */
public String createEvent(User user, Reservation reservation) {
```

---

## よくある質問

### Q1: なぜカレンダー連携失敗でも予約処理を成功扱いにするのか？

**A:** ユーザー体験を優先するためです。

**理由:**
- カレンダー連携は**付加価値**であり、予約システムの本質ではない
- Google APIがダウンしていても、予約機能は動作し続けるべき
- ユーザーが予約できないのは避けたい

**エラー時の動作:**
1. 予約はデータベースに正常に保存される
2. カレンダー連携失敗のログを記録
3. ユーザーには予約成功として返す
4. 後からログを確認して対応可能

---

### Q2: Text Blocksを使わないとどうなるのか？

**A:** コードが読みにくく、保守しづらくなります。

**Text Blocksなし（従来の書き方）:**
```java
String html = "<html>\n" +
              "  <body>\n" +
              "    <h1>こんにちは</h1>\n" +
              "  </body>\n" +
              "</html>";
```

**Text Blocksあり（推奨）:**
```java
String html = """
    <html>
      <body>
        <h1>こんにちは</h1>
      </body>
    </html>
    """;
```

**メリット:**
- エスケープ不要
- インデントが保たれる
- 可読性が高い

---

### Q3: LocalDateTimeを直接Google APIに送れないのか？

**A:** 送れません。Google APIが求める形式が異なるためです。

**理由:**
1. Google APIは古い形式（`java.util.Date`ベース）を要求
2. タイムゾーン情報が必要
3. 世界中のユーザーが正しい時刻で見られるようにするため

**変換が必要:**
```
LocalDateTime → ZonedDateTime → Instant → Date → Google API形式
```

---

### Q4: MailHogとは何か？

**A:** メールのテスト用ツールです。

**特徴:**
- **開発環境専用**のSMTPサーバー
- 実際にメールを送信せず、ローカルで確認できる
- Webブラウザでメールの内容を確認可能

**アクセス方法:**
- SMTP: `localhost:1025`（メール送信先）
- Web UI: `http://localhost:8025`（メール確認画面）

**本番環境では:**
- SendGrid、Amazon SESなどの実際のメールサービスを使用

---

### Q5: Calendarクラスは完全修飾名でないといけないのか？

**A:** いいえ、インポート文でも解決できます。

**方法1: 完全修飾名（現在の実装）:**
```java
com.google.api.services.calendar.Calendar calendarService = ...;
```

**方法2: インポート文（よりシンプル）:**
```java
// ファイル冒頭
import com.google.api.services.calendar.Calendar;

// 使用箇所
Calendar calendarService = ...;
```

**どちらでも正しいです！**
- 完全修飾名: 明示的で安全
- インポート文: シンプルで読みやすい

---

### Q6: GsonFactoryとJacksonFactoryの違いは？

**A:** JSONライブラリの違いです。

**JacksonFactory（古い）:**
- Google API Client 1.x系で使用
- Jackson 2.xライブラリベース
- 現在は非推奨

**GsonFactory（新しい）:**
- Google API Client 2.x系で使用
- Gsonライブラリベース
- **現在の推奨方法**

**使い分け:**
- 新しいプロジェクト → GsonFactory
- 古いプロジェクト → JacksonFactory（互換性のため）

---

### Q7: なぜメール送信は同期処理なのか？

**A:** MVPではシンプルさを優先しているためです。

**同期処理（現在の実装）:**
```java
emailService.sendVerificationEmail(email, token);  // ← ここで待機
// メール送信が完了するまで次に進まない
```

**問題点:**
- メール送信に時間がかかる場合、ユーザーが待たされる

**非同期処理（将来の改善案）:**
```java
@Async
public void sendVerificationEmail(String email, String token) {
    // 別スレッドで実行
}
```

**メリット:**
- ユーザー登録がすぐに完了
- メール送信は裏で実行

---

## 🎓 Phase 6で学んだ重要な概念

### 1. 外部API連携の基本

- **HTTPトランスポート**: データ送受信の仕組み
- **JSONパーサー**: Javaオブジェクト⇔JSON変換
- **認証**: アクセストークンを使った認証

### 2. エラーハンドリングの戦略

- **必須機能**: エラー時は例外をスロー
- **付加価値**: エラー時はログ出力のみ
- **ユーザー体験**: 本質的な機能は常に動作させる

### 3. 日時の取り扱い

- **LocalDateTime**: データベース保存用
- **ZonedDateTime**: タイムゾーン付き
- **Instant**: 世界標準時刻
- **変換の重要性**: タイムゾーンを正しく扱う

### 4. メール送信

- **MIME形式**: HTML対応メール
- **Text Blocks**: 複数行文字列の記述
- **テスト環境**: MailHogでメール確認

---

このガイドを参考に、外部連携サービスの実装を深く理解してください。
何か不明点があれば、いつでも質問してください！
