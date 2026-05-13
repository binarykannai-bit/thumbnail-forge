import { NextRequest, NextResponse } from 'next/server';
import { buildTitlePrompt, type TitlePromptData } from '@/lib/title-prompts';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const maxDuration = 60; // タイトル生成は短いので 60秒で十分

/**
 * タイトル生成専用API。
 *
 * - メインの /api/generate（サムネ生成）と並列実行することで、体感速度を大幅短縮
 * - 軽量プロンプト + gpt-5-mini で 5〜10秒で完了する想定
 * - reasoning_effort=low で更に高速化
 */

const RESPONSE_SCHEMA = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'title_generation_response',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        titles: {
          type: 'array',
          description: 'YouTubeタイトル案。必ず3つ生成。',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              text: {
                type: 'string',
                description: 'タイトル本文。40文字以内。',
              },
              trigger: {
                type: 'string',
                enum: [
                  '知らないと損型',
                  '驚き＋利益型',
                  '共感＋逆転型',
                  '結論先出し型',
                  '問題提起型',
                ],
                description: '心理トリガー型。3つで全部異なる型を使う。',
              },
              structure: {
                type: 'string',
                description: '「検索ワード:○○ / 数字:○○ / 感情訴求:○○」形式。',
              },
              expectedCTR: {
                type: 'string',
                enum: ['高', '中高', '中'],
              },
            },
            required: ['text', 'trigger', 'structure', 'expectedCTR'],
          },
        },
      },
      required: ['titles'],
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です。' },
        { status: 401 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEYが未設定です。' },
        { status: 500 }
      );
    }

    const data: TitlePromptData = await req.json();

    const prompt = buildTitlePrompt(data);
    console.log(`[gen-titles] prompt size: ${prompt.length} chars`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

    const startTime = Date.now();
    let resp;
    try {
      resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          // gpt-5-mini は gpt-5 より大幅に高速。タイトルは構造がシンプルなので十分。
          model: 'gpt-5-mini',
          reasoning_effort: 'low',
          response_format: RESPONSE_SCHEMA,
          messages: [
            {
              role: 'system',
              content:
                'あなたはYouTubeタイトル戦略の最高峰の専門家です。日本のYouTube市場における視聴者心理学・CTR最適化に精通しています。出力は提供されたJSONスキーマに厳密に従ってください。',
            },
            { role: 'user', content: prompt },
          ],
        }),
      });
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        return NextResponse.json(
          { error: 'タイトル生成がタイムアウトしました（50秒）。' },
          { status: 504 }
        );
      }
      throw e;
    }
    clearTimeout(timeoutId);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[gen-titles] gpt-5-mini took ${elapsed}s (status: ${resp.status})`);

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
      else {
        return NextResponse.json(
          { error: 'タイトルJSONの解析に失敗しました。', raw: clean.slice(0, 500) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('[gen-titles] error:', err);
    return NextResponse.json(
      { error: err.message || '不明なエラー' },
      { status: 500 }
    );
  }
}
