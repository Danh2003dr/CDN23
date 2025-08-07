# SEQUENCE DIAGRAMS - CDN MANAGEMENT SYSTEM

## 📋 TỔNG QUAN

Tài liệu này mô tả các sequence diagram (biểu đồ tuần tự) cho hệ thống CDN Management System, bao gồm các luồng tương tác chính giữa các thành phần của hệ thống.

## 📊 CÁC SEQUENCE DIAGRAM

### 1. **Sequence Diagram Chi Tiết** (`sequence_diagram.puml`)

Biểu đồ này mô tả chi tiết các luồng tương tác chính trong hệ thống:

#### **Các Luồng Chính:**
- **Authentication Flow**: Xác thực người dùng với JWT tokens
- **Real-time Dashboard Monitoring**: Giám sát thời gian thực qua WebSocket
- **Node Management Flow**: Quản lý các CDN nodes
- **Content Management Flow**: Upload và phân phối nội dung
- **Alert Management Flow**: Xử lý cảnh báo hệ thống
- **Analytics and Reporting**: Phân tích và báo cáo
- **User Management Flow**: Quản lý người dùng và phân quyền
- **Access Logging**: Ghi log các hoạt động

#### **Các Thành Phần:**
- **User**: Người dùng cuối
- **React Frontend**: Giao diện web React
- **Express Server**: Server backend Node.js
- **Auth Middleware**: Middleware xác thực
- **WebSocket**: Kết nối real-time
- **MySQL Database**: Cơ sở dữ liệu chính
- **CDN Nodes**: Các node CDN phân tán
- **File System**: Hệ thống lưu trữ file
- **Real Data Collector**: Dịch vụ thu thập dữ liệu

### 2. **System Architecture Sequence** (`system_architecture_sequence.puml`)

Biểu đồ tổng quan kiến trúc hệ thống với các layer chính:

#### **Các Layer:**
- **Frontend Layer**: Web Browser + React App
- **Backend Layer**: Express Server + WebSocket + Authentication + API Routes
- **Data Layer**: MySQL Database + File System
- **External Systems**: CDN Nodes + Monitoring Services

#### **Các Luồng Chính:**
- **System Initialization**: Khởi tạo hệ thống
- **User Session Flow**: Quản lý phiên người dùng
- **Real-time Monitoring**: Giám sát thời gian thực
- **API Operations**: Các thao tác API
- **Content Management**: Quản lý nội dung
- **Alert System**: Hệ thống cảnh báo

## 🔧 CÁCH SỬ DỤNG

### **Tạo Diagram từ PlantUML:**

1. **Online PlantUML Editor**:
   - Truy cập: https://www.plantuml.com/plantuml/uml/
   - Copy nội dung file `.puml` vào editor
   - Xem kết quả diagram

2. **VS Code Extension**:
   - Cài đặt extension "PlantUML"
   - Mở file `.puml`
   - Sử dụng `Ctrl+Shift+P` -> "PlantUML: Preview Current Diagram"

3. **Command Line**:
   ```bash
   # Cài đặt PlantUML
   npm install -g plantuml
   
   # Tạo PNG từ PUML
   plantuml sequence_diagram.puml
   plantuml system_architecture_sequence.puml
   ```

## 📝 CHI TIẾT CÁC LUỒNG

### **Authentication Flow**
1. User truy cập ứng dụng
2. Frontend kiểm tra JWT token
3. Nếu chưa xác thực -> hiển thị login
4. Xác thực thành công -> chuyển đến dashboard

### **Real-time Monitoring**
1. WebSocket connection được thiết lập
2. Real Data Collector thu thập metrics từ CDN nodes
3. Dữ liệu được broadcast qua WebSocket
4. Frontend cập nhật UI real-time

### **Node Management**
1. User xem danh sách nodes
2. Chọn node để xem chi tiết performance
3. Có thể cập nhật status của node
4. Thay đổi được broadcast real-time

### **Content Management**
1. User upload nội dung
2. File được lưu vào File System
3. Metadata được lưu vào database
4. Nội dung được phân phối đến các CDN nodes

### **Alert System**
1. Monitoring service liên tục kiểm tra CDN nodes
2. Khi phát hiện vấn đề -> tạo alert
3. Alert được broadcast qua WebSocket
4. User nhận thông báo real-time

## 🎯 LỢI ÍCH CỦA SEQUENCE DIAGRAMS

### **Cho Developers:**
- Hiểu rõ luồng tương tác giữa các thành phần
- Dễ dàng debug và troubleshoot
- Hướng dẫn implement các tính năng mới

### **Cho System Architects:**
- Visualize toàn bộ kiến trúc hệ thống
- Identify bottlenecks và optimization points
- Plan cho scalability và performance

### **Cho Project Managers:**
- Hiểu complexity của các tính năng
- Estimate effort cho development
- Communication với stakeholders

## 🔄 CẬP NHẬT

Các sequence diagram này sẽ được cập nhật khi:
- Thêm tính năng mới
- Thay đổi kiến trúc hệ thống
- Optimize performance flows
- Cập nhật security measures

## 📞 HỖ TRỢ

Nếu cần hỗ trợ hiểu hoặc cập nhật sequence diagrams:
- Xem tài liệu API trong `PROJECT_DESCRIPTION.md`
- Kiểm tra database schema trong `DATABASE_SUMMARY.md`
- Tham khảo source code trong `server/src/` và `client-new/src/`