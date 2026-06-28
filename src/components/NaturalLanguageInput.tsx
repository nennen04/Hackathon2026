import { CONDITION_GROUPS, KEYWORD_CHIPS } from '../mockData';

interface NaturalLanguageInputProps {
  freeText: string;
  onFreeTextChange: (value: string) => void;
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  selectedConditions: Record<string, string>;
  onSelectCondition: (groupId: string, optionId: string) => void;
  onSubmit: () => void;
}

const MAX_LENGTH = 300;

const KEYWORD_PRESETS = [
  'レンタカー', 'ドライブ', '電車', 'バス', '新幹線', '飛行機', '徒歩',
  '伊豆', '熱海', '三浦', '鎌倉', '日光', '箱根', '京都', '大阪', '江の島', '奥多摩', '佐原',
  '海鮮', 'グルメ', '温泉', '海', '山', '川', '自然', 'ハイキング', 'のんびり', '歴史', '神社', '寺', '大仏', 'カフェ'
];

export function extractKeywords(text: string): string[] {
  const matched = KEYWORD_PRESETS.filter((kw) => text.includes(kw));

  // 漢字の熟語（2〜4文字）とカタカナ語（2〜6文字）を正規表現で抽出
  const kanjiRegex = /[一-龠]{2,4}/g;
  const katakanaRegex = /[ァ-ヴー]{2,6}/g;

  const exclusions = new Set([
    '希望', '予定', '出発', '到着', '旅行', '計画', '一緒', '今回', '前回', '場所', '自分', '家族', '友達', '夫婦'
  ]);

  let match;
  while ((match = kanjiRegex.exec(text)) !== null) {
    const word = match[0];
    if (!exclusions.has(word) && word.length >= 2) {
      matched.push(word);
    }
  }
  while ((match = katakanaRegex.exec(text)) !== null) {
    const word = match[0];
    if (!exclusions.has(word) && word.length >= 2) {
      matched.push(word);
    }
  }

  // 特定の類義語・表現のゆらぎをキーワードへマッピング
  if (text.includes('子供') || text.includes('子ども') || text.includes('子連れ')) {
    matched.push('子供');
  }
  if (text.includes('だらだら') || text.includes('のんびり') || text.includes('ゆったり')) {
    matched.push('のんびり');
  }

  return Array.from(new Set(matched));
}

function NaturalLanguageInput({
  freeText,
  onFreeTextChange,
  selectedKeywords,
  onToggleKeyword,
  selectedConditions,
  onSelectCondition,
  onSubmit,
}: NaturalLanguageInputProps) {
  const matchedPresets = extractKeywords(freeText);
  const availableKeywords = matchedPresets.length > 0 ? matchedPresets : KEYWORD_CHIPS;

  return (
    <div>
      <p className="section-title">どんな旅にしたいですか？</p>
      <p className="helper-text" style={{ marginBottom: 10 }}>
        行き先や体験のやりたいこと、こだわり条件を自由に入力してください。
      </p>

      <div className="nli-textarea-wrap">
        <textarea
          className="nli-textarea"
          value={freeText}
          maxLength={MAX_LENGTH}
          onChange={(e) => onFreeTextChange(e.target.value)}
          placeholder="例：レンタカーで伊豆に行きたいです。海鮮を食べて、海も見て、温泉に入ってのんびりしたい。"
        />
        <span className="nli-counter">
          {freeText.length}/{MAX_LENGTH}
        </span>
      </div>

      <p className="section-title">キーワード</p>
      <div className="nli-chip-row">
        {availableKeywords.map((keyword) => (
          <button
            key={keyword}
            className={
              selectedKeywords.includes(keyword) ? 'chip chip--active' : 'chip'
            }
            onClick={() => onToggleKeyword(keyword)}
            type="button"
          >
            {keyword}
          </button>
        ))}
      </div>

      {CONDITION_GROUPS.map((group) => (
        <div className="condition-group" key={group.id}>
          <p className="condition-group__label">{group.label}</p>
          <div className="condition-group__options">
            {group.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={
                  selectedConditions[group.id] === option.id
                    ? 'condition-chip condition-chip--active'
                    : 'condition-chip'
                }
                onClick={() => onSelectCondition(group.id, option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button className="primary-button" onClick={onSubmit} style={{ marginTop: 8 }}>
        AIに提案してもらう →
      </button>
      <p className="nli-estimate">所要時間 約30秒</p>
    </div>
  );
}

export default NaturalLanguageInput;
