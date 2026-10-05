# WindHub

## P2P Share

Mở màn hình **P2P Share** từ thanh điều hướng hoặc truy cập `/p2p`. WebRTC DataChannel truyền text và file trực tiếp giữa hai trình duyệt; ứng dụng không upload, lưu hoặc relay nội dung qua backend.

### Ghép nối thủ công

1. Trên thiết bị A, chọn **Create Connection** và đợi Offer xuất hiện khi ICE gathering hoàn tất (tối đa 15 giây).
2. Copy Offer sang thiết bị B qua kênh riêng tư (QR, tin nhắn, hoặc clipboard).
3. Trên B, dán Offer và chọn **Create Answer**; gửi Answer trở lại A.
4. Trên A, dán Answer và chọn **Connect**. Đợi trạng thái **Connected** ở cả hai thiết bị.
5. Dùng tab **Text** hoặc **File** để truyền dữ liệu. File có thể chọn bằng file picker hoặc kéo thả; người nhận tải file sau khi đã nhận đủ dữ liệu.

Offer và Answer chứa SDP cùng các ICE candidate thu thập được, nên có thể khá dài. Nếu ICE gathering vượt quá 15 giây, ứng dụng vẫn trả mã với candidate đã thu thập được đến lúc đó; một số mạng có thể cần thử lại hoặc cấu hình TURN. Chỉ chia sẻ mã với peer tin cậy. Trang cần HTTPS hoặc localhost; STUN chỉ hỗ trợ tìm đường, không đảm bảo hoạt động trên mọi NAT/firewall.

### Cấu trúc

- `src/modules/P2P/core/WebRTCCore.js`: RTCPeerConnection, DataChannel, SDP/ICE gathering, trạng thái và đóng kết nối.
- `src/modules/P2P/pairing/ManualPairingAdapter.js`: adapter ghép nối thủ công; signaling tương lai có thể triển khai cùng giao diện.
- `src/modules/P2P/transfers/TextTransfer.js`: message text có ID, timestamp và kiểm tra kích thước.
- `src/modules/P2P/transfers/FileTransfer.js`: metadata, chunk 16 KiB, backpressure, tiến độ, tốc độ và hủy truyền.
- `src/modules/P2P/config/iceServers.js`: cấu hình ICE/STUN tập trung; dễ bổ sung TURN trong tương lai.
- `src/modules/P2P/index.jsx`: UI; không chứa logic WebRTC phức tạp trực tiếp.

### Giới hạn hiện tại

- STUN công khai chỉ giúp khám phá địa chỉ; một số mạng NAT/firewall cần TURN. TURN có thể relay lưu lượng và cần được cấu hình/cung cấp riêng; chưa bật ở phiên bản này.
- Ghép nối cần copy/paste thủ công; không có auto reconnect và không có xác thực peer.
- File giới hạn 1 GiB và được ghép trong bộ nhớ trình duyệt trước khi tải xuống; dung lượng thực tế phụ thuộc thiết bị.
- Browser phải hỗ trợ WebRTC DataChannel; yêu cầu secure context (HTTPS hoặc localhost).
- WebRTC đã có DTLS encryption nhưng chưa có PIN, QR verification, hoặc xác nhận trước khi nhận file.

### Khi thêm signaling server

Giữ nguyên `WebRTCCore` và các transfer service. Tạo adapter mới theo giao diện `createOffer()`, `createAnswer(offer)`, `acceptAnswer(answer)`, rồi chuyển SDP/ICE qua signaling transport mới. Không gửi file/text qua signaling; DataChannel vẫn là transport P2P chính.
