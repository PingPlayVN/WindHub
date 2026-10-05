# WindHub

## P2P Share

Mở màn hình **P2P Share** từ thanh điều hướng hoặc truy cập `/p2p`. Lần đầu vào công cụ, đặt tên cho thiết bị; tên được lưu trong local storage và có thể đổi sau. Công cụ liệt kê thiết bị đang trực tuyến để gửi yêu cầu kết nối, thiết bị nhận phải chấp thuận trước khi bắt đầu.

WebRTC DataChannel truyền text và file trực tiếp giữa hai trình duyệt. Signaling server chỉ chuyển tiếp yêu cầu kết nối và Offer/Answer/ICE để thiết lập WebRTC; file và tin nhắn không được gửi qua server. Tên thiết bị không được xác thực danh tính, vì vậy chỉ chấp thuận thiết bị bạn nhận ra.

Sau khi kết nối, dùng tab **File** hoặc **Text**. File có thể chọn bằng file picker hoặc kéo thả; người nhận tải file sau khi đã nhận đủ dữ liệu.

### Cấu trúc

- `src/modules/P2P/core/WebRTCCore.js`: RTCPeerConnection, DataChannel, SDP/ICE gathering, trạng thái và đóng kết nối.
- `src/modules/P2P/pairing/SignalingClient.js`: presence, yêu cầu kết nối và chuyển tiếp SDP qua WebSocket.
- `signaling-server/src/index.js`: signaling server; không lưu trạng thái bền vững và không relay file/text.
- `src/modules/P2P/transfers/TextTransfer.js`: message text có ID, timestamp và kiểm tra kích thước.
- `src/modules/P2P/transfers/FileTransfer.js`: chunk tối đa 256 KiB (đàm phán theo giới hạn SCTP), ACK tích lũy theo tối đa 4 chunk/1 MiB/100 ms, tối đa 8 MiB đang chờ ACK và backpressure DataChannel ở watermark 4/1 MiB.
- `src/modules/P2P/config/iceServers.js`: cấu hình ICE/STUN tập trung; dễ bổ sung TURN trong tương lai.
- `src/modules/P2P/index.jsx`: UI; không chứa logic WebRTC phức tạp trực tiếp.

### Giới hạn hiện tại

- STUN công khai chỉ giúp khám phá địa chỉ; một số mạng NAT/firewall cần TURN. TURN có thể relay lưu lượng và cần được cấu hình/cung cấp riêng; chưa bật ở phiên bản này.
- Presence/signaling dùng bộ nhớ tạm của một tiến trình; khi Render free service ngủ hoặc khởi động lại, thiết bị sẽ tạm thời mất kết nối và cần đăng ký lại.
- Danh sách thiết bị hiện online được chia sẻ với những người đang mở công cụ; tên thiết bị là tên tự chọn, không phải bằng chứng danh tính.
- File giới hạn 1 GiB và được ghép trong bộ nhớ trình duyệt trước khi tải xuống; dung lượng thực tế phụ thuộc thiết bị.
- Tuning mặc định của truyền file chưa được benchmark trên thiết bị Android/PC thực tế; thông lượng còn phụ thuộc mạng, trình duyệt và kết nối ICE được chọn.
- Browser phải hỗ trợ WebRTC DataChannel; yêu cầu secure context (HTTPS hoặc localhost).
- WebRTC đã có DTLS encryption nhưng chưa có PIN, QR verification, hoặc xác nhận trước khi nhận file.

### Triển khai signaling server trên Render

1. Tạo một Blueprint trên Render từ repository; Render sẽ đọc `signaling-server/render.yaml`.
2. Đặt biến `ALLOWED_ORIGINS` thành origin của website WindHub (ví dụ `https://your-windhub-site.example`), không thêm dấu `/` cuối. Có thể phân cách nhiều origin bằng dấu phẩy.
3. Sau khi service được tạo, đặt `VITE_P2P_SIGNALING_URL` trong cấu hình build của frontend thành URL service, ví dụ `https://windhub-p2p-signaling.onrender.com`, rồi build/deploy lại frontend.
4. Kiểm tra endpoint `https://<service>.onrender.com/health` trả về `{"ok":true}`.

Render free tier có thể đưa service vào trạng thái ngủ khi không hoạt động; lần kết nối đầu sau thời gian nghỉ có thể phải đợi service khởi động. STUN công khai chỉ giúp khám phá địa chỉ; một số mạng NAT/firewall cần TURN. Trang cần HTTPS hoặc localhost.

Chạy server và test cục bộ:

```powershell
npm install --prefix signaling-server
npm --prefix signaling-server test
npm --prefix signaling-server start
```
