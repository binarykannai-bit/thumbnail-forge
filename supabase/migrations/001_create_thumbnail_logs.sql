-- =====================================================
-- thumbnail-forge: 生成ログテーブル
-- =====================================================
-- 実行方法: Supabase Dashboard → SQL Editor → 全文貼り付け → Run
-- =====================================================

-- 1. テーブル作成
CREATE TABLE IF NOT EXISTS public.thumbnail_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- マルチユーザー対応列（将来用、当面はNULL運用OK）
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 入力
  script text NOT NULL,                      -- 原稿全文
  input_data jsonb,                          -- フォーム入力全体

  -- 抽出（数字ホワイトリスト機能で抽出した数字）
  extracted_numbers jsonb,

  -- 出力
  gpt_output jsonb,                          -- GPT-5の出力JSON全体
  number_warnings jsonb,                     -- 違反検出があれば、なければNULL

  -- メタデータ
  training_image_count int,                  -- RAG/学習画像の使用枚数
  training_mode text,                        -- 'rag-similarity' / 'random' 等

  -- 学習データ昇格用（C機能で使用予定。今は列だけ用意）
  is_selected_for_training boolean DEFAULT false,
  selected_thumbnail_index int,              -- 5案中どれを採用したか（0〜4）
  notes text                                 -- 手書きメモ
);

COMMENT ON TABLE public.thumbnail_generation_logs IS
  'サムネ生成のリクエスト/レスポンス履歴。後から見返し・学習データ昇格に使う。';

-- 2. インデックス
CREATE INDEX IF NOT EXISTS idx_thumbnail_logs_created_at
  ON public.thumbnail_generation_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_thumbnail_logs_user_id
  ON public.thumbnail_generation_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_thumbnail_logs_selected
  ON public.thumbnail_generation_logs (is_selected_for_training)
  WHERE is_selected_for_training = true;

-- 3. RLS有効化
ALTER TABLE public.thumbnail_generation_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLSポリシー（マルチユーザー対応の準備）
-- =====================================================
-- 注: INSERT は API routes から service_role_key 経由で行う。
--     service_role は RLS をバイパスするため、INSERT ポリシーは不要。
--     SELECT/UPDATE/DELETE は authenticated ユーザー向けに自分のレコードのみ許可。
-- =====================================================

-- 4a. ユーザーは自分のレコードのみ閲覧可能
DROP POLICY IF EXISTS "Users can view own logs" ON public.thumbnail_generation_logs;
CREATE POLICY "Users can view own logs"
  ON public.thumbnail_generation_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4b. ユーザーは自分のレコードのみ更新可能（採用フラグ立てなど）
DROP POLICY IF EXISTS "Users can update own logs" ON public.thumbnail_generation_logs;
CREATE POLICY "Users can update own logs"
  ON public.thumbnail_generation_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4c. ユーザーは自分のレコードのみ削除可能
DROP POLICY IF EXISTS "Users can delete own logs" ON public.thumbnail_generation_logs;
CREATE POLICY "Users can delete own logs"
  ON public.thumbnail_generation_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. PostgREST スキーマキャッシュをリロード
-- =====================================================
-- 過去のジョン・アドバイザー運用と同じ手順
-- =====================================================
NOTIFY pgrst, 'reload schema';
