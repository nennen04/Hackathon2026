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

function NaturalLanguageInput({
  freeText,
  onFreeTextChange,
  selectedKeywords,
  onToggleKeyword,
  selectedConditions,
  onSelectCondition,
  onSubmit,
}: NaturalLanguageInputProps) {
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
        {KEYWORD_CHIPS.map((keyword) => (
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
