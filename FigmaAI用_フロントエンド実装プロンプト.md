# FigmaAI用 フロントエンド実装プロンプト

**プロジェクト名**: ミニ予約システム（定員あり）
**対象**: React フロントエンド実装
**ツール**: FigmaAI
**作成日**: 2026-01-02

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [既存の環境構成](#既存の環境構成)
3. [技術スタック・コーディング規約](#技術スタックコーディング規約)
4. [実装すべき画面一覧](#実装すべき画面一覧)
5. [共通コンポーネント設計](#共通コンポーネント設計)
6. [各画面の詳細仕様](#各画面の詳細仕様)
7. [API連携仕様](#api連携仕様)
8. [レスポンシブデザイン要件](#レスポンシブデザイン要件)
9. [FigmaAI実装時の注意事項](#figmaai実装時の注意事項)

---

## プロジェクト概要

### システム概要
定員制の予約システムのフロントエンドを実装します。

**主な機能**:
- ユーザー認証（メール/パスワード、Google OAuth2）
- サービスメニュー表示
- 予約枠の検索・表示
- 予約作成・キャンセル
- 予約履歴表示
- スタッフ向け管理機能（メニュー・予約枠・予約管理）

**ユーザーロール**:
- 未ログインユーザー: 予約枠閲覧のみ
- USER: 予約作成・キャンセル、自分の予約管理
- STAFF: 全管理機能（メニュー・予約枠・全予約管理）

---

## 既存の環境構成

### Phase 8で作成済みの環境

以下の環境が既に構築されています。**この環境を基盤として画面を実装してください。**

#### ディレクトリ構成

```
reservation-frontend/
├── src/
│   ├── api/                 # API関連コード
│   │   ├── client.ts        # Axios設定（既存）
│   │   └── serviceMenuApi.ts # サンプルAPI（既存）
│   ├── components/          # 再利用可能なコンポーネント（これから作成）
│   ├── pages/               # ページコンポーネント（これから作成）
│   ├── types/               # TypeScript型定義
│   │   └── index.ts         # 全DTO型定義（既存）
│   ├── hooks/               # カスタムフック（これから作成）
│   ├── utils/               # ユーティリティ関数（これから作成）
│   ├── App.tsx              # ルートコンポーネント
│   └── main.tsx             # エントリーポイント
├── vite.config.ts           # Vite設定（プロキシ設定済み）
└── package.json
```

#### 既存のTypeScript型定義 (`src/types/index.ts`)

以下の型定義が既に作成されています。**これらをそのまま使用してください。**

```typescript
// API Response Types
export interface ServiceMenu {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

export interface Slot {
  id: number;
  serviceMenuId: number;
  serviceMenuName: string;
  startTime: string;  // ISO 8601形式
  endTime: string;    // ISO 8601形式
  status: string;     // "AVAILABLE", "RESERVED", "FULL"
  capacity: number;
}

export interface User {
  userId: number;
  email: string;
  name: string;
  role: string;  // "USER", "STAFF"
}

export interface Reservation {
  id: number;
  userId: number;
  userName: string;
  slotId: number;
  serviceMenuId: number;
  serviceMenuName: string;
  startTime: string;
  endTime: string;
  status: string;  // "CONFIRMED", "CANCELLED"
  notes?: string;
  googleCalendarEventId?: string;
}

// Request Types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ServiceMenuRequest {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

export interface SlotRequest {
  serviceMenuId: number;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface ReservationRequest {
  slotId: number;
  notes?: string;
}

// Error Response Type
export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  status: number;
  fieldErrors?: Record<string, string>;
}
```

#### 既存のAPI Client (`src/api/client.ts`)

Axios clientが既に設定されています。**このclientを使用してAPIを呼び出してください。**

```typescript
import apiClient from './client';
import type { ServiceMenu, ServiceMenuRequest } from '../types';

// 使用例
export const serviceMenuApi = {
  getAll: async (): Promise<ServiceMenu[]> => {
    const response = await apiClient.get<ServiceMenu[]>('/service-menus');
    return response.data;
  },

  getById: async (id: number): Promise<ServiceMenu> => {
    const response = await apiClient.get<ServiceMenu>(`/service-menus/${id}`);
    return response.data;
  },

  create: async (data: ServiceMenuRequest): Promise<ServiceMenu> => {
    const response = await apiClient.post<ServiceMenu>('/service-menus', data);
    return response.data;
  },

  update: async (id: number, data: ServiceMenuRequest): Promise<ServiceMenu> => {
    const response = await apiClient.put<ServiceMenu>(`/service-menus/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/service-menus/${id}`);
  },
};
```

#### Viteプロキシ設定 (`vite.config.ts`)

CORS問題を解決するため、以下のプロキシ設定が既に適用されています。

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

**重要**: `/api`で始まるリクエストは自動的に`http://localhost:8080/api`に転送されます。

---

## 技術スタック・コーディング規約

### 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 19 | UIライブラリ |
| TypeScript | 最新 | 型安全性 |
| Vite | 7.3.0 | 開発サーバー・ビルドツール |
| Axios | 最新 | HTTP通信 |
| React Router DOM | 最新 | ルーティング |

### コーディング規約

#### TypeScript

- **厳格モード**: `strict: true`を使用
- **型定義**: 明示的な型アノテーションを優先
- **any禁止**: `any`型は使用しない
- **null安全**: Optional chainingとnullish coalescingを活用

```typescript
// 良い例
const user: User | null = await fetchUser();
const userName = user?.name ?? 'ゲスト';

// 悪い例
const user: any = await fetchUser();
const userName = user.name;
```

#### React

- **関数コンポーネント**: クラスコンポーネントは使用しない
- **Hooks**: useState, useEffect, useContext等を適切に使用
- **Props型定義**: すべてのPropsに型を定義

```typescript
// 良い例
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
};

// 悪い例
const Button = (props) => {
  return <button onClick={props.onClick}>{props.label}</button>;
};
```

#### ファイル命名

- **コンポーネント**: PascalCase（例: `LoginPage.tsx`, `Header.tsx`）
- **ユーティリティ**: camelCase（例: `formatDate.ts`, `apiHelper.ts`）
- **定数**: UPPER_SNAKE_CASE（例: `API_ENDPOINTS.ts`）

#### インポート順序

1. React関連
2. サードパーティライブラリ
3. 内部モジュール（型定義、コンポーネント、utils）

```typescript
// 良い例
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import type { User, LoginRequest } from '../types';
import { Header } from '../components/Header';
import { formatDate } from '../utils/dateUtils';
```

#### エラーハンドリング

- **try-catch**: 非同期処理は必ずtry-catchでラップ
- **エラーメッセージ**: ユーザーフレンドリーなメッセージを表示
- **ログ出力**: 開発環境ではconsole.errorでログ出力

```typescript
// 良い例
try {
  const response = await apiClient.get('/slots');
  setSlots(response.data);
} catch (error) {
  console.error('予約枠の取得に失敗しました', error);
  setErrorMessage('予約枠の取得に失敗しました。もう一度お試しください。');
}
```

---

## 実装すべき画面一覧

### 認証画面（全ユーザー共通）

| 画面ID | 画面名 | パス | 優先度 |
|--------|--------|------|--------|
| A-01 | ログイン画面 | `/login` | 高 |
| A-02 | 新規登録画面 | `/signup` | 高 |
| A-03 | メール確認完了画面 | `/verify-success` | 中 |
| A-04 | メール確認エラー画面 | `/verify-error` | 中 |

### ユーザー画面（USER）

| 画面ID | 画面名 | パス | 優先度 |
|--------|--------|------|--------|
| U-01 | 予約枠一覧画面（公開） | `/` または `/slots` | 高 |
| U-02 | 予約枠詳細画面 | `/slots/:slotId` | 高 |
| U-03 | 予約確認画面 | `/reservations/confirm` | 中（オプション） |
| U-04 | 予約完了画面 | `/reservations/success` | 高 |
| U-05 | 自分の予約一覧画面 | `/reservations/my` | 高 |
| U-06 | 予約履歴画面 | `/reservations/history` | 中 |

### スタッフ画面（STAFF）

| 画面ID | 画面名 | パス | 優先度 |
|--------|--------|------|--------|
| S-01 | スタッフダッシュボード | `/staff` | 中 |
| S-02 | メニュー管理画面 | `/staff/menus` | 高 |
| S-03 | 予約枠管理画面 | `/staff/slots` | 高 |
| S-04 | 予約枠作成画面 | `/staff/slots/create` | 高 |
| S-05 | 予約枠編集画面 | `/staff/slots/:slotId/edit` | 中 |
| S-06 | 全予約一覧画面 | `/staff/reservations` | 中 |

---

## 共通コンポーネント設計

以下の共通コンポーネントを作成してください。

### 1. Header（ヘッダー）

**配置**: `src/components/Header.tsx`

**表示内容**:
- ロゴ / アプリ名
- ナビゲーションメニュー（ロール別）
- ユーザー情報（ログイン後）
- ログアウトボタン

**ロール別メニュー**:

| ロール | メニュー項目 |
|--------|-------------|
| 未ログイン | - 予約枠一覧<br>- ログイン<br>- 新規登録 |
| USER | - 予約枠一覧<br>- 自分の予約<br>- 予約履歴<br>- ログアウト |
| STAFF | - ダッシュボード<br>- メニュー管理<br>- 予約枠管理<br>- 全予約一覧<br>- ログアウト |

**Props型定義**:
```typescript
interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}
```

---

### 2. Footer（フッター）

**配置**: `src/components/Footer.tsx`

**表示内容**:
- コピーライト
- お問い合わせリンク（任意）

---

### 3. ErrorMessage（エラーメッセージ）

**配置**: `src/components/ErrorMessage.tsx`

**表示位置**: 画面上部（トースト通知 or アラート）

**色分け**:
- 成功: 緑系（`#10b981`）
- エラー: 赤系（`#ef4444`）
- 警告: 黄色系（`#f59e0b`）
- 情報: 青系（`#3b82f6`）

**Props型定義**:
```typescript
interface ErrorMessageProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}
```

---

### 4. LoadingSpinner（ローディング表示）

**配置**: `src/components/LoadingSpinner.tsx`

**表示**: 中央配置のスピナー

**Props型定義**:
```typescript
interface LoadingSpinnerProps {
  message?: string;
}
```

---

### 5. Card（カードコンポーネント）

**配置**: `src/components/Card.tsx`

**用途**: 予約枠、予約情報等の表示に使用

**デザイン**: 白背景、影付き、角丸

**Props型定義**:
```typescript
interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```

---

## 各画面の詳細仕様

### A-01: ログイン画面

**パス**: `/login`

**表示内容**:
```
┌─────────────────────────────────────┐
│        予約システム - ログイン        │
├─────────────────────────────────────┤
│                                     │
│  メールアドレス                       │
│  [__________________________]       │
│                                     │
│  パスワード                          │
│  [__________________________]       │
│                                     │
│  [    ログイン    ]                  │
│                                     │
│  ──────── または ────────            │
│                                     │
│  [ G  Googleでログイン ]             │
│                                     │
│  アカウントをお持ちでない方は          │
│  [新規登録はこちら]                   │
│                                     │
└─────────────────────────────────────┘
```

**機能**:
- メールアドレス、パスワード入力
- バリデーション（メール形式、必須チェック）
- ログインボタン → `POST /api/auth/login`
- Googleログインボタン → `GET /api/auth/google`
- 新規登録リンク → `/signup`

**API連携**:
```typescript
// POST /api/auth/login
const loginRequest: LoginRequest = {
  email: 'user@example.com',
  password: 'password123'
};

const response = await apiClient.post<User>('/auth/login', loginRequest);
// レスポンス: User型
```

**エラー表示**:
- 401: "メールアドレスまたはパスワードが正しくありません"
- 403: "メールアドレスが確認されていません"

**状態管理**:
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
```

---

### A-02: 新規登録画面

**パス**: `/signup`

**表示内容**:
```
┌─────────────────────────────────────┐
│        予約システム - 新規登録        │
├─────────────────────────────────────┤
│                                     │
│  氏名                                │
│  [__________________________]       │
│                                     │
│  メールアドレス                       │
│  [__________________________]       │
│                                     │
│  パスワード（8文字以上）              │
│  [__________________________]       │
│                                     │
│  パスワード（確認）                   │
│  [__________________________]       │
│                                     │
│  [    登録する    ]                  │
│                                     │
│  既にアカウントをお持ちの方は          │
│  [ログインはこちら]                   │
│                                     │
└─────────────────────────────────────┘
```

**機能**:
- 氏名、メールアドレス、パスワード入力
- パスワード確認（2回入力が一致するかチェック）
- 登録ボタン → `POST /api/auth/signup`
- 成功時 → 確認メール送信メッセージ表示

**API連携**:
```typescript
// POST /api/auth/signup
const registerRequest: RegisterRequest = {
  name: '山田太郎',
  email: 'user@example.com',
  password: 'password123'
};

const response = await apiClient.post('/auth/signup', registerRequest);
// レスポンス: { message: "確認メールを送信しました..." }
```

**バリデーション**:
- メール形式チェック
- パスワード8文字以上
- パスワード一致チェック

**状態管理**:
```typescript
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [error, setError] = useState('');
const [success, setSuccess] = useState(false);
```

---

### U-01: 予約枠一覧画面（公開）

**パス**: `/` または `/slots`

**認証**: 不要（未ログインでも閲覧可）

**表示内容**:
```
┌─────────────────────────────────────────────────┐
│  ヘッダー（ナビゲーション）                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  予約可能な枠一覧                                │
│                                                 │
│  [フィルタ]                                      │
│  日付: [____] 〜 [____]                         │
│  メニュー: [すべて ▼]                            │
│  [検索]                                          │
│                                                 │
│  ┌────────────────────────────────┐            │
│  │ 30分コース                      │            │
│  │ 2025-12-15 10:00 〜 10:30      │            │
│  │ 残席: 2 / 5                     │            │
│  │ [詳細を見る]                    │            │
│  └────────────────────────────────┘            │
│                                                 │
│  ┌────────────────────────────────┐            │
│  │ 60分コース                      │            │
│  │ 2025-12-15 11:00 〜 12:00      │            │
│  │ 残席: 3 / 3                     │            │
│  │ [詳細を見る]                    │            │
│  └────────────────────────────────┘            │
│                                                 │
│  （枠がない場合）                                │
│  予約可能な枠がありません                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

**機能**:
- `GET /api/slots` で枠一覧取得
- 日付範囲・メニューでフィルタ
- 各枠の「詳細を見る」ボタン → `/slots/{slotId}`

**API連携**:
```typescript
// GET /api/slots?from=...&to=...&menuId=...
const params = {
  from: '2025-12-15T00:00:00',
  to: '2025-12-16T23:59:59',
  menuId: 1 // オプション
};

const response = await apiClient.get<Slot[]>('/slots', { params });
// レスポンス: Slot[]型
```

**状態管理**:
```typescript
const [slots, setSlots] = useState<Slot[]>([]);
const [fromDate, setFromDate] = useState('');
const [toDate, setToDate] = useState('');
const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

---

### U-02: 予約枠詳細画面

**パス**: `/slots/:slotId`

**認証**: 不要（予約ボタン押下時にログインチェック）

**表示内容**:
```
┌─────────────────────────────────────────────────┐
│  ← 戻る                                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  予約枠詳細                                      │
│                                                 │
│  メニュー: 30分コース                            │
│  日時: 2025-12-15 10:00 〜 10:30               │
│  定員: 5人                                       │
│  予約済み: 3人                                   │
│  残席: 2人                                       │
│                                                 │
│  説明:                                           │
│  初心者向けの30分コースです。                     │
│                                                 │
│  [    この枠を予約する    ]                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**機能**:
- `GET /api/slots/{slotId}` で枠詳細取得
- 「この枠を予約する」ボタン:
  - 未ログイン → ログイン画面へリダイレクト
  - ログイン済み → 予約作成API呼び出し → 予約完了画面へ

**API連携**:
```typescript
// GET /api/slots/:slotId
const response = await apiClient.get<Slot>(`/slots/${slotId}`);

// POST /api/reservations
const reservationRequest: ReservationRequest = {
  slotId: Number(slotId),
  notes: '備考欄（オプション）'
};

const reservationResponse = await apiClient.post<Reservation>('/reservations', reservationRequest);
```

---

### U-05: 自分の予約一覧画面

**パス**: `/reservations/my`

**認証**: 必須

**表示内容**:
```
┌─────────────────────────────────────────────────┐
│  ヘッダー                                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  自分の予約一覧（進行中）                         │
│                                                 │
│  ┌────────────────────────────────┐            │
│  │ 30分コース                      │            │
│  │ 2025-12-15 10:00 〜 10:30      │            │
│  │ 予約日時: 2025-12-13 10:00     │            │
│  │ ステータス: 予約中              │            │
│  │ [キャンセル]                    │            │
│  └────────────────────────────────┘            │
│                                                 │
│  ┌────────────────────────────────┐            │
│  │ 60分コース                      │            │
│  │ 2025-12-16 14:00 〜 15:00      │            │
│  │ 予約日時: 2025-12-13 11:00     │            │
│  │ ステータス: 予約中              │            │
│  │ キャンセル不可（24時間前を過ぎています）│        │
│  └────────────────────────────────┘            │
│                                                 │
│  [予約履歴を見る]                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**機能**:
- `GET /api/reservations/my` で予約一覧取得
- キャンセルボタン:
  - キャンセル可能期間内 → 確認ダイアログ → `PATCH /api/reservations/{id}/cancel`
  - 期限切れ → ボタン非表示またはグレーアウト

**API連携**:
```typescript
// GET /api/reservations/my
const response = await apiClient.get<Reservation[]>('/reservations/my');

// PATCH /api/reservations/:id/cancel
await apiClient.patch(`/reservations/${reservationId}/cancel`);
```

---

### S-02: メニュー管理画面（STAFF）

**パス**: `/staff/menus`

**認証**: STAFF

**表示内容**:
```
┌─────────────────────────────────────────────────┐
│  メニュー管理                                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  [+ 新規メニュー作成]                            │
│                                                 │
│  メニュー一覧                                    │
│                                                 │
│  ┌────────────────────────────────┐            │
│  │ 30分コース                      │            │
│  │ 所要時間: 30分                  │            │
│  │ 料金: 1000円                    │            │
│  │ [編集] [削除]                   │            │
│  └────────────────────────────────┘            │
│                                                 │
│  ┌────────────────────────────────┐            │
│  │ 60分コース                      │            │
│  │ 所要時間: 60分                  │            │
│  │ 料金: 2000円                    │            │
│  │ [編集] [削除]                   │            │
│  └────────────────────────────────┘            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**機能**:
- `GET /api/service-menus` でメニュー一覧取得
- 新規作成 → モーダルまたは別画面
- 編集・削除ボタン

**API連携**:
```typescript
// GET /api/service-menus
const response = await apiClient.get<ServiceMenu[]>('/service-menus');

// POST /api/service-menus
const menuRequest: ServiceMenuRequest = {
  name: '90分コース',
  description: '説明文',
  durationMinutes: 90,
  price: 3000
};
const createResponse = await apiClient.post<ServiceMenu>('/service-menus', menuRequest);

// PUT /api/service-menus/:id
await apiClient.put<ServiceMenu>(`/service-menus/${menuId}`, menuRequest);

// DELETE /api/service-menus/:id
await apiClient.delete(`/service-menus/${menuId}`);
```

---

### S-04: 予約枠作成画面（STAFF）

**パス**: `/staff/slots/create`

**認証**: STAFF

**表示内容**:
```
┌─────────────────────────────────────────────────┐
│  予約枠作成                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  メニュー                                        │
│  [30分コース ▼]                                  │
│                                                 │
│  開始日時                                        │
│  [2025-12-15] [10:00]                           │
│                                                 │
│  終了日時                                        │
│  [2025-12-15] [10:30]                           │
│  ※ メニューの所要時間から自動計算               │
│                                                 │
│  定員                                            │
│  [5]                                            │
│                                                 │
│  [キャンセル]  [    作成    ]                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**機能**:
- メニュー選択 → 所要時間から終了日時を自動計算
- `POST /api/slots` で枠作成
- 成功時 → 予約枠管理画面へ戻る

**API連携**:
```typescript
// POST /api/slots
const slotRequest: SlotRequest = {
  serviceMenuId: 1,
  startTime: '2025-12-15T10:00:00',
  endTime: '2025-12-15T10:30:00',
  capacity: 5
};

const response = await apiClient.post<Slot>('/slots', slotRequest);
```

---

## API連携仕様

### バックエンドAPI概要

**ベースURL**: `http://localhost:8080/api` (Viteプロキシ経由で `/api`からアクセス可)

### 主要エンドポイント

#### 認証API

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | `/api/auth/signup` | 新規登録 | 不要 |
| POST | `/api/auth/login` | ログイン | 不要 |
| GET | `/api/auth/verify` | メール確認 | 不要 |
| GET | `/api/auth/google` | Googleログイン開始 | 不要 |
| POST | `/api/auth/logout` | ログアウト | 必須 |

#### サービスメニューAPI

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/service-menus` | 一覧取得 | 不要 |
| GET | `/api/service-menus/:id` | 詳細取得 | 不要 |
| POST | `/api/service-menus` | 作成 | STAFF |
| PUT | `/api/service-menus/:id` | 更新 | STAFF |
| DELETE | `/api/service-menus/:id` | 削除 | STAFF |

#### 予約枠API

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/slots` | 公開枠一覧 | 不要 |
| GET | `/api/slots/:id` | 詳細取得 | 不要 |
| POST | `/api/slots` | 作成 | STAFF |
| PUT | `/api/slots/:id` | 更新 | STAFF |
| DELETE | `/api/slots/:id` | 削除 | STAFF |

#### 予約API

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | `/api/reservations` | 予約作成 | USER |
| GET | `/api/reservations/my` | 自分の予約一覧 | USER |
| PATCH | `/api/reservations/:id/cancel` | 予約キャンセル | USER |

### エラーレスポンス形式

すべてのエラーは以下の形式で返されます：

```json
{
  "error": "ERROR_CODE",
  "message": "ユーザー向けエラーメッセージ",
  "timestamp": "2026-01-02T10:00:00+09:00",
  "status": 400,
  "fieldErrors": {
    "email": "メールアドレスの形式が不正です",
    "password": "パスワードは8文字以上である必要があります"
  }
}
```

### HTTPステータスコード

| コード | 説明 | 用途 |
|-------|------|------|
| 200 OK | 成功 | GET、PATCH成功時 |
| 201 Created | 作成成功 | POST成功時 |
| 204 No Content | 成功（レスポンスなし） | ログアウト、削除成功時 |
| 400 Bad Request | バリデーションエラー | 入力不正 |
| 401 Unauthorized | 未認証 | ログイン必要 |
| 403 Forbidden | 権限不足 | ロール不足 |
| 404 Not Found | リソース未存在 | 指定IDなし |
| 409 Conflict | リソース競合 | 定員超過、重複予約 |

---

## レスポンシブデザイン要件

### ブレークポイント

| デバイス | 幅 | レイアウト |
|---------|-----|---------|
| モバイル | 〜 767px | 1カラム、ハンバーガーメニュー |
| タブレット | 768px 〜 1023px | 2カラム可、メニュー展開 |
| デスクトップ | 1024px 〜 | 3カラム可、サイドバーメニュー |

### レスポンシブ対応

#### モバイル（〜767px）
- 1カラムレイアウト
- ハンバーガーメニュー
- タッチ操作に適したボタンサイズ（最小44px×44px）
- フォント: 16px以上（ズーム防止）

#### タブレット（768px〜1023px）
- 2カラムレイアウト可能
- メニュー展開
- カードを2列表示

#### デスクトップ（1024px〜）
- 3カラムレイアウト可能
- サイドバーメニュー常時表示
- カードを3列表示

### 推奨CSSフレームワーク

- **Tailwind CSS**: ユーティリティファーストのCSSフレームワーク
- **Material-UI (MUI)**: Reactコンポーネントライブラリ
- **素のCSS**: カスタムスタイルも可

---

## FigmaAI実装時の注意事項

### 1. 既存コードの活用

**重要**: Phase 8で作成した以下のコードを**必ず活用**してください。

- `src/types/index.ts`: 型定義（そのまま使用）
- `src/api/client.ts`: API client（そのまま使用）
- `src/api/serviceMenuApi.ts`: API実装のサンプル（パターンを踏襲）

### 2. ルーティング設定

React Router DOMを使用してルーティングを設定してください。

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SlotListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/slots/:slotId" element={<SlotDetailPage />} />
        <Route path="/reservations/my" element={<MyReservationsPage />} />
        <Route path="/staff/menus" element={<StaffMenusPage />} />
        {/* その他のルート */}
      </Routes>
    </BrowserRouter>
  );
}
```

### 3. 認証状態の管理

Context APIまたは状態管理ライブラリを使用して、ユーザー認証状態を管理してください。

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (user: User) => setUser(user);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 4. Protected Route（認証が必要なルート）

未ログインユーザーがアクセスできないルートを保護してください。

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};
```

### 5. 日時フォーマット

ISO 8601形式の日時文字列を日本語表示に変換するユーティリティを作成してください。

```typescript
// src/utils/dateUtils.ts
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

// 使用例: "2025-12-15T10:00:00" → "2025/12/15 10:00"
```

### 6. エラーハンドリングのパターン

すべてのAPI呼び出しでエラーハンドリングを実装してください。

```typescript
const fetchSlots = async () => {
  setLoading(true);
  setError('');

  try {
    const response = await apiClient.get<Slot[]>('/slots');
    setSlots(response.data);
  } catch (error) {
    console.error('予約枠の取得に失敗しました', error);
    setError('予約枠の取得に失敗しました。もう一度お試しください。');
  } finally {
    setLoading(false);
  }
};
```

### 7. ローディング状態の表示

非同期処理中は必ずローディング表示を行ってください。

```typescript
{loading && <LoadingSpinner />}
{error && <ErrorMessage message={error} type="error" />}
{!loading && !error && slots.length === 0 && <p>予約可能な枠がありません</p>}
{!loading && !error && slots.map(slot => <SlotCard key={slot.id} slot={slot} />)}
```

### 8. アクセシビリティ

- ボタン、リンクには適切な`aria-label`を設定
- フォーム入力には`label`を関連付け
- キーボード操作をサポート

### 9. テスト用のモックデータ

開発初期段階では、APIが動作しない場合に備えてモックデータを用意してください。

```typescript
// src/mocks/slotsMock.ts
import type { Slot } from '../types';

export const mockSlots: Slot[] = [
  {
    id: 1,
    serviceMenuId: 1,
    serviceMenuName: '30分コース',
    startTime: '2025-12-15T10:00:00',
    endTime: '2025-12-15T10:30:00',
    status: 'AVAILABLE',
    capacity: 5,
  },
  // ...
];
```

### 10. 開発サーバーの起動

フロントエンド開発サーバーとバックエンドサーバーを**両方起動**してください。

```bash
# バックエンド（ポート8080）
cd /Users/yanagitanaoki/Documents/ReservationSystem/reservation
./gradlew bootRun

# フロントエンド（ポート5173）
cd /Users/yanagitanaoki/Documents/ReservationSystem/reservation-frontend
npm run dev
```

---

## まとめ

このプロンプトに記載された内容に従って、FigmaでUIデザインを作成し、FigmaAIでReactコンポーネントを生成してください。

**重要なポイント**:
1. ✅ **既存の型定義とAPI clientを活用**（再作成不要）
2. ✅ **画面遷移・UI設計書に記載された画面を全て実装**
3. ✅ **API設計書に記載されたエンドポイントを使用**
4. ✅ **レスポンシブデザイン対応**
5. ✅ **エラーハンドリングとローディング表示**

不明点があれば、次のセッションでご質問ください。

---

**生成日**: 2026-01-02
**作成者**: Claude Sonnet 4.5
