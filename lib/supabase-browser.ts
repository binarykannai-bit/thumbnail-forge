'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * ブラウザ（クライアントコンポーネント）用のSupabaseクライアント。
 *
 * - ログイン画面でのメール/パスワード認証
 * - クライアントサイドでのセッション取得
 * - anon_key を使用（公開しても安全なキー）
 *
 * 使用例:
 *   const supabase = createBrowserSupabaseClient();
 *   await supabase.auth.signInWithPassword({ email, password });
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
