# WindHub 🌐

> **Nền tảng Web Workspace đa tiện ích & Trung tâm công cụ hiện đại (All-in-one Web Workspace & Tools Hub)**  
> Tích hợp quản lý file phong cách Desktop Explorer, truyền tệp P2P WebRTC siêu tốc, bộ công cụ tính toán & đồ họa độc đáo, cùng các tiện ích mạng thời gian thực.

---

## 📑 Mục lục

1. [Tổng quan dự án](#-tổng-quan-dự-án)
2. [Kiến trúc & Công nghệ (Tech Stack)](#-kiến-trúc--công-nghệ-tech-stack)
3. [Bản đồ tính năng & Các Module chính](#-bản-đồ-tính-năng--các-module-chính)
   - [Dashboard & Thống kê thời gian thực](#1-dashboard--thống-kê-thời-gian-thực-)
   - [Quản lý Tệp tin (File Manager)](#2-quản-lý-tệp-tin-file-manager-files)
   - [Trung tâm Công cụ (Tools Hub)](#3-trung-tâm-công-cụ-tools-hub-tools)
   - [Tiện ích Mạng (Extensions)](#4-tiện-ích-mạng-extensions-extensions)
   - [Truyền tệp ngang hàng P2P (WebRTC DataChannel)](#5-truyền-tệp-ngang-hàng-p2p-webrtc-datachannel-p2p)
   - [Xác thực & Bảo mật (Auth & Security)](#6-xác-thực--bảo-mật-auth--security)
4. [📱 ĐÁNH GIÁ CẢM ỨNG MOBILE TRÊN TAB QUẢN LÝ FILE & GIẢI PHÁP THIẾT KẾ (PHẦN CHƯA CODE)](#-đánh-giá-cảm-ứng-mobile-trên-tab-quản-lý-file--giải-pháp-thiết-kế-phần-chưa-code)
   - [4.1 Hiện trạng kiến trúc Desktop-First & Vấn đề trên Mobile](#41-hiện-trạng-kiến-trúc-desktop-first--vấn-đề-trên-mobile)
   - [4.2 Ma trận đối chiếu trải nghiệm Desktop vs Mobile Touch](#42-ma-trận-đối-chiếu-trải-nghiệm-desktop-vs-mobile-touch)
   - [4.3 Chi tiết các điểm nghẽn tương tác cảm ứng (Touch Pain Points)](#43-chi-tiết-các-điểm-nghẽn-tương-tác-cảm-ứng-touch-pain-points)
   - [4.4 Bản thiết kế kỹ thuật & Lộ trình triển khai (Proposed Blueprint)](#44-bản-thiết-kế-kỹ-thuật--lộ-trình-triển-khai-proposed-blueprint)
5. [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
6. [Hướng dẫn cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
   - [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
   - [Cấu hình biến môi trường (.env)](#cấu-hình-biến-môi-trường-env)
   - [Lệnh chạy cục bộ](#lệnh-chạy-cục-bộ)
7. [Triển khai hệ thống (Deployment)](#-triển-khai-hệ-thống-deployment)
   - [Frontend (Vercel)](#frontend-vercel)
   - [Signaling Server P2P (Render)](#signaling-server-p2p-render)
   - [Facebook Scraper Worker (Cloudflare Workers)](#facebook-scraper-worker-cloudflare-workers)
8. [Tác giả & Đóng góp](#-tác-giả--đóng-góp)

---

## 🌟 Tổng quan dự án

**WindHub** là nền tảng ứng dụng web tổng hợp được xây dựng với mục tiêu mang lại trải nghiệm làm việc mượt mà, trực quan và tiện dụng ngay trong trình duyệt. 

Dự án kết hợp giữa:
- Giao diện người dùng phong cách hệ điều hành với hệ thống chuyển đổi theme **Dark/Light Morphing**.
- Quản lý tệp đám mây và liên kết thông minh với khả năng xem trước (preview) hầu hết các định dạng tệp văn phòng, media phổ biến.
- Công nghệ truyền tệp ngang hàng **P2P WebRTC** bảo mật, trực tiếp giữa hai trình duyệt mà không lưu tệp trung gian trên server.
- Các công cụ chuyên sâu như thuật toán hiển thị ký tự máy tính bỏ túi Casio fx-580VN X, bộ chuyển đổi ảnh sang nghệ thuật ASCII canvas đa luồng, và các tiện ích mạng.

---

## 🛠 Kiến trúc & Công nghệ (Tech Stack)

### Frontend Core
- **Framework & Runtime**: [React 19](https://react.dev/), [Vite 8](https://vitejs.dev/) (tốc độ biên dịch và HMR cực nhanh).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) kết hợp CSS Variables, hiệu ứng Glassmorphism & Animations.
- **Motion & UI**: [Framer Motion](https://www.framer.com/motion/) cho micro-interactions, layout transitions, [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/).
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (quản lý Auth, Theme, UI state gọn nhẹ, decoupled).
- **Thông báo & Feedback**: [Sonner](https://sonner.emilkowal.ski/) toast system.

### Xử lý Tài liệu & Media Engines
- **Tài liệu văn phòng**: `@cyntler/react-doc-viewer`, `mammoth` (DOCX), `xlsx` (Excel Spreadsheets), `pptx-renderer` (PowerPoint), `jszip` (Đọc cấu trúc file nén ZIP).
- **PDF Viewer**: `@embedpdf/react-pdf-viewer` hỗ trợ xem PDF nhúng mượt mà.
- **Đồ họa & Trích xuất**: `html-to-image`, Web Worker rendering cho bộ biến đổi ASCII.

### Backend & Cơ sở hạ tầng đám mây
- **BaaS (Backend as a Service)**: [Google Firebase](https://firebase.google.com/) (Firestore cho realtime metadata, Firebase Auth cho phân quyền Admin/User).
- **Dịch vụ tải lên (Direct Upload)**: [Uploadcare](https://uploadcare.com/) cho upload tệp đa phương tiện.
- **Signaling Server**: Node.js WebSocket Server (quản lý presence, chuyển tiếp SDP Offer/Answer và ICE Candidates cho WebRTC P2P).
- **Serverless Edge Worker**: [Cloudflare Workers](https://workers.cloudflare.com/) làm proxy vượt giới hạn CORS và trích xuất dữ liệu hồ sơ Facebook an toàn.

---

## 🧭 Bản đồ tính năng & Các Module chính

### 1. Dashboard & Thống kê thời gian thực (`/`)
- Kết nối trực tiếp Firestore qua `onSnapshot` để tính toán số lượng tệp theo từng phân loại (Video, Hình ảnh, Tài liệu, File khác).
- Danh sách các tệp mới tải lên gần đây kèm trạng thái khóa và thời gian tạo.
- Hiệu ứng tải dữ liệu **AsciiReveal** với các preset decode ký tự độc đáo thay cho loader thông thường.

### 2. Quản lý Tệp tin (File Manager) (`/files`)
Mô phỏng trải nghiệm File Explorer quen thuộc:
- **Phân loại 4 không gian root**:
  - `root_video`: Lưu trữ và phát video trực tuyến.
  - `root_image`: Thư viện hình ảnh với thumbnail sinh tự động.
  - `root_document`: Tài liệu văn bản (Word, Excel, PDF, PPTX, Code).
  - `root_other`: Các định dạng lưu trữ khác và liên kết web.
- **Điều hướng Breadcrumb**: Cây thư mục lồng nhau không giới hạn độ sâu, dễ dàng quay lại các cấp cha.
- **Xem trước đa năng (Rich Preview Modal)**: Xem trực tiếp video, audio, ảnh, tài liệu Office, file ZIP và tệp mã nguồn mà không cần tải về máy.
- **Tính năng Desktop Explorer**:
  - Context Menu chuột phải (tự tính toán chống tràn màn hình).
  - Phím tắt bàn phím: `Ctrl+C` (Sao chép), `Ctrl+X` (Cắt), `Ctrl+V` (Dán), `Delete` (Xóa), `F2` (Đổi tên inline).
  - Kéo thả tệp vào thư mục (Desktop HTML5 Drag & Drop).
  - Chức năng Khóa tải xuống (Download Lock) dành riêng cho quản trị viên.
  - Chia sẻ tệp trực tiếp qua URL deep link (`/files?tab=...&fileId=...`).

### 3. Trung tâm Công cụ (Tools Hub) (`/tools`)
Bộ công cụ tự động đăng ký dạng plugin (`src/modules/Tools/`):
- **Casio fx-580VN X Spell**:
  - Ứng dụng thuật toán tràn bộ nhớ *Basic Overflow* (phát triển dựa trên nghiên cứu của Phong2k11® & AxesMC).
  - Hỗ trợ viết 17 ký tự chữ cái trên màn hình máy tính khoa học Casio ClassWiz.
  - Bàn phím số ảo mô phỏng đúng bố cục phần cứng, hướng dẫn thao tác từng bước trực quan.
- **Image → ASCII Studio**:
  - Chuyển đổi bất kỳ hình ảnh nào sang định dạng tranh ký tự ASCII/ANSI.
  - Đa dạng bảng màu ký tự (Standard, Dense, Matrix, Minimalist, Binary).
  - Render chạy ngầm trên Web Worker chống giật lag UI; hỗ trợ sao chép text hoặc xuất ảnh độ phân giải cao.
- **Vocabulary Practice**:
  - Công cụ luyện tập từ vựng tiếng Anh tương tác, hỗ trợ nhập bộ từ và kiểm tra phản xạ.

### 4. Tiện ích Mạng (Extensions) (`/extensions`)
- **Anime Trace Tool**: Truy tìm tập phim, khung giờ và nguồn gốc Anime từ ảnh chụp màn hình thông qua API `trace.moe`.
- **Facebook Profile Tool**: Công cụ bóc tách metadata tài khoản / trang Facebook công khai qua Cloudflare Worker Edge Proxy mà không lộ thông tin cá nhân và không bị chặn CORS.

### 5. Truyền tệp ngang hàng P2P (WebRTC DataChannel) (`/p2p`)
- Kết nối trực tiếp giữa 2 trình duyệt không qua máy chủ lưu trữ trung gian.
- **Giao thức chuyển dữ liệu (Data Transfer)**:
  - Chia nhỏ chunk dữ liệu tối đa 256 KiB (đàm phán phù hợp giới hạn SCTP).
  - Cơ chế ACK tích lũy (Cumulative ACK) theo chu kỳ tối đa 4 chunk / 1 MiB / 100 ms.
  - Quản lý bộ đệm và backpressure thông minh ở ngưỡng watermark 4 MiB / 1 MiB để tránh tràn RAM khi truyền tệp dung lượng lớn (lên tới 1 GiB).
- **Bảo mật**: Mã hóa kênh truyền đầu cuối bằng chuẩn DTLS.

### 6. Xác thực & Bảo mật (Auth & Security)
- Phân quyền Admin dựa trên danh sách email cấu hình (`VITE_ADMIN_EMAILS`).
- Hệ thống bảo vệ Anti-DevTools cho người dùng khách: Chặn mở F12, `Ctrl+Shift+I/J/C`, chặn xem source code `Ctrl+U`.
- Dành riêng cho Admin trên thiết bị di động: Tích hợp công cụ gỡ lỗi nhúng **Eruda DevTools** bật/tắt trực tiếp từ thanh Header.

---

## 📱 ĐÁNH GIÁ CẢM ỨNG MOBILE TRÊN TAB QUẢN LÝ FILE & GIẢI PHÁP THIẾT KẾ (PHẦN CHƯA CODE)

> [!IMPORTANT]  
> Mục này phân tích chuyên sâu về **Tab Quản lý File (`/files`)**, đánh giá toàn bộ trải nghiệm cảm ứng (Touch Experience) trên thiết bị di động ở thời điểm hiện tại, chỉ rõ các điểm nghẽn do kiến trúc Desktop-First gây ra, và đưa ra **bản thiết kế giải pháp kỹ thuật cụ thể cho phần chưa code**.

### 4.1 Hiện trạng kiến trúc Desktop-First & Vấn đề trên Mobile

Module Quản lý File hiện tại (`src/modules/FileManager/`) được xây dựng tập trung cho chuột và bàn phím máy tính:
- Sử dụng trực tiếp các sự kiện chuột: `onClick`, `onDoubleClick`, `onContextMenu`, `onMouseEnter`, `onMouseLeave`.
- Sử dụng sự kiện kéo thả HTML5 Desktop: `draggable`, `onDragStart`, `onDragOver`, `onDrop`.
- Phụ thuộc vào phím bổ trợ bàn phím: `event.ctrlKey`, `event.metaKey`, `event.shiftKey`.

Khi người dùng thao tác trên màn hình cảm ứng điện thoại hoặc máy tính bảng (iOS Safari, Android Chrome), môi trường trình duyệt di động chuyển đổi hoàn toàn sang **Touch/Pointer Events**. Điều này dẫn đến sự đứt gãy trải nghiệm nghiêm trọng.

---

### 4.2 Ma trận đối chiếu trải nghiệm Desktop vs Mobile Touch

| Hành vi thao tác | Trải nghiệm trên Desktop (Hiện tại) | Trải nghiệm trên Mobile Touch (Hiện trạng thực tế) | Đánh giá mức độ |
| :--- | :--- | :--- | :---: |
| **Mở xem tệp / Thư mục** | Click chọn; Double click hoặc Enter để mở. | Chạm đơn (`tap`) mở ngay lập tức do `onClick` tự trigger. | ⚠️ Trung bình |
| **Chọn tệp (Selection)** | Giữ `Ctrl`/`Shift` + Click để chọn 1 hoặc nhiều tệp. | **Không thể thực hiện**: Mobile không có phím `Ctrl`, chạm vào là bị mở tệp ngay. | ❌ **Rất nghiêm trọng** |
| **Menu tác vụ (Context Menu)** | Chuột phải tại vị trí trỏ chuột hiển thị menu tuỳ biến. | **Xung đột**: Nhấn giữ kích hoạt menu hệ điều hành mặc định (Save image, Copy link); Menu web bị lệch hoặc không mở được. | ❌ **Nghiêm trọng** |
| **Nút 3 chấm mở nhanh** | Hiện khi rê chuột vào tệp (`group-hover:opacity-100`). | **Bị ẩn hoàn toàn**: Màn hình cảm ứng không có hover, người dùng không nhìn thấy nút để thao tác. | ❌ **Rất nghiêm trọng** |
| **Kéo thả tệp (Drag & Drop)** | Kéo tệp thả vào thư mục khác trực quan. | **Tê liệt hoàn toàn**: HTML5 Drag & Drop API không hỗ trợ Touch Pointer trên trình duyệt di động. | ❌ **Nghiêm trọng** |
| **Đổi tên / Khóa / Xóa tệp** | Dùng phím `F2`, `Delete` hoặc Context Menu chuột phải. | Phụ thuộc hoàn toàn vào menu; nếu không mở được menu thì không thể đổi tên/xóa. | ❌ **Nghiêm trọng** |
| **Đọc tên tệp dài (Marquee)** | Rê chuột vào tên tệp để chữ chạy ngang (`onMouseEnter`). | Chạm vào không kích hoạt được cuộn marquee, tên tệp dài bị cắt cụt `...`. | ⚠️ Nhẹ |
| **Điều hướng Breadcrumb** | Thanh Breadcrumb trải ngang rộng rãi. | Bị tràn màn hình khi đi vào thư mục sâu; vùng chạm (tap target) quá nhỏ khó bấm bằng ngón cái. | ⚠️ Trung bình |

---

### 4.3 Chi tiết các điểm nghẽn tương tác cảm ứng (Touch Pain Points)

#### 1. Xung đột giữa "Chạm để Chọn" và "Chạm để Mở" (Tap vs Selection Conflict)
Trong `useFileSelection.js`:
```javascript
const handleItemClick = (event, item) => {
  if (renamingItem === item.id) return;
  if (event.ctrlKey || event.metaKey) {
    // Chỉ chọn khi có phím Ctrl/Meta
    ...
    return;
  }
  setSelectedItems(new Set([item.id]));
  if (item.type === 'folder') handleOpenFolder(item);
  else handlePreview(item);
};
```
- **Hệ quả trên di động**: Người dùng chạm ngón tay vào màn hình thì `event.ctrlKey` luôn là `false`. Ứng dụng lập tức mở thư mục hoặc bật modal xem trước tệp. Người dùng không có cách nào chọn tệp để thực hiện các thao tác quản trị (xóa, di chuyển, đổi tên, khóa).

#### 2. Nút hành động nhanh phụ thuộc Hover (`hover: none`)
Trong `FileItem.jsx`:
```jsx
<div className={`absolute opacity-0 group-hover:opacity-100 transition-opacity ...`}>
  <button aria-label={`Mở menu cho ${file.name}`}>
    <MoreVertical size={16} />
  </button>
</div>
```
- **Hệ quả trên di động**: Thiết bị di động có đặc tính phần cứng `@media (hover: none)`. Class `opacity-0` khiến nút 3 chấm bị ẩn vĩnh viễn, người dùng phổ thông không thể biết cách mở menu tác vụ cho từng tệp.

#### 3. Bất khả thi trong việc Kéo thả Di động (Touch DnD Failure)
- Thuộc tính `draggable={true}` kết hợp `onDragStart`, `onDragOver`, `onDrop` là tiêu chuẩn của trình duyệt desktop (chuột kéo).
- Trên iOS Safari và Android Chrome, cử chỉ ngón tay di chuyển trên màn hình mặc định được trình duyệt dành riêng cho việc **cuộn trang (scroll/pan)**. Để kéo thả được trên màn hình cảm ứng, cần phải can thiệp bằng Touch/Pointer Events (`pointerdown`, `pointermove`, `pointerup`) kèm cờ `touch-action: none` hoặc thư viện tương thích. Hiện tại phần này chưa được lập trình, khiến tính năng chuyển thư mục bằng kéo thả hoàn toàn vô dụng trên mobile.

#### 4. Menu nổi (Floating Context Menu) không phù hợp với kích thước ngón tay
- `ContextMenu.jsx` hiện tại nhận tọa độ `(clientX, clientY)` và vẽ một bảng danh mục nhỏ 240px.
- Trên màn hình điện thoại 5 - 6.7 inch, menu này thường bị ngón tay che khuất ngay khi bấm, hoặc xuất hiện sát mép dưới/mép phải gây khó khăn khi dùng một tay. Tiêu chuẩn giao diện di động hiện đại yêu cầu dùng **Bottom Sheet (Ngăn kéo trượt từ đáy màn hình)** thay vì floating context menu.

---

### 4.4 Bản thiết kế kỹ thuật & Lộ trình triển khai (Proposed Blueprint)

Dưới đây là kiến trúc giải pháp chuẩn bị áp dụng để nâng cấp tab Quản lý File đạt chuẩn **Mobile-First Touch Experience**:

```
                         CƠ CHẾ CẢM ỨNG QUẢN LÝ FILE
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
   Chế độ Bình thường                               Chế độ Chọn nhiều
(Normal Browsing Mode)                             (Multi-Select Mode)
           │                                                 │
   ┌───────┴───────┐                                 ┌───────┴───────┐
   │               │                                 │               │
Tap đơn:       Nhấn giữ (>450ms):                Tap đơn:        Nút Hủy /
Mở xem tệp /   Kích hoạt Haptic Vibration,       Chọn / Bỏ chọn  Thoát chế độ
Vào thư mục    Tự động vào "Chế độ Chọn"        tệp được chạm   chọn
                       │                                     │
                       └──────────────────┬──────────────────┘
                                          │
                                          ▼
                             THANH TÁC VỤ ĐÁY MÀN HÌNH
                              (Bottom Floating Bar)
                         [Tải về] [Chia sẻ] [Di chuyển] [Xóa]
```

#### Bước 1: Xây dựng Hook nhận diện cử chỉ cảm ứng (`useTouchGestures.js`)
Thay vì dùng sự kiện chuột đơn thuần, tạo hook quản lý Pointer/Touch Events thông minh:
- **Ngưỡng nhấn giữ (Long-press Threshold)**: ~450ms.
- **Dung sai di chuyển ngón tay (Movement Tolerance)**: Nếu ngón tay di chuyển quá 10px trong 450ms, hủy sự kiện nhấn giữ để ưu tiên cử chỉ cuộn trang tự nhiên của người dùng.
- **Rung phản hồi (Haptic Feedback)**: Gọi `navigator.vibrate?.(40)` ngay khi cử chỉ nhấn giữ thành công.

```javascript
// Thiết kế tham khảo cho useTouchGestures.js
export function useTouchGestures({ onLongPress, onTap, delay = 450 }) {
  const timerRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    timerRef.current = setTimeout(() => {
      navigator.vibrate?.(40);
      onLongPress();
    }, delay);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startPos.current.x);
    const dy = Math.abs(touch.clientY - startPos.current.y);
    if (dx > 10 || dy > 10) clearTimeout(timerRef.current);
  };

  const handleTouchEnd = () => clearTimeout(timerRef.current);

  return { onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd };
}
```

#### Bước 2: Bổ sung "Chế độ Chọn nhiều" (Multi-Select Mode)
- **Kích hoạt**: Bằng cách nhấn giữ 1 tệp bất kỳ HOẶC nhấn nút "Chọn" trên thanh công cụ Header của File Manager.
- **Hành vi khi đang trong chế độ chọn**:
  - Mỗi thẻ tệp sẽ hiển thị một ô checkbox tròn ở góc trên bên trái.
  - Chạm đơn (`tap`) vào tệp sẽ thêm/bớt tệp đó vào `selectedItems` thay vì mở tệp.
  - Hiện thanh công cụ hành động cố định ở đáy màn hình (**Bottom Action Bar**).

#### Bước 3: Thay thế ContextMenu trên Mobile bằng Bottom Action Sheet
- Phát hiện thiết bị di động thông qua `@media (max-width: 768px)` hoặc touch detection.
- Khi nhấn nút 3 chấm hoặc nhấn giữ trên mobile, mở **Mobile Action Sheet**:
  - Trượt từ cạnh dưới màn hình lên với hiệu ứng spring của Framer Motion.
  - Có thanh kéo (drag handle) để người dùng có thể vuốt xuống để đóng.
  - Kích thước các nút bấm tối thiểu **48px x 48px** theo khuyến nghị tiếp cận của WCAG.

#### Bước 4: Giải quyết vấn đề Di chuyển Tệp (Move to Folder)
- Thay vì ép buộc người dùng kéo thả ngón tay trên màn hình nhỏ (rất dễ trượt tay vào khoảng trống hoặc thả nhầm thư mục):
- Bổ sung hành động **"Di chuyển tới..." (Move To)** trên Bottom Bar / Action Sheet. Khi bấm, mở một Modal hiển thị cây thư mục đơn giản để người dùng chọn thư mục đích và ấn "Chuyển đến đây". Cách làm này giống 100% với Google Drive và Apple Files trên iOS/Android.

#### Bước 5: Tinh chỉnh hiển thị giao diện cho Touch Devices
- Áp dụng Media Query CSS cho nút 3 chấm:
  ```css
  @media (hover: none) and (pointer: coarse) {
    .file-item-actions {
      opacity: 1 !important; /* Luôn hiển thị nút 3 chấm trên màn hình cảm ứng */
    }
  }
  ```
- **Thanh Breadcrumb cuộn ngang**: Thêm `overflow-x-auto whitespace-nowrap scrollbar-none` kèm nút "Lùi 1 cấp" (Back button) to rõ ở đầu thanh Breadcrumb giúp người dùng lùi về thư mục cha chỉ bằng một lần chạm ngón cái.

---

## 📂 Cấu trúc thư mục dự án

```plaintext
WindHub/
├── cloudflare-worker/           # Cloudflare Worker proxy cho Facebook metadata
│   ├── src/                     # Source worker
│   ├── wrangler.toml            # Cấu hình Cloudflare Wrangler
│   └── README.md
├── signaling-server/            # Node.js WebSocket Signaling Server cho P2P WebRTC
│   ├── src/index.js             # Logic kết nối presence, SDP & ICE relay
│   ├── render.yaml              # Blueprint triển khai Render
│   └── package.json
├── public/                      # Static assets, favicon, manifest
├── src/
│   ├── assets/                  # Hình ảnh, âm thanh, icon nội bộ
│   ├── components/
│   │   ├── layout/              # Sidebar (Logo biến hình), Header, MainLayout
│   │   └── ui/                  # AsciiReveal, Loader, OfflineGate, Button...
│   ├── hooks/                   # Custom React hooks (useInstallPrompt...)
│   ├── modules/                 # Các Module nghiệp vụ độc lập
│   │   ├── Auth/                # Đăng nhập & Xác thực Firebase
│   │   ├── Extension/           # AnimeTraceTool, FacebookProfileTool
│   │   ├── FileManager/         # HỆ THỐNG QUẢN LÝ TỆP TIN
│   │   │   ├── components/      # Breadcrumb, FileGrid, FileItem, ContextMenu, Modals
│   │   │   ├── features/        # FileSharing (chia sẻ liên kết sâu)
│   │   │   ├── hooks/           # useFileData, useFileNavigation, useFileSelection...
│   │   │   ├── utils/           # Icon formatters, file helpers
│   │   │   └── index.jsx        # Entry point của File Manager
│   │   ├── P2P/                 # HỆ THỐNG TRUYỀN TỆP NGANG HÀNG
│   │   │   ├── core/            # WebRTCCore (RTCPeerConnection, DataChannel)
│   │   │   ├── pairing/         # SignalingClient WebSocket
│   │   │   ├── transfers/       # FileTransfer (chunking, ACK, backpressure), TextTransfer
│   │   │   └── config/          # ICE/STUN servers
│   │   └── Tools/               # CasioSpell, ImageArtStudio, VocabularyPractice
│   ├── pages/                   # Các trang chính: Home, ToolsHub, Tools (Extensions)
│   ├── services/                # Kết nối Firebase (db, auth), direct uploads
│   ├── store/                   # Zustand stores: useAuthStore, useThemeStore, useUIStore
│   ├── App.jsx                  # Routing, Anti-DevTools, PWA check
│   ├── index.css                # Tailwind CSS v4 directives & custom utilities
│   └── main.jsx                 # React root render
├── tests/                       # Unit tests (fileManagerUtils, p2p, imageArt...)
├── .env.example                 # Mẫu cấu hình biến môi trường
├── package.json                 # Khai báo dependencies & npm scripts
├── vite.config.js               # Cấu hình Vite & Tailwind v4
└── README.md                    # Tài liệu hướng dẫn toàn diện dự án
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên (khuyên dùng Node.js 20+ LTS).
- **Trình quản lý gói**: `npm` hoặc `pnpm`.

### Cấu hình biến môi trường (`.env`)
Tạo file `.env` ở thư mục gốc của dự án dựa trên file `.env.example`:

```env
# Danh sách email Admin (ngăn cách bởi dấu phẩy nếu có nhiều admin)
VITE_ADMIN_EMAILS=your-admin-email@gmail.com

# URL Cloudflare Worker proxy cho công cụ bóc tách Facebook
VITE_FACEBOOK_WORKER_URL=https://your-facebook-worker.workers.dev

# URL máy chủ Signaling WebSocket cho tính năng P2P Share
VITE_P2P_SIGNALING_URL=https://your-signaling-service.onrender.com
```

### Lệnh chạy cục bộ

1. **Cài đặt thư viện dependencies**:
   ```bash
   npm install
   ```

2. **Chạy ứng dụng ở môi trường phát triển (Development)**:
   ```bash
   npm run dev
   ```
   Trình duyệt sẽ mở tại `http://localhost:5173`.

3. **Chạy kiểm thử (Unit Tests)**:
   ```bash
   npm test
   ```

4. **Kiểm tra cú pháp & Linting**:
   ```bash
   npm run lint:fast   # Kiểm tra nhanh với Oxlint
   npm run lint        # Kiểm tra đầy đủ với ESLint & Oxlint
   ```

5. **Đóng gói sản phẩm (Production Build)**:
   ```bash
   npm run build
   ```

---

## 🌐 Triển khai hệ thống (Deployment)

### Frontend (Vercel)
Dự án đã tích hợp sẵn cấu hình `vercel.json` phục vụ điều hướng Single Page Application (SPA).
1. Kết nối repository GitHub với Vercel.
2. Thêm các biến môi trường từ `.env` vào mục **Environment Variables** trên Vercel Dashboard.
3. Vercel sẽ tự động build và cấp phát URL production HTTPS an toàn.

### Signaling Server P2P (Render)
Dịch vụ WebSocket Signaling cho P2P Share được đặt trong thư mục `signaling-server/`:
1. Tạo một Blueprint mới trên Render từ repository; Render sẽ tự nhận diện file `signaling-server/render.yaml`.
2. Đặt biến `ALLOWED_ORIGINS` thành URL của trang web frontend (ví dụ: `https://windhub.vercel.app`), không có dấu `/` ở cuối.
3. Sau khi service khởi động thành công, copy URL gán vào `VITE_P2P_SIGNALING_URL` của frontend.
4. Kiểm tra endpoint kiểm tra sức khỏe: `https://<service-name>.onrender.com/health` (trả về `{"ok":true}`).

Chạy và kiểm thử Signaling server cục bộ:
```powershell
npm install --prefix signaling-server
npm --prefix signaling-server test
npm --prefix signaling-server start
```

### Facebook Scraper Worker (Cloudflare Workers)
1. Truy cập thư mục worker:
   ```bash
   cd cloudflare-worker
   ```
2. Đăng nhập tài khoản Cloudflare:
   ```bash
   npx wrangler login
   ```
3. Cập nhật `ALLOWED_ORIGIN` trong file `wrangler.toml` thành domain chính thức của WindHub.
4. Triển khai lên Cloudflare Edge:
   ```bash
   npx wrangler deploy
   ```
5. Cập nhật URL worker vừa tạo vào biến `VITE_FACEBOOK_WORKER_URL`.

---

## 🤝 Tác giả & Đóng góp

- **Tác giả & Nhà phát triển chính**: Phong2k11 / PingPlayVN.
- **Thuật toán Casio fx-580VN X Spell**: Nghiên cứu & phát triển bởi **Phong2k11® & AxesMC**.
- Mọi đóng góp, báo lỗi (Issues) và đề xuất tính năng (Pull Requests) luôn được chào đón trên GitHub Repository.

---
*WindHub — Empowering productivity with modern web technologies.*
