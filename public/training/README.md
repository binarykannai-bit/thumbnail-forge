# サムネ Forge

YouTube サムネイル自動生成ツール (Next.js 15 + TypeScript + Vercel)

## 機能

- GPT-5 でタイトル3案 + サムネプロンプト5案を生成
- OpenAI Image 2.0 (gpt-image-1) でサムネ画像を自動生成（5パターン並列）
- 範囲選択+AI再生成による画像編集
- プリセット指示と自由入力による全体調整

## アーキテクチャ

```
[ブラウザ]
   ↓ /api/generate
[Next.js API Route]
   ↓ (OpenAI APIキーはサーバー環境変数で安全に管理)
[OpenAI GPT-5] → タイトル+プロンプト生成
[OpenAI Image 2.0] → 画像生成
```

ブラウザに OpenAI APIキーが**一切露出しない**設計です。

## デプロイ手順 (Vercel)

### Step 1: GitHubリポジトリを作成

1. https://github.com にログイン
2. 右上の「+」→「New repository」
3. Repository name: `thumbnail-forge`
4. **Public** または **Private**（どちらでもOK）
5. 「Add a README file」「.gitignore」「License」は**チェックしない**（このプロジェクトに既にある）
6. 「Create repository」をクリック

### Step 2: ファイルをアップロード

GitHub上でファイルをアップロードする方法：

1. 作成したリポジトリのページで「uploading an existing file」リンクをクリック
2. このZIPの中身を**そのままドラッグ&ドロップ**（フォルダごと）
3. 下にスクロールして「Commit changes」をクリック

⚠️ 重要: `node_modules/` と `.next/` フォルダは含めないこと（既に `.gitignore` で除外済み）

### Step 3: Vercel にインポート

1. https://vercel.com/dashboard を開く
2. 「Add New...」→「Project」をクリック
3. GitHubの一覧から `thumbnail-forge` を選択 →「Import」
4. **Framework Preset: Next.js** が自動選択されるはず
5. **Environment Variables** を追加（重要）:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-...` （あなたのOpenAI APIキー）
   - **Environments**: Production, Preview, Development すべてチェック
6. 「Deploy」をクリック

3〜5分でデプロイ完了します。

### Step 4: 動作確認

完了画面で表示されるURL（例: `thumbnail-forge.vercel.app`）にアクセス。

「デモを表示」ボタンが動作すること、実際のサムネ生成が動くことを確認してください。

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI APIキー（`sk-...` で始まる文字列） | ✅ |

## 開発（ローカル）

ローカルでも動かす場合のみ：

```bash
npm install
cp .env.local.example .env.local
# .env.local に OPENAI_API_KEY=sk-... を記入
npm run dev
# http://localhost:3000 で起動
```

## ファイル構成

```
thumbnail-forge/
├── app/
│   ├── page.tsx              # メインページ
│   ├── ClientApp.tsx         # フロントエンドUI（'use client'）
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── generate/         # GPT-5 タイトル+プロンプト生成
│       └── generate-image/   # Image 2.0 画像生成
├── lib/
│   ├── constants.ts          # カテゴリ・心理状態・プリセット等の定数
│   ├── prompts.ts            # buildPrompt() ロジック
│   ├── styles.ts             # スタイルオブジェクト
│   ├── helpers.ts            # ユーティリティ
│   └── types.ts              # TypeScript型定義
├── .env.local.example        # 環境変数テンプレート
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## トラブルシューティング

### Vercel デプロイで失敗する

- 「Environment Variables」に `OPENAI_API_KEY` が設定されているか確認
- `package.json` の依存関係がすべて含まれているか確認

### サムネ生成で「すべての画像生成に失敗しました」

考えられる原因:
- OpenAI APIキーが無効、または利用制限超過
- OpenAIアカウントの組織認証(Organization Verification)が未完了 → https://platform.openai.com/settings/organization/general
- gpt-image-1モデルへのアクセス権限がない
- 残高不足

### TypeScript エラーが出てビルドが進まない

`next.config.js` に `typescript: { ignoreBuildErrors: true }` を設定済み。これで型エラーがあってもビルド可能。

## 今後の拡張予定

- [ ] Supabase Auth による社内チーム認証
- [ ] 生成履歴のデータベース保存
- [ ] チャンネル別タグ機能
- [ ] カスタムドメイン設定
