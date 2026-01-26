# Phase 4: ユーザーページ実装 - 実装解説

このドキュメントは、Phase 4で実装した3つのユーザーページの詳細解説です。

---

## 📋 Phase 4で実装したもの

### フロントエンド

1. **MyReservationsPage** (`src/pages/MyReservationsPage.tsx`) - 125行
   - 自分の予約一覧表示
   - 予約キャンセル機能
   - 24時間前判定

2. **ReservationHistoryPage** (`src/pages/ReservationHistoryPage.tsx`) - 112行
   - 全ての予約履歴表示
   - ステータス別表示（予約済み、キャンセル済み）
   - 新しい順ソート

3. **SlotDetailPage** (`src/pages/SlotDetailPage.tsx`) - 188行
   - 予約枠詳細表示
   - 予約作成フォーム
   - 早期リターンパターン

4. **App.tsx** - ルート設定更新
   - 3つのページをルーティングに追加
   - `/slots/:id` ルート追加

### バックエンド修正

1. **ReservationStatus.java** - `CONFIRMED` → `RESERVED`に修正
2. **SlotStatus.java** - `RESERVED` → `FULL`に修正
3. **ReservationService.java** - Google Calendar連携を一時的に無効化、スロットステータス更新を一時的に無効化

### API修正

1. **reservationApi.ts**
   - `getMy()`: `/api/reservations/my` → `/api/reservations/user/1`
   - `cancel()`: `PATCH /cancel` → `DELETE /{id}`

---

## 🎯 MyReservationsPage 詳細解説

### 概要

自分の予約一覧を表示し、キャンセル機能を提供するページです。

### コード構成

```typescript
// 状態管理
const [reservations, setReservations] = useState<Reservation[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

// データ取得
const fetchReservations = async () => { ... }

// キャンセル処理
const handleCancel = async (id: number) => { ... }

// フィルタリング（進行中の予約のみ）
const activeReservations = reservations.filter(r => r.status === "RESERVED");
```

### 重要なポイント

#### 1. フィルタリング（51-52行目）

```typescript
// 進行中の予約（RESERVED）のみ表示
const activeReservations = reservations.filter(r => r.status === "RESERVED");
```

**解説：**
- `filter()` メソッドで配列から条件に合う要素のみ抽出
- `status === "RESERVED"` → 予約中のもののみ
- `CANCELLED`（キャンセル済み）は除外される

**なぜフィルタリングするのか？**
- このページは「進行中の予約」を表示するため
- キャンセル済みの予約は「予約履歴」ページで表示

#### 2. キャンセル処理（36-49行目）

```typescript
const handleCancel = async (id: number) => {
    if (!window.confirm("この予約をキャンセルしますか？")) {
        return;
    }

    try {
        await reservationApi.cancel(id);
        alert("予約をキャンセルしました");
        fetchReservations(); // ★ 一覧を再取得
    } catch (error) {
        console.error("予約のキャンセルに失敗しました", error);
        alert("予約のキャンセルに失敗しました。もう一度お試しください。");
    }
};
```

**重要：`fetchReservations()`の呼び出し**
- キャンセル成功後、一覧を再取得
- これにより、キャンセルした予約が一覧から消える
- サーバー側でステータスが`CANCELLED`に変わるため

#### 3. 条件付きレンダリング（95-107行目）

```typescript
{isCancellable(reservation.startTime) ? (
  <Button onClick={() => handleCancel(reservation.id)} variant="destructive">
    キャンセル
  </Button>
) : (
  <p className="text-sm text-red-600 mt-2">
    キャンセル不可（24時間前を過ぎています）
  </p>
)}
```

**解説：**
- `isCancellable()` 関数で24時間前かどうか判定
- 24時間以上前 → キャンセルボタン表示
- 24時間未満 → 「キャンセル不可」メッセージ表示

**isCancellable関数（dateUtils.ts）：**
```typescript
export const isCancellable = (startTime: string): boolean => {
  const start = new Date(startTime);
  const now = new Date();
  const hoursDiff = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursDiff > 24;
};
```

---

## 🎯 ReservationHistoryPage 詳細解説

### 概要

全ての予約履歴を表示するページです。キャンセル済みの予約も含めて表示します。

### MyReservationsPageとの違い

| 項目 | MyReservationsPage | ReservationHistoryPage |
|------|-------------------|----------------------|
| 表示内容 | 進行中の予約（RESERVED）のみ | 全ての予約（RESERVED + CANCELLED） |
| フィルタリング | あり（activeReservations） | なし |
| ソート | なし | あり（新しい順） |
| ステータス表示 | 固定（予約中） | 動的（getStatusDisplay関数） |
| キャンセルボタン | あり | なし |
| 戻るボタン | 予約履歴へ | 予約一覧へ |

### 重要なポイント

#### 1. getStatusDisplay関数（36-46行目）

```typescript
const getStatusDisplay = (status: string) => {
    switch (status) {
        case "RESERVED":
            return { text: "予約済み", color: "text-green-600" };
        case "CANCELLED":
            return { text: "キャンセル済み", color: "text-red-600" };
        default:
            return { text: status, color: "text-gray-600"};
    }
};
```

**解説：**
- `switch`文で複数の条件分岐
- オブジェクトを返す（表示テキストと色の2つの情報）
- ステータスに応じた表示を動的に生成

**使い方：**
```typescript
const statusDisplay = getStatusDisplay(reservation.status);
// statusDisplay = { text: "予約済み", color: "text-green-600" }

<span className={`${statusDisplay.color} font-semibold`}>
  {statusDisplay.text}
</span>
```

#### 2. ソート機能（48-51行目）

```typescript
const sortedReservations = [...reservations].sort((a, b) => {
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
});
```

**解説：**

**スプレッド演算子 `[...reservations]`：**
- 元の配列をコピー
- `sort()`は元の配列を変更するため、コピーを作成

**降順ソート：**
- `b.startTime - a.startTime` → 新しい順
- `a.startTime - b.startTime` → 古い順

**getTime()メソッド：**
- 日付を数値（ミリ秒）に変換
- 1970年1月1日からの経過ミリ秒数
- 数値で比較できるため便利

---

## 🎯 SlotDetailPage 詳細解説

### 概要

予約枠の詳細を表示し、予約を作成するページです。Phase 4で最も複雑な実装です。

### 新しく学ぶHooks

#### 1. useParams - URLパラメータの取得

```typescript
const { id } = useParams<{ id: string }>();
```

**URLの例：**
```
http://localhost:5173/slots/123
                              ↑
                           この部分を取得
```

**App.tsxでのルート定義：**
```typescript
<Route path="/slots/:id" element={<SlotDetailPage />} />
                    ↑
                 パラメータ名
```

**取得されるデータ：**
```typescript
id = "123" // 必ず文字列として取得される
```

**数値として使う場合：**
```typescript
const numericId = Number(id); // または parseInt(id)
```

#### 2. useNavigate - プログラムからのページ遷移

```typescript
const navigate = useNavigate();

// 使い方：
navigate("/reservations/my");  // 予約一覧ページへ遷移
```

**Linkとの違い：**
| | Link | useNavigate |
|---|------|------------|
| 用途 | ボタンやリンク | 処理完了後の自動遷移 |
| 使用場所 | JSX内 | 関数内 |
| 例 | `<Link to="/path">` | `navigate("/path")` |

### 重要なポイント

#### 1. 早期リターンパターン（76-104行目）

```typescript
if (loading) {
    return <LoadingSpinner />;
}

if (error) {
    return (
        <div>...</div>
    );
}

if (!slot) {
    return (
        <div>...</div>
    );
}

// ここまで来たら、slotは必ず存在する
return (
    <div>...</div>
);
```

**メリット：**

1. **ネストが深くならない**
   ```typescript
   // ❌ 悪い例（ネストが深い）
   if (!loading) {
       if (!error) {
           if (slot) {
               return <div>...</div>
           }
       }
   }

   // ✅ 良い例（早期リターン）
   if (loading) return <LoadingSpinner />;
   if (error) return <div>...</div>;
   if (!slot) return <div>...</div>;
   return <div>...</div>;
   ```

2. **TypeScriptの型推論が効く**
   ```typescript
   if (!slot) return <div>...</div>;

   // ここ以降、TypeScriptは slot が null ではないことを理解
   console.log(slot.id);  // エラーなし
   ```

#### 2. フォーム送信処理（50-70行目）

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // ① フォームのデフォルト動作を防ぐ

    if (!slot) return;   // ② slotがない場合は何もしない

    setSubmitting(true); // ③ 送信中フラグON

    try {
        await reservationApi.create({
            slotId: slot.id,
            notes: notes || undefined,  // ④ 空文字列の場合はundefined
        });
        alert("予約が完了しました！");
        navigate("/reservations/my");  // ⑤ 予約一覧へ遷移
    } catch (error) {
        console.error("予約の作成に失敗しました", error);
        alert("予約の作成に失敗しました。もう一度お試しください");
    } finally {
        setSubmitting(false);  // ⑥ 送信中フラグOFF
    }
};
```

**重要なポイント：**

**① e.preventDefault()**
- フォームのデフォルト動作（ページリロード）を防ぐ
- これがないとページがリロードされてしまう

**④ notes || undefined**
```typescript
// 空文字列の場合はundefinedにする
notes: notes || undefined

// 理由：
// notes = "" → undefined （サーバーに送らない）
// notes = "何か入力" → "何か入力" （サーバーに送る）
```

**⑤ navigate()**
- 予約成功後、自動で予約一覧ページへ遷移
- ユーザーが手動で移動する必要がない

#### 3. Textareaコンポーネント（155-161行目）

```typescript
<Textarea
  id="notes"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  placeholder="特別なリクエストや要望があればご記入ください"
  rows={4}
/>
```

**制御されたコンポーネント（Controlled Component）：**
- `value={notes}` → 表示内容を状態で制御
- `onChange={(e) => setNotes(e.target.value)}` → 入力を検知して状態更新
- Reactが値を完全に制御

**非制御コンポーネントとの違い：**
```typescript
// 制御されたコンポーネント（推奨）
<Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />

// 非制御コンポーネント
<Textarea defaultValue={notes} />
```

#### 4. ボタンの状態制御（163-169行目）

```typescript
<Button
  type="submit"
  className="w-full"
  disabled={submitting}
>
  {submitting ? "予約中..." : "予約を確定する"}
</Button>
```

**解説：**
- `disabled={submitting}` → submittingがtrueの時、ボタン無効化
- テキストも動的に変更（予約中...）
- 二重送信を防ぐ

---

## 🔧 API修正の解説

### 1. reservationApi.getMy() の修正

**問題：**
- フロントエンド: `/api/reservations/my` を呼び出し
- バックエンド: このエンドポイントが存在しない

**解決：**
```typescript
getMy: async (): Promise<Reservation[]> => {
    // TODO: 将来的にはSpring Securityから現在のユーザーIDを取得
    const userId = 1; // Phase 7テスト用の固定値
    const response = await apiClient.get<Reservation[]>(`/reservations/user/${userId}`);
    return response.data;
},
```

**理由：**
- Phase 7ではSpring Securityが未実装
- 一時的にuserIdを固定（1）
- Phase 9以降でSpring Securityから取得するように修正予定

### 2. reservationApi.cancel() の修正

**問題：**
- フロントエンド: `PATCH /api/reservations/{id}/cancel`
- バックエンド: `DELETE /api/reservations/{id}`

**解決：**
```typescript
cancel: async (id: number): Promise<void> => {
    await apiClient.delete(`/reservations/${id}`);
}
```

---

## 🎓 学習ポイント

### 1. React Hooks

**useParams:**
- URLパラメータを取得
- 動的ルーティングに使用
- 型指定が重要: `<{ id: string }>`

**useNavigate:**
- プログラムからページ遷移
- 処理完了後の自動遷移に使用
- Linkとは用途が異なる

### 2. 配列操作

**filter():**
```typescript
const activeReservations = reservations.filter(r => r.status === "RESERVED");
```
- 条件に合う要素のみ抽出
- 元の配列は変更しない

**sort():**
```typescript
const sortedReservations = [...reservations].sort((a, b) => {
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
});
```
- 配列を並び替え
- 元の配列を変更するため、スプレッド演算子でコピー
- 降順：`b - a`、昇順：`a - b`

### 3. TypeScript

**早期リターンと型推論:**
```typescript
if (!slot) return <div>...</div>;

// ここ以降、TypeScriptは slot が null ではないことを理解
console.log(slot.id);  // エラーなし
```

**オプショナルチェイニング:**
```typescript
notes: notes || undefined
```
- 空文字列の場合はundefinedにする
- APIに不要なデータを送らない

### 4. フォーム処理

**e.preventDefault():**
- フォームのデフォルト動作を防ぐ
- ページリロードを防止

**制御されたコンポーネント:**
- `value`と`onChange`で値を制御
- Reactが状態を管理

**送信中フラグ:**
- `submitting`状態でボタンを無効化
- 二重送信を防ぐ

### 5. 条件付きレンダリング

**三項演算子:**
```typescript
{isCancellable(reservation.startTime) ? (
  <Button>キャンセル</Button>
) : (
  <p>キャンセル不可</p>
)}
```

**&& 演算子:**
```typescript
{reservation.notes && (
  <p>備考: {reservation.notes}</p>
)}
```

---

## 🐛 トラブルシューティング

### 問題1: データベース制約違反（ReservationStatus）

**エラー：**
```
ERROR: new row for relation "reservations" violates check constraint "reservations_status_check"
```

**原因：**
- Javaのenumは`CONFIRMED`
- データベースの制約は`RESERVED`のみ許可

**解決：**
```java
// ReservationStatus.java
public enum ReservationStatus {
    RESERVED,    // CONFIRMED → RESERVED に変更
    CANCELLED
}
```

### 問題2: データベース制約違反（SlotStatus）

**エラー：**
```
ERROR: new row for relation "slots" violates check constraint "slots_status_check"
```

**原因：**
- Javaのenumは`RESERVED`
- データベースの制約は`FULL`のみ許可

**解決：**
```java
// SlotStatus.java
public enum SlotStatus {
    AVAILABLE,
    FULL,         // RESERVED → FULL に変更
    CANCELLED
}
```

### 問題3: Google Calendar連携エラー

**エラー：**
```
500 Internal Server Error
```

**原因：**
- GoogleCalendarServiceの認証情報が未設定
- Phase 6で実装したが、認証が必要

**解決：**
```java
// ReservationService.java
// TODO: Googleカレンダーイベント作成（Phase 7テスト用に一時的に無効化）
// String eventId = googleCalendarService.createEvent(user, savedReservation);
```

### 問題4: スロットステータスの誤った更新

**問題：**
- 予約1件作成しただけで「満員」になる
- 残席があるのにステータスがFULL

**原因：**
```java
// ReservationService.java
slot.setStatus(SlotStatus.FULL);  // 無条件でFULLに変更
```

**解決：**
```java
// TODO: スロットのステータス管理（Phase 5以降で実装）
// 現在は予約数をカウントせず、常にAVAILABLEのまま
// 正しい実装：予約数がcapacity以上になったらFULLに変更
// slot.setStatus(SlotStatus.FULL);
// slotRepository.save(slot);
```

---

## ❓ FAQ

### Q1: なぜ`CONFIRMED`ではなく`RESERVED`を使うのか？

**A:** データベースの制約に合わせるため。

データベースのチェック制約では`RESERVED`のみが許可されています。Javaのenumとデータベースの制約を一致させる必要があります。

### Q2: useParamsで取得した値はなぜ文字列なのか？

**A:** URLパラメータは常に文字列として扱われます。

```typescript
const { id } = useParams<{ id: string }>();
// id = "123" (文字列)

// 数値として使う場合
const numericId = Number(id);
```

### Q3: なぜスプレッド演算子を使ってからソートするのか？

**A:** `sort()`メソッドは元の配列を変更してしまうため。

```typescript
// ❌ 悪い例
reservations.sort(...) // 元の配列が変更される

// ✅ 良い例
[...reservations].sort(...) // コピーを作ってソート
```

### Q4: `e.preventDefault()`を忘れるとどうなるのか？

**A:** フォーム送信時にページがリロードされます。

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // これがないとページがリロードされる

    // 予約作成処理...
}
```

### Q5: なぜ`notes || undefined`とするのか？

**A:** 空文字列をAPIに送らないため。

```typescript
notes: notes || undefined

// notes = "" → undefined （サーバーに送らない）
// notes = "何か入力" → "何か入力" （サーバーに送る）
```

### Q6: useNavigateとLinkの使い分けは？

**A:**
- **Link**: ユーザーがクリックするボタンやリンク
- **useNavigate**: 処理完了後の自動遷移

```typescript
// Link（ユーザーがクリック）
<Link to="/path">
  <Button>予約一覧を見る</Button>
</Link>

// useNavigate（処理完了後）
await reservationApi.create(...);
navigate("/reservations/my"); // 自動遷移
```

### Q7: 早期リターンのメリットは？

**A:**
1. ネストが深くならない
2. TypeScriptの型推論が効く
3. コードが読みやすくなる

```typescript
// 早期リターン
if (!slot) return <div>Not Found</div>;
console.log(slot.id); // slotは必ず存在する

// ネストが深い
if (slot) {
    console.log(slot.id);
}
```

### Q8: submitting状態はなぜ必要なのか？

**A:** 二重送信を防ぐため。

```typescript
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
    setSubmitting(true); // ボタンを無効化

    await reservationApi.create(...);

    setSubmitting(false); // ボタンを有効化
};

<Button disabled={submitting}>
  {submitting ? "予約中..." : "予約を確定する"}
</Button>
```

### Q9: getStatusDisplay関数でオブジェクトを返す理由は？

**A:** 表示テキストと色の2つの情報を一度に返すため。

```typescript
const getStatusDisplay = (status: string) => {
    switch (status) {
        case "RESERVED":
            return { text: "予約済み", color: "text-green-600" };
        case "CANCELLED":
            return { text: "キャンセル済み", color: "text-red-600" };
    }
};

// 使い方
const statusDisplay = getStatusDisplay(reservation.status);
<span className={statusDisplay.color}>{statusDisplay.text}</span>
```

### Q10: Phase 5以降で実装する予定の機能は？

**A:**
1. **スロットステータスの正しい管理**
   - 予約数をカウント
   - capacity以上になったらFULLに変更

2. **Spring Security統合**
   - 現在のユーザーIDを自動取得
   - `/api/reservations/my`エンドポイントの実装

3. **Google Calendar連携の有効化**
   - 認証情報の設定
   - イベントの自動作成・削除

---

## 🎉 Phase 4 完了！

Phase 4では以下を実装しました：

### フロントエンド
✅ MyReservationsPage - 自分の予約一覧とキャンセル機能
✅ ReservationHistoryPage - 全ての予約履歴表示
✅ SlotDetailPage - 予約枠詳細と予約作成
✅ App.tsx - ルート設定更新

### バックエンド修正
✅ ReservationStatus - データベース制約に合わせて修正
✅ SlotStatus - データベース制約に合わせて修正
✅ ReservationService - 一時的な修正（Google Calendar、スロットステータス）

### API修正
✅ reservationApi.ts - エンドポイント修正

### 学習したこと
✅ useParams、useNavigate
✅ 早期リターンパターン
✅ フォーム処理（e.preventDefault、制御されたコンポーネント）
✅ 配列操作（filter、sort）
✅ 条件付きレンダリング
✅ データベース制約とJavaのenumの一致

---

**次は Phase 5（スタッフページ実装）に進みます！**

スタッフ用の管理画面（メニュー管理、予約枠管理、全予約一覧）を実装します。
