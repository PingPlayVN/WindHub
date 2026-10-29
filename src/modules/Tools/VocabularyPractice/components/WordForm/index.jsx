import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, X } from 'lucide-react';

const initialValues = { english: '', vietnamese: '' };

function WordField({ id, label, value, onChange, placeholder }) {
  return (
    <label htmlFor={id} className="block space-y-1.5 text-xs font-medium text-slate-400">
      {label}
      <input
        id={id}
        autoComplete="off"
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400"
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
    <motion.form initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-[#101319] p-4">
      <div>
        <h3 className="font-semibold text-slate-100">{word ? 'Sửa cặp từ' : 'Thêm từ vựng'}</h3>
        <p className="mt-1 text-xs text-slate-500">Nhiều nghĩa có thể ngăn cách bằng dấu phẩy.</p>
      </div>
      <WordField id="vocabulary-english" label="Tiếng Anh" value={values.english} onChange={(event) => setValues((current) => ({ ...current, english: event.target.value }))} placeholder="e.g. thoughtful, considerate" />
      <WordField id="vocabulary-vietnamese" label="Tiếng Việt" value={values.vietnamese} onChange={(event) => setValues((current) => ({ ...current, vietnamese: event.target.value }))} placeholder="chu đáo, ân cần" />
      <div className="flex gap-2">
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-black transition hover:bg-amber-300">
          {word ? <Check size={15} /> : <Plus size={15} />}
          {word ? 'Lưu thay đổi' : 'Thêm cặp từ'}
        </button>
        {word && (
          <button type="button" onClick={onCancel} aria-label="Hủy sửa" className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white">
            <X size={15} />
          </button>
        )}
      </div>
    </motion.form>
  );
}