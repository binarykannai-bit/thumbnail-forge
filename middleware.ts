import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * 認証ミドルウェア。
 *
 * - 全ページ・APIアクセス時にセッションを確認
 * - 未ログイン状態でログインページ以外にアクセス → /login にリダイレクト
 * - ログイン済み状態でログインページにアクセス → / にリダイレクト
 * - セッションのトークンリフレッシュも自動実行
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Supabase未設定の場合は認証スキップ（開発時の保険）
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[middleware] Supabase未設定。認証ガードをスキップします。');
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 現在のユーザーを取得（自動でセッションリフレッシュも行う）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  const isAuthCallback = pathname.startsWith('/auth/');

  // ❌ 未ログイン + ログインページ以外 → /login へリダイレクト
  if (!user && !isLoginPage && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname); // ログイン後の戻り先を保持
    return NextResponse.redirect(url);
  }

  // ✅ ログイン済み + ログインページ → / へリダイレクト
  if (user && isLoginPage) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/';
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

/**
 * ミドルウェアの適用範囲:
 * - 静的ファイル（_next/static, _next/image, favicon, 画像など）は除外
 * - それ以外（ページ・API route）すべてに適用
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
