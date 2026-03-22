# Trạng thái dự án — CDN Management System

Bản cập nhật này phản ánh **mã nguồn hiện tại** trong repository, tránh mô tả quá mức so với thực tế — phù hợp khi đính kèm link GitHub trên **CV**.

---

## Tóm tắt một dòng

Full-stack **quản lý & giám sát CDN** (Express + MySQL + React/TypeScript + MUI), có **JWT/RBAC**, **rate limiting**, **WebSocket**, **upload & tối ưu ảnh**, **analytics & logs**.

---

## Đã triển khai (đối chiếu code)

### Backend

- [x] REST API với cấu trúc route rõ ràng (`auth`, `nodes`, `metrics`, `alerts`, `content`, `analytics`, `permissions`, `access-logs`, `activity-logs`).
- [x] JWT + middleware `requirePermission` / `requireRole`.
- [x] `express-rate-limit`: toàn `/api` (1000/15 phút/IP) và riêng `/api/auth` (50/15 phút/IP).
- [x] Helmet, compression, CORS danh sách origin, static `/uploads`.
- [x] Socket.IO attach vào cùng HTTP server.
- [x] Dịch vụ nền: **Node Heartbeat**, **Performance Monitoring**; tùy chọn **Real Data Collector** khi `USE_REAL_DATA=true`.
- [x] Health: `GET /health`.

### Frontend

- [x] Các trang: Dashboard, Nodes & chi tiết, Metrics, Analytics, Content, Users, Permissions, Access logs, Activity logs, Login/Register.
- [x] i18next; bản đồ Leaflet; biểu đồ Recharts / Chart.js; MUI X Data Grid & Date Pickers.

### Cơ sở dữ liệu

- [x] Schema MySQL: users, roles, cdn_nodes, node_metrics, content, content_distribution, access_logs, alerts, node_maintenance, api_keys.
- [x] Script bổ sung `user_activity_logs` (chạy khi setup của bạn gồm file này).

### Dữ liệu mẫu

- [x] `seed.js`: user/role, node, alert, API key, … phục vụ demo và kiểm thử tay.

---

## Điểm cần lưu ý (trung thực kỹ thuật)

| Chủ đề | Ghi chú |
|--------|---------|
| Alerts “đã đọc” | Một số route cập nhật trạng thái đọc mới ở mức phản hồi/log; nâng cấp production nên ghi DB. |
| Dữ liệu thật vs demo | Mặc định có thể chạy với dữ liệu/demo; bật thu thập thật qua env và cấu hình collector. |
| Tài liệu API máy đọc | Chưa có OpenAPI; mô tả bằng markdown trong repo. |

---

## Việc chưa làm hoặc ngoài phạm vi hiện tại

- [ ] Thông báo cảnh báo qua email/SMS / push (chưa trong routes đã liệt kê).
- [ ] Ứng dụng mobile riêng.
- [ ] Multi-tenant đầy đủ (schema hiện tại hướng single-tenant).
- [ ] Redis layer (dependency chưa dùng cho cache chính trong luồng đã rà).

---

## Gợi ý checklist trước khi ghi “production-ready” trên CV

1. `.env` bảo mật: `JWT_SECRET`, DB, `CLIENT_URL`, tắt debug không cần thiết.
2. HTTPS + reverse proxy; giới hạn CORS theo domain thật.
3. Rà soát route ingest log (ví dụ `POST /api/access-logs`) — chỉ mở cho nguồn tin cậy.
4. Backup MySQL và kế hoạch restore.
5. (Tuỳ chọn) bật test CI, thêm OpenAPI.

---

## Thống kê ước lượng (tham khảo, không cố định)

- Số nhóm route API: **9** mount tại `index.js`.
- Số endpoint con: **40+** (ước lượng từ các file `routes/*.js`).
- Số bảng SQL cốt lõi: **10** (+ activity logs nếu áp dụng script).

Chi tiết từng URL: xem [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md).

---

## Tài liệu liên quan

- [README.md](README.md)
- [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md)
