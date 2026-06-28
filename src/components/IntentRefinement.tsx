import type { ExtractedIntent } from '../llm/intentExtractor';

interface IntentRefinementProps {
  extracted: ExtractedIntent;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  freeNote: string;
  onFreeNoteChange: (v: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

const TAG_ICONS: Record<string, string> = {
  温泉: '♨️',
  露天風呂: '🛁',
  旅館: '🏯',
  海鮮: '🦞',
  海: '🌊',
  海水浴: '🏖️',
  ビーチ: '🏖️',
  山: '⛰️',
  ハイキング: '🥾',
  自然: '🌿',
  紅葉: '🍁',
  桜: '🌸',
  絶景: '🗻',
  寺社仏閣: '⛩️',
  歴史: '📜',
  散策: '🚶',
  グルメ: '🍜',
  和食: '🍱',
  南国料理: '🥭',
  リゾート: '🌴',
  ドライブ: '🚗',
  アウトドア: '🏕️',
  キャンプ: '⛺',
  シュノーケリング: '🤿',
  スキー: '⛷️',
  のんびり: '☕',
  ショッピング: '🛍️',
};

function tagIcon(tag: string): string {
  return TAG_ICONS[tag] ?? '✨';
}

export default function IntentRefinement({
  extracted,
  selectedTags,
  onToggleTag,
  freeNote,
  onFreeNoteChange,
  loading,
  onSubmit,
}: IntentRefinementProps) {
  return (
    <div className="intent-refine">
      {/* AI message bubble */}
      <div className="intent-refine__bubble">
        <span className="intent-refine__bubble-icon">🌱</span>
        <p className="intent-refine__bubble-text">{extracted.shortMessage}</p>
      </div>

      {/* Destination badge */}
      <div className="intent-refine__dest">
        <span className="intent-refine__dest-label">行き先イメージ</span>
        <span className="intent-refine__dest-value">{extracted.destination}</span>
      </div>

      {/* Experience tags */}
      <p className="section-title" style={{ marginTop: 20, marginBottom: 8 }}>
        どんな体験をしたいですか？
      </p>
      <p className="helper-text" style={{ marginBottom: 12 }}>
        タップして調整できます。選んだ内容をもとにプランを提案します。
      </p>
      <div className="intent-refine__tags">
        {extracted.experienceTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={selectedTags.includes(tag) ? 'intent-tag intent-tag--on' : 'intent-tag'}
            onClick={() => onToggleTag(tag)}
          >
            <span className="intent-tag__icon">{tagIcon(tag)}</span>
            {tag}
          </button>
        ))}
      </div>

      {/* Free-form additional note */}
      <p className="section-title" style={{ marginTop: 20, marginBottom: 6 }}>
        その他に追加したいことがあれば
      </p>
      <div className="nli-textarea-wrap">
        <textarea
          className="nli-textarea"
          style={{ minHeight: 72 }}
          value={freeNote}
          maxLength={200}
          onChange={(e) => onFreeNoteChange(e.target.value)}
          placeholder="例：子供と一緒なので歩きすぎない方がいい、予算は1人1万円くらいなど"
        />
        <span className="nli-counter">{freeNote.length}/200</span>
      </div>

      <button
        className="primary-button"
        style={{ marginTop: 20 }}
        onClick={onSubmit}
        disabled={loading || selectedTags.length === 0}
      >
        {loading ? 'プランを作成中...' : 'このイメージでプランを提案してもらう →'}
      </button>
      {selectedTags.length === 0 && (
        <p className="helper-text" style={{ textAlign: 'center', marginTop: 8, color: '#ef4444' }}>
          体験タグを1つ以上選んでください
        </p>
      )}
    </div>
  );
}
