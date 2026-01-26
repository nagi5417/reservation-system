# Phase 8実装ガイド（フロントエンド環境構築）

このガイドは、Phase 8で実施したフロントエンド環境構築の全工程を詳細に解説したものです。

---

## 📋 目次

1. [Phase 8の目的](#phase-8の目的)
2. [使用する技術スタック](#使用する技術スタック)
3. [環境構築の全工程](#環境構築の全工程)
4. [作成したファイルの詳細解説](#作成したファイルの詳細解説)
5. [なぜこの構成なのか](#なぜこの構成なのか)
6. [次のステップ](#次のステップ)
7. [よくある質問](#よくある質問)

---

## Phase 8の目的

Phase 8では、以下を実現しました：

1. **Reactプロジェクトの作成** - フロントエンド開発の基盤
2. **TypeScript環境の構築** - 型安全なコード開発
3. **APIクライアントの設定** - バックエンドとの通信
4. **開発環境の整備** - 効率的な開発のための設定

**なぜフロントエンドが必要？**
- バックエンドAPIだけでは、ユーザーが使える画面がない
- Webブラウザで動作するUIを提供するため
- ユーザーフレンドリーな操作を実現するため

---

## 使用する技術スタック

### 1. React（リアクト）

**何のため：** UIを構築するためのJavaScriptライブラリ

**なぜReact？**
- コンポーネントベースで再利用しやすい
- 仮想DOMで高速
- 大規模なコミュニティとエコシステム
- 学習リソースが豊富

**React 19の特徴：**
- 最新の安定版
- パフォーマンス向上
- 新しいフック機能

---

### 2. TypeScript（タイプスクリプト）

**何のため：** JavaScriptに型システムを追加

**なぜTypeScript？**
- 型チェックでバグを早期発見
- コード補完が効く（開発効率UP）
- リファクタリングが安全
- 大規模開発に適している

**JavaScriptとの違い：**
```javascript
// JavaScript（型なし）
function add(a, b) {
  return a + b;
}
add("1", "2");  // "12" になってしまう（バグ）

// TypeScript（型あり）
function add(a: number, b: number): number {
  return a + b;
}
add("1", "2");  // エラー！コンパイル時に発見
```

---

### 3. Vite（ヴィート）

**何のため：** 高速な開発サーバーとビルドツール

**なぜVite？**
- 起動が超高速（Create React Appの10倍以上）
- ホットリロードが速い（変更がすぐ反映）
- モダンなビルドツール（ESModules使用）
- 設定がシンプル

**Create React Appとの比較：**
| 項目 | Vite | Create React App |
|------|------|------------------|
| 起動速度 | 超高速（~1秒） | 遅い（~30秒） |
| ビルド速度 | 高速 | 普通 |
| 設定 | シンプル | 複雑 |
| 推奨度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

### 4. Axios（アクシオス）

**何のため：** HTTPクライアント（API通信）

**なぜAxios？**
- Promiseベースで使いやすい
- インターセプター機能（共通処理を一箇所に）
- エラーハンドリングが簡単
- リクエスト/レスポンスの変換が柔軟

**fetchとの比較：**
```typescript
// fetch（標準API）
fetch('http://localhost:8080/api/service-menus')
  .then(response => response.json())  // JSONパース必要
  .then(data => console.log(data))
  .catch(error => console.error(error));

// Axios
axios.get('/api/service-menus')
  .then(response => console.log(response.data))  // 自動JSONパース
  .catch(error => console.error(error));
```

---

### 5. React Router DOM

**何のため：** ページ遷移の管理

**なぜ必要？**
- シングルページアプリケーション（SPA）でページ遷移を実現
- URLとコンポーネントを紐付ける
- ブラウザの戻る/進むボタンに対応

**例：**
```
/ → トップページ
/service-menus → サービスメニュー一覧
/reservations → 予約一覧
```

---

## 環境構築の全工程

### 工程1: プロジェクトディレクトリの作成

**実行したコマンド：**
```bash
cd /Users/yanagitanaoki/Documents/ReservationSystem
npm create vite@latest reservation-frontend -- --template react-ts
```

**何をしているか：**
1. `npm create vite@latest` → Viteの最新版でプロジェクト作成
2. `reservation-frontend` → プロジェクト名
3. `-- --template react-ts` → React + TypeScriptテンプレートを使用

**オプションの意味：**
- `@latest` : 最新バージョンを使用
- `--` : npmコマンドとViteコマンドの引数を区切る
- `--template react-ts` : React + TypeScript テンプレート

**なぜこのコマンド？**
- 手動で設定ファイルを作るより、テンプレートを使う方が速い
- 公式テンプレートは、ベストプラクティスに沿っている
- 必要最小限の設定で済む

**実行結果：**
```
reservation-frontend/
├── node_modules/     # 依存関係（後でインストール）
├── public/           # 静的ファイル
├── src/              # ソースコード
│   ├── App.tsx       # メインコンポーネント
│   ├── main.tsx      # エントリーポイント
│   └── ...
├── index.html        # HTMLテンプレート
├── package.json      # プロジェクト設定
├── tsconfig.json     # TypeScript設定
└── vite.config.ts    # Vite設定
```

---

### 工程2: 基本依存関係のインストール

**実行したコマンド：**
```bash
cd reservation-frontend
npm install
```

**何をしているか：**
1. `package.json`に記載された依存関係を読み込む
2. `node_modules/`ディレクトリにライブラリをダウンロード
3. `package-lock.json`を生成（バージョン固定）

**インストールされる主要なパッケージ：**
- `react`: React本体
- `react-dom`: ReactをDOMにレンダリング
- `typescript`: TypeScriptコンパイラ
- `vite`: ビルドツール
- `@vitejs/plugin-react`: ViteでReactを使うためのプラグイン

**なぜこの順番？**
- プロジェクト作成 → ディレクトリ移動 → インストール
- この順番でないと、正しい場所にインストールされない

**実行結果：**
```
added 222 packages, and audited 223 packages in 32s
found 0 vulnerabilities
```

**意味：**
- 222個のパッケージがインストールされた
- セキュリティの脆弱性は見つからなかった

---

### 工程3: 追加ライブラリのインストール

**実行したコマンド：**
```bash
npm install axios react-router-dom
```

**何をしているか：**
- `axios`: API通信ライブラリをインストール
- `react-router-dom`: ルーティングライブラリをインストール

**なぜ追加でインストール？**
- Viteのテンプレートには含まれていない
- プロジェクトの要件に応じて追加する

**バージョン確認：**
```bash
npm list axios react-router-dom
```

**installとciの違い：**
```bash
npm install    # package.jsonから最新版をインストール
npm ci         # package-lock.jsonから厳密にインストール（CI/CD用）
```

---

### 工程4: ディレクトリ構成の作成

**実行したコマンド：**
```bash
cd src
mkdir -p api components pages types hooks utils
```

**何をしているか：**
- `mkdir -p`: 複数のディレクトリを一度に作成
- `-p`: 親ディレクトリがなくても作成（エラー回避）

**作成されたディレクトリ：**

```
src/
├── api/          # API関連のコード
├── components/   # 再利用可能なUIコンポーネント
├── pages/        # ページコンポーネント
├── types/        # TypeScript型定義
├── hooks/        # カスタムフック
└── utils/        # ユーティリティ関数
```

**なぜこの構成？**

**1. api/ ディレクトリ**
- API通信のコードを一箇所に集約
- バックエンドとの通信ロジックを分離
- 例: `serviceMenuApi.ts`, `slotApi.ts`

**2. components/ ディレクトリ**
- 再利用可能なUIコンポーネント
- 複数ページで使用される部品
- 例: `Button.tsx`, `Navbar.tsx`, `Modal.tsx`

**3. pages/ ディレクトリ**
- 各ページのコンポーネント
- URLに対応する画面
- 例: `HomePage.tsx`, `ServiceMenuListPage.tsx`

**4. types/ ディレクトリ**
- TypeScriptの型定義
- API レスポンスの型
- 例: `ServiceMenu`, `Slot`, `Reservation`

**5. hooks/ ディレクトリ**
- カスタムフック（ロジックの再利用）
- 例: `useAuth.ts`, `useApi.ts`

**6. utils/ ディレクトリ**
- ユーティリティ関数
- 例: `formatDate.ts`, `validation.ts`

**他の構成方法との比較：**

```
# 機能別（推奨）
src/
├── api/
├── components/
└── pages/

# ページ別（大規模プロジェクト向け）
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── api/
│   │   └── pages/
│   └── reservations/
│       ├── components/
│       ├── api/
│       └── pages/
```

今回は中規模プロジェクトなので、機能別の構成を採用しました。

---

### 工程5: TypeScript型定義の作成

**作成したファイル：** `src/types/index.ts`

**なぜこのファイルが必要？**
- バックエンドのDTOと一致する型定義
- TypeScriptの型チェックを有効化
- APIレスポンスの構造を明確化
- コード補完が効く

**ファイルの内容（抜粋）：**

```typescript
// src/types/index.ts

// サービスメニューの型定義
export interface ServiceMenu {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}
```

**各行の解説：**

```typescript
export interface ServiceMenu {
```
- `export`: 他のファイルから使用可能にする
- `interface`: TypeScriptの型定義
- `ServiceMenu`: 型の名前（バックエンドのDTOと同じ）

```typescript
  id: number;
```
- `id`: フィールド名
- `number`: TypeScript の数値型（Javaの`Long`に対応）
- `;`: フィールドの区切り

```typescript
  name: string;
```
- `string`: TypeScript の文字列型（Javaの`String`に対応）

```typescript
  durationMinutes: number;
  price: number;
```
- JavaのDTOフィールドと1対1で対応

**バックエンド（Java）との対応：**

```java
// Java (ServiceMenuResponse.java)
public class ServiceMenuResponse {
    private Long id;
    private String name;
    private String description;
    private Integer durationMinutes;
    private Integer price;
}
```

```typescript
// TypeScript (types/index.ts)
export interface ServiceMenu {
  id: number;              // Long → number
  name: string;            // String → string
  description: string;     // String → string
  durationMinutes: number; // Integer → number
  price: number;           // Integer → number
}
```

**型の対応表：**

| Java | TypeScript |
|------|------------|
| Long | number |
| Integer | number |
| String | string |
| Boolean | boolean |
| LocalDateTime | string（ISO 8601形式） |
| List<T> | T[] |

**Slotの型定義：**

```typescript
export interface Slot {
  id: number;
  serviceMenuId: number;
  serviceMenuName: string;
  startTime: string;           // LocalDateTime → string
  endTime: string;             // LocalDateTime → string
  status: string;
  capacity: number;
}
```

**なぜstartTimeがstring？**
- JavaのLocalDateTimeはJSONで文字列として送信される
- 例: `"2026-01-10T10:00:00"`
- TypeScriptでは`string`として受け取り、必要に応じて`Date`に変換

**リクエスト型の定義：**

```typescript
export interface ServiceMenuRequest {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}
```

**なぜResponseとRequestで別の型？**
- Response: `id`がある（サーバーが自動採番）
- Request: `id`がない（新規作成時は不要）
- 明確に区別することでバグ防止

**エラーレスポンスの型：**

```typescript
export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  status: number;
  fieldErrors?: Record<string, string>;  // オプショナル
}
```

**`?`の意味：**
- オプショナルフィールド（あってもなくても良い）
- `fieldErrors`はバリデーションエラー時のみ存在

**`Record<string, string>`の意味：**
- キーが`string`、値も`string`のオブジェクト
- 例: `{ "email": "メールアドレスの形式が正しくありません" }`

---

### 工程6: Axiosクライアントの設定

**作成したファイル：** `src/api/client.ts`

**なぜこのファイルが必要？**
- Axiosの設定を一箇所に集約
- 全てのAPI呼び出しで共通設定を使用
- インターセプターで共通処理を実装

**ファイルの内容：**

```typescript
import axios from 'axios';

// Axiosインスタンスの作成
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**各行の詳細解説：**

```typescript
import axios from 'axios';
```
- `axios`パッケージをインポート
- インストールしたライブラリを使用可能にする

```typescript
const apiClient = axios.create({
```
- `axios.create()`: 設定済みインスタンスを作成
- `const`: 定数（変更不可）
- `apiClient`: 変数名（好きな名前でOK）

```typescript
  baseURL: '/api',
```
- **baseURL**: 全てのリクエストの基準URL
- `/api` → Viteプロキシが`http://localhost:8080/api`に転送
- 例: `apiClient.get('/service-menus')` → `http://localhost:8080/api/service-menus`

**なぜ `/api` だけ？**
- Viteのプロキシ機能を使用（後述）
- フロントエンド: `http://localhost:5173`
- バックエンド: `http://localhost:8080`
- プロキシで自動転送するため、フルURLは不要

```typescript
  timeout: 10000,
```
- **timeout**: タイムアウト時間（ミリ秒）
- 10000ms = 10秒
- 10秒以内にレスポンスがない場合、エラー

**なぜ10秒？**
- 短すぎる: ネットワークが遅い時にエラー
- 長すぎる: ユーザーが待たされる
- 10秒は一般的なバランス

```typescript
  headers: {
    'Content-Type': 'application/json',
  },
```
- **headers**: 全リクエストに付与されるヘッダー
- `Content-Type`: 送信するデータの形式
- `application/json`: JSON形式で送信

**リクエストインターセプター：**

```typescript
apiClient.interceptors.request.use(
  (config) => {
    // リクエスト送信前の処理
    // 将来的に認証トークンを追加
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

**何をしているか：**
1. **リクエストインターセプター**: 全てのリクエストの前に実行される処理
2. `config`: リクエストの設定オブジェクト
3. `return config`: 設定を返す（リクエスト続行）

**なぜインターセプター？**
- 全てのAPIリクエストに共通処理を追加
- 認証トークンを自動的に付与（将来実装）
- 各API呼び出しで個別に書かなくて済む

**コメントアウトされている理由：**
- 現在は認証機能未実装
- Phase 9以降で実装予定
- 準備だけしておく

**レスポンスインターセプター：**

```typescript
apiClient.interceptors.response.use(
  (response) => {
    // レスポンス成功時
    return response;
  },
  (error) => {
    // エラー時の共通処理
    if (error.response) {
      // サーバーからエラーレスポンス
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // リクエストは送信されたが、レスポンスなし
      console.error('Network Error:', error.message);
    } else {
      // その他のエラー
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);
```

**何をしているか：**
1. **レスポンスインターセプター**: 全てのレスポンスの後に実行される処理
2. 成功時: そのまま返す
3. エラー時: エラーの種類を判別してログ出力

**エラーの種類：**

1. **error.response** - サーバーがエラーを返した
   ```
   例: 404 Not Found, 400 Bad Request
   error.response.data にエラーメッセージ
   ```

2. **error.request** - リクエストは送信されたが、レスポンスなし
   ```
   例: ネットワーク切断、サーバーダウン
   ```

3. **その他** - リクエスト設定のエラー
   ```
   例: 設定ミス
   ```

**最後のexport：**

```typescript
export default apiClient;
```
- `default export`: このファイルのメインエクスポート
- 他のファイルで `import apiClient from './api/client'` と使える

---

### 工程7: サンプルAPIサービスの作成

**作成したファイル：** `src/api/serviceMenuApi.ts`

**なぜこのファイルが必要？**
- APIエンドポイントごとに関数を定義
- コンポーネントから簡単に呼び出せる
- API呼び出しロジックを一箇所に集約

**ファイルの内容：**

```typescript
import apiClient from './client';
import type { ServiceMenu, ServiceMenuRequest } from '../types';

export const serviceMenuApi = {
  // 全サービスメニュー取得
  getAll: async (): Promise<ServiceMenu[]> => {
    const response = await apiClient.get<ServiceMenu[]>('/service-menus');
    return response.data;
  },

  // ID指定で取得
  getById: async (id: number): Promise<ServiceMenu> => {
    const response = await apiClient.get<ServiceMenu>(`/service-menus/${id}`);
    return response.data;
  },

  // 新規作成
  create: async (data: ServiceMenuRequest): Promise<ServiceMenu> => {
    const response = await apiClient.post<ServiceMenu>('/service-menus', data);
    return response.data;
  },

  // 更新
  update: async (id: number, data: ServiceMenuRequest): Promise<ServiceMenu> => {
    const response = await apiClient.put<ServiceMenu>(`/service-menus/${id}`, data);
    return response.data;
  },

  // 削除
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/service-menus/${id}`);
  },
};
```

**各行の詳細解説：**

```typescript
import apiClient from './client';
```
- 先ほど作成したAxiosクライアントをインポート

```typescript
import type { ServiceMenu, ServiceMenuRequest } from '../types';
```
- `type`: 型のみをインポート（実行時には不要）
- `ServiceMenu`: レスポンスの型
- `ServiceMenuRequest`: リクエストの型
- `../types`: 1つ上のディレクトリの`types`フォルダ

**なぜ `type` キーワード？**
- TypeScriptのコンパイル後に消える（軽量化）
- 型だけが必要な場合に使用

```typescript
export const serviceMenuApi = {
```
- オブジェクトとして複数の関数をエクスポート
- `serviceMenuApi.getAll()` のように呼び出せる

**getAll関数の解説：**

```typescript
getAll: async (): Promise<ServiceMenu[]> => {
```
- `async`: 非同期関数（Promiseを返す）
- `()`: 引数なし
- `Promise<ServiceMenu[]>`: ServiceMenuの配列を返すPromise

**なぜasync？**
- API呼び出しは時間がかかる（非同期処理）
- `await`を使って結果を待つ

```typescript
const response = await apiClient.get<ServiceMenu[]>('/service-menus');
```
- `await`: レスポンスが返ってくるまで待つ
- `apiClient.get`: GETリクエストを送信
- `<ServiceMenu[]>`: レスポンスの型を指定（TypeScript）
- `'/service-menus'`: エンドポイント
  - 実際のURL: `http://localhost:8080/api/service-menus`

```typescript
return response.data;
```
- `response.data`: Axiosはデータを`data`プロパティに格納
- 型: `ServiceMenu[]`

**getById関数の解説：**

```typescript
getById: async (id: number): Promise<ServiceMenu> => {
  const response = await apiClient.get<ServiceMenu>(`/service-menus/${id}`);
  return response.data;
},
```
- `(id: number)`: 引数としてIDを受け取る
- `` `/service-menus/${id}` ``: テンプレートリテラル（変数を埋め込める）
  - 例: id=1 → `/service-menus/1`

**create関数の解説：**

```typescript
create: async (data: ServiceMenuRequest): Promise<ServiceMenu> => {
  const response = await apiClient.post<ServiceMenu>('/service-menus', data);
  return response.data;
},
```
- `data: ServiceMenuRequest`: 作成するデータ
- `apiClient.post`: POSTリクエスト
- 第2引数の`data`: リクエストボディ

**update関数の解説：**

```typescript
update: async (id: number, data: ServiceMenuRequest): Promise<ServiceMenu> => {
  const response = await apiClient.put<ServiceMenu>(`/service-menus/${id}`, data);
  return response.data;
},
```
- `apiClient.put`: PUTリクエスト
- IDとデータの両方が必要

**delete関数の解説：**

```typescript
delete: async (id: number): Promise<void> => {
  await apiClient.delete(`/service-menus/${id}`);
},
```
- `Promise<void>`: 戻り値なし
- DELETEは204 No Contentを返すため

**使用例：**

```typescript
// コンポーネントから使用
import { serviceMenuApi } from '../api/serviceMenuApi';

// 全取得
const menus = await serviceMenuApi.getAll();

// ID指定取得
const menu = await serviceMenuApi.getById(1);

// 新規作成
const newMenu = await serviceMenuApi.create({
  name: 'ヘアカット',
  description: '基本的なヘアカット',
  durationMinutes: 30,
  price: 3000,
});

// 更新
const updated = await serviceMenuApi.update(1, {
  name: 'ヘアカット（更新）',
  description: '...',
  durationMinutes: 45,
  price: 4000,
});

// 削除
await serviceMenuApi.delete(1);
```

---

### 工程8: Viteプロキシ設定

**編集したファイル：** `vite.config.ts`

**なぜこの設定が必要？**
- フロントエンド（5173）とバックエンド（8080）は別ポート
- ブラウザのCORS制限を回避
- 本番環境と同じ構成でローカル開発

**CORS問題とは？**

```
フロントエンド: http://localhost:5173
↓ APIリクエスト
バックエンド: http://localhost:8080

→ ブラウザがブロック！（異なるオリジン）
```

**プロキシの仕組み：**

```
ブラウザ
↓ /api/service-menus
Viteサーバー (5173)
↓ プロキシ転送
バックエンド (8080) /api/service-menus
```

**修正前：**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**修正後：**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

**追加した部分の解説：**

```typescript
server: {
```
- Vite開発サーバーの設定

```typescript
  proxy: {
```
- プロキシの設定オブジェクト

```typescript
    '/api': {
```
- `/api`で始まるリクエストをプロキシ対象にする
- 例: `/api/service-menus`, `/api/slots`

```typescript
      target: 'http://localhost:8080',
```
- 転送先のURL
- Spring Bootサーバーのアドレス

```typescript
      changeOrigin: true,
```
- リクエストのOriginヘッダーを変更
- CORS問題を回避

**動作確認：**

```typescript
// フロントエンドコードでこう書くと
axios.get('/api/service-menus')

// 実際にはこうリクエストされる
http://localhost:8080/api/service-menus
```

**プロキシなしの場合（エラー）：**

```
Access to XMLHttpRequest at 'http://localhost:8080/api/service-menus'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**プロキシありの場合（成功）：**

```
ブラウザ → Vite (5173) → Spring Boot (8080)
        ← Vite (5173) ← Spring Boot (8080)
```

---

### 工程9: 開発サーバーの起動

**実行したコマンド：**
```bash
cd reservation-frontend
npm run dev
```

**何をしているか：**
- `npm run dev`: package.jsonの`dev`スクリプトを実行
- Viteの開発サーバーを起動

**package.jsonの該当箇所：**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

- `dev`: 開発サーバー起動
- `build`: 本番用ビルド
- `preview`: ビルド結果のプレビュー

**起動ログ：**

```
VITE v7.3.0  ready in 846 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**各項目の意味：**
- `ready in 846 ms`: 起動にかかった時間
- `Local: http://localhost:5173/`: ローカルアクセスURL
- `Network`: ネットワーク経由のアクセス（デフォルトは無効）

**なぜ5173ポート？**
- Viteのデフォルトポート
- 変更も可能（vite.config.ts）

**開発サーバーの特徴：**

1. **ホットリロード**
   - ファイルを保存すると自動的にブラウザが更新
   - ページ全体をリロードせず、変更部分だけ更新

2. **高速起動**
   - ESModulesを使用
   - バンドル不要で起動が速い

3. **エラー表示**
   - コンパイルエラーをブラウザに表示
   - デバッグが簡単

**停止方法：**
```bash
Ctrl + C
```

**バックグラウンド実行（今回使用）：**
```bash
npm run dev &
```
- `&`: バックグラウンドで実行
- ターミナルを使い続けられる

---

## 作成したファイルの詳細解説

### ファイル1: types/index.ts

**目的：** TypeScript型定義の一元管理

**なぜ必要？**
- バックエンドとフロントエンドの型を一致させる
- TypeScriptの型チェックを有効化
- コード補完を効かせる

**全体構成：**

```typescript
// 1. レスポンス型（サーバーから返ってくるデータ）
export interface ServiceMenu { ... }
export interface Slot { ... }
export interface User { ... }
export interface Reservation { ... }

// 2. リクエスト型（サーバーに送るデータ）
export interface RegisterRequest { ... }
export interface LoginRequest { ... }
export interface ServiceMenuRequest { ... }
export interface SlotRequest { ... }
export interface ReservationRequest { ... }

// 3. エラーレスポンス型
export interface ErrorResponse { ... }
```

**なぜ分けるか？**
- レスポンス: idフィールドがある
- リクエスト: idフィールドがない
- 明確に区別することでバグ防止

**オプショナルフィールド：**

```typescript
notes?: string;
```
- `?`: オプショナル（あってもなくても良い）
- undefinedも許可される

**Record型：**

```typescript
fieldErrors?: Record<string, string>
```
- キーが`string`、値も`string`のオブジェクト
- 動的なフィールド名に対応

---

### ファイル2: api/client.ts

**目的：** Axiosクライアントの設定

**なぜ必要？**
- 全API呼び出しで共通設定を使用
- インターセプターで共通処理を追加
- 設定の一元管理

**主要な設定：**

1. **baseURL**: `/api`
2. **timeout**: 10秒
3. **headers**: `Content-Type: application/json`

**インターセプターのメリット：**
- 全リクエストに認証トークンを自動追加
- 全レスポンスのエラーを一箇所で処理
- 個別のAPI呼び出しがシンプルになる

---

### ファイル3: api/serviceMenuApi.ts

**目的：** サービスメニューAPIの関数群

**なぜ必要？**
- APIエンドポイントごとに関数を定義
- コンポーネントから簡単に呼び出せる
- APIロジックとUIロジックを分離

**CRUD操作：**
- **C**reate: `create()`
- **R**ead: `getAll()`, `getById()`
- **U**pdate: `update()`
- **D**elete: `delete()`

**使用パターン：**

```typescript
// コンポーネント内
import { serviceMenuApi } from '../api/serviceMenuApi';

function MyComponent() {
  const [menus, setMenus] = useState<ServiceMenu[]>([]);

  useEffect(() => {
    const fetchMenus = async () => {
      const data = await serviceMenuApi.getAll();
      setMenus(data);
    };
    fetchMenus();
  }, []);

  return <div>{/* menusを表示 */}</div>;
}
```

---

### ファイル4: vite.config.ts

**目的：** Vite開発サーバーの設定

**なぜ必要？**
- プロキシ設定でCORS問題を回避
- 開発環境と本番環境の差異を最小化

**プロキシの動作：**

```
リクエスト: /api/service-menus
→ Viteサーバー (5173)
→ 転送: http://localhost:8080/api/service-menus
→ Spring Boot (8080)
← レスポンス
← Viteサーバー (5173)
← ブラウザ
```

**本番環境では？**
- Nginxなどのリバースプロキシを使用
- フロントエンドとバックエンドを同じドメインで提供

---

## なぜこの構成なのか

### 1. TypeScript を使う理由

**型安全性：**
```typescript
// 型エラーをコンパイル時に発見
const menu: ServiceMenu = {
  id: 1,
  name: 'ヘアカット',
  // description がない → エラー！
};
```

**コード補完：**
```typescript
menu.  // ← ここでIDEが候補を表示
// id, name, description, durationMinutes, price
```

**リファクタリングが安全：**
```typescript
// ServiceMenuの型を変更すると、
// 全ての使用箇所でエラーが出る
// → 修正漏れを防げる
```

---

### 2. ディレクトリを分ける理由

**関心の分離：**
- api/ : データ取得
- components/ : UI表示
- pages/ : ページ構成
- types/ : 型定義

**メリット：**
- どこに何があるか明確
- ファイルを探しやすい
- 複数人での開発がしやすい

**悪い例（全部srcに）：**
```
src/
├── App.tsx
├── ServiceMenu.tsx
├── ServiceMenuList.tsx
├── serviceMenuApi.ts
├── types.ts
├── Slot.tsx
├── slotApi.ts
└── ... （ファイルが増えると混乱）
```

---

### 3. APIクライアントを分離する理由

**変更に強い：**
```typescript
// バックエンドのエンドポイントが変更されても
// api/serviceMenuApi.ts だけ修正すればOK

// コンポーネントは変更不要
serviceMenuApi.getAll();  // 使い方は同じ
```

**テストしやすい：**
```typescript
// API関数をモックに差し替えられる
jest.mock('../api/serviceMenuApi');
```

---

### 4. Viteを使う理由

**速度比較：**

| ツール | 起動時間 | ホットリロード |
|--------|----------|---------------|
| Vite | ~1秒 | 瞬時 |
| Create React App | ~30秒 | 1-2秒 |
| Webpack | ~20秒 | 1-2秒 |

**開発体験が向上：**
- コードを書く → 即座に反映
- 待ち時間が減る → 生産性UP

---

## 次のステップ

### Phase 9で実装すること

**1. ルーティング設定**
- React Routerの設定
- ページ構成の決定
- ナビゲーションの実装

**2. 共通コンポーネント作成**
- ナビゲーションバー
- フッター
- ローディング表示
- エラー表示

**3. ページ実装**
- サービスメニュー一覧ページ
- 予約枠検索ページ
- 予約作成ページ

**4. 状態管理**
- ReactのuseStateとuseContextを使用
- ユーザー情報の管理
- 認証状態の管理

---

## よくある質問

### Q1: なぜReactを使うのですか？

**A:** 以下の理由でReactを選択しました：

1. **コンポーネントベース**
   - UIを部品化して再利用できる
   - 保守性が高い

2. **仮想DOM**
   - 高速なUI更新
   - パフォーマンスが良い

3. **エコシステム**
   - ライブラリが豊富
   - 学習リソースが多い

4. **求人需要**
   - 企業での採用が多い
   - キャリアに役立つ

**他のフレームワークとの比較：**

| フレームワーク | 特徴 | 学習難易度 |
|---------------|------|-----------|
| React | 柔軟、自由度高い | 中 |
| Vue | シンプル、学習しやすい | 低 |
| Angular | フルスタック、大規模向け | 高 |

---

### Q2: TypeScriptは必須ですか？

**A:** 必須ではありませんが、**強く推奨**します。

**メリット：**
- バグを早期発見
- コード補完が効く
- リファクタリングが安全

**デメリット：**
- 学習コストがある
- 型定義を書く手間

**結論：**
- 小規模プロジェクト: JavaScript でもOK
- 中規模以上: TypeScript推奨
- 今回のプロジェクト: TypeScript採用

---

### Q3: Axiosではなくfetchを使ってはダメですか？

**A:** fetchも使えますが、Axiosの方が便利です。

**fetch:**
```typescript
fetch('/api/service-menus')
  .then(response => {
    if (!response.ok) throw new Error('Error');
    return response.json();  // JSONパース必要
  })
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

**Axios:**
```typescript
axios.get('/api/service-menus')
  .then(response => console.log(response.data))  // 自動JSONパース
  .catch(error => console.error(error));
```

**Axiosのメリット：**
- 自動JSONパース
- インターセプター機能
- タイムアウト設定が簡単
- エラーハンドリングが統一

---

### Q4: なぜプロキシが必要ですか？

**A:** CORS問題を回避するためです。

**CORS（Cross-Origin Resource Sharing）:**
- ブラウザのセキュリティ機能
- 異なるオリジン間の通信を制限

**問題のケース：**
```
フロントエンド: http://localhost:5173
バックエンド:   http://localhost:8080
→ 異なるオリジン → ブラウザがブロック
```

**解決方法1: プロキシ（開発環境）**
```
Viteサーバーが代理でリクエスト
→ ブラウザからは同一オリジン
```

**解決方法2: CORS設定（本番環境）**
```java
// Spring Bootで設定
@CrossOrigin(origins = "https://example.com")
```

---

### Q5: なぜディレクトリを6つも作るのですか？

**A:** 役割を明確に分けるためです。

**メリット：**
1. **探しやすい**
   - APIコードは`api/`
   - 型定義は`types/`

2. **変更しやすい**
   - 影響範囲が明確
   - テストしやすい

3. **複数人開発**
   - 担当を分けやすい
   - コンフリクトしにくい

**小規模プロジェクトなら？**
```
src/
├── components/
├── pages/
└── api/
```
これだけでもOK。プロジェクトの規模に応じて調整。

---

### Q6: npm installとnpm ciの違いは？

**A:**

**npm install:**
- `package.json`から最新版をインストール
- `package-lock.json`を更新
- 開発時に使用

**npm ci:**
- `package-lock.json`から厳密にインストール
- `node_modules`を削除してから再インストール
- CI/CD環境で使用

**使い分け：**
```bash
# 開発環境
npm install

# 本番環境・CI/CD
npm ci
```

---

### Q7: baseURLを`/api`にする理由は？

**A:** Viteプロキシと組み合わせるためです。

**仕組み：**
```typescript
// コード
axios.get('/api/service-menus')

// Viteプロキシが変換
http://localhost:8080/api/service-menus
```

**なぜこの方式？**
1. コードがシンプル
2. 環境による切り替えが簡単
3. 本番環境でも同じコードが使える

**本番環境では：**
```
https://example.com/api/service-menus
→ Nginx等がバックエンドに転送
```

---

## まとめ

### Phase 8で達成したこと

1. ✅ React + TypeScript + Vite プロジェクト作成
2. ✅ 必要なライブラリのインストール
3. ✅ ディレクトリ構成の整備
4. ✅ TypeScript型定義の作成
5. ✅ Axiosクライアントの設定
6. ✅ Viteプロキシの設定
7. ✅ 開発サーバーの起動確認

### Phase 8で学んだ重要な概念

**1. TypeScript**
- 型システムによる安全性
- コード補完の向上
- リファクタリングの容易さ

**2. Axios**
- HTTPクライアントライブラリ
- インターセプター機能
- エラーハンドリング

**3. Vite**
- 高速な開発サーバー
- プロキシ機能
- ホットリロード

**4. プロジェクト構成**
- ディレクトリの役割分担
- 関心の分離
- 保守性の向上

### 次のPhase 9に向けて

**実装予定：**
- ルーティング設定（React Router）
- 共通コンポーネント作成
- ページ実装
- APIとの連携

**準備完了：**
- 開発環境が整った
- 型定義が完成
- APIクライアントが設定済み

---

**Phase 8 完了おめでとうございます！** 🎉

フロントエンド開発の基盤が整いました。
次はReact Routerを設定して、実際の画面を作っていきましょう！
