import { NextRequest, NextResponse } from 'next/server';
import { buildPrompt } from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: '入力データがありません。' }, { status: 400 });
    }

    const prompt = buildPrompt(data);

    // Build OpenAI message content with images (refs + visualAssets)
    const userContent: any[] = [];
    (data.refs || []).forEach((ref: any) => {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${ref.mediaType};base64,${ref.base64}` },
      });
    });
    (data.visualAssets || []).forEach((asset: any) => {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${asset.mediaType};base64,${asset.base64}` },
      });
    });
    userContent.push({ type: 'text', text: prompt });

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'あなたはYouTubeサムネイル戦略の最高峰の専門家です。日本のYouTube市場における視聴者心理学・CTR最適化・コピーライティングに精通しています。出力は必ずJSON形式のみで、それ以外の前置き・コメント・コードブロック記号は一切含めないでください。',
          },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `OpenAI API エラー (${resp.status}): ${errText.slice(0, 500)}` },
        { status: resp.status }
      );
    }

    const json = await resp.json();
    const text = json.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else
        return NextResponse.json(
          { error: 'JSON解析失敗。GPTの出力が想定形式と異なります。', raw: clean.slice(0, 500) },
          { status: 500 }
        );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '不明なエラー' },
      { status: 500 }
    );
  }
}
