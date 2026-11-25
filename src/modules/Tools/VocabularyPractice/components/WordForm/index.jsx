import { useEffect, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import Button from '@/components/os/Button';

const initialValues = { english: '', vietnamese: '' };

function WordField({ id, label, value, onChange, placeholder }) {
  return (
    <label htmlFor={id} className="block space-y-1.5 text-xs font-semibold text-[var(--os-text-secondary)]">
      <span>{label}</span>
      <input
        id={id}
        autoComplete="off"
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="os-focus-ring h-10 w-full rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 text-sm text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)] focus:bg-[var(--os-surface-1)]"
      />
    </label>
  );
}

export default function WordForm({ word, onSave, onCancel }) {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(word ? { english: word.english, vietnamese: word.vietnamese } : initialValues);
  }, [word]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const english = values.english.trim();
    const vietnamese = values.vietnamese.trim();
    if (!english || !vietnamese) return;
    onSave({ english, vietnamese });
    if (!word) setValues(initialValues);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3.5 rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 self-start"
    >
      <div>
        <h4 className="text-sm font-bold text-[var(--os-text-primary)]">
          {word ? 'Chỉnh sửa cặp từ' : 'Thêm từ mới'}
        </h4>
        <p className="mt-0.5 text-[11px] text-[var(--os-text-muted)]">
          Các từ đồng nghĩa ngăn cách bằng dấu phẩy.
        </p>
      </div>

      <WordField
        id="vocabulary-english"
        label="Tiếng Anh (English)"
        value={values.english}
        onChange={(e) => setValues((c) => ({ ...c, english: e.target.value }))}
        placeholder="e.g. thoughtful, considerate"
      />
      <WordField
        id="vocabulary-vietnamese"
        label="Nghĩa Tiếng Việt"
        value={values.vietnamese}
        onChange={(e) => setValues((c) => ({ ...c, vietnamese: e.target.value }))}
        placeholder="chu đáo, ân cần"
      />

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          icon={word ? <Check size={14} /> : <Plus size={14} />}
        >
          {word ? 'Lưu thay đổi' : 'Thêm vào bảng'}
        </Button>
        {word && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Hủy sửa"
            icon={<X size={14} />}
            onClick={onCancel}
          >
            Hủy
          </Button>
        )}
      </div>
    </form>
  );
}
