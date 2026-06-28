import { useEffect, useState } from 'react';
import AddressEditForm from './AddressEditForm';
import { CURRENT_LOCATION_MOCK_LABEL, QUICK_DEPARTURE_LOCATIONS } from '../mockData';

interface DepartureLocationSheetProps {
  open: boolean;
  currentValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function DepartureLocationSheet({ open, currentValue, onSelect, onClose }: DepartureLocationSheetProps) {
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [draftValue, setDraftValue] = useState(currentValue);

  useEffect(() => {
    if (open) {
      setMode('list');
      setDraftValue(currentValue);
    }
  }, [open, currentValue]);

  if (!open) return null;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel">
        <div className="sheet-panel__header">
          <p className="sheet-panel__title">出発地を選択</p>
          <button type="button" className="sheet-panel__close" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>

        <div className="sheet-panel__body">
          {mode === 'edit' ? (
            <AddressEditForm
              label="出発地"
              value={draftValue}
              onChange={setDraftValue}
              onSave={() => onSelect(draftValue)}
              onCancel={() => setMode('list')}
              placeholder="例：渋谷駅、ホテル名など"
            />
          ) : (
            <>
              <div className="current-location-card">
                <span className="current-location-card__icon">🏠</span>
                <div className="current-location-card__body">
                  <p className="current-location-card__label">現在の出発地</p>
                  <p className="current-location-card__value">{currentValue}</p>
                  <button
                    type="button"
                    className="current-location-card__edit"
                    onClick={() => setMode('edit')}
                  >
                    編集する
                  </button>
                </div>
              </div>

              <p className="sheet-section-label">よく使う場所</p>
              <div className="quick-location-list">
                {QUICK_DEPARTURE_LOCATIONS.map((loc) => {
                  const selected = loc.value === currentValue;
                  return (
                    <button
                      type="button"
                      key={loc.id}
                      className={
                        selected ? 'quick-location-item quick-location-item--selected' : 'quick-location-item'
                      }
                      onClick={() => onSelect(loc.value)}
                    >
                      <span className="quick-location-item__icon">{loc.icon}</span>
                      <span className="quick-location-item__label">{loc.label}</span>
                      {selected ? (
                        <span className="quick-location-item__check">✓</span>
                      ) : (
                        <span className="quick-location-item__chevron">›</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="sheet-section-label">その他の選択肢</p>
              <div className="quick-location-list">
                <button
                  type="button"
                  className="quick-location-item"
                  onClick={() => onSelect(CURRENT_LOCATION_MOCK_LABEL)}
                >
                  <span className="quick-location-item__icon">📡</span>
                  <span className="quick-location-item__label">現在地を使う</span>
                  <span className="quick-location-item__chevron">›</span>
                </button>
                <button type="button" className="quick-location-item" onClick={() => setMode('edit')}>
                  <span className="quick-location-item__icon">✏️</span>
                  <span className="quick-location-item__label">住所を入力する</span>
                  <span className="quick-location-item__chevron">›</span>
                </button>
              </div>

              <p className="sheet-footer-note">
                出発地により、移動時間・費用・CO₂排出量の推定が変わります。
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default DepartureLocationSheet;
