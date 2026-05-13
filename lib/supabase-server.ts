import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * サーバーコンポーネント・API routes 用のSupabaseクライアント。
 *
 * - Next.jsのcookiesからセッションを取得
 * - サーバー側でログイン中のユーザーを判定するために使用
 * - anon_key を使用（RLSの恩恵を受ける）
 *
 * 使用例:
 *   const supabase = await createServerSupabaseClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // Server Componentからの呼び出しではsetができないが、
            // middlewareがセッションリフレッシュを担当するので無視してOK
          }
        },
      },
    }
  );
}
