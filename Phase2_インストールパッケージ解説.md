# Phase 2: インストールパッケージ解説

このドキュメントは、Phase 2（認証画面の実装）でインストールしたパッケージの詳細解説です。

---

## 📦 インストールしたパッケージ一覧

### Phase 2-3で実行したコマンド

```bash
# コマンド1: Tailwind CSSとユーティリティパッケージ
npm install tailwindcss@4.1.12 @tailwindcss/vite@4.1.12 clsx tailwind-merge class-variance-authority

# コマンド2: Radix UIとアイコンパッケージ
npm install @radix-ui/react-slot@1.1.2 @radix-ui/react-label@2.1.2 lucide-react@0.487.0
```

**合計**: 8つのパッケージ（159の依存パッケージを含む）

---

## 1. Tailwind CSS関連（2つ）

### 1-1. `tailwindcss@4.1.12`

**何をするもの？**
- CSSフレームワーク
- ユーティリティクラスでスタイルを記述できる

**なぜ必要？**
- 従来のCSS: 別ファイルにスタイルを書く必要がある
- Tailwind CSS: HTMLに直接クラス名でスタイルを記述できる

**例**:
```tsx
// 従来のCSS
<button className="login-button">ログイン</button>
// styles.css に .login-button { background: blue; ... } を書く必要がある

// Tailwind CSS
<button className="bg-blue-500 text-white px-4 py-2 rounded">ログイン</button>
// CSSファイル不要！クラス名だけで完結
```

**よく使うクラス**:
- `bg-blue-500` - 背景色（青）
- `text-white` - 文字色（白）
- `px-4` - 左右のpadding（1rem）
- `py-2` - 上下のpadding（0.5rem）
- `rounded` - 角丸
- `flex` - Flexboxレイアウト
- `w-full` - 幅100%

**メリット**:
- CSSファイルを書かなくていい
- クラス名を考えなくていい
- レスポンシブデザインが簡単（`md:`, `lg:` プレフィックス）
- 未使用のスタイルは自動削除される（ファイルサイズ削減）

---

### 1-2. `@tailwindcss/vite@4.1.12`

**何をするもの？**
- Vite用のTailwind CSSプラグイン
- Tailwind CSS v4の新しいアプローチ

**なぜ必要？**
- ViteのビルドプロセスにTailwind CSSを統合
- 従来の`tailwind.config.js`が不要になる
- CSSファイルに`@import 'tailwindcss'`と書くだけで動く

**従来との違い**:
```javascript
// 従来（Tailwind CSS v3）
// tailwind.config.js が必要
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: { ... }
}

// Tailwind CSS v4
// tailwind.config.js 不要！
// src/styles/tailwind.css に以下を書くだけ
@import 'tailwindcss' source(none);
@source '../**/*.{js,ts,jsx,tsx}';
```

**設定場所**: `vite.config.ts`
```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

---

## 2. ユーティリティ関連（3つ）

### 2-1. `clsx`

**何をするもの？**
- クラス名を条件付きで結合するライブラリ

**なぜ必要？**
- 複数のクラス名を状態に応じて動的に切り替えたい時に便利

**例**:
```tsx
import { clsx } from 'clsx'

// 条件によってクラスを変える
const buttonClass = clsx(
  'px-4 py-2 rounded',           // 常に適用
  isLoading && 'opacity-50',     // loadingの時だけ適用
  isError ? 'bg-red-500' : 'bg-blue-500'  // 条件分岐
)

<button className={buttonClass}>送信</button>

// loadingの時: "px-4 py-2 rounded opacity-50 bg-blue-500"
// エラーの時: "px-4 py-2 rounded bg-red-500"
```

**実際の使用例（LoginPageより）**:
```tsx
// エラーの時だけ表示
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}

// loadingの時はボタンを無効化
<Button disabled={loading}>
  {loading ? 'ログイン中...' : 'ログイン'}
</Button>
```

---

### 2-2. `tailwind-merge`

**何をするもの？**
- Tailwind CSSのクラス名を賢く結合する

**なぜ必要？**
- 同じプロパティのクラスが重複した時、後のものを優先する

**clsxとの違い**:
```tsx
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// clsx: 単純に結合するだけ
clsx('px-4 py-2', 'px-8')
// → "px-4 py-2 px-8"  （px-4とpx-8が両方残る）

// twMerge: 重複を解決
twMerge('px-4 py-2', 'px-8')
// → "py-2 px-8"  （px-4が削除され、px-8だけ残る）
```

**実際の使用場所**: `src/components/ui/utils.ts`
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**cn関数の使用例**:
```tsx
import { cn } from '../components/ui/utils'

function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded bg-blue-500',  // デフォルトスタイル
        className                          // カスタムスタイル（上書き可能）
      )}
      {...props}
    />
  )
}

// 使用側
<Button className="bg-red-500">削除</Button>
// → bg-blue-500が削除され、bg-red-500だけ適用される
```

---

### 2-3. `class-variance-authority`

**何をするもの？**
- コンポーネントのバリエーション（variant）を管理する

**通称**: `cva`（略称で呼ばれる）

**なぜ必要？**
- ボタンの種類（primary、secondary、destructive等）を型安全に管理

**例（Buttonコンポーネント）**:
```tsx
import { cva } from "class-variance-authority"

const buttonVariants = cva(
  // ベーススタイル（全てのボタンに適用）
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      // バリエーション1: variant
      variant: {
        default: "bg-primary text-white hover:bg-primary/90",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-gray-300 bg-white hover:bg-gray-100",
        ghost: "hover:bg-gray-100",
      },
      // バリエーション2: size
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// 使用例
<Button variant="destructive" size="lg">削除</Button>
// → "inline-flex items-center ... bg-red-500 text-white ... h-11 px-8"
```

**メリット**:
- TypeScriptで型チェックされる（存在しないvariantを指定するとエラー）
- コードが読みやすい
- スタイルの一貫性が保たれる

**LoginPageでの使用例**:
```tsx
<Button type="submit" disabled={loading}>
  {loading ? 'ログイン中...' : 'ログイン'}
</Button>

<Button type="button" variant="outline" onClick={handleGoogleLogin}>
  Googleでログイン
</Button>
```

---

## 3. Radix UI関連（2つ）

**Radix UIとは？**
- アクセシビリティに優れたUIコンポーネントライブラリ
- スタイルなし（Tailwind CSSでスタイル付け）
- キーボード操作、スクリーンリーダー対応

### 3-1. `@radix-ui/react-slot@1.1.2`

**何をするもの？**
- 子コンポーネントにpropsを渡すためのユーティリティ

**なぜ必要？**
- `asChild` propを実装するため
- コンポーネントの柔軟性を高める

**例**:
```tsx
// asChild=false（デフォルト）
<Button>ログイン</Button>
// → <button>ログイン</button>

// asChild=true
<Button asChild>
  <a href="/login">ログイン</a>
</Button>
// → <a href="/login">ログイン</a>（Buttonのスタイルが適用される）
```

**内部実装イメージ**:
```tsx
import { Slot } from "@radix-ui/react-slot"

function Button({ asChild, ...props }) {
  const Comp = asChild ? Slot : "button"
  return <Comp {...props} />
}
```

---

### 3-2. `@radix-ui/react-label@2.1.2`

**何をするもの？**
- アクセシブルなラベルコンポーネント

**なぜ必要？**
- `<label>`タグをReactコンポーネントとして提供
- アクセシビリティ機能が自動で追加される

**通常のlabelとの違い**:
```tsx
// 通常のlabel
<label htmlFor="email">メールアドレス</label>
<input id="email" type="email" />

// Radix UIのLabel
<Label htmlFor="email">メールアドレス</Label>
<Input id="email" type="email" />
// → クリック時の動作、スクリーンリーダー対応が強化される
```

**LoginPageでの使用例**:
```tsx
<div className="space-y-2">
  <Label htmlFor="email">メールアドレス</Label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
  />
</div>
```

**アクセシビリティのメリット**:
- ラベルをクリックすると入力フィールドにフォーカス
- スクリーンリーダーが「メールアドレス 編集中」と読み上げる
- キーボード操作がスムーズ

---

## 4. アイコン関連（1つ）

### 4-1. `lucide-react@0.487.0`

**何をするもの？**
- Reactで使えるアイコンライブラリ
- 1000個以上のアイコンを提供

**なぜ必要？**
- UIに視覚的な要素を追加
- ユーザビリティ向上

**使用例**:
```tsx
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react'

// メールアイコン
<Mail className="w-4 h-4" />

// ローディングアイコン（回転アニメーション）
<Loader2 className="w-4 h-4 animate-spin" />

// ログインボタンにアイコンを追加
<Button>
  <LogIn className="w-4 h-4 mr-2" />
  ログイン
</Button>
```

**よく使うアイコン**:
- `Mail` - メール
- `Lock` - パスワード
- `User` - ユーザー
- `LogIn` / `LogOut` - ログイン/ログアウト
- `Calendar` - カレンダー
- `Clock` - 時計
- `Check` - チェックマーク
- `X` - 閉じる
- `AlertCircle` - 警告
- `Loader2` - ローディング

**サイズとカスタマイズ**:
```tsx
// サイズ変更
<Mail className="w-6 h-6" />  // 24px × 24px
<Mail className="w-8 h-8" />  // 32px × 32px

// 色変更
<Mail className="w-4 h-4 text-blue-500" />

// アニメーション
<Loader2 className="w-4 h-4 animate-spin" />
```

**公式サイト**: https://lucide.dev/icons/

---

## 📊 パッケージの役割まとめ

| パッケージ | 役割 | 使用場所 |
|-----------|------|---------|
| **tailwindcss** | CSSフレームワーク | 全コンポーネントのスタイル |
| **@tailwindcss/vite** | ViteプラグイN | ビルドプロセス |
| **clsx** | クラス名の条件付き結合 | `cn()`関数内 |
| **tailwind-merge** | クラス名の重複解決 | `cn()`関数内 |
| **class-variance-authority** | バリエーション管理 | Button, Inputなど |
| **@radix-ui/react-slot** | Props伝搬 | Button内部 |
| **@radix-ui/react-label** | アクセシブルなLabel | フォーム |
| **lucide-react** | アイコン | UI全般 |

---

## 🔧 セットアップで行ったこと

### 1. Tailwind CSS設定

**ファイル**: `vite.config.ts`
```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**追加内容**:
- `tailwindcss()`プラグインを追加
- `@`エイリアスで`./src`を参照可能に

---

### 2. CSSファイル

**作成したファイル**:
- `src/styles/index.css` - メインCSSファイル（他のCSSをimport）
- `src/styles/tailwind.css` - Tailwind CSSのimport
- `src/styles/theme.css` - テーマ設定（色、フォント等）
- `src/styles/fonts.css` - フォント設定（空ファイル）

**tailwind.css**の内容:
```css
@import 'tailwindcss' source(none);
@source '../**/*.{js,ts,jsx,tsx}';
@import 'tw-animate-css';
```

**theme.css**の内容（抜粋）:
```css
:root {
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --primary: #030213;
  --destructive: #d4183d;
  --radius: 0.625rem;
}
```

---

### 3. UIコンポーネント

**コピーしたフォルダ**:
- `src/components/ui/` - 49個のUIコンポーネント

**主要コンポーネント**:
- `button.tsx` - ボタン
- `input.tsx` - 入力フィールド
- `label.tsx` - ラベル
- `card.tsx` - カード
- `alert.tsx` - アラート
- `utils.ts` - `cn()`関数

---

### 4. ユーティリティ関数

**作成したファイル**:
- `src/utils/dateUtils.ts` - 日付変換ユーティリティ

**cn関数**（`src/components/ui/utils.ts`）:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

この関数は**全てのUIコンポーネントで使用**されます。

---

## 💡 なぜこれらのパッケージが必要なのか？

### 従来のアプローチ（Phase 1で使用）

```tsx
// インラインスタイル
<button style={{
  backgroundColor: '#3b82f6',
  color: '#fff',
  padding: '8px 16px',
  borderRadius: '4px',
  border: 'none',
}}>
  ログイン
</button>
```

**問題点**:
- スタイルが長くなる
- 再利用しにくい
- レスポンシブ対応が難しい
- ダークモード対応が難しい

---

### Tailwind CSS + shadcn/ui アプローチ（Phase 2）

```tsx
<Button variant="default" size="default">
  ログイン
</Button>
```

**メリット**:
- コードが短い
- 再利用しやすい
- レスポンシブ対応が簡単（`md:`, `lg:`）
- ダークモード対応が簡単（`dark:`）
- アクセシビリティが自動で対応される
- 型安全（TypeScriptで補完が効く）

---

## 🎯 実際のLoginPageでの使用例

```tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';        // cva, Slot使用
import { Input } from '../components/ui/input';          // Label対応
import { Label } from '../components/ui/label';          // Radix UI
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

export const LoginPage: React.FC = () => {
  // useState: Reactの状態管理
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Tailwind CSSでスタイル適用
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
```

**この1つのコンポーネントで使用されているもの**:
- ✅ Tailwind CSS（`className`）
- ✅ clsx + tailwind-merge（`cn()`関数経由）
- ✅ class-variance-authority（Button内部）
- ✅ @radix-ui/react-slot（Button内部）
- ✅ @radix-ui/react-label（Label）
- ✅ lucide-react（アイコン表示時）

---

## 📚 学習のポイント

### 初心者が混乱しやすい点

**Q1: なぜこんなに多くのパッケージが必要なの？**

A: 各パッケージは1つの責務だけを持っています（単一責任の原則）

- `clsx` → クラス名の結合
- `tailwind-merge` → 重複の解決
- `cva` → バリエーション管理

これらを組み合わせて、高品質なUIコンポーネントを構築します。

---

**Q2: 全部覚える必要がある？**

A: いいえ。段階的に理解すればOK：

1. **まず**: Tailwind CSSのクラス名を覚える（`bg-blue-500`等）
2. **次に**: UIコンポーネント（Button, Input）の使い方を覚える
3. **最後**: 内部実装（cva, cn関数）を理解する

---

**Q3: どのパッケージが何をしているか分からなくなる**

A: このドキュメントを見返してください！

また、エラーメッセージを見れば分かります：
```
Module not found: Can't resolve 'clsx'
→ clsxがインストールされていない
```

---

## 🔍 トラブルシューティング

### エラー1: `Cannot find module 'tailwindcss'`

**原因**: パッケージがインストールされていない

**解決**:
```bash
npm install tailwindcss @tailwindcss/vite
```

---

### エラー2: `cn is not defined`

**原因**: `src/components/ui/utils.ts`が存在しない

**解決**: figma-generatedからコピー
```bash
cp -r /path/to/figma-generated/src/components/ui /path/to/reservation-frontend/src/components/
```

---

### エラー3: スタイルが反映されない

**原因**: `src/styles/index.css`がimportされていない

**解決**: `src/main.tsx`を確認
```tsx
import './styles/index.css'  // これが必要
```

---

## 📖 参考リンク

- **Tailwind CSS**: https://tailwindcss.com/
- **Radix UI**: https://www.radix-ui.com/
- **Lucide Icons**: https://lucide.dev/
- **class-variance-authority**: https://cva.style/docs
- **clsx**: https://github.com/lukeed/clsx
- **tailwind-merge**: https://github.com/dcastil/tailwind-merge

---

## ✅ チェックリスト

Phase 2-3で行ったことを確認：

- [x] `tailwindcss@4.1.12` インストール
- [x] `@tailwindcss/vite@4.1.12` インストール
- [x] `clsx` インストール
- [x] `tailwind-merge` インストール
- [x] `class-variance-authority` インストール
- [x] `@radix-ui/react-slot@1.1.2` インストール
- [x] `@radix-ui/react-label@2.1.2` インストール
- [x] `lucide-react@0.487.0` インストール
- [x] `vite.config.ts` 更新（tailwindcssプラグイン追加）
- [x] `src/styles/` フォルダ作成
- [x] CSSファイルコピー（index.css, tailwind.css, theme.css）
- [x] `src/components/ui/` フォルダ作成
- [x] UIコンポーネント49個コピー
- [x] `src/utils/dateUtils.ts` コピー
- [x] `src/main.tsx` 更新（`./styles/index.css`をimport）

---

このドキュメントを保存しておけば、後から見返して理解を深められます！
