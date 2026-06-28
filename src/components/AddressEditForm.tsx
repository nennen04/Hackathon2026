interface AddressEditFormProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
}

function AddressEditForm({ label, value, onChange, onSave, onCancel, placeholder }: AddressEditFormProps) {
  return (
    <div className="address-edit-form">
      <label className="address-edit-form__label" htmlFor="address-edit-input">
        {label}
      </label>
      <input
        id="address-edit-input"
        type="text"
        className="address-edit-form__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
      />
      <div className="address-edit-form__actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          キャンセル
        </button>
        <button type="button" className="primary-button" onClick={onSave}>
          保存
        </button>
      </div>
    </div>
  );
}

export default AddressEditForm;
