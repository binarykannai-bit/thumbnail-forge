import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'サーバー側でOPENAI_API_KEYが未設定です。Vercelの環境変数を確認してください。' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'プロンプトがありません。' }, { status: 400 });
    }

    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-2',
        prompt,
        size: '1280x720',
        quality: 'medium',
        n: 1,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `OpenAI Image API エラー (${resp.status}): ${errText.slice(0, 500)}` },
        { status: resp.status }
      );
    }

    const json = await resp.json();
    const b64 = json.data?.[0]?.b64_json || null;

    if (!b64) {
      return NextResponse.json({ error: '画像データが返ってきませんでした。' }, { status: 500 });
    }

    return NextResponse.json({ imageBase64: b64 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '不明なエラー' },
      { status: 500 }
    );
  }
}
