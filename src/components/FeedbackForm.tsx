import { FEEDBACK_HISTORY_NOTE, RATING_CATEGORIES, VISIT_HISTORY } from '../mockData';
import StarRating from './StarRating';

interface FeedbackFormProps {
  ratings: Record<string, number>;
  onRatingChange: (id: string, value: number) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
}

const MAX_LENGTH = 300;

function FeedbackForm({
  ratings,
  onRatingChange,
  comment,
  onCommentChange,
  onSubmit,
}: FeedbackFormProps) {
  return (
    <div>
      <p className="section-title">この旅はいかがでしたか？</p>

      {RATING_CATEGORIES.map((category) => (
        <div className="rating-row" key={category.id}>
          <span className="rating-row__label">{category.label}</span>
          <StarRating
            value={ratings[category.id] ?? 0}
            onChange={(value) => onRatingChange(category.id, value)}
          />
        </div>
      ))}

      <div className="feedback-textarea-wrap">
        <textarea
          className="feedback-textarea"
          value={comment}
          maxLength={MAX_LENGTH}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="感想を自由にご記入ください（任意）"
        />
        <span className="feedback-counter">
          {comment.length}/{MAX_LENGTH}
        </span>
      </div>

      <p className="section-title">訪問履歴（次回の提案に活かします）</p>
      <div className="history-list">
        {VISIT_HISTORY.map((item) => (
          <div
            className={item.isCurrentTrip ? 'history-item history-item--current' : 'history-item'}
            key={item.id}
          >
            <span className="history-item__thumb">{item.isCurrentTrip ? '🚃' : '🚗'}</span>
            <div>
              <p className="history-item__tag">{item.label}</p>
              <p className="history-item__name">{item.planName}</p>
              <p className="history-item__date">{item.date}</p>
            </div>
            {item.isCurrentTrip && <span className="history-item__check">✓</span>}
          </div>
        ))}
      </div>

      <div className="history-note">
        <span>📌</span>
        <p>{FEEDBACK_HISTORY_NOTE}</p>
      </div>

      <button className="primary-button" onClick={onSubmit}>
        送信する
      </button>
    </div>
  );
}

export default FeedbackForm;
