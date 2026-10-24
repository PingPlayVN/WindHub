# ASCII Reveal & Skeleton Loading in WindHub

Tích hợp từ mã nguồn [ascii-reveal](https://github.com/quanhoangindex/ascii-reveal.git).

Hiệu ứng skeleton loading và content reveal dựa trên lưới ký tự ASCII:
- **AsciiSkeleton**: Render ngay tức thì (0 layout shift, pure markup + CSS + canvas shimmer).
- **AsciiReveal**: Giải mã (decode) văn bản, hình ảnh, thẻ card theo từng đợt sóng chuyển cảnh mượt mà.
- Tự động đồng bộ font chữ `JetBrains Mono` và dải màu Cam thương hiệu (`--ascii-accent: #f97316`) của WindHub.

---

## 1. Import nhanh

```jsx
import {
  AsciiSkeleton,
  AsciiReveal,
  FileCardSkeleton,
  FileRowSkeleton,
  StatCardSkeleton,
  OfflineAsciiSkeleton
} from '@/components/ui/AsciiReveal';
```

---

## 2. Các biến thể Skeleton (Variants)

| `variant` | Mô tả |
| :--- | :--- |
| `dither` *(mặc định)* | Khối sắc độ `░▒▓█`, rất hợp làm placeholder cho file thumbnail, card, avatar. |
| `scan` | Dấu chấm và ký tự scan decode `··:·:-` + `+=*#%@&$`. Phù hợp văn bản, preview. |
| `terminal` | Ký tự nhị phân `01` quét cùng màu accent WindHub (`#f97316`). Phù hợp trạng thái kết nối mạng, offline. |
| `braille` | Chấm braille mịn `⠢⠔⠑⠊` quét đổi trạng thái. |

---

## 3. Ví dụ sử dụng

### Skeleton khối hình / Thumbnail
```jsx
<AsciiSkeleton variant="dither" rows={6} height={112} className="w-full rounded-xl" />
```

### Skeleton dòng chữ (Text lines)
```jsx
<AsciiSkeleton variant="dither" lines={3} widths={['100%', '80%', '50%']} />
```

### Skeleton Avatar / Khối tròn
```jsx
<AsciiSkeleton variant="dither" rows={3} width={48} height={48} circle />
```

### Kết hợp AsciiReveal để tạo hiệu ứng giải mã khi tải xong
```jsx
{isLoading ? (
  <FileCardSkeleton variant="dither" />
) : (
  <AsciiReveal preset="decode" speed={1.2}>
    <FileItem file={file} />
  </AsciiReveal>
)}
```

---

## 4. Các vị trí đã được áp dụng trong WindHub

1. **Quản lý tệp tin (`FileManager` - `FileGrid.jsx`)**:
   - `FileCardSkeleton` cho chế độ xem dạng lưới (Grid View).
   - `FileRowSkeleton` cho chế độ xem dạng danh sách (List View).
   - `AsciiReveal` bao bọc danh sách tệp khi dữ liệu tải xong.
2. **Trang chủ (`Home` - `index.jsx`)**:
   - `StatCardSkeleton` cho 4 khối thống kê tài nguyên.
   - ASCII skeleton cho danh sách hoạt động gần đây.
   - `AsciiReveal` giải mã bảng điều khiển khi tải xong Firebase snapshot.
3. **Màn hình mất mạng (`OfflineGate` - `index.jsx`)**:
   - `OfflineAsciiSkeleton` (variant `terminal`) chạy mờ ảo phía sau hộp thoại cảnh báo mất kết nối internet.
4. **Xem trước tệp (`PreviewContent.jsx`)**:
   - Skeleton quét dạng `scan` khi tải preview và `AsciiReveal` khi hiển thị tệp văn bản.
