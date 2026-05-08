'use client';
// @ts-nocheck

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, Copy, Check, Upload, X, RotateCcw, AlertCircle, Loader2, Zap, ShieldCheck, Eye, Play, FileText, Crown, AlertTriangle, Award, Minus, Flame, Layers, Settings, Key, Download, Image as ImageIcon, Anchor, MessageSquareWarning, Edit3, Undo2, Type, Palette, Wand2, ChevronDown, ChevronUp, Code2, ExternalLink } from 'lucide-react';
import { STEPS, MAIN_CATEGORIES, SUB_CATEGORIES, AUDIENCES, DIRECTIONS, MAIN_VISUALS, getVisualUpload, PSYCHOLOGY, DENSITIES, FONT_SIZES, NG_LIST, REF_CONTEXTS, getDirectionIcon, EDIT_PRESETS, C, FONT, FONT_MONO, FONT_COND, SHADOW_SM, SHADOW_MD } from '@/lib/constants';
import { styles, globalCSS } from '@/lib/styles';
import { buildPrompt } from '@/lib/prompts';
import { fileToBase64, cropTo1280x720, buildRegionInstruction } from '@/lib/helpers';

// Constants/helpers/styles are now imported from @/lib/*

// ============================================================
// MAIN APP
// ============================================================
export default function ClientApp() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    mainCategory: '', subCategory: '', audiences: [], psychology: [], persona: '', direction: [], mainVisual: '', noPersonInImage: false, density: '', fontSize: '', ng: [],
    refs: [], visualAssets: [], script: '',
    requiredPhrases: [], phraseInput: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(null); // 'analyzing' | 'titles' | 'images'
  const [loadingMsg, setLoadingMsg] = useState('');
  const [imgProgress, setImgProgress] = useState({ done: 0, total: 0 });
  const [thumbStatuses, setThumbStatuses] = useState([]); // [{idx, status: 'pending'|'generating'|'success'|'failed', error?}]
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&family=Roboto+Condensed:wght@500;700&family=Roboto+Mono:wght@400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const update = (k, v) => setData(d => ({ ...d, [k]: v }));
  const toggleArr = (k, v) => setData(d => ({
    ...d,
    [k]: d[k].includes(v) ? d[k].filter(x => x !== v) : [...d[k], v]
  }));

  const reset = () => {
    setStep(1);
    setData({
      mainCategory: '', subCategory: '', audiences: [], psychology: [], persona: '', direction: [], mainVisual: '', noPersonInImage: false, density: '', fontSize: '', ng: [],
      refs: [], visualAssets: [], script: '',
      requiredPhrases: [], phraseInput: '',
    });
    setResult(null);
    setError(null);
    setImgProgress({ done: 0, total: 0 });
  };

  const canProceed = () => {
    if (step === 1) return data.mainCategory && data.audiences.length > 0 && data.direction.length > 0 && data.mainVisual && data.density && data.fontSize;
    if (step === 2) {
      const upload = getVisualUpload(data.mainVisual);
      if (upload && upload.required && data.visualAssets.length === 0) return false;
      return true;
    }
    if (step === 3) return data.script.trim().length >= 30;
    if (step === 4) return true;
    return true;
  };

  // GPT Image 2は1280x720を直接生成できるためクロップ不要
  async function callOpenAIImage(prompt: string): Promise<string | null> {
    const resp = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!resp.ok) {
      const errJson = await resp.json().catch(() => ({}));
      throw new Error(errJson.error || `画像生成エラー (${resp.status})`);
    }
    const json = await resp.json();
    const rawB64 = json.imageBase64;
    if (!rawB64) return null;
    return rawB64; // クロップなしでそのまま返す
  }

  const generate = async () => {
    setLoading(true);
    setError(null);
    setLoadingPhase('analyzing');
    setLoadingMsg('GPT-5が台本を分析中...');
    setImgProgress({ done: 0, total: 0 });
    setThumbStatuses([]);

    try {
      setLoadingPhase('titles');
      setLoadingMsg('タイトル案とサムネプロンプトを生成中...');

      const apiResp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      if (!apiResp.ok) {
        const errJson = await apiResp.json().catch(() => ({}));
        throw new Error(errJson.error || `API エラー (${apiResp.status})`);
      }

      const parsed = await apiResp.json();

      const totalThumbs = parsed.thumbnails?.length || 0;
      setLoadingPhase('images');
      setLoadingMsg(`Image 2.0で${totalThumbs}枚のサムネ画像を生成中...`);
      setImgProgress({ done: 0, total: totalThumbs });
      setThumbStatuses(
        Array.from({ length: totalThumbs }, (_, i) => ({
          idx: i,
          label: parsed.thumbnails[i]?.label || `Pattern ${i + 1}`,
          status: 'generating',
          error: null,
        }))
      );

      const imagePromises = (parsed.thumbnails || []).map(async (t, idx) => {
        try {
          const b64 = await callOpenAIImage(t.imagePrompt);
          setImgProgress(p => ({ ...p, done: p.done + 1 }));
          setThumbStatuses(prev => prev.map((s, i) =>
            i === idx ? { ...s, status: 'success' } : s
          ));
          return { ...t, imageBase64: b64, imageError: null };
        } catch (e) {
          setImgProgress(p => ({ ...p, done: p.done + 1 }));
          setThumbStatuses(prev => prev.map((s, i) =>
            i === idx ? { ...s, status: 'failed', error: e.message } : s
          ));
          return { ...t, imageBase64: null, imageError: e.message };
        }
      });

      const thumbsWithImages = await Promise.all(imagePromises);

      const allFailed = thumbsWithImages.every(t => !t.imageBase64);
      if (allFailed && thumbsWithImages.length > 0) {
        const firstError = thumbsWithImages[0].imageError || '不明なエラー';
        throw new Error(`すべてのサムネ画像生成に失敗しました。\n\n原因: ${firstError}`);
      }

      setResult({
        titles: parsed.titles || [],
        thumbnails: thumbsWithImages,
      });
      setStep(5);
    } catch (e) {
      setError(e.message || '不明なエラー');
    } finally {
      setLoading(false);
      setLoadingMsg('');
      setLoadingPhase(null);
    }
  };

  const showDemo = () => {
    setError(null);
    setResult(getDemoResult());
    setStep(5);
  };

  return (
    <div style={styles.app}>
      <style>{globalCSS}</style>
      <Header reset={reset} hasResult={!!result} onShowDemo={showDemo} />

      <main style={styles.main}>
        <StepIndicator current={step} setStep={setStep} hasResult={!!result} />

        <div style={styles.content}>
          {step === 1 && <Step1 data={data} update={update} toggleArr={toggleArr} />}
          {step === 2 && <Step2 data={data} setData={setData} />}
          {step === 3 && <Step3 data={data} update={update} />}
          {step === 4 && <Step4 data={data} update={update} setData={setData} />}
          {step === 5 && <Step5 result={result} setResult={setResult} />}
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={20} style={{ flexShrink: 0, color: '#FF0000', marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: '#0F0F0F', fontSize: 14 }}>生成エラー</div>
              <div style={{
                fontSize: 12,
                color: '#606060',
                fontFamily: 'Roboto Mono, monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.6,
              }}>{error}</div>
            </div>
            <button onClick={() => setError(null)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#909090', padding: 4, borderRadius: 6, flexShrink: 0,
            }}>
              <X size={16} />
            </button>
          </div>
        )}
      </main>

      {loading && <LoadingOverlay phase={loadingPhase} msg={loadingMsg} progress={imgProgress} thumbStatuses={thumbStatuses} />}

      <Footer
        step={step}
        setStep={setStep}
        canProceed={canProceed()}
        loading={loading}
        generate={generate}
        reset={reset}
      />
    </div>
  );
}

// ============================================================
// LOADING OVERLAY
// ============================================================
function LoadingOverlay({ phase, msg, progress, thumbStatuses }: any) {
  const [elapsed, setElapsed] = useState(0);
  const phases = [
    { id: 'analyzing', label: '台本分析', desc: 'フックと心理トリガーを抽出' },
    { id: 'titles', label: 'タイトル生成', desc: '3案 + プロンプト5案を作成' },
    { id: 'images', label: 'サムネ画像生成', desc: 'GPT Image 2で5枚生成' },
  ];
  const currentIdx = phases.findIndex(p => p.id === phase);

  // 経過時間カウンター
  useEffect(() => {
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const totalEstimate = phase === 'analyzing' ? 5 : phase === 'titles' ? 30 : 70;
  const ratio = elapsed / totalEstimate;
  let estimatePercent: number;
  if (ratio < 1) {
    // 予想時間内: 0%〜80%まで線形
    estimatePercent = ratio * 80;
  } else {
    // 予想時間超過後: 80%〜99%まで漸近的に減速
    const overtime = ratio - 1;
    estimatePercent = 80 + 19 * (1 - Math.exp(-overtime * 0.7));
  }
  estimatePercent = Math.min(99, estimatePercent);
  const isOverEstimate = elapsed > totalEstimate;

  return (
    <div style={styles.loadingOverlay}>
      <div style={styles.loadingBox}>
        {/* Phase indicator */}
        <div style={styles.phaseTrack}>
          {phases.map((p, i) => {
            const isCurrent = p.id === phase;
            const isDone = currentIdx > i;
            return (
              <React.Fragment key={p.id}>
                <div style={styles.phaseStep}>
                  <div style={{
                    ...styles.phaseCircle,
                    ...(isCurrent ? styles.phaseCircleActive : {}),
                    ...(isDone ? styles.phaseCircleDone : {}),
                  }}>
                    {isDone ? <Check size={16} /> : isCurrent ? <Loader2 size={16} className="spin" /> : (i + 1)}
                  </div>
                  <div style={{
                    ...styles.phaseLabel,
                    ...(isCurrent ? styles.phaseLabelActive : {}),
                    ...(isDone ? styles.phaseLabelDone : {}),
                  }}>
                    {p.label}
                  </div>
                </div>
                {i < phases.length - 1 && (
                  <div style={{
                    ...styles.phaseLine,
                    ...(isDone ? styles.phaseLineDone : {}),
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current phase message */}
        <div style={styles.loadingTitle}>{msg}</div>

        {/* 経過時間 */}
        <div style={{
          fontFamily: FONT_MONO,
          fontSize: 13,
          color: C.textDim,
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 12,
        }}>
          経過時間: <span style={{ fontWeight: 700, color: C.red }}>{elapsed}秒</span>
          {' / 目安: '}{totalEstimate}秒
        </div>

        {/* Progress bar (画像生成中はリアル進捗、それ以外は推定アニメ) */}
        {progress.total > 0 ? (
          <>
            <div style={styles.progressBarWrap}>
              <div style={{
                ...styles.progressBar,
                width: `${(progress.done / progress.total) * 100}%`
              }} />
            </div>
            <div style={styles.progressText}>
              {progress.done} / {progress.total} 完了 （{Math.round((progress.done / progress.total) * 100)}%）
            </div>
          </>
        ) : (
          <>
            <div style={styles.progressBarWrap}>
              <div style={{
                ...styles.progressBar,
                width: `${estimatePercent}%`,
                transition: 'width 1s linear',
              }} />
            </div>
            <div style={styles.progressText}>
              推定進捗: {Math.round(estimatePercent)}%
            </div>
            {isOverEstimate && (
              <div style={{
                fontSize: 12,
                color: C.warning,
                textAlign: 'center',
                marginTop: 8,
                fontWeight: 700,
              }}>
                予想時間を超過しています。AIモデルが処理中です。もう少しお待ちください...
              </div>
            )}
          </>
        )}

        {/* Per-thumbnail status indicators */}
        {thumbStatuses && thumbStatuses.length > 0 && (
          <div style={styles.thumbStatusGrid}>
            {thumbStatuses.map(s => (
              <div key={s.idx} style={{
                ...styles.thumbStatusItem,
                ...(s.status === 'success' ? styles.thumbStatusSuccess : {}),
                ...(s.status === 'failed' ? styles.thumbStatusFailed : {}),
                ...(s.status === 'generating' ? styles.thumbStatusGenerating : {}),
              }}>
                <div style={styles.thumbStatusNum}>
                  {s.status === 'success' ? <Check size={11} /> :
                   s.status === 'failed' ? <X size={11} /> :
                   s.status === 'generating' ? <Loader2 size={11} className="spin" /> :
                   (s.idx + 1)}
                </div>
                <div style={styles.thumbStatusLabel}>
                  Pattern {String(s.idx + 1).padStart(2, '0')}
                </div>
                <div style={styles.thumbStatusSub}>
                  {s.status === 'success' ? '✓ 完了' :
                   s.status === 'failed' ? '✗ 失敗' :
                   '生成中...'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hint */}
        <div style={styles.loadingHint}>
          {phase === 'analyzing' && 'GPT-5.4が原稿から最大のフック・キラーワード・心理トリガーを抽出しています'}
          {phase === 'titles' && 'タイトル3案 + サムネ5案のプロンプトを構築中'}
          {phase === 'images' && 'GPT Image 2 が5枚を並列で生成中。各画像20〜40秒'}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// HEADER
// ============================================================
function Header({ reset, hasResult, onShowDemo }: any) {
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <div style={styles.logo}>
          <div style={styles.logoMark}>
            <div style={styles.logoTriangle} />
          </div>
          <div style={styles.logoText}>
            <span style={{ fontWeight: 700 }}>サムネ</span>
            <span style={{ fontWeight: 400, opacity: 0.9 }}> Forge</span>
          </div>
          <div style={styles.liveDot} className="live-pulse" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onShowDemo} style={styles.headerBtnDemo} className="header-btn-demo-hover">
            <Eye size={14} />
            <span>デモを表示</span>
          </button>
          {hasResult && (
            <button onClick={reset} style={styles.headerBtn} className="header-btn-hover">
              <RotateCcw size={16} />
              <span>新規作成</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// STEP INDICATOR
// ============================================================
function StepIndicator({ current, setStep, hasResult }: any) {
  return (
    <div style={styles.tabBarWrap}>
      <div style={styles.tabBar}>
        {STEPS.map((s) => {
          const isActive = s.id === current;
          const isDone = s.id < current;
          const clickable = s.id <= current || hasResult;
          return (
            <button
              key={s.id}
              onClick={() => clickable && setStep(s.id)}
              style={{ ...styles.tab, cursor: clickable ? 'pointer' : 'default' }}
              className={clickable ? 'tab-hover' : ''}
            >
              <span style={{
                ...styles.tabNum,
                color: isActive ? '#FF0000' : isDone ? '#606060' : '#909090',
              }}>{String(s.id).padStart(2, '0')}</span>
              <span style={{
                ...styles.tabLabel,
                color: isActive ? '#0F0F0F' : '#606060',
                fontWeight: isActive ? 700 : 500,
              }}>{s.label}</span>
              {isActive && <div style={styles.tabIndicator} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// STEP 1: BASICS
// ============================================================
function Step1({ data, update, toggleArr }: any) {
  return (
    <div style={styles.stepContent}>
      <SectionTitle title="基本情報" desc="動画とサムネの方向性を選択。同じ項目を再クリックで解除できます" />

      <Card>
        <Field label="メインカテゴリ" required hint="動画の大ジャンル">
          <Pills options={MAIN_CATEGORIES} value={data.mainCategory} onChange={v => update('mainCategory', v)} />
        </Field>
      </Card>

      <Card>
        <Field label="サブカテゴリ" hint="任意 / より具体的なジャンル指定">
          <Pills options={SUB_CATEGORIES} value={data.subCategory} onChange={v => update('subCategory', v)} />
        </Field>
      </Card>

      <Card>
        <Field label="狙う視聴者" required hint="複数選択可">
          <Pills options={AUDIENCES} value={data.audiences} onChange={v => toggleArr('audiences', v)} multi />
        </Field>
      </Card>

      <Card>
        <Field label="視聴者の心理状態" hint="任意・複数選択可（CTRに直結する感情トリガーを指定）">
          <CardGrid
            options={PSYCHOLOGY.map(p => ({ value: p.id, title: p.id, desc: p.desc }))}
            value={data.psychology}
            onChange={v => toggleArr('psychology', v)}
            multi
          />
        </Field>
      </Card>

      <Card>
        <Field label="サムネ方向性" required hint="複数選択可（複数選ぶとサムネ案に分散して反映）">
          <CardGrid
            options={DIRECTIONS.map(d => ({ value: d.id, title: d.id, desc: d.desc }))}
            value={data.direction}
            onChange={v => toggleArr('direction', v)}
            multi
          />
        </Field>
      </Card>

      <Card>
        <Field label="サムネのメインビジュアル" required hint="サムネに何を映すか">
          <CardGrid
            options={MAIN_VISUALS.map(v => ({ value: v.id, title: v.id, desc: v.desc }))}
            value={data.mainVisual}
            onChange={v => update('mainVisual', v === data.mainVisual ? '' : v)}
          />
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 16,
            padding: '12px 14px',
            background: data.noPersonInImage ? C.redLight : C.surface3,
            border: `1px solid ${data.noPersonInImage ? C.red : C.border}`,
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            <input
              type="checkbox"
              checked={!!data.noPersonInImage}
              onChange={e => update('noPersonInImage', e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: C.red }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                AIによる人物画像を生成しない
              </div>
              <div style={{ fontSize: 11, color: C.textMute, marginTop: 2 }}>
                チェックすると、サムネ画像にAIで生成された人物（顔・人体）を含めません。文字・図解・背景のみで構成します。
              </div>
            </div>
          </label>
        </Field>
      </Card>

      <div style={styles.row3}>
        <Card>
          <Field label="デザイン密度" required>
            <Pills options={DENSITIES} value={data.density} onChange={v => update('density', v)} stack />
          </Field>
        </Card>
        <Card>
          <Field label="文字サイズ感" required>
            <Pills options={FONT_SIZES} value={data.fontSize} onChange={v => update('fontSize', v)} stack />
          </Field>
        </Card>
        <Card>
          <Field label="NG表現" hint="複数選択可">
            <Pills options={NG_LIST} value={data.ng} onChange={v => toggleArr('ng', v)} multi stack />
          </Field>
        </Card>
      </div>

      <Card>
        <Field label="詳細ペルソナ" hint="任意 / 具体的な視聴者像を書くほどタイトル・サムネの精度が上がります">
          <textarea
            value={data.persona}
            onChange={e => update('persona', e.target.value)}
            style={{ ...styles.input, minHeight: 200, lineHeight: 1.7 }}
            placeholder={`例：
名前: 田中健一(仮名)
年齢: 38歳
職業: 都内勤務の会社員、年収600万
家族: 妻と子ども1人、住宅ローン返済中
悩み: 老後資金が不安。新NISAは始めたが何を買えばいいかわからない
欲求: 安全に資産形成したい。難しい専門用語は避けたい
視聴動機: 「自分と同じような人向け」の具体的な指針が欲しい

※すべて埋める必要はありません。書ける範囲でOK`}
          />
          <div style={styles.charCount}>{data.persona.length} 文字</div>
        </Field>
      </Card>
    </div>
  );
}

// ============================================================
// STEP 2: REFERENCES
// ============================================================
function Step2({ data, setData }: any) {
  const fileRef = useRef(null);
  const assetFileRef = useRef(null);
  const upload = getVisualUpload(data.mainVisual);

  const handleFiles = async (files) => {
    const newRefs = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const base64 = await fileToBase64(file);
      newRefs.push({
        id: Math.random().toString(36).slice(2),
        name: file.name, base64, mediaType: file.type,
        context: '全体を参考',
        isMain: data.refs.length === 0 && newRefs.length === 0,
      });
    }
    setData(d => ({ ...d, refs: [...d.refs, ...newRefs].slice(0, 5) }));
  };

  const handleAssetFiles = async (files) => {
    if (!upload) return;
    const newAssets = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const base64 = await fileToBase64(file);
      newAssets.push({
        id: Math.random().toString(36).slice(2),
        name: file.name, base64, mediaType: file.type,
      });
    }
    setData(d => ({ ...d, visualAssets: [...d.visualAssets, ...newAssets].slice(0, upload.max) }));
  };

  const removeRef = (id) => setData(d => ({ ...d, refs: d.refs.filter(r => r.id !== id) }));
  const setMain = (id) => setData(d => ({ ...d, refs: d.refs.map(r => ({ ...r, isMain: r.id === id })) }));
  const setContext = (id, ctx) => setData(d => ({ ...d, refs: d.refs.map(r => r.id === id ? { ...r, context: ctx } : r) }));
  const removeAsset = (id) => setData(d => ({ ...d, visualAssets: d.visualAssets.filter(a => a.id !== id) }));

  return (
    <div style={styles.stepContent}>
      <SectionTitle title="参考サムネ・素材画像" desc="任意 / Claude Visionが画像を解析しサムネ生成に反映します" />

      {upload && (
        <Card>
          <Field
            label={upload.label}
            required={upload.required}
            hint={`「${data.mainVisual}」を選択中 / 最大${upload.max}枚 / ${upload.hint}`}
          >
            <div
              onClick={() => assetFileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleAssetFiles(e.dataTransfer.files); }}
              style={{
                ...styles.assetDropzone,
                ...(upload.required ? styles.assetDropzoneRequired : {}),
              }}
              className="dropzone-hover"
            >
              <div style={styles.dropzoneIcon} className="dropzone-icon">
                <Upload size={28} />
              </div>
              <div style={{ marginTop: 14, fontSize: 15, fontWeight: 600, color: '#0F0F0F' }}>
                {upload.label}をアップロード
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#606060' }}>
                {upload.hint} / PNG・JPG / 最大{upload.max}枚
              </div>
              {!upload.required && (
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: '#FF0000' }}>
                  画像を入れない場合、AIが自動で生成します
                </div>
              )}
              {upload.required && data.visualAssets.length === 0 && (
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#FF0000' }}>
                  ※ 必須項目（最低1枚アップロードしてください）
                </div>
              )}
              <input ref={assetFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleAssetFiles(e.target.files)} />
            </div>

            {data.visualAssets.length > 0 && (
              <div style={styles.assetGrid}>
                {data.visualAssets.map((a, i) => (
                  <div key={a.id} style={styles.assetCard}>
                    <img src={`data:${a.mediaType};base64,${a.base64}`} alt={a.name} style={styles.assetImg} />
                    <button onClick={() => removeAsset(a.id)} style={styles.refRemove} className="ref-remove-hover">
                      <X size={14} />
                    </button>
                    <div style={styles.assetNum}>{i + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </Field>
        </Card>
      )}

      {!upload && (
        <div style={styles.infoBox}>
          <FileText size={20} style={{ color: '#FF0000', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#0F0F0F', fontSize: 14 }}>
              「{data.mainVisual}」では素材画像のアップロードは不要です
            </div>
            <div style={{ fontSize: 13, color: '#606060', lineHeight: 1.7 }}>
              文字主体のサムネが生成されます。下の「参考サムネ画像」は任意で設定できます。
            </div>
          </div>
        </div>
      )}

      <Card>
        <Field label="参考サムネ画像" hint="任意・最大5枚 / 色味・構図の参考になる画像">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            style={styles.dropzone}
            className="dropzone-hover"
          >
            <div style={styles.dropzoneIcon} className="dropzone-icon">
              <Upload size={28} />
            </div>
            <div style={{ marginTop: 16, fontSize: 16, fontWeight: 500, color: '#0F0F0F' }}>
              参考サムネをアップロード
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#606060' }}>
              クリックまたはドラッグ&ドロップ / PNG・JPG・WebP / 最大5枚
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
          </div>
        </Field>

        {data.refs.length > 0 && (
          <div style={{ ...styles.refGrid, marginTop: 16 }}>
            {data.refs.map(ref => (
              <div key={ref.id} style={{ ...styles.refCard, ...(ref.isMain ? styles.refCardMain : {}) }}>
                <div style={styles.refImgWrap}>
                  <img src={`data:${ref.mediaType};base64,${ref.base64}`} alt={ref.name} style={styles.refImg} />
                  <button onClick={() => removeRef(ref.id)} style={styles.refRemove} className="ref-remove-hover">
                    <X size={16} />
                  </button>
                  {ref.isMain && (
                    <div style={styles.mainBadge}>
                      <Play size={10} fill="currentColor" />
                      <span>MAIN</span>
                    </div>
                  )}
                </div>
                <div style={styles.refControls}>
                  <select value={ref.context} onChange={e => setContext(ref.id, e.target.value)} style={styles.refSelect}>
                    {REF_CONTEXTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {!ref.isMain && (
                    <button onClick={() => setMain(ref.id)} style={styles.mainBtn} className="main-btn-hover">
                      メインに設定
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// STEP 3: SCRIPT
// ============================================================
function Step3({ data, update }: any) {
  return (
    <div style={styles.stepContent}>
      <SectionTitle title="原稿・台本入力" desc="原稿全文または箇条書きメモを貼り付けてください。フック・要点はClaudeが自動抽出します" />

      <Card>
        <div style={styles.scriptBox}>
          <div style={styles.scriptIconHeader}>
            <FileText size={18} style={{ color: '#FF0000' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F0F0F' }}>動画原稿・台本・メモ</span>
            <span style={{ fontSize: 11, color: '#909090', marginLeft: 'auto', fontFamily: 'Roboto Mono, monospace' }}>
              {data.script.length} 文字
            </span>
          </div>
          <textarea
            value={data.script}
            onChange={e => update('script', e.target.value)}
            style={styles.scriptArea}
            placeholder={`動画原稿・台本・箇条書きメモなんでもOK。

例：
■ タイトル候補：S&P500の隠れたリスク
■ フック：実は今、米国株を持っているだけで気づかぬうちに損失が膨らんでいる
■ 結論：今すぐ●●を確認すべき
■ 内容：
- 為替リスクの本当の意味
- ヘッジありなしの違い
- 過去10年のデータ分析
- 具体的な対策3つ

Claudeが原稿から最大のフック、心理トリガー、視聴者が食いつくポイントを自動抽出してサムネ生成に活用します。`}
          />
          <div style={styles.scriptHint}>
            <Sparkles size={14} style={{ color: '#FF0000', flexShrink: 0 }} />
            <span>30文字以上で次へ進めます。詳しく書くほど精度の高いサムネが生成されます。</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// STEP 4: REQUIRED PHRASES
// ============================================================
function Step4({ data, update, setData }: any) {
  const addPhrase = () => {
    const v = data.phraseInput.trim();
    if (!v) return;
    if (v.length > 12) {
      alert('Image 2.0で確実に描画させるため、12文字以内で入力してください');
      return;
    }
    setData(d => ({ ...d, requiredPhrases: [...d.requiredPhrases, v], phraseInput: '' }));
  };
  const removePhrase = (i) => setData(d => ({ ...d, requiredPhrases: d.requiredPhrases.filter((_, idx) => idx !== i) }));

  return (
    <div style={styles.stepContent}>
      <SectionTitle title="必ず入れたい文言" desc="任意 / Image 2.0の日本語描画限界を考慮し12文字以内推奨" />

      <Card>
        <Field label="必須文言" hint="例：9割が知らない / AI時代の勝ち組 / 危険な真実">
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={data.phraseInput}
              onChange={e => update('phraseInput', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPhrase()}
              style={{ ...styles.input, flex: 1 }}
              placeholder="文言を入力してEnter（12文字以内推奨）" maxLength={20} />
            <button onClick={addPhrase} style={styles.addBtn} className="add-btn-hover">追加</button>
          </div>
          <div style={styles.charCount}>{data.phraseInput.length} / 12 推奨</div>

          {data.requiredPhrases.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.requiredPhrases.map((p, i) => (
                <div key={i} style={styles.phraseChip}>
                  <span style={{ fontWeight: 600 }}>{p}</span>
                  <button onClick={() => removePhrase(i)} style={styles.phraseRemove}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>
      </Card>

      <div style={styles.infoBox}>
        <Sparkles size={20} style={{ color: '#FF0000', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4, color: '#0F0F0F', fontSize: 14 }}>次のステップ：AI生成</div>
          <div style={{ fontSize: 13, color: '#606060', lineHeight: 1.7 }}>
            「サムネを生成」ボタンを押すと、GPT-5が<strong>タイトル案3つ</strong>を生成し、続けてOpenAI Image 2.0が<strong>サムネ画像5パターン</strong>を生成します。所要時間は約1〜3分です。<br />
            <span style={{ color: '#FF0000', fontWeight: 700 }}>※ 出力サイズはYouTube標準の1280×720pxに自動調整されます</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 5: OUTPUT (3 titles + 5 generated images)
// ============================================================
function Step5({ result, setResult }: any) {
  if (!result) return null;

  return (
    <div style={styles.stepContent}>
      <SectionTitle title="生成結果" desc="タイトル案3つとサムネ用プロンプト5パターンが完成しました" />

      {result.isDemo && (
        <div style={styles.demoBanner}>
          <Eye size={20} style={{ flexShrink: 0, color: '#856404' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 2, fontSize: 14 }}>★ デモモード ★</div>
            <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.6 }}>
              実際のAI生成は行われていません。出力画面のレイアウト・操作感を確認するためのモック表示です。
            </div>
          </div>
        </div>
      )}

      <OutputSection title="タイトル案" sub="TITLES" count={result.titles?.length || 0}>
        {result.titles?.map((t, i) => (
          <CopyCard key={i} text={t.text}
            badges={[
              { label: t.trigger, kind: 'trigger' },
              { label: `想定CTR: ${t.expectedCTR}`, kind: 'ctr' },
            ]} />
        ))}
      </OutputSection>

      <div style={styles.patternsHeader}>
        <div>
          <h3 style={styles.patternsTitle}>サムネ画像</h3>
          <p style={styles.patternsDesc}>GPT Image 2 で生成した5パターン（1280×720）</p>
        </div>
        <span style={styles.patternsCount}>
          {result.thumbnails?.length || 0} パターン
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {result.thumbnails?.map((t, i) => (
          <ThumbnailImageCard
            key={i}
            data={t}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
function Card({ children }: any) { return <div style={styles.card}>{children}</div>; }

function SectionTitle({ title, desc }: any) {
  return (
    <div style={styles.sectionTitle}>
      <h2 style={styles.sectionH}>{title}</h2>
      {desc && <p style={styles.sectionDesc}>{desc}</p>}
    </div>
  );
}

function Field({ label, hint, required, children }: any) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabelRow}>
        <span style={styles.fieldLabel}>
          {label}{required && <span style={styles.required}>*</span>}
        </span>
        {hint && <span style={styles.fieldHint}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Pills({ options, value, onChange, multi, stack }: any) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flexDirection: stack ? 'column' : 'row' }}>
      {options.map(o => {
        const active = multi ? value.includes(o) : value === o;
        const handleClick = () => {
          if (multi) onChange(o);
          else onChange(active ? '' : o);
        };
        return (
          <button key={o} onClick={handleClick}
            style={{ ...styles.pill, ...(active ? styles.pillActive : {}) }}
            className={active ? 'pill-active-hover' : 'pill-hover'}
          >
            {active && <Check size={14} style={{ marginRight: 6, marginLeft: -4 }} />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function CardGrid({ options, value, onChange, multi }: any) {
  return (
    <div style={styles.cardGrid}>
      {options.map(o => {
        const active = multi ? value.includes(o.value) : value === o.value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            style={{ ...styles.cardOption, ...(active ? styles.cardOptionActive : {}) }}
            className={active ? 'card-option-active-hover' : 'card-option-hover'}
          >
            {active && <div style={styles.cardCheck}><Check size={14} /></div>}
            <div style={styles.cardOptionTitle}>{o.title}</div>
            <div style={styles.cardOptionDesc}>{o.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

function OutputSection({ title, sub, count, children }: any) {
  return (
    <div style={styles.outputSection}>
      <div style={styles.outputHeader}>
        <div>
          <h3 style={styles.outputTitle}>{title}</h3>
          {sub && <span style={styles.outputSub}>{sub}</span>}
        </div>
        <span style={styles.outputCount}>{count}件</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function CopyCard({ text, badges = [] }: any) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={styles.copyCard} className="copy-card-hover">
      <div style={{ flex: 1 }}>
        <div style={styles.copyText}>{text}</div>
        {badges.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {badges.map((b, i) => (
              <span key={i} style={{ ...styles.badge, ...(b.kind === 'trigger' ? styles.badgeTrigger : styles.badgeCtr) }}>
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <button onClick={copy} style={{ ...styles.copyBtn, ...(copied ? styles.copyBtnDone : {}) }} className={copied ? '' : 'copy-btn-hover'}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span>{copied ? 'コピー済' : 'コピー'}</span>
      </button>
    </div>
  );
}

// ============================================================
// THUMBNAIL IMAGE CARD (shows generated image)
// ============================================================
// ============================================================
// REGION SELECTOR - Visual rectangular selection on image
// ============================================================
function RegionSelector({ imageBase64, regions, onAddRegion, onRemoveRegion }: any) {
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPt, setStartPt] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [pendingRect, setPendingRect] = useState(null);

  const getRelativeCoords = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleMouseDown = (e) => {
    if (pendingRect) return; // Don't start new while pending edit
    e.preventDefault();
    const pt = getRelativeCoords(e);
    setStartPt(pt);
    setIsDrawing(true);
    setCurrentRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPt) return;
    const pt = getRelativeCoords(e);
    setCurrentRect({
      x: Math.min(startPt.x, pt.x),
      y: Math.min(startPt.y, pt.y),
      w: Math.abs(pt.x - startPt.x),
      h: Math.abs(pt.y - startPt.y),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);
    // Only register if rect is meaningfully large
    if (currentRect.w > 2 && currentRect.h > 2) {
      setPendingRect(currentRect);
    } else {
      setCurrentRect(null);
    }
  };

  const cancelPending = () => {
    setPendingRect(null);
    setCurrentRect(null);
    setStartPt(null);
  };

  const confirmRegion = (action, value) => {
    if (!pendingRect) return;
    onAddRegion({
      ...pendingRect,
      action,
      value: value || '',
      id: Math.random().toString(36).slice(2),
    });
    setPendingRect(null);
    setCurrentRect(null);
    setStartPt(null);
  };

  // Get position description for AI prompt
  const getPositionDesc = (rect) => {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    let h = '';
    if (cy < 33) h = '上部';
    else if (cy > 66) h = '下部';
    else h = '中央';
    let v = '';
    if (cx < 33) v = '左';
    else if (cx > 66) v = '右';
    else v = '中央';
    return `${h}${v === '中央' && h !== '中央' ? '中央' : v}`;
  };

  return (
    <div style={styles.regionSelectorWrap}>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={styles.regionCanvas}
      >
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt="編集対象"
          style={styles.regionImage}
          draggable={false}
        />

        {/* Existing regions */}
        {regions.map((r, i) => (
          <div key={r.id} style={{
            ...styles.regionRect,
            left: `${r.x}%`,
            top: `${r.y}%`,
            width: `${r.w}%`,
            height: `${r.h}%`,
          }}>
            <div style={styles.regionBadge}>{i + 1}</div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveRegion(r.id); }}
              style={styles.regionRemove}
              title="この指示を削除"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* Currently drawing rect */}
        {currentRect && !pendingRect && (
          <div style={{
            ...styles.regionRectDrawing,
            left: `${currentRect.x}%`,
            top: `${currentRect.y}%`,
            width: `${currentRect.w}%`,
            height: `${currentRect.h}%`,
          }} />
        )}

        {/* Pending rect (waiting for action selection) */}
        {pendingRect && (
          <div style={{
            ...styles.regionRectPending,
            left: `${pendingRect.x}%`,
            top: `${pendingRect.y}%`,
            width: `${pendingRect.w}%`,
            height: `${pendingRect.h}%`,
          }}>
            <div style={styles.regionBadgePending}>{regions.length + 1}</div>
          </div>
        )}
      </div>

      {/* Hint text */}
      {regions.length === 0 && !pendingRect && !isDrawing && (
        <div style={styles.regionHint}>
          画像上でドラッグして、変更したい範囲を矩形で囲んでください
        </div>
      )}

      {/* Action picker for pending rect */}
      {pendingRect && (
        <ActionPicker
          rect={pendingRect}
          positionDesc={getPositionDesc(pendingRect)}
          onConfirm={confirmRegion}
          onCancel={cancelPending}
        />
      )}
    </div>
  );
}

// ============================================================
// ACTION PICKER - choose what to do with selected region
// ============================================================
function ActionPicker({ rect, positionDesc, onConfirm, onCancel }: any) {
  const [action, setAction] = useState(null);
  const [value, setValue] = useState('');

  const actions = [
    { id: 'change_text', icon: '✏️', label: '文字を変更', placeholder: '例: 9割が知らない' },
    { id: 'remove', icon: '🗑', label: '削除', placeholder: null },
    { id: 'free', icon: '💬', label: '自由指示', placeholder: '例: 顔をもっと驚いた表情に / 背景を赤に' },
  ];

  if (!action) {
    return (
      <div style={styles.actionPicker}>
        <div style={styles.actionPickerHeader}>
          <div style={styles.actionPickerTitle}>
            選択範囲（{positionDesc}付近）にどうしますか?
          </div>
          <button onClick={onCancel} style={styles.actionCancelBtn}>
            <X size={14} />
          </button>
        </div>
        <div style={styles.actionGrid}>
          {actions.map(a => (
            <button
              key={a.id}
              onClick={() => {
                if (a.id === 'remove') {
                  onConfirm('remove', '');
                } else {
                  setAction(a);
                }
              }}
              style={styles.actionChoiceBtn}
              className="action-choice-hover"
            >
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.actionPicker}>
      <div style={styles.actionPickerHeader}>
        <div style={styles.actionPickerTitle}>
          <span style={{ marginRight: 6 }}>{action.icon}</span>
          {action.label}（{positionDesc}）
        </div>
        <button onClick={onCancel} style={styles.actionCancelBtn}>
          <X size={14} />
        </button>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={action.placeholder}
        style={styles.actionInput}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onConfirm(action.id, value.trim());
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button onClick={() => setAction(null)} style={styles.actionBackBtn}>
          ← 戻る
        </button>
        <button
          onClick={() => value.trim() && onConfirm(action.id, value.trim())}
          disabled={!value.trim()}
          style={{
            ...styles.actionConfirmBtn,
            ...(!value.trim() ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
          }}
          className={value.trim() ? 'primary-btn-hover' : ''}
        >
          <Check size={14} />
          <span>追加</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// THUMBNAIL IMAGE CARD (with inline editor)
// ============================================================
function ThumbnailImageCard({ data, index }: any) {
  const [textCopied, setTextCopied] = useState(false);
  const Icon = getDirectionIcon(data.label);
  const t = data.thumbnailText || { main: '', sub: '', marker: '' };

  const copyText = () => {
    const fullText = t.sub ? `${t.main}\n${t.sub}` : t.main;
    navigator.clipboard.writeText(fullText);
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 1500);
  };

  const downloadImage = () => {
    if (!data.imageBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${data.imageBase64}`;
    link.download = `thumbnail-pattern-${String(index + 1).padStart(2, '0')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderWithMarker = (text: string, marker: string) => {
    if (!marker || !text || !text.includes(marker)) return text;
    const parts = text.split(marker);
    return parts.map((p, i) => (
      <React.Fragment key={i}>
        {p}{i < parts.length - 1 && <span style={styles.marker}>{marker}</span>}
      </React.Fragment>
    ));
  };

  return (
    <div style={styles.thumbCard}>
      {/* Header */}
      <div style={styles.thumbCardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={styles.thumbCardIcon}><Icon size={16} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={styles.thumbCardNum}>PATTERN {String(index + 1).padStart(2, '0')}</div>
            <div style={styles.thumbCardLabel}>{data.label}</div>
          </div>
        </div>
        {data.imageBase64 && (
          <button onClick={downloadImage} style={styles.copyAllBtn} className="copy-all-hover">
            <Download size={14} />
            <span>ダウンロード</span>
          </button>
        )}
      </div>

      {/* Image */}
      {data.imageBase64 ? (
        <div style={{ background: '#000', aspectRatio: '16/9', overflow: 'hidden' }}>
          <img
            src={`data:image/png;base64,${data.imageBase64}`}
            alt={`Thumbnail Pattern ${index + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ) : data.imageError ? (
        <div style={{ padding: 32, background: '#FFEBEE', color: '#FF0000', textAlign: 'center', fontSize: 13, borderTop: '1px solid #E5E5E5' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <AlertCircle size={32} />
          </div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>画像生成に失敗しました</div>
          <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.6, maxWidth: 480, margin: '0 auto', wordBreak: 'break-word' }}>{data.imageError}</div>
        </div>
      ) : (
        <div style={{ padding: 32, background: '#FAFAFA', textAlign: 'center', fontSize: 13, color: '#909090', borderTop: '1px solid #E5E5E5' }}>
          画像なし（デモモード）
        </div>
      )}

      {/* Text section */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={styles.patternSectionLabel}>
          <Type size={12} />
          <span>サムネ文字案</span>
          <button onClick={copyText} style={{
            ...styles.miniCopyBtn,
            ...(textCopied ? styles.miniCopyBtnDone : {})
          }} className={textCopied ? '' : 'mini-copy-hover'}>
            {textCopied ? <Check size={12} /> : <Copy size={12} />}
            <span>{textCopied ? 'コピー済' : '文字をコピー'}</span>
          </button>
        </div>
        <div style={styles.patternTextWrap}>
          <div style={styles.thumbMain}>{renderWithMarker(t.main, t.marker)}</div>
          {t.sub && <div style={styles.thumbSub}>{renderWithMarker(t.sub, t.marker)}</div>}
          {t.marker && (
            <div style={styles.markerNote}>
              黄色強調: <span style={{ fontWeight: 700, color: '#0F0F0F' }}>{t.marker}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function Footer({ step, setStep, canProceed, loading, generate, reset }: any) {
  if (step === 5) {
    return (
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <button onClick={() => setStep(4)} style={styles.backBtn} className="back-btn-hover">
            <ChevronLeft size={18} /><span>戻る</span>
          </button>
          <button onClick={reset} style={styles.primaryBtn} className="primary-btn-hover">
            <RotateCcw size={16} /><span>新しいサムネを作る</span>
          </button>
        </div>
      </footer>
    );
  }
  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
          style={{ ...styles.backBtn, opacity: step === 1 ? 0.3 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer' }}
          className={step === 1 ? '' : 'back-btn-hover'}
        >
          <ChevronLeft size={18} /><span>戻る</span>
        </button>
        {step < 4 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed}
            style={{ ...styles.primaryBtn, ...(canProceed ? {} : styles.primaryBtnDisabled) }}
            className={canProceed ? 'primary-btn-hover' : ''}
          >
            <span>次へ</span><ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={generate} disabled={loading || !canProceed}
            style={{ ...styles.primaryBtn, ...((loading || !canProceed) ? styles.primaryBtnDisabled : {}) }}
            className={(loading || !canProceed) ? '' : 'primary-btn-hover'}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
            <span>{loading ? '生成中...' : 'サムネを生成'}</span>
          </button>
        )}
      </div>
    </footer>
  );
}

// ============================================================
// HELPERS
// ============================================================
// fileToBase64 imported from @/lib/helpers

// ============================================================
// DEMO MODE (Generate mock PNG thumbnails using Canvas)
// ============================================================
function generateMockPNG({ main, sub, label, theme }) {
  const themes = {
    red:   { bg: '#1A0808', accent: '#7F0000', text: '#FFEB3B', stroke: '#000000' },
    navy:  { bg: '#0A1A3F', accent: '#1E40AF', text: '#FFFFFF', stroke: '#000000' },
    dark:  { bg: '#0F0F0F', accent: '#3F0000', text: '#FF1A1A', stroke: '#000000' },
    mixed: { bg: '#1F0A0A', accent: '#7F0000', text: '#FFEB3B', stroke: '#000000' },
    gold:  { bg: '#1A1A0F', accent: '#3F3500', text: '#FFD600', stroke: '#000000' },
  };
  const t = themes[theme] || themes.red;

  // YouTube standard size: 1280x720
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 1280, 720);
  grad.addColorStop(0, t.bg);
  grad.addColorStop(1, t.accent);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);

  // Subtle grid overlay for visual depth
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 1280; i += 80) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 720); ctx.stroke();
  }
  for (let i = 0; i < 720; i += 80) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1280, i); ctx.stroke();
  }

  // DEMO watermark (top center)
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = 'bold 32px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('★ DEMO MOCK IMAGE ★', 640, 70);

  // Main text with thick stroke
  const fontStack = '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif';
  ctx.font = `900 ${main.length > 6 ? 130 : 160}px ${fontStack}`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 14;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = t.stroke;
  ctx.strokeText(main, 640, 380);
  ctx.fillStyle = t.text;
  ctx.fillText(main, 640, 380);

  // Sub text
  if (sub) {
    ctx.font = `700 ${sub.length > 6 ? 70 : 90}px ${fontStack}`;
    ctx.lineWidth = 9;
    ctx.strokeStyle = t.stroke;
    ctx.strokeText(sub, 640, 510);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(sub, 640, 510);
  }

  // Pattern label tag (bottom-left)
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'left';
  const labelW = ctx.measureText(label).width + 40;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(40, 640, labelW, 50);
  ctx.fillStyle = 'white';
  ctx.fillText(label, 60, 675);

  return canvas.toDataURL('image/png').split(',')[1];
}

function getDemoResult() {
  const thumbs = [
    {
      theme: 'red', main: '知らないと損', sub: '新NISAの罠',
      label: '強インパクト型・恐怖訴求', marker: '損',
      prompt: 'Create a YouTube thumbnail in 16:9 widescreen aspect ratio (1280x720). COMPOSITION PATTERN: Close-up face with power word style. SUBJECT: A Japanese man in his late 30s with worried, shocked expression — wide eyes, slight frown. Wearing navy business suit. Position face on right 40% of frame. BACKGROUND: Deep crimson red gradient with dark vignette. TEXT: Main "知らないと損" in upper-left, extra-bold gothic, ~180px, bright yellow with thick black outline. Sub "新NISAの罠" below, white with black outline. The word "損" gets a yellow highlight block. STYLE: Photorealistic, high contrast, dramatic lighting from upper-left.',
    },
    {
      theme: 'navy', main: 'プロの常識', sub: '正しい買い方',
      label: '信頼感型・権威付け', marker: 'プロ',
      prompt: 'Create a YouTube thumbnail in 16:9 widescreen aspect ratio. COMPOSITION: Authority-style portrait. SUBJECT: A trustworthy Japanese male financial advisor in his 40s, confident calm expression, slight smile, wearing a navy suit and silver tie. Pointing at the text. BACKGROUND: Deep navy blue gradient with subtle gold accents and soft bokeh. TEXT: Main "プロの常識" in left-center, gold/cream color with deep navy outline, large bold gothic font. Sub "正しい買い方" below in white. STYLE: Premium, polished, professional photography. Conveys trust and expertise.',
    },
    {
      theme: 'dark', main: '9割が知らない', sub: 'あの真実',
      label: 'ミステリアス型・好奇心ギャップ', marker: '9割',
      prompt: 'Create a YouTube thumbnail in 16:9 widescreen aspect ratio. COMPOSITION: Black-box mystery style. Center features a silhouette/shadowy figure with question marks. BACKGROUND: Pure black with subtle red glow accents. TEXT: Main "9割が知らない" centered, large bold gothic in bright red (#FF1A1A) with thick black outline. Sub "あの真実" below in white with red accent. The "9割" gets a yellow highlight. STYLE: Mysterious, dark, intriguing. Creates curiosity gap.',
    },
    {
      theme: 'mixed', main: '貯金は危険', sub: '今すぐ確認',
      label: '強フック型・断定的衝撃', marker: '危険',
      prompt: 'Create a YouTube thumbnail in 16:9 widescreen aspect ratio. COMPOSITION: Strong hook style with shocking statement. SUBJECT: A Japanese person with extreme shock/disbelief expression — wide eyes, mouth open in horror. BACKGROUND: Aggressive red and black gradient with warning-style design elements. TEXT: Main "貯金は危険" centered, massive extra-bold gothic, bright yellow with very thick black outline (occupying 40% of frame). Sub "今すぐ確認" below in white with red highlight. The word "危険" has a yellow highlight block. STYLE: Maximum visual impact, alarming, urgent.',
    },
    {
      theme: 'gold', main: '終了', sub: 'S&P500神話',
      label: '強キラーワード型・1単語勝負', marker: '終了',
      prompt: 'Create a YouTube thumbnail in 16:9 widescreen aspect ratio. COMPOSITION: Single killer-word dominant style. The word "終了" should occupy 60-70% of the frame center. SUBJECT: Behind the giant text, a Japanese man pointing at the word with a serious, warning expression. BACKGROUND: Bright yellow (#FFD600) solid background with subtle texture. TEXT: Main "終了" in massive extra-bold gothic, deep black with no outline, dominating the center. Sub "S&P500神話" small at bottom, black bold. STYLE: Maximum word impact, minimal decoration.',
    },
  ];

  return {
    isDemo: true,
    titles: [
      { text: '新NISA 月3万｜住宅ローン返済中の会社員が老後不安を消した3ステップ', trigger: '損失回避', expectedCTR: '高' },
      { text: '【2026年版】38歳から始める新NISA｜プロが教える失敗しない買い方', trigger: '権威付け', expectedCTR: '中高' },
      { text: 'S&P500だけじゃ危険？ 9割が知らない新NISAの落とし穴と対策5選', trigger: '好奇心ギャップ', expectedCTR: '高' },
    ],
    thumbnails: thumbs.map(t => ({
      label: t.label,
      thumbnailText: { main: t.main, sub: t.sub, marker: t.marker },
      imagePrompt: t.prompt,
      imageBase64: null,
      imageError: null,
    })),
  };
}

// ============================================================
// STYLES
// ============================================================

// globalCSS imported from @/lib/styles
