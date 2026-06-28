interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
  return (
    <div className="star-group">
      {Array.from({ length: max }).map((_, index) => {
        const n = index + 1;
        return (
          <button
            key={n}
            type="button"
            className={n <= value ? 'star star--filled' : 'star'}
            onClick={() => onChange(n)}
            aria-label={`${n}つ星`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;
