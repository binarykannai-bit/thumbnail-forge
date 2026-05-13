import { createServerSupabaseClient } from '@/lib/supabase-server';
import ClientApp from './ClientApp';

/**
 * トップページ。
 *
 * サーバー側でログイン中のユーザー情報を取得し、ClientAppにpropsで渡す。
 * （middlewareで認証ガード済みのため、ここに到達した時点でuserは必ず存在する）
 */
export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ClientApp userEmail={user?.email ?? null} />;
}
