'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }}
    >
      <Loader2 size={32} color="#ffffff" className="animate-spin" />
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Supabaseのエラーメッセージは英語なので、よくあるものを日本語化
        if (signInError.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません。');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('メールアドレスの確認が完了していません。');
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      // ログイン成功 → リダイレクト
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || '予期せぬエラーが発生しました');
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '24px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* ロゴ・タイトル */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
            }}
          >
            <LogIn size={28} color="#ffffff" strokeWidth={2.5} />
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 8px 0',
            }}
          >
            サムネ Forge
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            ログインしてください
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* メールアドレス */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px rgba(99,102,241,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* パスワード */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px rgba(99,102,241,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#ffffff',
              background:
                loading || !email || !password
                  ? '#cbd5e1'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow:
                loading || !email || !password
                  ? 'none'
                  : '0 4px 12px rgba(99,102,241,0.35)',
              transition: 'transform 0.1s, box-shadow 0.15s',
            }}
            onMouseDown={(e) => {
              if (!loading && email && password)
                e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                ログイン中...
              </>
            ) : (
              <>
                <LogIn size={18} />
                ログイン
              </>
            )}
          </button>
        </form>

        {/* フッター */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          アカウントは管理者発行制です。
          <br />
          ログイン情報をお持ちでない場合は管理者にお問い合わせください。
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
