# MÔ HÌNH PHÂN RÃ CHỨC NĂNG
## HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC BẰNG BLOCKCHAIN

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mục tiêu chính
- Đảm bảo tính minh bạch và xác thực trong chuỗi cung ứng thuốc
- Phòng chống thuốc giả thông qua blockchain và Smart Contract
- Cung cấp khả năng truy xuất nguồn gốc thuốc chính xác
- Tăng cường niềm tin của cộng đồng vào hệ thống y tế

### 1.2 Các vai trò người dùng
- **Admin**: Quản trị toàn bộ hệ thống
- **Nhà sản xuất**: Đưa thông tin thuốc lên blockchain
- **Nhà phân phối**: Vận chuyển và phân phối thuốc
- **Bệnh viện**: Lưu trữ và cung cấp thuốc cho bệnh nhân
- **Bệnh nhân**: Người sử dụng cuối, truy cứu thông tin qua QR code

---

## 2. PHÂN RÃ CHỨC NĂNG CẤP 1 - CÁC MODULE CHÍNH

```
HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC
├── 1. MODULE QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG
├── 2. MODULE QUẢN LÝ LÔ THUỐC
├── 3. MODULE QUẢN LÝ CHUỖI CUNG UNG (Core)
├── 4. MODULE GIAO NHIỆM VỤ VÀ THEO DÕI TIẾN ĐỘ
├── 5. MODULE THÔNG BÁO
├── 6. MODULE ĐÁNH GIÁ VÀ GÓP Ý
├── 7. MODULE THỐNG KÊ VÀ BÁO CÁO
└── 8. MODULE BẢO MẬT VÀ XÁC THỰC
```

---

## 3. PHÂN RÃ CHỨC NĂNG CẤP 2 - CHI TIẾT TỪNG MODULE

### 3.1 MODULE QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG

```
1. QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG
├── 1.1 Đăng ký tài khoản
│   ├── 1.1.1 Đăng ký theo vai trò
│   ├── 1.1.2 Xác thực thông tin
│   └── 1.1.3 Kích hoạt tài khoản
├── 1.2 Đăng nhập bảo mật
│   ├── 1.2.1 Xác thực JWT
│   ├── 1.2.2 Xác thực 2FA (tùy chọn)
│   └── 1.2.3 Quản lý phiên đăng nhập
├── 1.3 Quản lý hồ sơ
│   ├── 1.3.1 Cập nhật thông tin cá nhân
│   ├── 1.3.2 Đổi mật khẩu
│   └── 1.3.3 Quản lý quyền truy cập
└── 1.4 Phân quyền người dùng
    ├── 1.4.1 Gán vai trò
    ├── 1.4.2 Thiết lập quyền hạn
    └── 1.4.3 Kiểm soát truy cập
```

### 3.2 MODULE QUẢN LÝ LÔ THUỐC

```
2. QUẢN LÝ LÔ THUỐC
├── 2.1 Thêm lô thuốc mới
│   ├── 2.1.1 Nhập thông tin cơ bản
│   ├── 2.1.2 Tạo mã QR duy nhất
│   ├── 2.1.3 Ghi nhận lên blockchain
│   └── 2.1.4 Tạo chữ ký số và timestamp
├── 2.2 Cập nhật thông tin lô thuốc
│   ├── 2.2.1 Sửa đổi thông tin
│   ├── 2.2.2 Ghi lại lịch sử thay đổi
│   └── 2.2.3 Cập nhật blockchain
├── 2.3 Xóa/Vô hiệu hóa lô thuốc
│   ├── 2.3.1 Đánh dấu vô hiệu
│   ├── 2.3.2 Ghi lý do xóa
│   └── 2.3.3 Cập nhật trạng thái
└── 2.4 Truy vấn thông tin lô thuốc
    ├── 2.4.1 Tìm kiếm theo mã lô
    ├── 2.4.2 Quét QR code
    ├── 2.4.3 Xem lịch sử lô thuốc
    └── 2.4.4 Kiểm tra tính hợp lệ
```

### 3.3 MODULE QUẢN LÝ CHUỖI CUNG ỨNG (CORE)

```
3. QUẢN LÝ CHUỖI CUNG ỨNG
├── 3.1 Ghi nhận hành trình thuốc
│   ├── 3.1.1 Sản xuất
│   │   ├── 3.1.1.1 Đăng ký thông tin sản xuất
│   │   ├── 3.1.1.2 Ghi nhận nguyên liệu
│   │   └── 3.1.1.3 Kiểm tra chất lượng
│   ├── 3.1.2 Phân phối
│   │   ├── 3.1.2.1 Xác nhận nhận hàng
│   │   ├── 3.1.2.2 Ghi nhận điều kiện bảo quản
│   │   └── 3.1.2.3 Cập nhật vị trí
│   └── 3.1.3 Bệnh viện
│       ├── 3.1.3.1 Nhập kho bệnh viện
│       ├── 3.1.3.2 Quản lý tồn kho
│       └── 3.1.3.3 Cấp phát cho bệnh nhân
├── 3.2 Xác minh từng bước vận chuyển
│   ├── 3.2.1 Smart Contract validation
│   ├── 3.2.2 Kiểm tra chữ ký số
│   └── 3.2.3 Xác thực timestamp
├── 3.3 Phát hiện thuốc giả
│   ├── 3.3.1 So sánh với blockchain
│   ├── 3.3.2 Kiểm tra tính toàn vẹn
│   └── 3.3.3 Cảnh báo thuốc giả
└── 3.4 Truy xuất nguồn gốc
    ├── 3.4.1 Theo dõi đầy đủ hành trình
    ├── 3.4.2 Hiển thị chuỗi cung ứng
    └── 3.4.3 Xác minh từng điểm chuyển giao
```

### 3.4 MODULE GIAO NHIỆM VỤ VÀ THEO DÕI TIẾN ĐỘ

```
4. GIAO NHIỆM VỤ VÀ THEO DÕI TIẾN ĐỘ
├── 4.1 Tạo và giao nhiệm vụ
│   ├── 4.1.1 Định nghĩa nhiệm vụ
│   ├── 4.1.2 Gán người thực hiện
│   └── 4.1.3 Thiết lập thời hạn
├── 4.2 Theo dõi tiến độ
│   ├── 4.2.1 Cập nhật trạng thái
│   ├── 4.2.2 Báo cáo tiến độ
│   └── 4.2.3 Cảnh báo quá hạn
└── 4.3 Hoàn thành nhiệm vụ
    ├── 4.3.1 Xác nhận hoàn thành
    ├── 4.3.2 Đánh giá kết quả
    └── 4.3.3 Lưu trữ kết quả
```

### 3.5 MODULE THÔNG BÁO

```
5. THÔNG BÁO
├── 5.1 Gửi thông báo
│   ├── 5.1.1 Thông báo thu hồi thuốc
│   ├── 5.1.2 Cảnh báo hết hạn
│   ├── 5.1.3 Thông báo cập nhật
│   └── 5.1.4 Cảnh báo bảo mật
├── 5.2 Nhận thông báo
│   ├── 5.2.1 Hiển thị thông báo
│   ├── 5.2.2 Đánh dấu đã đọc
│   └── 5.2.3 Lưu trữ lịch sử
└── 5.3 Quản lý thông báo
    ├── 5.3.1 Phân loại thông báo
    ├── 5.3.2 Thiết lập ưu tiên
    └── 5.3.3 Tự động hóa gửi
```

### 3.6 MODULE ĐÁNH GIÁ VÀ GÓP Ý

```
6. ĐÁNH GIÁ VÀ GÓP Ý
├── 6.1 Đánh giá chất lượng thuốc
│   ├── 6.1.1 Đánh giá ẩn danh
│   ├── 6.1.2 Thang điểm đánh giá
│   └── 6.1.3 Nhận xét chi tiết
├── 6.2 Đánh giá dịch vụ
│   ├── 6.2.1 Đánh giá nhà sản xuất
│   ├── 6.2.2 Đánh giá nhà phân phối
│   └── 6.2.3 Đánh giá bệnh viện
└── 6.3 Xử lý phản hồi
    ├── 6.3.1 Thu thập góp ý
    ├── 6.3.2 Phân tích phản hồi
    └── 6.3.3 Cải thiện dịch vụ
```

### 3.7 MODULE THỐNG KÊ VÀ BÁO CÁO

```
7. THỐNG KÊ VÀ BÁO CÁO
├── 7.1 Thống kê lô thuốc
│   ├── 7.1.1 Số lượng lô theo thời gian
│   ├── 7.1.2 Phân bố theo nhà sản xuất
│   └── 7.1.3 Tỷ lệ thuốc hết hạn
├── 7.2 Thống kê chuỗi cung ứng
│   ├── 7.2.1 Thời gian vận chuyển
│   ├── 7.2.2 Hiệu quả phân phối
│   └── 7.2.3 Điểm nghẽn trong chuỗi
├── 7.3 Báo cáo bảo mật
│   ├── 7.3.1 Phát hiện thuốc giả
│   ├── 7.3.2 Vi phạm bảo mật
│   └── 7.3.3 Truy cập trái phép
└── 7.4 Dashboard quản lý
    ├── 7.4.1 Tổng quan hệ thống
    ├── 7.4.2 Chỉ số KPI
    └── 7.4.3 Cảnh báo real-time
```

### 3.8 MODULE BẢO MẬT VÀ XÁC THỰC

```
8. BẢO MẬT VÀ XÁC THỰC
├── 8.1 Mã hóa dữ liệu
│   ├── 8.1.1 Mã hóa mật khẩu (bcrypt)
│   ├── 8.1.2 Mã hóa dữ liệu nhạy cảm (AES-256)
│   └── 8.1.3 Chữ ký số
├── 8.2 Xác thực và phân quyền
│   ├── 8.2.1 JWT Authentication
│   ├── 8.2.2 Role-based Access Control
│   └── 8.2.3 Session Management
├── 8.3 Audit và giám sát
│   ├── 8.3.1 Audit Smart Contract
│   ├── 8.3.2 Log hoạt động hệ thống
│   └── 8.3.3 Giám sát bảo mật
└── 8.4 Backup và phục hồi
    ├── 8.4.1 Sao lưu dữ liệu
    ├── 8.4.2 Khôi phục hệ thống
    └── 8.4.3 Disaster Recovery
```

---

## 4. KIẾN TRÚC CÔNG NGHỆ

### 4.1 Blockchain Layer
- **Platform**: Ethereum Testnet / Hyperledger Fabric
- **Smart Contract**: Solidity
- **Consensus**: Proof of Authority (PoA)

### 4.2 Backend Layer
- **Framework**: Node.js + Express.js
- **Blockchain Integration**: Web3.js
- **Database**: MongoDB
- **Authentication**: JWT + bcrypt

### 4.3 Frontend Layer
- **Framework**: React.js
- **QR Code**: react-qr-scanner
- **State Management**: Redux/Context API
- **UI Framework**: Material-UI/Ant Design

### 4.4 Security Layer
- **Encryption**: AES-256
- **Digital Signature**: ECDSA
- **Access Control**: RBAC
- **Audit**: Smart Contract Audit

---

## 5. LUỒNG HOẠT ĐỘNG CHÍNH

### 5.1 Luồng sản xuất thuốc
```
Nhà sản xuất → Tạo lô thuốc → Ghi blockchain → Tạo QR → Đóng gói
```

### 5.2 Luồng phân phối
```
Nhà sản xuất → Nhà phân phối → Xác nhận nhận hàng → Cập nhật blockchain → Vận chuyển → Bệnh viện
```

### 5.3 Luồng kiểm tra thuốc
```
Bệnh nhân → Quét QR → Truy vấn blockchain → Hiển thị thông tin → Xác minh tính hợp lệ
```

---

## 6. METRICS VÀ KPI

### 6.1 Hiệu suất hệ thống
- Thời gian phản hồi truy vấn blockchain
- Số lượng giao dịch/giây
- Tỷ lệ uptime hệ thống

### 6.2 Bảo mật
- Số lượng thuốc giả phát hiện
- Tỷ lệ xác thực thành công
- Số vụ vi phạm bảo mật

### 6.3 Người dùng
- Số lượng người dùng active
- Tần suất sử dụng QR scanner
- Mức độ hài lòng người dùng

---

## 7. ROADMAP PHÁT TRIỂN

### Phase 1: Core Functions (Hiện tại)
- ✅ Quản lý lô thuốc cơ bản
- ✅ Blockchain integration
- ✅ QR code scanning
- ✅ User management

### Phase 2: Advanced Features
- 🔄 IoT integration (cảm biến nhiệt độ)
- 🔄 Mobile app
- 🔄 Advanced analytics
- 🔄 API integration với HIS

### Phase 3: Production Ready
- ⏳ Mainnet deployment
- ⏳ Regulatory compliance
- ⏳ Enterprise integration
- ⏳ Scalability optimization

---

*Tài liệu này mô tả chi tiết mô hình phân rã chức năng của Hệ thống Quản lý Nguồn gốc Xuất xứ Thuốc bằng Blockchain, phục vụ cho việc phát triển và triển khai hệ thống.*