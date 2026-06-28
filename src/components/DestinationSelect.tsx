import type { DestinationCandidate } from '../llm/intentExtractor';

interface DestinationSelectProps {
  candidates: DestinationCandidate[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

export default function DestinationSelect({
  candidates,
  selectedId,
  onSelect,
  loading,
  onSubmit,
}: DestinationSelectProps) {
  const selected = candidates.find((c) => c.id === selectedId);

  // 一番おすすめの代替地（CO₂削減率が最大の近場候補）を算出
  const recommendedId = candidates
    .filter((c) => c.isAlternative)
    .sort((a, b) => b.co2SavingPercent - a.co2SavingPercent)[0]?.id;

  const formatHours = (h: number) =>
    Number.isInteger(h) ? `${h}` : h.toFixed(1);

  return (
    <div>
      <div className="intent-refine__bubble" style={{ marginBottom: 16 }}>
        <span className="intent-refine__bubble-icon">🗺️</span>
        <p className="intent-refine__bubble-text">
          同じ体験が、実はもっと近くでもできます！どの目的地でプランを作りますか？
        </p>
      </div>

      <p className="section-title" style={{ marginBottom: 4 }}>目的地を選ぶ</p>
      <p className="helper-text" style={{ marginBottom: 14 }}>
        近い場所を選ぶほど移動時間が減り、その分 現地の滞在時間が増えて CO₂ も削減できます。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {candidates.map((cand) => {
          const isSelected = selectedId === cand.id;
          const isRecommended = cand.id === recommendedId;
          return (
            <button
              key={cand.id}
              type="button"
              onClick={() => onSelect(cand.id)}
              style={{
                border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                cursor: 'pointer',
                background: isSelected ? 'var(--color-primary-soft)' : '#fafdfb',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                width: '100%',
                boxShadow: isSelected ? '0 4px 14px rgba(22,160,111,0.15)' : 'none',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{
                  fontWeight: 800,
                  fontSize: '14.5px',
                  color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  {cand.isAlternative ? '🌱' : '📍'}
                  {cand.name}
                </span>
                {isRecommended ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#fff',
                    background: 'var(--color-primary)',
                    padding: '3px 10px',
                    borderRadius: '99px',
                    whiteSpace: 'nowrap',
                  }}>
                    🌱 イチオシ
                  </span>
                ) : cand.isAlternative ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-primary-dark)',
                    background: '#cdeee0',
                    padding: '3px 9px',
                    borderRadius: '99px',
                    whiteSpace: 'nowrap',
                  }}>
                    近場エコ候補
                  </span>
                ) : (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    padding: '3px 9px',
                    borderRadius: '99px',
                    background: '#f0f4f3',
                  }}>
                    元の希望
                  </span>
                )}
              </div>

              {/* Reason text */}
              <p style={{
                fontSize: '12.5px',
                color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                lineHeight: '1.55',
                margin: 0,
              }}>
                {cand.reason}
              </p>

              {/* Metrics row (alternatives only) */}
              {cand.isAlternative && (
                <div style={{
                  marginTop: 10,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--color-primary-dark)',
                    background: '#e3f4ec',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                  }}>
                    ⏱ 滞在時間 +約{formatHours(cand.extraStayHours ?? 0)}時間
                  </span>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--color-primary-dark)',
                    background: '#e3f4ec',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                  }}>
                    🌿 CO₂ 約{cand.co2SavingPercent}%削減
                  </span>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div style={{
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                }}>
                  ✓ この目的地で提案してもらう
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div style={{
          marginTop: 20,
          padding: '12px 14px',
          background: 'var(--color-primary-soft)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12.5px',
          color: 'var(--color-primary-dark)',
          lineHeight: 1.55,
        }}>
          <strong>選択中：{selected.name}</strong>
          {selected.isAlternative && (
            <> — 現地の滞在時間が約{formatHours(selected.extraStayHours ?? 0)}時間増え、CO₂排出量を約{selected.co2SavingPercent}%削減できます🌿</>
          )}
        </div>
      )}

      <button
        className="primary-button"
        style={{ marginTop: 18 }}
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? 'プランを作成中...' : 'このプランで提案してもらう →'}
      </button>
    </div>
  );
}
