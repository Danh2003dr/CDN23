# Mô tả dự án — CDN Management System

Tài liệu này mô tả **phạm vi kỹ thuật thực tế** của repository, phục vụ portfolio, README GitHub và **trích dẫn vào CV** một cách chính xác.

---

## 1. Tổng quan

**CDN Management System** là nền tảng web nội bộ để:

- Theo dõi **trạng thái và metrics** của các điểm phân phối (CDN nodes).
- **Quản lý nội dung**: tải lên, phân phối tới node, tối ưu ảnh, làm mới cache (theo logic API hiện có).
- **Cảnh báo và phân tích**: tổng hợp hiệu năng, so sánh node, phát hiện bất thường (theo service monitoring).
- **An ninh vận hành**: đăng nhập JWT, phân quyền chi tiết, nhật ký truy cập và hoạt động người dùng.

Ứng dụng gồm **backend Node.js (Express)** và **frontend React (TypeScript)**; persistence chính là **MySQL**.

---

## 2. Vai trò và trách nhiệm có thể ghi trên CV

| Hạng mục | Nội dung cụ thể (theo codebase) |
|----------|----------------------------------|
| Backend | Thiết kế REST API; middleware xác thực JWT; `requirePermission` / `requireRole`; rate limit toàn cục và riêng auth; Helmet, compression, CORS; upload file (Multer); tối ưu ảnh (Sharp); pool MySQL (mysql2). |
| Real-time | Socket.IO server; handler khởi tạo từ `websocket/`; heartbeat node và performance monitoring service chạy khi server start. |
| Frontend | SPA React 18 + TS; routing; context auth; gọi API qua axios; i18next; trang quản trị (dashboard, nodes, analytics, content, users, logs, permissions). |
| Dữ liệu | Schema SQL (bảng cốt lõi + script activity logs); seed dữ liệu demo; (tùy chọn) thu thập dữ liệu thật qua `USE_REAL_DATA` và cấu hình collector. |
| Vận hành & chất lượng | Health check `/health`; Winston / prom-client trong dependencies (sẵn cho logging & metrics); Jest cấu hình cho backend (chạy test theo nhu cầu). |

---

## 3. Kiến trúc thư mục

### Backend (`server/`)

- `src/index.js` — Khởi tạo HTTP server, Express, Socket.IO, rate limit, mount routes, chạy heartbeat & monitoring.
- `src/routes/` — `auth`, `nodes`, `metrics`, `alerts`, `content`, `analytics`, `permissions`, `activityLogs`, `accessLogs`.
- `src/middleware/` — JWT auth, kiểm tra permission/role.
- `src/services/` — Thu thập dữ liệu, heartbeat, giám sát hiệu năng, v.v.
- `src/websocket/` — WebSocket handler.
- `database/` — `schema*.sql`, `setup.js`, `seed.js`.

### Frontend (`client-new/`)

- `src/pages/` — Các màn hình chính (Dashboard, Nodes, NodeDetail, Metrics, Analytics, ContentManagement, UserManagement, Permissions, AccessLogs, ActivityLogs, Login, Register).
- `src/components/`, `src/contexts/`, `src/services/` — UI tái sử dụng, state API, gọi backend.

---

## 4. Mô hình dữ liệu (MySQL)

Các bảng cốt lõi trong `schema.tables.sql`:

| Bảng | Mục đích |
|------|----------|
| `roles` | Vai trò; trường `permissions` dạng JSON |
| `users` | Người dùng, liên kết `role_id` |
| `cdn_nodes` | Node CDN (hostname, IP, vùng, trạng thái, loại node, …) |
| `node_metrics` | Chuỗi metrics theo thời gian (CPU, RAM, disk, mạng, latency, error rate, …) |
| `content` | Metadata file đã upload |
| `content_distribution` | Trạng thái phân phối nội dung tới từng node |
| `access_logs` | Log truy cập / phản hồi (phục vụ analytics access) |
| `alerts` | Cảnh báo gắn node, mức độ, trạng thái xử lý |
| `node_maintenance` | Lịch bảo trì |
| `api_keys` | Khóa API (hash), quyền JSON, hết hạn |

Script `user_activity_logs.sql` bổ sung **audit** chi tiết (bảng + index + view tóm tắt) nếu bạn chạy trong pipeline setup của mình.

---

## 5. Tính năng theo module (đối chiếu code)

### 5.1 Xác thực & người dùng (`/api/auth`)

- Đăng nhập, đăng ký (nếu bật trong triển khai), refresh token, đổi mật khẩu, profile.
- **Quản lý user** (cần permission phù hợp): `GET/POST /api/auth/users`, `GET/PUT/DELETE /api/auth/users/:id`, kích hoạt / vô hiệu hóa.

### 5.2 Nodes (`/api/nodes`)

- Liệt kê, thống kê, CRUD, performance, metrics (bao gồm realtime), cập nhật trạng thái, heartbeat (trạng thái + endpoint test cho admin).

### 5.3 Metrics (`/api/metrics`)

- Overview, dashboard, chi tiết theo node, aggregated, trends, top metric, anomaly, summary.

### 5.4 Alerts (`/api/alerts`)

- Danh sách có lọc thời gian / phân trang phía ứng dụng, unread count, đánh dấu đã đọc (một / tất cả), summary, theo node, anomalies, tạo alert test (admin), cập nhật ngưỡng monitoring (admin).

**Lưu ý:** Một số thao tác “đánh dấu đọc” trong route hiện log console — khi lên production nên persist vào DB nếu cần.

### 5.5 Content (`/api/content`)

- Danh sách, upload, phân phối, xóa, xem phân phối theo content, cache-invalidate, optimize (Sharp), thống kê.

### 5.6 Analytics (`/api/analytics`)

- Xu hướng hiệu năng, so sánh node, phân bố địa lý, metrics realtime tổng hợp, anomaly detection, summary, export, user-access.

### 5.7 Permissions (`/api/permissions`)

- Danh sách permission, roles, chi tiết role, permission theo user, `POST /check`, permission của user hiện tại, danh sách endpoint (admin).

### 5.8 Logs

- **Access logs** (`/api/access-logs`): tra cứu, summary, analytics, export; có route `POST /` cho ingest (xem middleware phù hợp khi public).
- **Activity logs** (`/api/activity-logs`): filter theo user, action, resource, export.

---

## 6. Công nghệ

### Backend (chọn lọc từ `package.json`)

Express, mysql2, jsonwebtoken, bcryptjs, socket.io, multer, sharp, helmet, cors, compression, express-rate-limit, express-validator, dotenv, winston, prom-client, node-cron, axios, aws-sdk (dependency kèm theo — dùng khi tích hợp storage/cloud).

### Frontend

React 18, TypeScript, react-router-dom, axios, MUI 5 (`@mui/material`, icons, X Data Grid, X Date Pickers, X Charts), i18next, socket.io-client, recharts, chart.js + react-chartjs-2, leaflet + react-leaflet, date-fns.

---

## 7. Bảo mật & hiệu năng (đã có trong code)

- JWT cho API có bảo vệ; kiểm tra permission trên từng nhóm route.
- Rate limiting: giới hạn chung `/api` và giới hạn chặt hơn cho `/api/auth`.
- Helmet, gzip qua compression, giới hạn kích thước body JSON/urlencoded.
- Mật khẩu hash (bcryptjs); truy vấn tham số hóa qua mysql2 (giảm rủi ro SQL injection khi giữ đúng pattern hiện tại).

---

## 8. Hạn chế / hướng mở rộng thẳng thắn

- **Thông báo email/SMS** cho cảnh báo: **chưa** thấy triển khai trong routes hiện tại; có thể đưa vào roadmap.
- **Redis cache**: chưa tích hợp trong luồng chính (có thể bổ sung sau).
- **OpenAPI/Swagger**: chưa có file spec tự động; tài liệu API nằm ở markdown trong repo.
- **USE_REAL_DATA=false** (mặc định): phù hợp demo; production cần cấu hình nguồn dữ liệu và bảo mật endpoint ingest log.

---

## 9. Roadmap gợi ý (không cam kết trong repo)

- Persist trạng thái “đã đọc” cho alerts; webhook/email cho cảnh báo.
- OpenAPI, test tự động tăng độ phủ.
- Cache Redis cho metrics hot path; triển khai container (Docker Compose).

---

## 10. Liên kết nhanh

- [README.md](README.md) — Cài đặt và tổng quan.
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — Checklist trạng thái & phạm vi.
