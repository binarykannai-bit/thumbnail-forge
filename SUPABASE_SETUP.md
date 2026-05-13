# 📋 Supabase セットアップ手順（ログイン認証 + ログ機能）

このドキュメントは **thumbnail-forge の Supabase 関連機能** を有効化する手順です。
所要時間: 約 15 分

機能：
- 🔐 **メール+パスワードのログイン認証**（管理者発行型）
- 📝 **サムネ生成ログの保存**
- 🛡️ **未ログインユーザーのアプリアクセスをブロック**

---

## ステップ 1: Supabaseプロジェクト作成（3分）

1. https://supabase.com/dashboard を開いてサインイン
2. 右上の **「New Project」** をクリック
3. 以下を入力:
   - **Name**: `thumbnail-forge`
   - **Database Password**: 強固なパスワード（後で使うのでメモ）
   - **Region**: `Northeast Asia (Tokyo)` を推奨
   - **Pricing Plan**: `Free` でOK
4. **「Create new project」** をクリック
5. プロジェクト作成完了まで待つ（約 2 分）

---

## ステップ 2: テーブル作成（2分）

1. 作成したプロジェクトのダッシュボードを開く
2. 左サイドバーの **「SQL Editor」** をクリック
3. **「+ New query」** をクリック
4. 本リポジトリの `supabase/migrations/001_create_thumbnail_logs.sql` の **全文をコピーして貼り付け**
5. 右下の **「Run」** ボタン（または `Ctrl/Cmd + Enter`）をクリック
6. `Success. No rows returned` と表示されればOK

---

## ステップ 3: 認証設定（2分）

「管理者発行型」運用のため、**サインアップ画面は持たず、Supabaseダッシュボード上でユーザーを手動作成**します。

### 3-1. メール認証を無効化（任意・テスト時のみ）

メール確認なしで即ログインしたい場合：

1. 左サイドバー **「Authentication」** → **「Providers」**
2. **「Email」** をクリック
3. **「Confirm email」** を **OFF** に
4. **「Save」** をクリック

> 本番運用するならONのままが安全。OFFにすると、誰でも適当なメールアドレスで登録できる状態になりますが、今回は管理者発行型なので問題なし。

### 3-2. URLの設定（重要）

1. 左サイドバー **「Authentication」** → **「URL Configuration」**
2. **Site URL** を本番URLに設定（例: `https://thumbnail-forge.vercel.app`）
3. **Redirect URLs** にも本番URLを追加
4. **「Save」** をクリック

> ローカル開発も同時に使う場合は、`http://localhost:3000` も追加しておく。

---

## ステップ 4: 管理者ユーザー作成（1分）

1. 左サイドバー **「Authentication」** → **「Users」**
2. 右上の **「+ Add user」** → **「Create new user」** をクリック
3. 以下を入力:
   - **Email**: ｎさんが使うメールアドレス
   - **Password**: 強固なパスワード
   - **「Auto Confirm User?」** に **チェックを入れる**（メール確認なしで即ログインできる）
4. **「Create user」** をクリック

これでログイン用アカウント完成。

---

## ステップ 5: APIキーを取得（1分）

1. 左サイドバーの **「⚙️ Settings」** → **「API」** をクリック
2. 以下の3つの値をコピーしてメモ:

   | 表示名 | 環境変数名 | 説明 |
   |---|---|---|
   | **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` の形式 |
   | **anon public** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | フロントエンド用（公開しても安全） |
   | **service_role** secret | `SUPABASE_SERVICE_ROLE_KEY` | サーバー専用（**絶対に公開しないこと**） |

---

## ステップ 6: Vercel環境変数に設定（2分）

1. Vercelダッシュボードで `thumbnail-forge` プロジェクトを開く
2. **「Settings」** → **「Environment Variables」** をクリック
3. 以下3つを追加:

   | Key | Value | Environment |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | （ステップ5でコピーしたURL） | 全部 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | （ステップ5でコピーしたanon key） | 全部 |
   | `SUPABASE_SERVICE_ROLE_KEY` | （ステップ5でコピーしたservice_role key） | 全部 |

4. **「Save」** をクリック

---

## ステップ 7: ローカル開発用の設定（任意・1分）

```bash
cp .env.local.example .env.local
# .env.local を開いて、ステップ5でコピーした値を貼り付け
```

---

## ステップ 8: 再デプロイ（1分）

1. Vercelダッシュボード → **「Deployments」** タブ
2. 最新デプロイの **「⋯」** → **「Redeploy」**
3. **「Redeploy」** をクリック

---

## ✅ 動作確認

### 認証ガード

1. デプロイ完了後、thumbnail-forge のURLにアクセス
2. ログインしていない状態だと自動で `/login` へリダイレクトされる
3. ステップ4で作成した **メールアドレスとパスワード** でログイン
4. ログイン成功 → トップページへ自動遷移
5. ヘッダー右上に **メールアドレス + ログアウトボタン** が表示される

### サムネ生成 + ログ保存

1. サムネを1回生成する
2. Supabaseダッシュボード → **「Table Editor」** → `thumbnail_generation_logs` を開く
3. 新しいレコードが追加され、`user_id` カラムにステップ4で作ったユーザーIDが入っているはず
4. Vercel Logs（`Functions` タブ）に以下が出ているはず:

   ```
   [numbers] extracted N unique numbers from script: [...]
   [numbers] ✅ 全サムネで原稿の数字のみ使用されています
   [logger] ✅ ログを保存しました: id=xxxxxxxx-...
   ```

### ログアウト

1. ヘッダー右上の **「ログアウト」** をクリック
2. `/login` 画面に戻る
3. 再ログインしないとアプリにアクセスできない

---

## 🆕 後でユーザー追加したいとき

ステップ4と同じ手順を繰り返すだけ。
Supabaseダッシュボード **「Authentication」** → **「Users」** → **「+ Add user」**

各ユーザーは自分が生成したサムネ履歴しか閲覧できない（RLSで保護）。

---

## 🚨 トラブルシューティング

### ログインしても `/login` に戻される
- Vercelの環境変数が反映されていない → 再デプロイ
- ブラウザのCookieが古い → シークレットウィンドウで試す

### "Invalid login credentials" エラー
- パスワードを再確認
- メール認証が ON のままで Auto Confirm されていない → Supabaseダッシュボードのユーザー一覧で **「⋯」** → **「Confirm email」**

### ログがSupabaseに記録されない
- Vercel Logsに `[logger] Supabase未設定` と出ている → 環境変数の設定漏れ
- Vercel Logsに `[logger] Supabase insert failed` と出ている → エラーメッセージを確認

### "permission denied" エラー
- RLSポリシー設定漏れ → SQLを再実行
- service_role_key の代わりに anon key を使っている → ステップ5を再確認

---

## 🔍 ログの活用方法

### 過去の生成履歴を見る
Supabase Table Editor で `thumbnail_generation_logs` を開けば、全生成履歴が一覧表示されます。

### 警告ログを確認する
SQL Editor で以下を実行すると違反のみ抽出可能:

```sql
SELECT id, created_at, number_warnings
FROM thumbnail_generation_logs
WHERE number_warnings IS NOT NULL
ORDER BY created_at DESC;
```

### 自分の履歴のみ抽出
```sql
SELECT id, created_at, script, gpt_output
FROM thumbnail_generation_logs
WHERE user_id = '<your-user-id>'  -- Authentication → Users で確認
ORDER BY created_at DESC
LIMIT 20;
```
