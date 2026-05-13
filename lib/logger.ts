import { createServiceClient } from './supabase';
import type { ExtractedNumbers } from './script-numbers';

/**
 * サムネ生成ログのペイロード型。
 * route.ts から呼び出される際に渡される全フィールド。
 */
export interface ThumbnailLogPayload {
  /** 原稿全文 */
  script: string;
  /** フォーム入力全体（audiences/direction/必須文言など。data オブジェクト全体） */
  inputData: any;
  /** 原稿から抽出した数字ホワイトリスト */
  extractedNumbers: ExtractedNumbers;
  /** GPT-5の出力JSON全体（thumbnails配列・imagePrompt含む） */
  gptOutput: any;
  /** 違反検出があれば、なければnull */
  numberWarnings: any[] | null;
  /** RAG/学習画像の使用枚数 */
  trainingImageCount: number;
  /** 'rag-similarity' / 'random' 等 */
  trainingMode: string;
  /** ログインユーザーID（将来用、当面はnull） */
  userId?: string | null;
}

/**
 * サムネ生成ログをSupabaseに書き込む。
 *
 * 失敗してもサムネ生成自体は止めない（fire-and-forgetポリシー）。
 * Supabase未設定時は警告ログを出して null を返す。
 *
 * @returns 作成されたログのID。失敗時は null。
 */
export async function logThumbnailGeneration(
  payload: ThumbnailLogPayload
): Promise<string | null> {
  const supabase = createServiceClient();

  if (!supabase) {
    console.warn(
      '[logger] Supabase未設定のためログをスキップします（NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を設定してください）'
    );
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('thumbnail_generation_logs')
      .insert({
        user_id: payload.userId ?? null,
        script: payload.script,
        input_data: payload.inputData,
        extracted_numbers: payload.extractedNumbers,
        gpt_output: payload.gptOutput,
        number_warnings: payload.numberWarnings,
        training_image_count: payload.trainingImageCount,
        training_mode: payload.trainingMode,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[logger] Supabase insert failed:', error.message);
      return null;
    }

    console.log(`[logger] ✅ ログを保存しました: id=${data.id}`);
    return data.id as string;
  } catch (err) {
    console.error('[logger] 予期せぬエラー:', err);
    return null;
  }
}

/**
 * 既存ログの「学習データ採用フラグ」を立てる。
 * フロントの「⭐採用」ボタンから呼び出される想定（C機能で使用予定）。
 */
export async function markLogAsSelected(
  logId: string,
  selectedThumbnailIndex: number,
  notes?: string
): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('thumbnail_generation_logs')
      .update({
        is_selected_for_training: true,
        selected_thumbnail_index: selectedThumbnailIndex,
        notes: notes ?? null,
      })
      .eq('id', logId);

    if (error) {
      console.error('[logger] 採用フラグ更新失敗:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[logger] 採用フラグ更新で予期せぬエラー:', err);
    return false;
  }
}
