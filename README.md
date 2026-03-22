# CDN Management System

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Ứng dụng web quản lý và giám sát mạng phân phối nội dung (CDN): dashboard, node, nội dung, cảnh báo, phân tích, nhật ký truy cập và phân quyền theo vai trò. Backend REST + WebSocket; frontend React (TypeScript) và MUI.

**Tài liệu chi tiết:** [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md) · **Trạng thái & phạm vi:** [PROJECT_STATUS.md](PROJECT_STATUS.md)

---

## Điểm nổi bật (tóm tắt cho portfolio / CV)

- Thiết kế **REST API** có **JWT**, phân quyền theo permission, **rate limiting** (toàn API + riêng nhóm auth), **Helmet**, **compression**, **CORS** có kiểm soát.
- **WebSocket (Socket.IO)** phục vụ cập nhật thời gian thực; dịch vụ **heartbeat node** và **giám sát hiệu năng** chạy nền.
- **MySQL**: schema chuẩn hóa (users, roles, nodes, metrics, content, phân phối, alerts, bảo trì, access logs, API keys; bổ sung bảng/view activity logs theo script).
- **React + TypeScript**: trang Dashboard, Nodes, chi tiết node, Metrics, Analytics, Content, Alerts, Users, Permissions, Access logs, Activity logs; **i18n** (i18next); bản đồ **Leaflet**; biểu đồ **Recharts / Chart.js**; **MUI X Data Grid / Date Pickers**.

---

## Cấu trúc repository

```
CDN23/
├── server/           # Backend Express (Node.js)
│   ├── src/          # routes, middleware, services, websocket
│   └── database/     # SQL schema, setup & seed
├── client-new/       # Frontend CRA + React + TypeScript + MUI
├── README.md
├── PROJECT_DESCRIPTION.md
└── PROJECT_STATUS.md
```

---

## Yêu cầu môi trường

- **Node.js** ≥ 18 (theo `server/package.json`)
- **MySQL** 8.x
- **npm**

---

## Cài đặt và chạy nhanh

### 1. Cơ sở dữ liệu

```bash
cd server
npm install
```

Tạo database `cdn_management` (hoặc tên trong `.env`), sau đó:

```bash
npm run setup
npm run seed
```

(Có thể dùng `npm run setup-fixed` nếu bạn đang theo quy trình đã chỉnh trong repo.)

### 2. Backend

Tạo file `server/.env` (tham khảo biến: `DB_*`, `PORT`, `JWT_SECRET`, `CLIENT_URL`, tùy chọn `USE_REAL_DATA=true` để bật thu thập dữ liệu thật theo cấu hình node).

```bash
cd server
npm start
```

Mặc định API: `http://localhost:5000` — kiểm tra: `GET /health`

### 3. Frontend

```bash
cd client-new
npm install
npm start
```

Mặc định UI: `http://localhost:3000` (proxy tới backend trong `client-new/package.json`).

---

## API (tổng quan)

Nhóm chính (tiền tố `/api`):

| Nhóm | Base path | Ghi chú |
|------|-----------|---------|
| Auth & người dùng | `/api/auth` | Đăng nhập, profile, CRUD user dưới `/api/auth/users` |
| Nodes | `/api/nodes` | CRUD, performance, metrics, heartbeat |
| Metrics | `/api/metrics` | overview, dashboard, theo node, anomaly, summary |
| Alerts | `/api/alerts` | danh sách, summary, theo node, anomalies, thresholds |
| Content | `/api/content` | upload, distribute, optimize, cache-invalidate |
| Analytics | `/api/analytics` | xu hướng, so sánh node, bản đồ, export |
| Permissions | `/api/permissions` | roles, kiểm tra quyền |
| Access logs | `/api/access-logs` | tra cứu, tổng hợp, export |
| Activity logs | `/api/activity-logs` | audit theo user / action / resource |

Chi tiết từng endpoint: xem [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md).

---

## Dữ liệu demo và môi trường thật

- Seed cung cấp **người dùng, node, cảnh báo, API keys** mẫu để demo UI và luồng API.
- Biến `USE_REAL_DATA` điều khiển có bật **thu thập metrics thật** từ các nguồn cấu hình hay không; khi tắt, hệ thống vẫn chạy với luồng demo.

---

## Build production (gợi ý)

```bash
cd client-new && npm run build
cd server && npm start
```

Triển khai thực tế nên kèm reverse proxy (ví dụ Nginx), HTTPS, biến môi trường bảo mật, và quản lý process (PM2, systemd, container).

---

## License

MIT — xem file [LICENSE](LICENSE) nếu có trong repo.

---

## Gợi ý câu mô tả ngắn trên CV (tiếng Việt)

- *Xây dựng hệ thống quản lý CDN full-stack: Express + MySQL + JWT/RBAC, WebSocket cập nhật real-time, React TypeScript + MUI, dashboard analytics và quản lý nội dung có tối ưu ảnh (Sharp).*
