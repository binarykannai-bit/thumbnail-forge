import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * サーバーサイド専用のSupabaseクライアント。
 *
 * service_role_key を使うため RLS をバイパスして書き込み可能。
 * API routes / server actions など、サーバー側でのみ使用すること。
 * 絶対にクライアントサイド（'use client'）から呼び出してはいけない。
 *
 * 環境変数が未設定の場合は null を返す。これによりログ機能が無効化されるが、
 * メイン機能（サムネ生成）は引き続き動作する。
 */
export function createServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
