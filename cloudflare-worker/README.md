# WindHub Cloudflare Worker

Đa dịch vụ backend cho WindHub, tối ưu cho gói **Cloudflare Workers Free**:
1. **Xổ Số Vui Xóm Làng**: Máy chủ WebSocket thời gian thực, quản lý phòng chơi, trạng thái và lưu trữ bền vững với **Durable Objects + SQLite**.
2. **Facebook Profile Proxy**: Proxy phân tích metadata hồ sơ Facebook công khai.

---

## 1. Cấu hình & Deploy

```powershell
cd cloudflare-worker
npx wrangler login
npx wrangler deploy
```

Worker sẽ tự động áp dụng migration SQLite cho Durable Object `LotteryRoom`:
```toml
[durable_objects]
bindings = [
  { name = "LOTTERY_ROOM", class_name = "LotteryRoom" }
]

[[migrations]]
tag = "v1"
new_sqlite_classes = ["LotteryRoom"]
```

---

## 2. Các Endpoint khả dụng

### Xổ Số Vui Xóm Làng:
- `GET /api/lottery/rooms`: Danh sách các phòng làng mặc định.
- `GET /api/lottery/ws?room=<room_id>&userId=<uid>&userName=<name>`: Nâng cấp WebSocket thời gian thực (hỗ trợ WebSocket Hibernation).
- `GET /api/lottery/snapshot?room=<room_id>&userId=<uid>`: Snapshot trạng thái phòng và số dư điểm.
- `GET /api/lottery/history?room=<room_id>`: Lịch sử kết quả đã lưu trong SQLite.

### Facebook Profile Proxy:
- `GET /profile?url=https%3A%2F%2Fwww.facebook.com%2F...`

Chi tiết xem tại [VILLAGE_LOTTERY_GUIDE.md](../docs/VILLAGE_LOTTERY_GUIDE.md).
