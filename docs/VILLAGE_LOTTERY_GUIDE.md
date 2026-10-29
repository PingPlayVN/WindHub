# Hướng dẫn Module "Xổ Số Vui Xóm Làng" (WindHub)

Tài liệu hướng dẫn vận hành, kiểm thử, cấu hình Durable Objects SQLite và triển khai Cloudflare Workers Free + Cloudflare Pages.

---

## 1. Cài đặt Dependencies

Tại thư mục gốc dự án:
```powershell
npm install
```

---

## 2. Chạy giao diện cục bộ (Frontend Development)

Chạy Vite dev server:
```powershell
npm run dev
```
Giao diện sẽ chạy tại `http://localhost:5173`. Truy cập mục **Giải trí** trên menu thanh bên (đường dẫn `/lottery`).

---

## 3. Chạy Worker cục bộ với Wrangler (Local Backend & Durable Objects SQLite)

Di chuyển vào thư mục `cloudflare-worker`:
```powershell
cd cloudflare-worker
npx wrangler dev
```

Wrangler sẽ khởi tạo môi trường Miniflare cục bộ, tự động chạy SQLite engine cho Durable Object `LotteryRoom` và lắng nghe tại `http://localhost:8787`.

Để kết nối giao diện dev vào Worker local:
- Mở giao diện WindHub (`/lottery`).
- Nhấn nút **Đổi phòng** > Chọn **Cấu hình Cloudflare Worker URL (Dev/Test)**.
- Nhập `http://localhost:8787` và nhấn **Lưu**. Giao diện sẽ tự động kết nối WebSocket vào Worker local!

---

## 4. Cấu hình Durable Objects SQLite & Migrations

Trong `cloudflare-worker/wrangler.toml`:
```toml
name = "windhub-worker"
main = "src/index.js"
compatibility_date = "2024-09-23"
workers_dev = true

[vars]
ALLOWED_ORIGIN = "*"

[durable_objects]
bindings = [
  { name = "LOTTERY_ROOM", class_name = "LotteryRoom" }
]

[[migrations]]
tag = "v1"
new_sqlite_classes = ["LotteryRoom"]
```

> **Lưu ý quan trọng**: Cloudflare yêu cầu `new_sqlite_classes` trong migrations để kích hoạt `ctx.storage.sql`. Nếu không có thiết lập này, lệnh truy vấn SQL sẽ không hoạt động.

---

## 5. Thiết lập Secrets & Biến môi trường

### File `.env` (Frontend Vite):
```env
# URL của Worker đã deploy lên Cloudflare (không để lộ secrets)
VITE_LOTTERY_WORKER_URL=https://windhub-worker.<tên-tài-khoản-cloudflare>.workers.dev
```

### Worker Variables (Backend):
Cấu hình origin được phép trong `wrangler.toml` (hoặc thiết lập qua Cloudflare Dashboard):
```toml
[vars]
ALLOWED_ORIGIN = "https://windhub.pages.dev"
```

> Tuyệt đối không commit credentials, Cloudflare API tokens, hoặc khóa bảo mật vào Git.

---

## 6. Hướng dẫn Deploy

### 6.1. Deploy Cloudflare Worker (Free Plan)
```powershell
cd cloudflare-worker
npx wrangler login
npx wrangler deploy
```
Sau khi deploy thành công, sao chép URL Worker (ví dụ: `https://windhub-worker.<subdomain>.workers.dev`).

### 6.2. Deploy Cloudflare Pages (Frontend)
1. Kết nối kho Git GitHub `WindHub` với **Cloudflare Pages**.
2. Thiết lập Build Settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment variables**:
     - `VITE_LOTTERY_WORKER_URL`: `<URL-Worker-vừa-deploy>`
3. Nhấn **Save and Deploy**.

---

## 7. Kiểm tra WebSocket & Đồng bộ Thời gian thực

### Các endpoint kiểm tra:
- **Trạng thái HTTP**: `GET https://<worker-domain>/api/lottery/snapshot?room=lang-mai-dich`
- **Lịch sử SQLite**: `GET https://<worker-domain>/api/lottery/history?room=lang-mai-dich`
- **Kết nối WebSocket**: `wss://<worker-domain>/api/lottery/ws?room=lang-mai-dich&userId=test_user&userName=Tester`

### Kiểm thử nhiều Client:
1. Mở 2 tab trình duyệt hoặc 1 tab thường + 1 tab ẩn danh tại `/lottery`.
2. Đặt số ở tab 1, quan sát cả 2 tab:
   - Số người trực tuyến tăng đồng bộ.
   - Khi hết giờ (trạng thái `PLAYING`), cả 2 tab cùng quay lồng cầu.
   - Khi chốt kết quả (trạng thái `RESULT`), cả 2 tab nhận cùng con số duy nhất do máy chủ cấp.
   - Lịch sử tự động lưu vào SQLite và hiển thị ở bảng phía dưới.

---

## 8. Chạy Test Suite

Để chạy toàn bộ 43 test cases (bao gồm 9 test cases riêng biệt cho Durable Objects, SQLite persistence, Idempotency, Sequence ordering, Error safety):
```powershell
npm test
```

Tất cả các bài kiểm tra được viết theo chuẩn native `node:test` và `node:sqlite`, không yêu cầu mock ngoài phức tạp.

---

## 9. Quotas & Giới hạn Gói Cloudflare Workers Free

| Tiêu chí | Hạn mức Cloudflare Free | Tối ưu hóa trong WindHub |
| :--- | :--- | :--- |
| **Số yêu cầu (Requests)** | 100,000 requests/ngày | Sử dụng WebSocket dài hạn, hạn chế polling HTTP liên tục |
| **Thời gian CPU (CPU Time)** | 10ms - 50ms / request | Sử dụng **WebSocket Hibernation API** (`ctx.acceptWebSocket`); khi kết nối nhàn rỗi Worker không tiêu tốn CPU time |
| **Durable Objects SQLite Storage** | Miễn phí tối đa 5GB | Bảng `rounds` và `bets` được đánh index gọn gàng, tự động phân trang theo limit |
| **Dung lượng tin nhắn WS** | Tối đa 2KB/tin | Worker chặn và loại bỏ mọi tin nhắn > 2048 bytes |
| **Rate Limit** | Chống lạm dụng | Chặn đặt cược liên tục, mỗi người chỉ được chọn 1 lần/số trong 1 vòng |

### Hành vi khi vượt hạn mức:
- Nếu vượt 100,000 requests/ngày, Cloudflare sẽ trả về HTTP 429 hoặc 1015 (Rate Limited).
- Client WindHub được trang bị cơ chế **Exponential Backoff Reconnect** kết hợp Jitter ngẫu nhiên (1s - 16s), tự động giữ trạng thái nhẹ nhàng và thông báo toast rõ ràng cho người dùng thay vì dội request dồn dập làm sập Worker.
