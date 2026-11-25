import { ArrowDownUp } from 'lucide-react';
import Dropdown from '@/components/os/Dropdown';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Mới nhất' },
  { id: 'oldest', label: 'Cũ nhất' },
  { id: 'name-asc', label: 'Tên A → Z' },
  { id: 'name-desc', label: 'Tên Z → A' },
];

export default function SortDropdown({ value, onChange }) {
  return (
    <Dropdown
      value={value}
      options={SORT_OPTIONS}
      onChange={onChange}
      label="Sắp xếp tài nguyên"
      icon={<ArrowDownUp size={14} />}
      className="w-[126px] sm:w-44"
    />
  );
}
