# Hệ thống Quản lý Nguồn gốc Xuất xứ Thuốc tại Bệnh viện bằng Blockchain

## Tổng quan Dự án

Hệ thống blockchain quản lý nguồn gốc xuất xứ thuốc được thiết kế để đảm bảo minh bạch và truy xuất nguồn gốc thuốc từ nhà sản xuất đến bệnh nhân, sử dụng công nghệ blockchain để chống thuốc giả.

### Mục tiêu chính
- Đảm bảo minh bạch chuỗi cung ứng thuốc
- Chống thuốc giả thông qua blockchain
- Truy xuất nguồn gốc qua mã QR
- Tự động hóa xác nhận giao nhận bằng smart contract

## Cấu trúc Dự án

```
blockchain-drug-provenance/
├── frontend/          # React.js interface cho 4 vai trò người dùng
├── backend/           # Node.js/Express API server 
├── blockchain/        # Smart contracts (Solidity) và blockchain setup
├── docs/             # Tài liệu thiết kế và hướng dẫn
├── tests/            # Unit tests và integration tests  
└── README.md         # Tài liệu chính
```

## Vai trò Người dùng

### 1. Admin (Quản trị hệ thống)
- Quản lý tài khoản người dùng
- Quản lý toàn bộ lô thuốc
- Xem báo cáo và thống kê
- Quản lý thuốc giả

### 2. Nhà sản xuất (Manufacturer)
- Ghi thông tin lô thuốc lên blockchain
- Tạo mã QR cho từng lô thuốc
- Cập nhật thông tin sản xuất

### 3. Nhà phân phối/Bệnh viện (Distributor/Hospital)
- Cập nhật trạng thái vận chuyển
- Xác nhận giao nhận thuốc
- Quản lý kho và phân phối
- Tra cứu nguồn gốc thuốc

### 4. Bệnh nhân (Patient)
- Quét mã QR để kiểm tra nguồn gốc thuốc
- Xem thông tin minh bạch về thuốc
- Đánh giá chất lượng thuốc

## Chức năng Chính

### 1. Quản lý Lô Thuốc
- Thêm/sửa/xóa thông tin lô thuốc
- Tạo mã QR liên kết blockchain
- Kiểm định chất lượng và hạn sử dụng

### 2. Chuỗi Cung ứng Blockchain
- Ghi nhận hành trình thuốc trên blockchain
- Smart contract tự động xác nhận giao nhận
- Phát hiện thuốc giả qua blockchain verification

### 3. Truy xuất Nguồn gốc QR
- Quét QR code để xem lịch sử thuốc
- Hiển thị thông tin nhà sản xuất, phân phối
- Xác thực tính hợp lệ của thuốc

### 4. Quản lý Nhiệm vụ
- Giao nhiệm vụ trong chuỗi cung ứng
- Theo dõi tiến độ thực hiện
- Đánh giá chất lượng hoàn thành

### 5. Hệ thống Thông báo
- Thông báo thu hồi thuốc
- Cảnh báo thuốc giả
- Thông báo trạng thái giao hàng

### 6. Thống kê & Báo cáo
- Dashboard tổng quan hệ thống
- Báo cáo xuất Excel/PDF
- Thống kê thuốc giả và chất lượng

## Công nghệ Sử dụng

### Blockchain
- **Platform**: Ethereum Testnet (Sepolia)
- **Smart Contract**: Solidity
- **Web3 Integration**: Web3.js
- **Development**: Truffle/Hardhat, Ganache

### Frontend
- **Framework**: React.js 18+ với TypeScript
- **UI Library**: Material-UI hoặc Ant Design
- **QR Code**: qrcode.react, qr-scanner
- **State Management**: Redux Toolkit
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: JWT, bcrypt
- **File Upload**: Multer
- **API Documentation**: Swagger/OpenAPI

### Database
- **Primary**: MongoDB (tài khoản, logs)
- **Blockchain Data**: IPFS cho metadata lớn
- **Caching**: Redis (optional)

### DevOps
- **Container**: Docker & Docker Compose
- **Testing**: Jest, Mocha, Hardhat tests
- **CI/CD**: GitHub Actions
- **Environment**: dotenv

## Cài đặt & Chạy

### Yêu cầu hệ thống
```bash
Node.js >= 18.0.0
npm >= 8.0.0
Docker (optional)
Git
```

### 1. Clone repository
```bash
git clone <repository-url>
cd blockchain-drug-provenance
```

### 2. Cài đặt dependencies
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install

# Blockchain
cd ../blockchain
npm install
```

### 3. Thiết lập môi trường
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp blockchain/.env.example blockchain/.env
```

### 4. Khởi động blockchain local
```bash
cd blockchain
npx ganache-cli --deterministic --accounts 10 --host 0.0.0.0
```

### 5. Deploy smart contracts
```bash
cd blockchain
npm run compile
npm run migrate
```

### 6. Khởi động backend
```bash
cd backend
npm run dev
```

### 7. Khởi động frontend
```bash  
cd frontend
npm start
```

## Demo & Testing

### Dữ liệu mẫu
Hệ thống được thiết lập với:
- 1 nhà sản xuất: VinPharm Co., Ltd.
- 1 nhà phân phối: MedDistribute JSC
- 1 bệnh viện: Bạch Mai Hospital  
- 20-50 lô thuốc giả lập

### Test Cases
- Quét QR code hợp lệ/không hợp lệ
- Xác nhận giao nhận tự động
- Phát hiện thuốc giả
- Workflow từ sản xuất đến bệnh nhân

### Demo Features
1. **Admin Panel**: Dashboard quản lý tổng thể
2. **Manufacturer**: Tạo lô thuốc và QR code
3. **Distributor**: Cập nhật vận chuyển
4. **Patient**: Quét QR kiểm tra nguồn gốc

## Bảo mật

### Authentication & Authorization
- JWT tokens với refresh mechanism
- Role-based access control (RBAC)
- Password hashing với bcrypt
- Rate limiting để chống brute force

### Blockchain Security  
- Smart contract audit checklist
- Input validation và sanitization
- Access control trong smart contracts
- Private key management

### Data Protection
- Encryption cho dữ liệu nhạy cảm (AES-256)
- HTTPS cho tất cả connections
- Input validation và sanitization
- SQL injection protection

## Roadmap

### Phase 1 (Tháng 1-2): Foundation
- [x] Thiết kế architecture
- [x] Setup development environment
- [ ] Core smart contracts
- [ ] Basic user authentication

### Phase 2 (Tháng 3-4): Core Features
- [ ] Drug batch management
- [ ] Supply chain tracking
- [ ] QR code generation/scanning
- [ ] Basic UI for all roles

### Phase 3 (Tháng 5): Advanced Features
- [ ] Task management system
- [ ] Notification system
- [ ] Reporting & analytics
- [ ] Mobile-responsive UI

### Phase 4 (Tháng 6): Testing & Deployment
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation & demo

## Đóng góp

### Development Guidelines
1. Sử dụng conventional commits
2. Code review bắt buộc trước merge
3. Maintain test coverage > 80%
4. Follow TypeScript best practices
5. Document public APIs

### Issue Reporting
Vui lòng tạo GitHub issue với:
- Mô tả chi tiết vấn đề
- Steps to reproduce
- Expected vs actual behavior
- Screenshots nếu có UI issues

## Giấy phép

Dự án này được phát triển cho mục đích học thuật và nghiên cứu.

## Liên hệ

- **Team Lead**: [Tên team leader]
- **Email**: [contact email]  
- **Documentation**: [Link đến docs chi tiết]

---

**Lưu ý**: Đây là hệ thống mô phỏng cho mục đích đồ án. Không sử dụng trong môi trường production mà không có security audit đầy đủ.