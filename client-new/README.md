# CDN Management — Frontend

Ứng dụng **React 18 + TypeScript** cho hệ thống CDN Management System. Giao diện dùng **MUI 5**, **react-router-dom**, gọi API backend qua **axios** (proxy dev tới `http://localhost:5000` trong `package.json`).

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm start` | Chạy dev server (mặc định port 3000). |
| `npm run build` | Build production vào thư mục `build/`. |
| `npm test` | Chạy test (CRA). |

## Cấu trúc chính

- `src/pages/` — Các màn hình ứng dụng (Dashboard, Nodes, Analytics, …).
- `src/components/` — Component dùng lại.
- `src/contexts/` — Context (ví dụ authentication).
- `src/services/` — Client gọi REST API.

Tổng quan dự án, cài đặt backend và mô tả API: xem [README.md](../README.md) và [PROJECT_DESCRIPTION.md](../PROJECT_DESCRIPTION.md) ở thư mục gốc repository.
