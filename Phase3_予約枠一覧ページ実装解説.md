# Phase 3実装ガイド（予約枠一覧ページ実装）

このガイドは、Phase 3で実装した予約枠一覧ページ（HomePage）とAPI実装の詳細解説です。

---

## 📋 目次

1. [実装概要](#実装概要)
2. [使用技術](#使用技術)
3. [HomePage.tsx 詳細解説](#homepagetsx-詳細解説)
4. [slotApi.ts 実装解説](#slotapits-実装解説)
5. [reservationApi.ts 実装解説](#reservationapits-実装解説)
6. [authApi.ts 実装解説](#authapits-実装解説)
7. [dateUtils.ts 実装解説](#dateutilsts-実装解説)
8. [学習ポイント](#学習ポイント)
9. [デザインパターン](#デザインパターン)
10. [ベストプラクティス](#ベストプラクティス)
11. [よくある質問](#よくある質問)

---

## 実装概要

### Phase 3で実装したもの

**1. HomePage.tsx（187行）**
- 予約枠一覧の表示
- 検索フィルタリング機能（日付範囲、メニュー選択）
- レスポンシブグリッドレイアウト
- ステータス別UI表示
- エラーハンドリングとローディング表示

**2. API実装（3ファイル）**
- `slotApi.ts` - スロット関連API（32行）
- `reservationApi.ts` - 予約関連API（23行）
- `authApi.ts` - 認証関連API（32行）

**3. ユーティリティ実装**
- `dateUtils.ts` - 日付フォーマット関数（44行）

---

## 使用技術

### React Hooks
- `useState` - 複数状態管理
- `useEffect` - データ初期取得

### TypeScript
- 型定義（Slot, ServiceMenu, SlotRequest など）
- オプショナルパラメータ
- 型安全なAPI呼び出し

### Tailwind CSS
- レスポンシブグリッド（grid-cols-1 md:grid-cols-2 lg:grid-cols-3）
- 条件付きスタイリング
- ホバーエフェクト

### shadcn/ui コンポーネント
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem
- Button, Input, Label, Alert

### Axios
- パラメータ付きGETリクエスト
- エラーハンドリング

---

## HomePage.tsx 詳細解説

### 全体構造

```typescript
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { slotApi } from "../api/slotApi";
import { serviceMenuApi } from "../api/serviceMenuApi";
import type { Slot, ServiceMenu } from "../types";
import { formatDateTime } from "../utils/dateUtils";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";

export const HomePage: React.FC = () => {
    // 状態管理
    const [slots, setSlots] = useState<Slot[]>([]);
    const [menus, setMenus] = useState<ServiceMenu[]>([]);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedMenuId, setSelectedMenuId] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // データ取得関数
    const fetchSlots = async () => { /* ... */ };
    const fetchMenus = async () => { /* ... */ };

    // 初期データ取得
    useEffect(() => {
        fetchSlots();
        fetchMenus();
    }, []);

    // イベントハンドラ
    const handleSearch = () => { /* ... */ };
    const getAvailableSeats = (slot: Slot): number => { /* ... */ };

    // レンダリング
    return ( /* ... */ );
}
```

---

### インポート解説

#### 1. React関連インポート

```typescript
import React, { useState, useEffect } from "react";
```

**解説:**
- `React`: Reactライブラリ本体
- `useState`: 状態管理フック
- `useEffect`: 副作用フック（データ取得など）

**なぜ必要？**
- `useState`: コンポーネント内で変化するデータを管理
- `useEffect`: コンポーネントマウント時にAPIからデータを取得

---

#### 2. ルーティング関連

```typescript
import { Link } from "react-router-dom";
```

**解説:**
- `Link`: ページ遷移用コンポーネント
- `<a>`タグの代わりに使用（SPAなのでページリロードなし）

**使用例:**
```typescript
<Link to={`/slots/${slot.id}`}>
  <Button>詳細を見る</Button>
</Link>
```

---

#### 3. API関連インポート

```typescript
import { slotApi } from "../api/slotApi";
import { serviceMenuApi } from "../api/serviceMenuApi";
```

**解説:**
- 自作のAPI呼び出し関数
- `slotApi.getAll()`: 予約枠一覧取得
- `serviceMenuApi.getAll()`: サービスメニュー一覧取得

---

#### 4. 型定義インポート

```typescript
import type { Slot, ServiceMenu } from "../types";
```

**解説:**
- `type`: 型のみをインポート（コンパイル後は消える）
- `Slot`: 予約枠の型
- `ServiceMenu`: サービスメニューの型

**なぜ`type`を付ける？**
- バンドルサイズの削減
- 型だけが必要な場合の明示的な宣言

---

#### 5. ユーティリティ関数

```typescript
import { formatDateTime } from "../utils/dateUtils";
```

**解説:**
- 日付フォーマット関数
- ISO形式 → 日本語形式（例: "2026/01/10 10:00"）

---

#### 6. UIコンポーネント

```typescript
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
```

**解説:**
- `LoadingSpinner`: 自作のローディング表示
- その他: shadcn/ui コンポーネント

---

### 状態管理の解説

```typescript
const [slots, setSlots] = useState<Slot[]>([]);
const [menus, setMenus] = useState<ServiceMenu[]>([]);
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
const [selectedMenuId, setSelectedMenuId] = useState<string>("all");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
```

#### 各状態の役割

**1. slots（予約枠一覧）**
```typescript
const [slots, setSlots] = useState<Slot[]>([]);
```
- **型**: `Slot[]` - Slot型の配列
- **初期値**: `[]` - 空配列
- **用途**: APIから取得した予約枠データを保存
- **更新タイミング**: `fetchSlots()` 成功時

**2. menus（サービスメニュー一覧）**
```typescript
const [menus, setMenus] = useState<ServiceMenu[]>([]);
```
- **型**: `ServiceMenu[]`
- **初期値**: `[]`
- **用途**: 検索フィルタのメニュー選択肢
- **更新タイミング**: `fetchMenus()` 成功時

**3. fromDate（開始日）**
```typescript
const [fromDate, setFromDate] = useState("");
```
- **型**: `string`
- **初期値**: `""`（空文字列）
- **用途**: 検索フィルタの開始日
- **フォーマット**: "YYYY-MM-DD"（input[type="date"]の形式）

**4. toDate（終了日）**
```typescript
const [toDate, setToDate] = useState("");
```
- **型**: `string`
- **初期値**: `""`
- **用途**: 検索フィルタの終了日

**5. selectedMenuId（選択中のメニューID）**
```typescript
const [selectedMenuId, setSelectedMenuId] = useState<string>("all");
```
- **型**: `string`
- **初期値**: `"all"`
- **用途**: 検索フィルタのメニュー選択
- **"all"**: 全メニュー表示

**6. loading（ローディング状態）**
```typescript
const [loading, setLoading] = useState(true);
```
- **型**: `boolean`
- **初期値**: `true`（最初はローディング中）
- **用途**: ローディング表示の制御
- `true`: LoadingSpinner表示
- `false`: データ表示

**7. error（エラーメッセージ）**
```typescript
const [error, setError] = useState("");
```
- **型**: `string`
- **初期値**: `""`（エラーなし）
- **用途**: エラーメッセージの保存と表示
- 空文字列: エラーなし
- 文字列あり: エラーメッセージを Alert で表示

---

### fetchSlots 関数の詳細解説

```typescript
const fetchSlots = async () => {
    setLoading(true);
    setError("");

    try {
        const params: { from?: string; to?: string; menuId?: number } = {};
        if (fromDate) params.from = new Date(fromDate).toISOString();
        if (toDate) params.to = new Date(toDate).toISOString();
        if (selectedMenuId && selectedMenuId !== "all") params.menuId = parseInt(selectedMenuId);

        const data = await slotApi.getAll(params);
        setSlots(data);
    } catch (error) {
        console.error("予約枠の取得に失敗しました", error);
        setError("予約枠の取得に失敗しました。もう一度お試しください。");
        setSlots([]);
    } finally {
        setLoading(false);
    }
};
```

#### 1行ごとの解説

**1. ローディング開始とエラークリア**
```typescript
setLoading(true);
setError("");
```
- `setLoading(true)`: ローディング表示を開始
- `setError("")`: 前回のエラーメッセージをクリア

**なぜ必要？**
- ユーザーにデータ取得中であることを伝える
- 前回のエラーが残っていると混乱する

---

**2. try ブロック開始**
```typescript
try {
```
- エラーが発生する可能性のある処理を囲む
- エラーが発生すると`catch`ブロックに移動

---

**3. パラメータオブジェクトの初期化**
```typescript
const params: { from?: string; to?: string; menuId?: number } = {};
```
- **型定義**: `{ from?: string; to?: string; menuId?: number }`
  - `?`: オプショナル（あってもなくてもOK）
  - `from`, `to`: ISO形式の日付文字列
  - `menuId`: メニューID（数値）
- **初期値**: `{}`（空オブジェクト）

**なぜオブジェクト？**
- Axiosは`params`オブジェクトをクエリパラメータに変換
- 例: `{ from: "2026-01-01T00:00:00Z", menuId: 1 }`
  → `?from=2026-01-01T00:00:00Z&menuId=1`

---

**4. 開始日のパラメータ追加**
```typescript
if (fromDate) params.from = new Date(fromDate).toISOString();
```

**詳細:**
- `if (fromDate)`: fromDateが空でない場合
- `new Date(fromDate)`: 文字列をDateオブジェクトに変換
  - 入力: `"2026-01-10"`（input[type="date"]の形式）
  - 変換後: `Date` オブジェクト
- `.toISOString()`: ISO 8601形式に変換
  - 出力: `"2026-01-10T00:00:00.000Z"`

**なぜISO形式？**
- バックエンドがISO形式を期待
- 国際標準形式で時刻も含まれる
- タイムゾーンの問題を回避

---

**5. 終了日のパラメータ追加**
```typescript
if (toDate) params.to = new Date(toDate).toISOString();
```
- fromDateと同じ処理

---

**6. メニューIDのパラメータ追加**
```typescript
if (selectedMenuId && selectedMenuId !== "all") params.menuId = parseInt(selectedMenuId);
```

**詳細:**
- `if (selectedMenuId && selectedMenuId !== "all")`:
  - メニューが選択されている
  - かつ "all"（全て）ではない
- `parseInt(selectedMenuId)`: 文字列を数値に変換
  - 入力: `"1"`（Select コンポーネントは文字列を返す）
  - 出力: `1`（数値）

**なぜparseInt？**
- React の Select コンポーネントは値を文字列として扱う
- バックエンドは数値を期待

---

**7. API呼び出し**
```typescript
const data = await slotApi.getAll(params);
```
- `await`: 非同期処理が完了するまで待つ
- `slotApi.getAll(params)`: スロットAPI呼び出し
  - `params`: 検索パラメータ（空オブジェクトの場合は全件取得）
- `data`: 取得した予約枠の配列

**実際のリクエスト:**
```
GET /api/slots?from=2026-01-10T00:00:00Z&to=2026-01-20T00:00:00Z&menuId=1
```

---

**8. 状態更新**
```typescript
setSlots(data);
```
- 取得したデータを`slots`状態に保存
- 再レンダリングがトリガーされ、UIが更新される

---

**9. エラーハンドリング**
```typescript
} catch (error) {
    console.error("予約枠の取得に失敗しました", error);
    setError("予約枠の取得に失敗しました。もう一度お試しください。");
    setSlots([]);
}
```

**詳細:**
- `catch (error)`: try ブロック内でエラーが発生した場合
- `console.error()`: コンソールにエラーログ出力（開発者用）
- `setError()`: ユーザー向けエラーメッセージを設定
- `setSlots([])`: データをクリア（古いデータを表示しない）

---

**10. finally ブロック**
```typescript
} finally {
    setLoading(false);
}
```
- `finally`: try または catch の後に必ず実行
- `setLoading(false)`: ローディング表示を終了
- 成功・失敗に関わらず実行される

**なぜfinallyを使う？**
- ローディング状態は必ず終了させる必要がある
- try と catch の両方に書くと重複する

---

### fetchMenus 関数の解説

```typescript
const fetchMenus = async () => {
    try {
        const data = await serviceMenuApi.getAll();
        setMenus(data);
    } catch (error) {
        console.error("メニューの取得に失敗しました", error);
        setMenus([]);
    }
};
```

**fetchSlots との違い:**
- `setLoading()` がない（fetchSlots のローディングで十分）
- `setError()` がない（メニュー取得失敗は致命的ではない）
- シンプルな実装

---

### useEffect の解説

```typescript
useEffect(() => {
    fetchSlots();
    fetchMenus();
}, []);
```

**詳細:**
- **第1引数**: 実行する関数
  - `fetchSlots()`: 予約枠取得
  - `fetchMenus()`: メニュー取得
- **第2引数**: 依存配列 `[]`
  - 空配列 = コンポーネントマウント時のみ実行
  - 依存値がないので再実行されない

**実行タイミング:**
1. コンポーネントが初めて表示される（マウント）
2. `fetchSlots()` と `fetchMenus()` が並行実行される
3. データ取得完了後、状態が更新され再レンダリング

**なぜuseEffect？**
- React のルールで、レンダリング中に副作用（API呼び出し）は禁止
- useEffect を使うことでレンダリング後にデータ取得

---

### handleSearch 関数の解説

```typescript
const handleSearch = () => {
    fetchSlots();
};
```

**シンプルな理由:**
- 検索パラメータは状態（fromDate、toDate、selectedMenuId）に保存済み
- `fetchSlots()` が最新の状態を参照して検索実行
- 追加の処理は不要

**呼び出し元:**
```typescript
<Button onClick={handleSearch}>検索</Button>
```

---

### getAvailableSeats 関数の解説

```typescript
const getAvailableSeats = (slot: Slot): number => {
    return slot.capacity;
};
```

**現在の実装:**
- 単純に `capacity`（収容人数）を返す

**将来の拡張:**
```typescript
// 予約済み人数を引いた残席数を計算
const getAvailableSeats = (slot: Slot): number => {
    return slot.capacity - slot.reservedCount;
};
```

---

### UI部分の解説

#### 1. 検索フィルタCard

```typescript
<Card className="mb-6 shadow-lg">
  <CardHeader>
    <CardTitle>検索フィルタ</CardTitle>
    <CardDescription>日付やメニューで絞り込み</CardDescription>
  </CardHeader>
  <CardContent>
    {/* フィルタ内容 */}
  </CardContent>
</Card>
```

**解説:**
- `Card`: shadcn/ui のカードコンポーネント
- `shadow-lg`: 大きめの影（Tailwind CSS）
- `CardHeader`: カードのヘッダー部分
- `CardTitle`: タイトル
- `CardDescription`: 説明文
- `CardContent`: カードの本体

---

#### 2. グリッドレイアウト

```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
```

**解説:**
- `grid`: CSSグリッドレイアウト
- `grid-cols-1`: デフォルト1列（モバイル）
- `md:grid-cols-4`: 中画面以上で4列
- `gap-4`: グリッド間隔（1rem = 16px）

**レスポンシブ:**
- スマホ（< 768px）: 1列（縦並び）
- タブレット以上（≥ 768px）: 4列（横並び）

---

#### 3. 日付入力

```typescript
<div className="space-y-2">
  <Label htmlFor="fromDate">開始日</Label>
  <Input
    id="fromDate"
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
  />
</div>
```

**解説:**
- `space-y-2`: 縦方向の間隔（0.5rem）
- `Label`: アクセシビリティ対応のラベル
- `htmlFor`: input の id と紐付け（クリックでフォーカス）
- `type="date"`: HTML5の日付入力
- `value={fromDate}`: 制御されたコンポーネント
- `onChange`: 値変更時に状態更新

**制御されたコンポーネント:**
- 入力値が React の状態で管理される
- 一方向のデータフロー
- 値の検証・加工が容易

---

#### 4. Select コンポーネント

```typescript
<Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
  <SelectTrigger id="menu">
    <SelectValue placeholder="すべて" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">すべて</SelectItem>
    {Array.isArray(menus) && menus.map((menu) => (
      <SelectItem key={menu.id} value={menu.id.toString()}>
        {menu.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**解説:**
- `Select`: shadcn/ui のセレクトコンポーネント
- `value`: 選択中の値
- `onValueChange`: 値変更時のコールバック
- `SelectTrigger`: クリック可能な部分
- `SelectValue`: 選択中の値を表示
- `SelectContent`: ドロップダウンの中身
- `SelectItem`: 選択肢

**動的な選択肢生成:**
```typescript
{Array.isArray(menus) && menus.map((menu) => (
  <SelectItem key={menu.id} value={menu.id.toString()}>
    {menu.name}
  </SelectItem>
))}
```
- `Array.isArray(menus)`: 配列チェック
- `menus.map()`: 各メニューをSelectItemに変換
- `key={menu.id}`: Reactのリスト用キー
- `value={menu.id.toString()}`: 数値を文字列に変換

---

#### 5. 検索ボタン

```typescript
<div className="flex items-end">
  <Button onClick={handleSearch} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
    検索
  </Button>
</div>
```

**解説:**
- `flex items-end`: フレックスボックス、下揃え
- `w-full`: 幅100%
- `bg-gradient-to-r`: 左から右へのグラデーション
- `from-blue-600 to-purple-600`: グラデーションの色
- `hover:from-blue-700 hover:to-purple-700`: ホバー時の色

---

#### 6. ローディング表示

```typescript
{loading && <LoadingSpinner />}
```
- `&&`: 短絡評価（loadingがtrueの時のみ表示）
- 三項演算子の代わり（falseの時は何も表示しない）

---

#### 7. エラー表示

```typescript
{error && (
  <Alert variant="destructive" className="mb-4">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```
- `variant="destructive"`: 赤い警告スタイル
- エラーメッセージがある時のみ表示

---

#### 8. データなしメッセージ

```typescript
{!loading && !error && Array.isArray(slots) && slots.length === 0 && (
  <Alert className="mb-4">
    <AlertDescription>予約可能な枠がありません</AlertDescription>
  </Alert>
)}
```

**条件:**
- `!loading`: ローディング中でない
- `!error`: エラーなし
- `Array.isArray(slots)`: slotsが配列
- `slots.length === 0`: データが0件

---

#### 9. 予約枠カード一覧

```typescript
{!loading && !error && Array.isArray(slots) && slots.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {slots.map((slot) => (
      <Card key={slot.id} className="hover:shadow-xl transition-shadow duration-300">
        {/* カード内容 */}
      </Card>
    ))}
  </div>
)}
```

**レスポンシブグリッド:**
- モバイル: 1列
- タブレット: 2列
- デスクトップ: 3列

**ホバーエフェクト:**
- `hover:shadow-xl`: ホバー時に大きな影
- `transition-shadow`: 影の変化をアニメーション
- `duration-300`: 0.3秒のアニメーション

---

#### 10. カード内容

```typescript
<CardHeader>
  <CardTitle className="text-lg">{slot.serviceMenuName}</CardTitle>
  <CardDescription>
    {formatDateTime(slot.startTime)} 〜 {formatDateTime(slot.endTime).split(' ')[1]}
  </CardDescription>
</CardHeader>
```

**日時表示の工夫:**
- `formatDateTime(slot.startTime)`: "2026/01/10 10:00"
- `formatDateTime(slot.endTime).split(' ')[1]`: "10:30"
  - `.split(' ')`: スペースで分割 → `["2026/01/10", "10:30"]`
  - `[1]`: 2番目の要素（時刻のみ）を取得
- 結果: "2026/01/10 10:00 〜 10:30"

---

#### 11. ステータス別スタイリング

```typescript
<span
  className={
    slot.status === 'AVAILABLE'
      ? 'text-green-600 font-semibold'
      : slot.status === 'FULL'
      ? 'text-red-600 font-semibold'
      : 'text-yellow-600 font-semibold'
  }
>
  {slot.status === 'AVAILABLE' ? '予約可能' : slot.status === 'FULL' ? '満員' : '一部予約済'}
</span>
```

**三項演算子のネスト:**
- AVAILABLE → 緑色 "予約可能"
- FULL → 赤色 "満員"
- その他 → 黄色 "一部予約済"

---

#### 12. 詳細ボタン

```typescript
<Link to={`/slots/${slot.id}`}>
  <Button
    className="w-full mt-2"
    disabled={slot.status === 'FULL'}
    variant={slot.status === 'FULL' ? 'secondary' : 'default'}
  >
    詳細を見る
  </Button>
</Link>
```

**条件付きスタイル:**
- 満員の場合: `disabled={true}`, `variant="secondary"`（灰色）
- それ以外: `disabled={false}`, `variant="default"`（青色）

---

## slotApi.ts 実装解説

### 全体コード

```typescript
import  apiClient from "./client";
import type { Slot, SlotRequest } from "../types";

export const slotApi = {
    getAll: async (params?: {
        from?: string;
        to?: string;
        menuId?: number;
    }): Promise<Slot[]> => {
        const response = await apiClient.get<Slot[]>(`/slots`, { params });
        return response.data;
    },

    getById: async (id: number): Promise<Slot> => {
        const response = await apiClient.get<Slot>(`/slots/${id}`);
        return response.data;
    },

    create: async (data: SlotRequest): Promise<Slot> => {
        const response = await apiClient.post<Slot>(`/slots`, data);
        return response.data;
    },

    update: async (id: number, data: SlotRequest): Promise<Slot> => {
        const response = await apiClient.put<Slot>(`/slots/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/slots/${id}`);
    }
}
```

### getAll の詳細解説

```typescript
getAll: async (params?: {
    from?: string;
    to?: string;
    menuId?: number;
}): Promise<Slot[]> => {
    const response = await apiClient.get<Slot[]>(`/slots`, { params });
    return response.data;
},
```

**パラメータ型定義:**
```typescript
params?: {
    from?: string;
    to?: string;
    menuId?: number;
}
```
- `params?`: パラメータ自体がオプショナル
- `from?`, `to?`, `menuId?`: 各プロパティもオプショナル

**Axiosのparams:**
```typescript
{ params }
```
- Axiosの設定オブジェクト
- `params`プロパティにクエリパラメータを指定
- 自動的にURLエンコードされる

**実際のリクエスト例:**
```typescript
// パラメータなし
slotApi.getAll();
// → GET /api/slots

// 日付範囲のみ
slotApi.getAll({ from: "2026-01-01T00:00:00Z", to: "2026-01-31T23:59:59Z" });
// → GET /api/slots?from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z

// 全パラメータ
slotApi.getAll({ from: "2026-01-01T00:00:00Z", to: "2026-01-31T23:59:59Z", menuId: 1 });
// → GET /api/slots?from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z&menuId=1
```

---

### CRUD操作パターン

**Create（作成）:**
```typescript
create: async (data: SlotRequest): Promise<Slot> => {
    const response = await apiClient.post<Slot>(`/slots`, data);
    return response.data;
},
```
- `POST /api/slots`
- リクエストボディ: `SlotRequest`
- レスポンス: `Slot`（作成されたスロット）

**Read（取得）:**
```typescript
getById: async (id: number): Promise<Slot> => {
    const response = await apiClient.get<Slot>(`/slots/${id}`);
    return response.data;
},
```
- `GET /api/slots/{id}`
- レスポンス: `Slot`（1件）

**Update（更新）:**
```typescript
update: async (id: number, data: SlotRequest): Promise<Slot> => {
    const response = await apiClient.put<Slot>(`/slots/${id}`, data);
    return response.data;
},
```
- `PUT /api/slots/{id}`
- リクエストボディ: `SlotRequest`
- レスポンス: `Slot`（更新後のスロット）

**Delete（削除）:**
```typescript
delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/slots/${id}`);
}
```
- `DELETE /api/slots/{id}`
- レスポンス: なし（`void`）
- バックエンドは `204 No Content` を返す

---

## reservationApi.ts 実装解説

### 全体コード

```typescript
import apiClient from "./client";
import type { Reservation, ReservationRequest } from "../types";

export const reservationApi = {
    create: async (data: ReservationRequest): Promise<Reservation> => {
        const response = await apiClient.post<Reservation>(`/reservations`, data);
        return response.data;
    },

    getMy: async (): Promise<Reservation[]> => {
        const response = await apiClient.get<Reservation[]>(`/reservations/my`);
        return response.data;
    },

    getAll: async (): Promise<Reservation[]> => {
        const response = await apiClient.get<Reservation[]>(`/reservations`);
        return response.data;
    },

    cancel: async (id: number): Promise<void> => {
        await apiClient.patch(`/reservations/${id}/cancel`);
    }
}
```

### 各関数の解説

**create（予約作成）:**
```typescript
create: async (data: ReservationRequest): Promise<Reservation> => {
    const response = await apiClient.post<Reservation>(`/reservations`, data);
    return response.data;
},
```
- `POST /api/reservations`
- 新規予約を作成

**getMy（自分の予約一覧）:**
```typescript
getMy: async (): Promise<Reservation[]> => {
    const response = await apiClient.get<Reservation[]>(`/reservations/my`);
    return response.data;
},
```
- `GET /api/reservations/my`
- ログイン中のユーザーの予約のみ取得
- 認証情報から自動判別（バックエンド側）

**getAll（全予約一覧）:**
```typescript
getAll: async (): Promise<Reservation[]> => {
    const response = await apiClient.get<Reservation[]>(`/reservations`);
    return response.data;
},
```
- `GET /api/reservations`
- 管理者用（全ユーザーの予約を取得）

**cancel（予約キャンセル）:**
```typescript
cancel: async (id: number): Promise<void> => {
    await apiClient.patch(`/reservations/${id}/cancel`);
}
```
- `PATCH /api/reservations/{id}/cancel`
- `PATCH`: 部分更新（statusのみ変更）
- レスポンスなし

---

## authApi.ts 実装解説

### 全体コード（修正後）

```typescript
import apiClient from "./client";
import type {User, LoginRequest, RegisterRequest} from "../types"

export const authApi = {
    login: async (data: LoginRequest): Promise<User> => {
        const response = await apiClient.post<User>("/auth/login", data);
        return response.data;
    },

    signup: async (data: RegisterRequest): Promise<{ message: string}> => {
        const response = await apiClient.post<{ message: string}>("/auth/register", data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.post("/auth/logout")
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            const response = await apiClient.get<User>("/auth/me");
            return response.data;
        } catch(error) {
            console.error("ユーザー情報の取得に失敗:", error)
            return null;
        }
    },

    googleLogin: (): void => {
        window.location.href = "/api/auth/google";
    },
};
```

### バグ修正の詳細

**修正前（バグ）:**
```typescript
signup: async (data: RegisterRequest): Promise<{ message: string}> => {
    const response = await apiClient.post<{ message: string}>("/auth/login", data);  // ← バグ
    return response.data;
},
```

**修正後:**
```typescript
signup: async (data: RegisterRequest): Promise<{ message: string}> => {
    const response = await apiClient.post<{ message: string}>("/auth/register", data);
    return response.data;
},
```

**問題点:**
- `/auth/login` → ログインエンドポイント
- 新規登録なのにログインAPIを呼んでいた

**影響:**
- 新規登録が正しく動作しない
- 既存ユーザーでないとエラーになる

---

### getCurrentUser の詳細解説

```typescript
getCurrentUser: async (): Promise<User | null> => {
    try {
        const response = await apiClient.get<User>("/auth/me");
        return response.data;
    } catch(error) {
        console.error("ユーザー情報の取得に失敗:", error)
        return null;
    }
},
```

**なぜtry/catchが必要？**
- 未ログイン時は404エラーが返る
- エラーを握りつぶして`null`を返す
- 呼び出し側でエラーハンドリング不要

**戻り値の型:**
```typescript
Promise<User | null>
```
- `User`: ログイン中
- `null`: 未ログイン

**使用例:**
```typescript
const user = await authApi.getCurrentUser();
if (user) {
  console.log("ログイン中:", user.name);
} else {
  console.log("未ログイン");
}
```

---

### googleLogin の詳細解説

```typescript
googleLogin: (): void => {
    window.location.href = "/api/auth/google";
},
```

**なぜAPIリクエストでない？**
- OAuth2フローは複数のリダイレクトが必要
- Spring Securityが自動的にGoogleにリダイレクト
- ページ全体の遷移が必要

**フロー:**
1. `/api/auth/google` にアクセス
2. Spring SecurityがGoogleログイン画面にリダイレクト
3. ユーザーがGoogleでログイン
4. Googleがコールバックurl（`/api/auth/google/callback`）にリダイレクト
5. Spring Securityがユーザー情報を取得
6. アプリのトップページにリダイレクト

---

## dateUtils.ts 実装解説

### 全体コード

```typescript
export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTimeInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const isCancellable = (startTime: string): boolean => {
  const start = new Date(startTime);
  const now = new Date();
  const hoursDiff = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursDiff > 24;
};
```

### formatDateTime の詳細解説

```typescript
export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

**入力:**
```typescript
"2026-01-10T10:00:00"
```

**出力:**
```typescript
"2026/01/10 10:00"
```

**`toLocaleString` の引数:**
- 第1引数: `'ja-JP'` - 日本語ロケール
- 第2引数: フォーマットオプション
  - `year: 'numeric'`: 4桁の年（2026）
  - `month: '2-digit'`: 2桁の月（01）
  - `day: '2-digit'`: 2桁の日（10）
  - `hour: '2-digit'`: 2桁の時（10）
  - `minute: '2-digit'`: 2桁の分（00）

---

### formatDateTimeInput の詳細解説

```typescript
export const formatDateTimeInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
```

**用途:**
- `<input type="datetime-local">` の value 用
- HTML5のdatetime-local形式: `YYYY-MM-DDTHH:mm`

**padStart の解説:**
```typescript
String(date.getMonth() + 1).padStart(2, '0')
```
- `getMonth()`: 0-11を返す → +1で1-12に
- `String()`: 数値を文字列に変換
- `.padStart(2, '0')`: 2桁になるまで左側に'0'を追加
  - 例: `"1"` → `"01"`
  - 例: `"12"` → `"12"`（変化なし）

**使用例:**
```typescript
const now = new Date();
const value = formatDateTimeInput(now);
// → "2026-01-05T14:30"

<Input type="datetime-local" value={value} />
```

---

### isCancellable の詳細解説

```typescript
export const isCancellable = (startTime: string): boolean => {
  const start = new Date(startTime);
  const now = new Date();
  const hoursDiff = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursDiff > 24;
};
```

**計算式:**
```typescript
const hoursDiff = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
```
- `getTime()`: UNIXタイムスタンプ（ミリ秒）
- `start.getTime() - now.getTime()`: 差分（ミリ秒）
- `/ (1000 * 60 * 60)`: ミリ秒を時間に変換
  - 1000: ミリ秒→秒
  - 60: 秒→分
  - 60: 分→時間

**判定:**
```typescript
return hoursDiff > 24;
```
- 24時間より前 → キャンセル可能
- 24時間以内 → キャンセル不可

**使用例:**
```typescript
const canCancel = isCancellable("2026-01-10T10:00:00");
if (canCancel) {
  // キャンセルボタンを表示
} else {
  // キャンセル不可メッセージを表示
}
```

---

## 学習ポイント

### 1. 複数状態管理のパターン

**学んだこと:**
- 1つのコンポーネントで複数の`useState`を使う
- 関連する状態をグループ化せず、個別に管理

**メリット:**
- 各状態が独立している
- 部分的な更新が簡単
- TypeScriptの型推論が効く

**例:**
```typescript
const [slots, setSlots] = useState<Slot[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
```

---

### 2. useEffect の依存配列

**空配列の意味:**
```typescript
useEffect(() => {
    fetchSlots();
    fetchMenus();
}, []);  // ← 空配列
```
- **実行タイミング**: コンポーネントマウント時のみ
- **再実行されない**: 依存値がないため

**依存配列ありの場合:**
```typescript
useEffect(() => {
    fetchSlots();
}, [fromDate, toDate, selectedMenuId]);  // ← これらが変わると再実行
```

---

### 3. 条件付きパラメータの構築

**学んだパターン:**
```typescript
const params: { from?: string; to?: string; menuId?: number } = {};
if (fromDate) params.from = new Date(fromDate).toISOString();
if (toDate) params.to = new Date(toDate).toISOString();
if (selectedMenuId && selectedMenuId !== "all") params.menuId = parseInt(selectedMenuId);
```

**メリット:**
- 空のパラメータは送信されない
- バックエンドで`null`チェック不要
- URLがシンプル

---

### 4. try/catch/finally パターン

**必ずfinallyを使う:**
```typescript
try {
    setLoading(true);
    // API呼び出し
} catch (error) {
    setError("エラーメッセージ");
} finally {
    setLoading(false);  // ← 必ず実行
}
```

**理由:**
- 成功・失敗に関わらずローディングを終了
- コードの重複を防ぐ

---

### 5. レスポンシブグリッド

**Tailwind CSSのブレークポイント:**
```typescript
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

- デフォルト（< 768px）: 1列
- `md`（≥ 768px）: 2列
- `lg`（≥ 1024px）: 3列

**モバイルファースト:**
- 小さい画面から設計
- 大きい画面用に上書き

---

### 6. 条件付きレンダリングのパターン

**複数条件のAND:**
```typescript
{!loading && !error && Array.isArray(slots) && slots.length > 0 && (
  <div>データ表示</div>
)}
```

**短絡評価:**
```typescript
{error && <Alert>{error}</Alert>}
```

**三項演算子:**
```typescript
{loading ? <LoadingSpinner /> : <DataList />}
```

---

## デザインパターン

### 1. 検索フィルタパターン

**構成:**
1. フィルタ用のCard
2. グリッドレイアウトでフォーム配置
3. 検索ボタン

**実装例:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>検索フィルタ</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Input type="date" />
      <Input type="date" />
      <Select />
      <Button onClick={handleSearch}>検索</Button>
    </div>
  </CardContent>
</Card>
```

---

### 2. カード型リストパターン

**構成:**
1. グリッドレイアウト
2. 各アイテムをCardで表示
3. ホバーエフェクト

**実装例:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id} className="hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {item.content}
      </CardContent>
    </Card>
  ))}
</div>
```

---

### 3. 状態別UI表示パターン

**実装例:**
```typescript
{loading && <LoadingSpinner />}
{error && <Alert variant="destructive">{error}</Alert>}
{!loading && !error && data.length === 0 && <Alert>データなし</Alert>}
{!loading && !error && data.length > 0 && <DataList data={data} />}
```

**順序が重要:**
1. ローディング
2. エラー
3. データなし
4. データあり

---

### 4. API関数パターン

**オブジェクトでエクスポート:**
```typescript
export const slotApi = {
    getAll: async () => { /* ... */ },
    getById: async (id) => { /* ... */ },
    create: async (data) => { /* ... */ },
    update: async (id, data) => { /* ... */ },
    delete: async (id) => { /* ... */ },
}
```

**メリット:**
- 名前空間の整理
- インポートが簡単: `import { slotApi } from './api/slotApi'`
- モック化が簡単

---

## ベストプラクティス

### 1. 型安全なAPI呼び出し

**良い例:**
```typescript
const response = await apiClient.get<Slot[]>('/slots');
// responseの型: AxiosResponse<Slot[]>
// response.dataの型: Slot[]
```

**悪い例:**
```typescript
const response = await apiClient.get('/slots');
// response.dataの型: any（型チェックなし）
```

---

### 2. エラーハンドリングの一元化

**良い例（try/catch）:**
```typescript
try {
    const data = await slotApi.getAll();
    setSlots(data);
} catch (error) {
    setError("取得に失敗しました");
    setSlots([]);  // ← 古いデータをクリア
}
```

**悪い例:**
```typescript
const data = await slotApi.getAll();
setSlots(data);  // ← エラー時の処理なし
```

---

### 3. 制御されたコンポーネント

**良い例:**
```typescript
<Input
  value={fromDate}
  onChange={(e) => setFromDate(e.target.value)}
/>
```

**悪い例（非制御コンポーネント）:**
```typescript
<input defaultValue={fromDate} />
// ← Reactの管理外、値の取得が難しい
```

---

### 4. 配列チェック

**良い例:**
```typescript
{Array.isArray(slots) && slots.map(...)}
```

**理由:**
- APIエラー時に`slots`が`undefined`になる可能性
- `undefined.map()`はエラー

---

### 5. キーの設定

**良い例:**
```typescript
{slots.map((slot) => (
  <Card key={slot.id}>...</Card>
))}
```

**悪い例:**
```typescript
{slots.map((slot, index) => (
  <Card key={index}>...</Card>  // ← インデックスをキーにしない
))}
```

**理由:**
- Reactのリスト更新最適化
- データの追加・削除時にバグの原因

---

## よくある質問

### Q1: なぜuseStateを複数使うの？1つのオブジェクトにまとめられない？

**A:** できますが、推奨されません。

**複数のuseState（推奨）:**
```typescript
const [slots, setSlots] = useState<Slot[]>([]);
const [loading, setLoading] = useState(true);
```

**1つのuseState（非推奨）:**
```typescript
const [state, setState] = useState({
  slots: [],
  loading: true,
});

// 更新が複雑
setState({ ...state, loading: false });
```

**理由:**
- 個別の状態更新が簡単
- TypeScriptの型推論が効く
- パフォーマンスが良い

---

### Q2: useEffectの依存配列を空にすると警告が出る

**A:** ESLintの警告ですが、意図的な場合は問題ありません。

**警告を消す方法:**
```typescript
useEffect(() => {
    fetchSlots();
    fetchMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**または関数を依存配列に追加:**
```typescript
const fetchSlots = useCallback(async () => {
  // ...
}, []);

useEffect(() => {
    fetchSlots();
}, [fetchSlots]);
```

---

### Q3: なぜfetchSlotsとfetchMenusを分けるの？

**A:** 責任の分離とエラーハンドリングのため。

**分離のメリット:**
- メニュー取得失敗でもスロット表示は続行
- 個別に再取得可能
- テストしやすい

**もし1つにまとめると:**
```typescript
const fetchData = async () => {
  const slots = await slotApi.getAll();  // ← ここで失敗
  const menus = await serviceMenuApi.getAll();  // ← 実行されない
}
```

---

### Q4: レスポンシブデザインのブレークポイントは変更できる？

**A:** tailwind.config.cjs で変更可能。

```javascript
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // デフォルト
      'md': '768px',   // ← これを変更可能
      'lg': '1024px',
      'xl': '1280px',
    },
  },
}
```

---

### Q5: なぜformatDateTimeで.split(' ')[1]するの？

**A:** 終了時刻は時刻のみ表示したいため。

**表示例:**
```
2026/01/10 10:00 〜 10:30
```

**コード:**
```typescript
{formatDateTime(slot.startTime)} 〜 {formatDateTime(slot.endTime).split(' ')[1]}
```

**formatDateTime(slot.endTime)の結果:**
```
"2026/01/10 10:30"
```

**.split(' ')の結果:**
```
["2026/01/10", "10:30"]
```

**[1]で取得:**
```
"10:30"
```

---

### Q6: Selectコンポーネントはなぜ文字列を返す？

**A:** HTML の`<select>`仕様に準拠。

**HTML仕様:**
```html
<select value="1">  ← 文字列
  <option value="1">メニュー1</option>
</select>
```

**React:**
```typescript
<Select value="1" onValueChange={(value) => {
  console.log(typeof value);  // → "string"
}}>
```

**数値に変換:**
```typescript
params.menuId = parseInt(selectedMenuId);
```

---

### Q7: try/catch/finallyのfinallyは本当に必要？

**A:** ローディング状態のクリーンアップには必須。

**finallyなしの場合:**
```typescript
try {
    setLoading(true);
    const data = await slotApi.getAll();
    setSlots(data);
    setLoading(false);  // ← エラー時は実行されない
} catch (error) {
    setError("エラー");
    setLoading(false);  // ← 重複
}
```

**finallyありの場合:**
```typescript
try {
    setLoading(true);
    const data = await slotApi.getAll();
    setSlots(data);
} catch (error) {
    setError("エラー");
} finally {
    setLoading(false);  // ← 必ず実行、重複なし
}
```

---

### Q8: useState の初期値を関数にできる？

**A:** できます。初期値の計算コストが高い場合に使用。

**通常:**
```typescript
const [state, setState] = useState(expensiveCalculation());
// ← 毎レンダリング時に実行（無駄）
```

**関数を渡す:**
```typescript
const [state, setState] = useState(() => expensiveCalculation());
// ← 初回のみ実行
```

**今回のコード:**
```typescript
const [slots, setSlots] = useState<Slot[]>([]);
// ← 空配列なので関数化不要
```

---

### Q9: APIのエラーをどう表示するのがベスト？

**A:** ユーザーフレンドリーなメッセージに変換。

**悪い例:**
```typescript
catch (error) {
    setError(error.message);
    // → "Network Error" や "Request failed with status code 500"
    // ユーザーにとって意味不明
}
```

**良い例:**
```typescript
catch (error) {
    console.error("詳細エラー:", error);  // ← 開発者用
    setError("予約枠の取得に失敗しました。もう一度お試しください。");  // ← ユーザー用
}
```

---

### Q10: なぜ getAvailableSeats は単純にcapacityを返すだけ？

**A:** 将来の拡張に備えた関数化。

**現在:**
```typescript
const getAvailableSeats = (slot: Slot): number => {
    return slot.capacity;
};
```

**将来の拡張:**
```typescript
const getAvailableSeats = (slot: Slot): number => {
    return slot.capacity - slot.reservedCount;  // ← 予約済み人数を引く
};
```

**メリット:**
- 呼び出し側のコード変更不要
- ビジネスロジックを関数に集約

---

## まとめ

Phase 3では、以下を実装しました：

### 実装したファイル（5つ）

1. **HomePage.tsx**（187行） - 予約枠一覧ページ
2. **slotApi.ts**（32行） - スロット関連API
3. **reservationApi.ts**（23行） - 予約関連API
4. **authApi.ts**（32行） - 認証関連API
5. **dateUtils.ts**（44行） - 日付ユーティリティ

### 学んだ主要な技術

- React Hooks（useState, useEffect）
- 複数状態管理
- 検索パラメータの実装
- レスポンシブデザイン
- 条件付きレンダリング
- shadcn/ui コンポーネント
- TypeScript型定義
- Axios API呼び出し

### 次のステップ

**Phase 4: ユーザーページ実装**
- MyReservationsPage（自分の予約一覧）
- ReservationHistoryPage（予約履歴）
- ReservationDetailPage（予約詳細）

---

**Phase 3 完了おめでとうございます！** 🎉

このガイドを参考に、Phase 4でも頑張りましょう！
