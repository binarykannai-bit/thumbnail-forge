import { C, FONT, FONT_MONO, FONT_COND, SHADOW_SM, SHADOW_MD } from './constants';

export const styles: Record<string, any> = {
  app: {
    minHeight: '100vh',
    backgroundColor: C.bg,
    color: C.text,
    fontFamily: FONT,
    paddingBottom: 100,
    fontSize: 14,
  },
  header: {
    background: C.dark,
    borderBottom: `2px solid ${C.red}`,
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  },
  headerInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 12 },
  logoMark: {
    width: 40, height: 28,
    background: C.red,
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 0 24px ${C.redGlow}`,
  },
  logoTriangle: {
    width: 0, height: 0,
    borderTop: '8px solid transparent',
    borderBottom: '8px solid transparent',
    borderLeft: '12px solid white',
    marginLeft: 4,
  },
  logoText: { fontFamily: FONT, fontSize: 19, letterSpacing: -0.5, color: C.textOnDark },
  liveDot: {
    width: 8, height: 8,
    background: C.red,
    borderRadius: '50%',
    boxShadow: `0 0 8px ${C.red}`,
  },
  headerBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: C.darkSurface,
    border: `1px solid ${C.darkBorder}`,
    color: C.textOnDark,
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 500,
    borderRadius: 18,
    transition: 'all 0.15s',
  },
  headerBtnConnected: {
    background: 'rgba(16, 185, 129, 0.15)',
    borderColor: C.green,
    color: C.green,
  },
  headerBtnDemo: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'transparent',
    border: `1px dashed ${C.warning}`,
    color: C.warning,
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 700,
    borderRadius: 18,
    transition: 'all 0.15s',
  },
  demoBanner: {
    background: '#FFF3CD',
    border: `1px solid ${C.warning}`,
    borderLeft: `4px solid ${C.warning}`,
    borderRadius: 8,
    padding: '14px 16px',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    color: '#856404',
  },
  main: { maxWidth: 1100, margin: '0 auto', padding: '24px 24px 48px' },
  tabBarWrap: {
    background: C.surface,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    marginBottom: 24,
    boxShadow: SHADOW_SM,
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    alignItems: 'flex-end',
    borderBottom: `1px solid ${C.border}`,
    overflow: 'auto',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: FONT,
    fontSize: 14,
    color: C.textDim,
    position: 'relative',
    transition: 'color 0.15s',
    flexShrink: 0,
  },
  tabNum: { fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700 },
  tabLabel: { fontSize: 14 },
  tabIndicator: {
    position: 'absolute',
    left: 0, right: 0, bottom: -1,
    height: 3,
    background: C.red,
    borderRadius: '3px 3px 0 0',
    boxShadow: `0 0 8px ${C.redGlow}`,
  },
  content: { minHeight: 400 },
  stepContent: { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { marginBottom: 8 },
  sectionH: {
    fontFamily: FONT,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.5,
    margin: 0,
    color: C.text,
  },
  sectionDesc: { fontSize: 14, color: C.textDim, margin: '6px 0 0' },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 24,
    boxShadow: SHADOW_SM,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 14 },
  fieldLabelRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldLabel: { fontSize: 16, fontWeight: 500, color: C.text },
  fieldHint: { fontSize: 12, color: C.textMute },
  required: { color: C.red, marginLeft: 4, fontSize: 14 },

  pill: {
    background: C.surface2,
    border: '1px solid transparent',
    color: C.text,
    padding: '8px 16px',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 500,
    transition: 'all 0.15s',
    textAlign: 'left',
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
  },
  pillActive: {
    background: C.red,
    color: 'white',
    fontWeight: 700,
    boxShadow: `0 0 0 3px ${C.redTint}, 0 2px 8px ${C.redGlow}`,
  },

  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 10,
  },
  cardOption: {
    background: C.surface,
    borderStyle: 'solid',
    borderWidth: '2px',
    borderColor: C.borderStrong,
    color: C.text,
    padding: '15px',
    cursor: 'pointer',
    fontFamily: FONT,
    transition: 'all 0.15s',
    textAlign: 'left',
    borderRadius: 12,
    position: 'relative',
    boxShadow: SHADOW_SM,
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  cardOptionActive: {
    background: C.redLight,
    borderColor: C.red,
    boxShadow: `0 4px 16px ${C.redTint}`,
  },
  cardCheck: {
    position: 'absolute',
    top: 8, right: 8,
    width: 22, height: 22,
    borderRadius: '50%',
    background: C.red,
    color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 2px 8px ${C.redGlow}`,
  },
  cardOptionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 4, color: C.text },
  cardOptionDesc: { fontSize: 12, color: C.textDim },

  row3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },

  input: {
    background: C.surface,
    border: `1px solid ${C.borderStrong}`,
    color: C.text,
    padding: '12px 14px',
    fontSize: 14,
    fontFamily: FONT,
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    borderRadius: 8,
  },
  charCount: {
    fontSize: 12,
    color: C.textMute,
    fontFamily: FONT_MONO,
    textAlign: 'right',
    marginTop: 6,
  },

  scriptBox: { display: 'flex', flexDirection: 'column', gap: 12 },
  scriptIconHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottom: `1px solid ${C.border}`,
  },
  scriptArea: {
    background: C.surface3,
    border: `1px solid ${C.borderStrong}`,
    color: C.text,
    padding: '16px 18px',
    fontSize: 14,
    fontFamily: FONT,
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    borderRadius: 8,
    minHeight: 320,
    lineHeight: 1.7,
  },
  scriptHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: C.redLight,
    border: `1px solid ${C.red}`,
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 12,
    color: C.text,
    fontWeight: 500,
  },

  dropzone: {
    border: `2px dashed ${C.borderStrong}`,
    background: C.surface3,
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: 12,
  },
  assetDropzone: {
    border: `2px dashed ${C.red}`,
    background: C.redLight,
    padding: '32px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: 12,
  },
  assetDropzoneRequired: {
    background: '#FFE0E5',
    boxShadow: `0 0 0 2px ${C.redTintStrong}`,
  },
  assetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 12,
    marginTop: 14,
  },
  assetCard: {
    position: 'relative',
    aspectRatio: '1/1',
    background: C.surface,
    border: `2px solid ${C.red}`,
    overflow: 'hidden',
    borderRadius: 12,
    boxShadow: `0 0 0 3px ${C.redTint}`,
  },
  assetImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  assetNum: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    background: C.red,
    color: 'white',
    fontSize: 11,
    fontWeight: 700,
    width: 22,
    height: 22,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT_MONO,
    boxShadow: `0 2px 8px ${C.redGlow}`,
  },
  dropzoneIcon: {
    width: 64, height: 64,
    borderRadius: '50%',
    background: C.surface2,
    color: C.textDim,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  refGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
  },
  refCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    transition: 'all 0.15s',
    borderRadius: 12,
    boxShadow: SHADOW_SM,
  },
  refCardMain: {
    borderColor: C.red,
    borderWidth: 2,
    boxShadow: `0 0 0 3px ${C.redTint}, 0 4px 16px ${C.redTint}`,
  },
  refImgWrap: {
    position: 'relative',
    aspectRatio: '16/9',
    overflow: 'hidden',
    background: C.surface2,
  },
  refImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  refRemove: {
    position: 'absolute',
    top: 8, right: 8,
    background: 'rgba(0,0,0,0.8)',
    border: 'none',
    color: 'white',
    width: 28, height: 28,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 8, left: 8,
    background: C.red,
    color: 'white',
    fontSize: 10,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 999,
    fontFamily: FONT,
    letterSpacing: 0.5,
    display: 'flex', alignItems: 'center', gap: 4,
    boxShadow: `0 2px 8px ${C.redGlow}`,
  },
  refControls: { padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  refSelect: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: '8px 10px',
    fontSize: 12,
    fontFamily: FONT,
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 6,
  },
  mainBtn: {
    background: 'transparent',
    border: `1px solid ${C.border}`,
    color: C.textDim,
    padding: '6px 10px',
    fontSize: 11,
    fontFamily: FONT,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: 6,
  },
  addBtn: {
    background: C.red,
    border: 'none',
    color: 'white',
    padding: '0 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: FONT,
    transition: 'all 0.15s',
    borderRadius: 8,
    boxShadow: `0 2px 8px ${C.redGlow}`,
  },
  phraseChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: C.red,
    color: 'white',
    padding: '6px 8px 6px 14px',
    fontSize: 13,
    fontFamily: FONT,
    borderRadius: 999,
    boxShadow: `0 2px 8px ${C.redGlow}`,
  },
  phraseRemove: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    opacity: 0.85,
    borderRadius: '50%',
  },
  infoBox: {
    background: C.redLight,
    border: `1px solid ${C.red}`,
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    gap: 12,
    boxShadow: `0 2px 12px ${C.redTint}`,
  },
  apiAlertBox: {
    background: C.surface,
    border: `2px dashed ${C.red}`,
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  errorBox: {
    background: C.redLight,
    border: `1px solid ${C.red}`,
    padding: 16,
    marginTop: 24,
    display: 'flex',
    gap: 12,
    borderRadius: 12,
  },

  // Output section
  outputSection: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    padding: 24,
    borderRadius: 12,
    boxShadow: SHADOW_SM,
  },
  outputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: `1px solid ${C.border}`,
  },
  outputTitle: { fontFamily: FONT, fontSize: 18, fontWeight: 700, margin: 0, color: C.text },
  outputSub: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: C.textMute,
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  outputCount: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    color: 'white',
    fontWeight: 700,
    background: C.red,
    padding: '3px 10px',
    borderRadius: 999,
    boxShadow: `0 2px 8px ${C.redGlow}`,
  },

  copyCard: {
    background: C.surface3,
    border: `1px solid ${C.border}`,
    padding: 16,
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    transition: 'all 0.15s',
    borderRadius: 8,
  },
  copyText: { fontSize: 15, fontWeight: 500, lineHeight: 1.5, color: C.text },

  // Patterns header
  patternsHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingBottom: 12,
    borderBottom: `2px solid ${C.red}`,
  },
  patternsTitle: { fontFamily: FONT, fontSize: 22, fontWeight: 700, margin: 0, color: C.text },
  patternsDesc: { fontSize: 13, color: C.textDim, margin: '4px 0 0' },
  patternsCount: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    color: 'white',
    fontWeight: 700,
    background: C.red,
    padding: '4px 14px',
    borderRadius: 999,
    boxShadow: `0 2px 12px ${C.redGlow}`,
    letterSpacing: 0.5,
  },

  // Thumbnail image grid (2 columns)
  thumbGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  thumbCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: SHADOW_SM,
    transition: 'all 0.15s',
    display: 'flex',
    flexDirection: 'column',
  },
  thumbCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: C.dark,
    borderBottom: `2px solid ${C.red}`,
  },
  thumbCardIcon: {
    width: 32, height: 32,
    background: C.red,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    flexShrink: 0,
  },
  thumbCardNum: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: C.red,
    fontWeight: 700,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  thumbCardLabel: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 700,
    color: C.textOnDark,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  downloadBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: C.red,
    border: `1px solid ${C.red}`,
    color: 'white',
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 700,
    transition: 'all 0.15s',
    flexShrink: 0,
    borderRadius: 999,
    boxShadow: `0 2px 8px ${C.redGlow}`,
  },
  thumbImage: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
    background: C.dark,
  },
  thumbImageError: {
    width: '100%',
    aspectRatio: '16/9',
    background: C.surface3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  thumbCardCaption: {
    padding: '12px 16px',
    background: C.surface3,
    borderTop: `1px solid ${C.border}`,
  },
  thumbCardCaptionLabel: {
    fontFamily: FONT_MONO,
    fontSize: 9,
    color: C.textMute,
    fontWeight: 700,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  thumbCardCaptionText: {
    fontFamily: FONT_COND,
    fontSize: 16,
    color: C.text,
    lineHeight: 1.4,
  },

  // Prompt-output mode banner
  promptModeBanner: {
    background: C.redLight,
    border: `1px solid ${C.red}`,
    borderLeft: `4px solid ${C.red}`,
    borderRadius: 8,
    padding: '14px 16px',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },

  // Pattern card body (combined text + prompt + open ChatGPT)
  patternBody: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  patternSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  patternSectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontFamily: FONT_MONO,
    fontWeight: 700,
    color: C.textMute,
    letterSpacing: 1,
  },
  patternTextWrap: {
    background: C.surface3,
    border: `1px solid ${C.border}`,
    padding: 14,
    borderRadius: 8,
  },
  thumbMain: {
    fontFamily: FONT_COND,
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: -0.5,
    color: C.text,
  },
  thumbSub: {
    fontFamily: FONT_COND,
    fontSize: 18,
    fontWeight: 500,
    color: C.textDim,
    marginTop: 4,
  },
  marker: {
    background: C.yellow,
    color: '#0F0F0F',
    padding: '0 6px',
    fontWeight: 700,
  },
  markerNote: {
    marginTop: 10,
    fontSize: 11,
    color: C.textMute,
    fontFamily: FONT_MONO,
  },
  imgPromptBody: {
    padding: 14,
    fontFamily: FONT_MONO,
    fontSize: 12,
    lineHeight: 1.7,
    overflow: 'hidden',
    transition: 'max-height 0.3s',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    background: C.dark,
    color: C.textOnDark,
    borderRadius: '8px 8px 0 0',
    border: `1px solid ${C.border}`,
    borderBottom: 'none',
  },
  expandBtn: {
    display: 'block',
    width: '100%',
    background: C.surface3,
    border: `1px solid ${C.border}`,
    borderTop: 'none',
    color: C.red,
    padding: '8px',
    fontSize: 12,
    fontFamily: FONT,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.15s',
    letterSpacing: 0.5,
    borderRadius: '0 0 8px 8px',
  },

  // Copy all button (header right)
  copyAllBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: C.red,
    border: `1px solid ${C.red}`,
    color: 'white',
    padding: '8px 14px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 700,
    transition: 'all 0.15s',
    flexShrink: 0,
    borderRadius: 999,
    boxShadow: `0 2px 12px ${C.redGlow}`,
  },
  miniCopyBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'transparent',
    border: `1px solid ${C.border}`,
    color: C.textDim,
    padding: '4px 10px',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 500,
    transition: 'all 0.15s',
    borderRadius: 999,
    marginLeft: 'auto',
  },
  miniCopyBtnRed: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: C.red,
    border: `1px solid ${C.red}`,
    color: 'white',
    padding: '4px 10px',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 700,
    transition: 'all 0.15s',
    borderRadius: 999,
    marginLeft: 'auto',
    boxShadow: `0 1px 6px ${C.redGlow}`,
  },
  miniCopyBtnDone: {
    background: '#10B981',
    color: 'white',
    borderColor: '#10B981',
    boxShadow: '0 1px 6px rgba(16, 185, 129, 0.3)',
  },

  // Open ChatGPT button (bottom of card)
  openChatGPTBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    background: '#10A37F',
    border: '1px solid #10A37F',
    color: 'white',
    padding: '12px',
    fontSize: 13,
    fontFamily: FONT,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: 999,
    boxShadow: '0 2px 12px rgba(16, 163, 127, 0.3)',
    marginTop: 4,
  },

  // Usage box
  usageBox: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    padding: 20,
    borderRadius: 12,
    boxShadow: SHADOW_SM,
  },
  usageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 700,
    marginBottom: 12,
    color: C.text,
    fontSize: 14,
  },
  usageList: {
    margin: 0,
    paddingLeft: 24,
    lineHeight: 1.9,
    fontSize: 13,
    color: C.textDim,
  },

  // Edited badge
  editedBadge: {
    display: 'inline-block',
    background: C.warning,
    color: '#0F0F0F',
    fontSize: 9,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
    marginLeft: 6,
    fontFamily: FONT,
    letterSpacing: 0.5,
  },

  // Revert button
  revertBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    width: 32, height: 32,
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: 999,
    flexShrink: 0,
  },

  // Compare wrap (before/after)
  compareWrap: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 4,
    background: C.dark,
  },
  compareItem: {
    position: 'relative',
    aspectRatio: '16/9',
    overflow: 'hidden',
  },
  compareLabel: {
    position: 'absolute',
    top: 8, left: 8,
    background: 'rgba(0,0,0,0.75)',
    color: 'white',
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 4,
    fontFamily: FONT_MONO,
    letterSpacing: 0.5,
    zIndex: 2,
  },
  compareImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  // Edit toggle
  editToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    background: C.surface3,
    border: 'none',
    borderTop: `1px solid ${C.border}`,
    color: C.red,
    padding: '12px',
    fontSize: 13,
    fontFamily: FONT,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  // Editor box
  editorBox: {
    background: C.surface3,
    borderTop: `1px solid ${C.border}`,
    padding: 16,
  },
  editTabs: {
    display: 'flex',
    gap: 4,
    background: C.surface,
    padding: 4,
    borderRadius: 999,
    marginBottom: 14,
  },
  editTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: 'transparent',
    border: 'none',
    color: C.textDim,
    padding: '8px 12px',
    fontSize: 12,
    fontFamily: FONT,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: 999,
  },
  editTabActive: {
    background: C.red,
    color: 'white',
    boxShadow: `0 2px 8px ${C.redGlow}`,
  },
  editorContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  editorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  editorLabel: {
    fontSize: 11,
    fontFamily: FONT_MONO,
    fontWeight: 700,
    color: C.textDim,
    letterSpacing: 0.8,
    minWidth: 70,
  },
  editorSubLabel: {
    fontSize: 11,
    fontFamily: FONT_MONO,
    fontWeight: 700,
    color: C.textDim,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  editorInput: {
    flex: 1,
    minWidth: 100,
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: FONT,
    outline: 'none',
    borderRadius: 6,
  },
  editorTextarea: {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: '10px 12px',
    fontSize: 13,
    fontFamily: FONT,
    outline: 'none',
    borderRadius: 6,
    resize: 'vertical',
    boxSizing: 'border-box',
    lineHeight: 1.5,
  },
  editorCharCount: {
    fontSize: 10,
    color: C.textMute,
    fontFamily: FONT_MONO,
  },
  colorPicker: {
    display: 'flex',
    gap: 6,
  },
  colorChip: {
    width: 28, height: 28,
    border: `2px solid #CCCCCC`,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.15s',
    padding: 0,
  },
  miniBtn: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 500,
    transition: 'all 0.15s',
    borderRadius: 6,
  },
  miniBtnActive: {
    background: C.red,
    color: 'white',
    borderColor: C.red,
    fontWeight: 700,
    boxShadow: `0 2px 8px ${C.redGlow}`,
  },
  applyBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%',
    background: C.red,
    border: `1px solid ${C.red}`,
    color: 'white',
    padding: '12px',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 700,
    transition: 'all 0.15s',
    borderRadius: 999,
    boxShadow: `0 4px 16px ${C.redGlow}`,
    marginTop: 8,
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 6,
  },
  presetChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: '8px 10px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 500,
    transition: 'all 0.15s',
    borderRadius: 8,
    textAlign: 'left',
  },
  presetChipActive: {
    background: C.redLight,
    borderColor: C.red,
    color: C.red,
    fontWeight: 700,
    boxShadow: `0 2px 8px ${C.redTint}`,
  },
  editorErrorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: C.redLight,
    border: `1px solid ${C.red}`,
    padding: '10px 12px',
    fontSize: 12,
    color: C.red,
    borderRadius: 6,
    marginTop: 10,
    fontWeight: 500,
  },

  // Tab count badge
  tabCount: {
    background: 'rgba(255,255,255,0.3)',
    color: 'white',
    fontSize: 10,
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: 999,
    marginLeft: 4,
    fontFamily: FONT_MONO,
    minWidth: 16,
    textAlign: 'center',
  },

  // Region selector
  regionSelectorWrap: {
    position: 'relative',
  },
  regionCanvas: {
    position: 'relative',
    aspectRatio: '16/9',
    cursor: 'crosshair',
    userSelect: 'none',
    background: C.dark,
    overflow: 'hidden',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
  },
  regionImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    pointerEvents: 'none',
  },
  regionRect: {
    position: 'absolute',
    border: `2px solid ${C.red}`,
    background: 'rgba(255, 0, 0, 0.12)',
    boxShadow: `0 0 0 1px rgba(255,255,255,0.5), 0 0 12px ${C.redGlow}`,
    pointerEvents: 'auto',
  },
  regionRectDrawing: {
    position: 'absolute',
    border: `2px dashed ${C.red}`,
    background: 'rgba(255, 0, 0, 0.08)',
    pointerEvents: 'none',
  },
  regionRectPending: {
    position: 'absolute',
    border: `3px solid ${C.red}`,
    pointerEvents: 'none',
  },
  regionBadge: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 24,
    height: 24,
    background: C.red,
    color: 'white',
    fontSize: 12,
    fontWeight: 700,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT_MONO,
    boxShadow: `0 2px 8px ${C.redGlow}`,
    border: `2px solid white`,
    zIndex: 2,
  },
  regionBadgePending: {
    position: 'absolute',
    top: -12,
    left: -12,
    width: 28,
    height: 28,
    background: C.red,
    color: 'white',
    fontSize: 13,
    fontWeight: 700,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT_MONO,
    boxShadow: `0 2px 12px ${C.redGlow}`,
    border: `3px solid white`,
  },
  regionRemove: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    background: '#0F0F0F',
    color: 'white',
    border: '2px solid white',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    zIndex: 3,
  },
  regionHint: {
    marginTop: 8,
    padding: '8px 12px',
    background: C.surface,
    border: `1px dashed ${C.borderStrong}`,
    borderRadius: 6,
    fontSize: 12,
    color: C.textDim,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Action picker (popup after drawing rect)
  actionPicker: {
    marginTop: 10,
    background: C.surface,
    border: `2px solid ${C.red}`,
    borderRadius: 12,
    padding: 12,
    boxShadow: `0 8px 24px ${C.redTintStrong}`,
  },
  actionPickerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionPickerTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: C.text,
  },
  actionCancelBtn: {
    background: 'transparent',
    border: 'none',
    color: C.textDim,
    cursor: 'pointer',
    padding: 4,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6,
  },
  actionChoiceBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    background: C.surface3,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: '10px 6px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: 8,
    fontFamily: FONT,
  },
  actionInput: {
    width: '100%',
    background: C.surface3,
    border: `1px solid ${C.borderStrong}`,
    color: C.text,
    padding: '10px 12px',
    fontSize: 13,
    fontFamily: FONT,
    outline: 'none',
    borderRadius: 6,
    boxSizing: 'border-box',
  },
  actionBackBtn: {
    flex: 1,
    background: C.surface3,
    border: `1px solid ${C.border}`,
    color: C.textDim,
    padding: '8px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: 6,
    fontFamily: FONT,
  },
  actionConfirmBtn: {
    flex: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    background: C.red,
    border: `1px solid ${C.red}`,
    color: 'white',
    padding: '8px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: 6,
    fontFamily: FONT,
    boxShadow: `0 2px 8px ${C.redGlow}`,
  },

  // Region list (below image)
  regionList: {
    marginTop: 12,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: 10,
  },
  regionListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearAllBtn: {
    background: 'transparent',
    border: 'none',
    color: C.textDim,
    fontSize: 11,
    fontFamily: FONT,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  regionListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 6px',
    borderTop: `1px solid ${C.border}`,
  },
  regionListNum: {
    width: 24, height: 24,
    background: C.red,
    color: 'white',
    fontSize: 12,
    fontWeight: 700,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT_MONO,
    flexShrink: 0,
    boxShadow: `0 2px 4px ${C.redGlow}`,
  },
  regionListPos: {
    fontSize: 10,
    color: C.textMute,
    fontFamily: FONT_MONO,
    fontWeight: 700,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  regionListDesc: {
    fontSize: 12,
    color: C.text,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  regionListRemove: {
    background: 'transparent',
    border: 'none',
    color: C.textDim,
    cursor: 'pointer',
    padding: 4,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Badges
  badge: {
    fontSize: 11,
    padding: '4px 10px',
    fontFamily: FONT,
    fontWeight: 600,
    borderRadius: 999,
  },
  badgeTrigger: {
    background: C.red,
    color: 'white',
    boxShadow: `0 1px 4px ${C.redTintStrong}`,
  },
  badgeCtr: {
    background: C.surface,
    color: C.textDim,
    border: `1px solid ${C.border}`,
  },

  copyBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: '8px 14px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 500,
    transition: 'all 0.15s',
    flexShrink: 0,
    borderRadius: 999,
  },
  copyBtnDone: {
    background: C.green,
    color: 'white',
    borderColor: C.green,
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
  },

  // Loading overlay
  loadingOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 15, 15, 0.85)',
    backdropFilter: 'blur(8px)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    background: C.surface,
    borderRadius: 16,
    padding: '32px 36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    minWidth: 460,
    maxWidth: 560,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    border: `2px solid ${C.red}`,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: C.text,
    textAlign: 'center',
  },

  // Phase track
  phaseTrack: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  phaseStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  phaseCircle: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: C.surface2,
    color: C.textMute,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: FONT_MONO,
    border: `2px solid ${C.border}`,
    transition: 'all 0.3s',
  },
  phaseCircleActive: {
    background: C.red,
    color: 'white',
    borderColor: C.red,
    boxShadow: `0 0 0 4px ${C.redTint}, 0 0 16px ${C.redGlow}`,
  },
  phaseCircleDone: {
    background: '#10B981',
    color: 'white',
    borderColor: '#10B981',
  },
  phaseLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: C.textMute,
    textAlign: 'center',
    fontFamily: FONT,
    letterSpacing: 0.3,
    transition: 'color 0.3s',
  },
  phaseLabelActive: {
    color: C.red,
    fontWeight: 700,
  },
  phaseLabelDone: {
    color: '#10B981',
  },
  phaseLine: {
    flex: 1,
    height: 2,
    background: C.border,
    margin: '0 4px',
    marginBottom: 18,
    transition: 'background 0.3s',
  },
  phaseLineDone: {
    background: '#10B981',
  },

  // Per-thumbnail status grid
  thumbStatusGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    marginTop: 4,
  },
  thumbStatusItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '8px 12px',
    background: C.surface3,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    transition: 'all 0.3s',
    minWidth: 96,
    flex: '0 1 120px',
  },
  thumbStatusGenerating: {
    borderColor: C.red,
    background: C.redLight,
    boxShadow: `0 0 0 1px ${C.redTint}`,
  },
  thumbStatusSuccess: {
    borderColor: '#10B981',
    background: '#ECFDF5',
  },
  thumbStatusFailed: {
    borderColor: C.red,
    background: '#FEE2E2',
  },
  thumbStatusNum: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: C.red,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: FONT_MONO,
  },
  thumbStatusLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: C.text,
    fontFamily: FONT_MONO,
    letterSpacing: 0.5,
  },
  thumbStatusSub: {
    fontSize: 9,
    color: C.textDim,
    fontFamily: FONT_MONO,
  },

  progressBarWrap: {
    width: '100%',
    height: 8,
    background: C.surface2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: C.red,
    borderRadius: 999,
    transition: 'width 0.3s',
    boxShadow: `0 0 12px ${C.redGlow}`,
  },
  progressText: {
    fontSize: 13,
    fontWeight: 700,
    color: C.red,
    fontFamily: FONT_MONO,
  },
  loadingHint: {
    fontSize: 12,
    color: C.textDim,
    textAlign: 'center',
    lineHeight: 1.6,
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 15, 15, 0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 90,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    background: C.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
    background: C.surface3,
  },
  modalTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: C.text,
    flex: 1,
  },
  modalClose: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: C.textDim,
    padding: 4,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  modalDesc: {
    margin: 0,
    fontSize: 14,
    color: C.textDim,
    lineHeight: 1.6,
  },
  warningBox: {
    background: '#FFF8E6',
    border: `1px solid ${C.warning}`,
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },

  footer: {
    position: 'fixed',
    bottom: 0, left: 0, right: 0,
    background: C.surface,
    borderTop: `1px solid ${C.border}`,
    boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
    zIndex: 50,
  },
  footerInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '14px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: '10px 20px',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 500,
    transition: 'all 0.15s',
    borderRadius: 999,
  },
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: C.red,
    border: `1px solid ${C.red}`,
    color: 'white',
    padding: '10px 28px',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: FONT,
    fontWeight: 700,
    letterSpacing: 0.3,
    transition: 'all 0.15s',
    borderRadius: 999,
    boxShadow: `0 4px 16px ${C.redGlow}`,
  },
  primaryBtnDisabled: {
    background: C.border,
    borderColor: C.border,
    color: C.textMute,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};


export const globalCSS = `
  * { box-sizing: border-box; }
  body { margin: 0; background: ${C.bg}; }
  
  .pill-hover:hover { background: ${C.borderStrong}; }
  .pill-active-hover:hover { 
    background: ${C.redHover};
    box-shadow: 0 0 0 4px ${C.redTintStrong}, 0 4px 12px ${C.redGlow};
  }
  
  .card-option-hover:hover { 
    background: ${C.surface3}; 
    border-color: ${C.borderStrong};
    box-shadow: ${SHADOW_MD};
  }
  .card-option-active-hover:hover { 
    background: #FFD9DD;
    box-shadow: 0 6px 24px ${C.redTintStrong};
  }
  
  .tab-hover:hover { color: ${C.text}; }
  
  .header-btn-hover:hover { background: #303030; border-color: ${C.red}; }
  .header-btn-demo-hover:hover { 
    background: rgba(255, 153, 0, 0.15); 
    border-style: solid;
    box-shadow: 0 2px 12px rgba(255, 153, 0, 0.3);
  }
  .back-btn-hover:hover { background: ${C.surface3}; border-color: ${C.borderStrong}; }
  
  .primary-btn-hover:hover { 
    background: ${C.redHover};
    border-color: ${C.redHover};
    box-shadow: 0 4px 24px ${C.redGlow};
    transform: translateY(-1px);
  }
  
  .add-btn-hover:hover { background: ${C.redHover}; box-shadow: 0 2px 16px ${C.redGlow}; }
  
  .copy-btn-hover:hover { background: ${C.redLight}; border-color: ${C.red}; color: ${C.red}; }
  .copy-card-hover:hover { border-color: ${C.borderStrong}; background: ${C.surface}; box-shadow: ${SHADOW_MD}; }
  
  .download-btn-hover:hover {
    background: ${C.redHover};
    box-shadow: 0 4px 20px ${C.redGlow};
    transform: translateY(-1px);
  }
  
  .revert-btn-hover:hover {
    background: ${C.surface3};
    border-color: ${C.warning};
    color: ${C.warning};
  }
  
  .edit-toggle-hover:hover {
    background: ${C.redLight};
    color: ${C.red};
  }
  
  .action-choice-hover:hover {
    background: ${C.redLight};
    border-color: ${C.red};
    color: ${C.red};
    transform: translateY(-1px);
  }
  
  .copy-all-hover:hover {
    background: ${C.redHover};
    box-shadow: 0 4px 20px ${C.redGlow};
    transform: translateY(-1px);
  }
  
  .mini-copy-hover:hover {
    background: ${C.redLight};
    border-color: ${C.red};
    color: ${C.red};
  }
  
  .mini-copy-red-hover:hover {
    background: ${C.redHover};
    box-shadow: 0 2px 12px ${C.redGlow};
  }
  
  .expand-btn-hover:hover { background: ${C.redLight}; }
  
  .open-chatgpt-hover:hover {
    background: #0E8E6E;
    border-color: #0E8E6E;
    box-shadow: 0 4px 20px rgba(16, 163, 127, 0.4);
    transform: translateY(-1px);
  }
  
  .dropzone-hover:hover { border-color: ${C.red}; background: ${C.redLight}; }
  .dropzone-hover:hover .dropzone-icon {
    background: ${C.red};
    color: white;
    box-shadow: 0 0 24px ${C.redGlow};
  }
  
  .ref-remove-hover:hover { background: ${C.red}; }
  .main-btn-hover:hover { 
    background: ${C.red};
    color: white;
    border-color: ${C.red};
    box-shadow: 0 2px 8px ${C.redGlow};
  }
  
  textarea:focus, input:focus, select:focus { 
    border-color: ${C.red} !important;
    box-shadow: 0 0 0 1px ${C.red}, 0 0 12px ${C.redTint};
  }
  
  button:focus, button:focus-visible { outline: none; }
  
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  
  .live-pulse { animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }
  
  /* 矩形選択用の控えめなパルス（サイズ変化なし、影と透明度のみ） */
  .region-pulse {
    animation: region-pulse 2s ease-in-out infinite;
  }
  @keyframes region-pulse {
    0%, 100% {
      box-shadow: 0 0 0 2px white, 0 0 12px ${C.redGlow};
      background: rgba(255, 0, 0, 0.16);
    }
    50% {
      box-shadow: 0 0 0 2px white, 0 0 18px ${C.red};
      background: rgba(255, 0, 0, 0.22);
    }
  }
  
  ::selection { background: ${C.red}; color: white; }
  
  ::-webkit-scrollbar { width: 12px; height: 12px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { 
    background: ${C.borderStrong};
    border-radius: 999px;
    border: 3px solid ${C.bg};
  }
  ::-webkit-scrollbar-thumb:hover { background: ${C.red}; }
  
  .thumb-grid-3plus2 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  @media (max-width: 1024px) {
    .thumb-grid-3plus2 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .thumb-grid-3plus2 { grid-template-columns: 1fr; }
  }
`;
