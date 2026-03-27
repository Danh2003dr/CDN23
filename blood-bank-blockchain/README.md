# 🩸 Hệ thống Quản lý Ngân hàng Máu - Blockchain

## Tổng quan

Đây là một hệ thống quản lý ngân hàng máu hoàn chỉnh sử dụng công nghệ blockchain để đảm bảo tính minh bạch và chống gian lận trong quy trình hiến máu. Hệ thống ghi nhận toàn bộ quy trình từ hiến máu, lưu trữ, xét nghiệm đến phân phối máu giữa các bệnh viện.

## ✨ Tính năng chính

### 🔐 Quản lý quyền truy cập
- **Blood Bank Admin**: Quản lý toàn hệ thống, đăng ký bệnh viện
- **Hospital Admin**: Quản lý yêu cầu máu của bệnh viện
- **Medical Staff**: Đăng ký người hiến, thu thập máu, cập nhật kết quả xét nghiệm

### 👥 Quản lý người hiến máu
- Đăng ký thông tin người hiến (họ tên, tuổi, nhóm máu, liên hệ)
- Theo dõi lịch sử hiến máu của từng người
- Kiểm tra điều kiện hiến máu (tuổi từ 18-65)

### 🩸 Quản lý đơn vị máu
- Mỗi đơn vị máu có ID duy nhất trên blockchain
- Theo dõi toàn bộ vòng đời: Thu thập → Xét nghiệm → Phê duyệt → Chuyển → Sử dụng
- Tự động tính ngày hết hạn (42 ngày sau thu thập)
- Ghi nhận kết quả xét nghiệm đầy đủ

### 🏥 Quản lý bệnh viện
- Đăng ký bệnh viện với địa chỉ admin trên blockchain
- Tạo yêu cầu máu với mức độ ưu tiên
- Theo dõi máu được chuyển đến bệnh viện

### 📋 Lịch sử minh bạch
- Mọi giao dịch được ghi nhận bất biến trên blockchain
- Theo dõi lịch sử chuyển máu giữa các bệnh viện
- Truy xuất nguồn gốc từ người hiến đến người nhận

### 📊 Báo cáo và thống kê
- Thống kê tổng quan hệ thống
- Máu có sẵn theo từng nhóm máu
- Lịch sử giao dịch chi tiết

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   API Server    │    │  Smart Contract │
│     (HTML/JS)   │◄──►│   (Node.js)     │◄──►│   (Solidity)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Blockchain    │
                                               │   (Ethereum)    │
                                               └─────────────────┘
```

## 📁 Cấu trúc dự án

```
blood-bank-blockchain/
├── contracts/
│   └── BloodBankManagement.sol    # Smart contract chính
├── scripts/
│   ├── deploy.js                  # Script deploy contract
│   └── interact.js                # Script tương tác với contract
├── frontend/
│   ├── server.js                  # API server Node.js
│   └── public/
│       └── index.html             # Giao diện web
├── test/
│   └── BloodBankManagement.test.js # Test cases
└── hardhat.config.js              # Cấu hình Hardhat
```

## 🚀 Hướng dẫn sử dụng

### 1. Cài đặt dependencies
```bash
cd blood-bank-blockchain
npm install
```

### 2. Khởi động blockchain local
```bash
# Terminal 1: Khởi động Hardhat node
npm run node
```

### 3. Deploy smart contract
```bash
# Terminal 2: Deploy contract
npm run deploy
```

### 4. Khởi động web server
```bash
# Terminal 3: Khởi động frontend
npm run start-frontend
```

### 5. Truy cập ứng dụng
Mở trình duyệt và truy cập: http://localhost:3000

## 🔄 Quy trình sử dụng

### Bước 1: Đăng ký người hiến máu
1. Vào tab "Người hiến"
2. Nhập thông tin: họ tên, tuổi, nhóm máu, liên hệ
3. Nhấn "Đăng ký Người hiến"

### Bước 2: Thu thập máu
1. Vào tab "Thu thập máu"
2. Nhập ID người hiến và thông tin bổ sung
3. Nhấn "Thu thập Máu"

### Bước 3: Cập nhật kết quả xét nghiệm
1. Vào tab "Xét nghiệm"
2. Nhập ID đơn vị máu và kết quả xét nghiệm
3. Chọn "Đạt" hoặc "Không đạt"
4. Nhấn "Cập nhật Kết quả"

### Bước 4: Đăng ký bệnh viện
1. Vào tab "Bệnh viện"
2. Nhập thông tin bệnh viện và địa chỉ admin
3. Nhấn "Đăng ký Bệnh viện"

### Bước 5: Tra cứu thông tin
1. Vào tab "Tra cứu"
2. Nhập ID đơn vị máu
3. Xem thông tin chi tiết và lịch sử chuyển máu

## 📊 Các API endpoints

- `GET /api/stats` - Thống kê tổng quan
- `POST /api/donors` - Đăng ký người hiến
- `GET /api/donors/:id` - Thông tin người hiến
- `POST /api/blood-units` - Thu thập máu
- `GET /api/blood-units/:id` - Thông tin đơn vị máu
- `PUT /api/blood-units/:id/test-results` - Cập nhật kết quả xét nghiệm
- `GET /api/blood-units/available/:bloodType` - Máu có sẵn theo loại
- `GET /api/blood-units/:id/history` - Lịch sử chuyển máu
- `POST /api/hospitals` - Đăng ký bệnh viện
- `GET /api/hospitals/:id` - Thông tin bệnh viện
- `POST /api/blood-requests` - Tạo yêu cầu máu
- `POST /api/blood-units/:id/transfer` - Chuyển máu

## 🛡️ Bảo mật

- **Access Control**: Sử dụng OpenZeppelin AccessControl cho phân quyền
- **ReentrancyGuard**: Chống tấn công reentrancy
- **Input Validation**: Kiểm tra dữ liệu đầu vào nghiêm ngặt
- **Immutable Records**: Dữ liệu trên blockchain không thể thay đổi

## 🌟 Lợi ích của blockchain

### 1. Minh bạch tuyệt đối
- Mọi giao dịch được ghi nhận công khai
- Không thể xóa hoặc sửa đổi lịch sử
- Truy xuất nguồn gốc hoàn chỉnh

### 2. Chống gian lận
- Không thể làm giả dữ liệu
- Mọi thay đổi đều có chữ ký số
- Phân quyền rõ ràng, không thể vượt quyền

### 3. Tin cậy
- Không cần bên thứ ba trung gian
- Tự động hóa quy trình
- Đảm bảo tuân thủ quy định

### 4. Hiệu quả
- Giảm thời gian xử lý giấy tờ
- Tự động cập nhật trạng thái
- Chia sẻ dữ liệu real-time

## 🔧 Mở rộng

Hệ thống có thể được mở rộng với:

- **Mobile App**: Ứng dụng di động cho người hiến
- **IoT Integration**: Cảm biến theo dõi nhiệt độ bảo quản
- **AI Analytics**: Dự đoán nhu cầu máu
- **Cross-chain**: Kết nối với các blockchain khác
- **IPFS**: Lưu trữ hình ảnh, tài liệu

## 📞 Liên hệ

Dự án được phát triển nhằm mục đích demo công nghệ blockchain trong y tế. 
Để biết thêm thông tin hoặc đóng góp, vui lòng liên hệ qua GitHub Issues.

---

**🩸 "Máu hiến tặng, tình yêu thương - Blockchain bảo vệ, minh bạch tin cậy"**