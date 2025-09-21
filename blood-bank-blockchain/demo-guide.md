# 🩸 Hướng dẫn Demo Hệ thống Quản lý Ngân hàng Máu

## 📋 Kịch bản Demo

### Phần 1: Giới thiệu hệ thống (5 phút)

**🎯 Mục tiêu**: Giải quyết vấn đề gian lận và thiếu minh bạch trong quản lý máu

**❌ Vấn đề hiện tại**:
- Khó truy xuất nguồn gốc máu
- Dữ liệu có thể bị thay đổi, làm giả
- Thiếu minh bạch trong phân phối
- Khó phối hợp giữa các bệnh viện

**✅ Giải pháp Blockchain**:
- Mỗi đơn vị máu có ID duy nhất trên blockchain
- Lịch sử bất biến, không thể sửa đổi
- Minh bạch hoàn toàn từ hiến đến sử dụng
- Tự động hóa quy trình, giảm sai sót

### Phần 2: Demo chức năng cốt lõi (15 phút)

#### Bước 1: Khởi động hệ thống
```bash
# Terminal 1: Blockchain node
cd blood-bank-blockchain
npm run node

# Terminal 2: Deploy smart contract
npm run deploy

# Terminal 3: Web interface
npm run start-frontend
```

#### Bước 2: Đăng ký người hiến máu
**Kịch bản**: Bệnh viện Bạch Mai đăng ký người hiến mới

1. Truy cập http://localhost:3000
2. Vào tab "Người hiến"
3. Nhập thông tin:
   - Họ tên: "Nguyễn Văn An"
   - Tuổi: 28
   - Nhóm máu: O-
   - Liên hệ: "0901234567"
4. Nhấn "Đăng ký Người hiến"
5. **Highlight**: Hiển thị transaction hash, ID người hiến

#### Bước 3: Thu thập đơn vị máu
**Kịch bản**: Thu thập máu từ người hiến vừa đăng ký

1. Vào tab "Thu thập máu"
2. Nhập:
   - ID Người hiến: 1
   - Thông tin: "Người hiến khỏe mạnh, không có bệnh lý"
3. Nhấn "Thu thập Máu"
4. **Highlight**: Đơn vị máu được tạo với ID duy nhất, ngày hết hạn tự động

#### Bước 4: Xét nghiệm và phê duyệt
**Kịch bản**: Cập nhật kết quả xét nghiệm

1. Vào tab "Xét nghiệm"
2. Nhập:
   - ID Đơn vị máu: 1
   - Kết quả: "HIV(-), HBV(-), HCV(-), Syphilis(-), Malaria(-)"
   - Phê duyệt: "Đạt - Phê duyệt"
3. Nhấn "Cập nhật Kết quả"
4. **Highlight**: Trạng thái chuyển từ COLLECTED → APPROVED

#### Bước 5: Tra cứu thông tin minh bạch
**Kịch bản**: Kiểm tra thông tin đầy đủ của đơn vị máu

1. Vào tab "Tra cứu"
2. Nhập ID: 1
3. Nhấn "Tra cứu"
4. **Highlight**: Hiển thị toàn bộ thông tin:
   - Thông tin người hiến
   - Ngày thu thập, hết hạn
   - Kết quả xét nghiệm
   - Trạng thái hiện tại
   - Lịch sử chuyển máu (nếu có)

### Phần 3: Demo tính năng nâng cao (10 phút)

#### Bước 6: Đăng ký bệnh viện
**Kịch bản**: Thêm bệnh viện Việt Đức vào hệ thống

1. Vào tab "Bệnh viện"
2. Nhập thông tin:
   - Tên: "Bệnh viện Việt Đức"
   - Địa chỉ: "Hà Nội, Việt Nam"
   - Liên hệ: "contact@vietduc.gov.vn"
   - Admin: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
3. **Highlight**: Tự động cấp quyền Hospital Admin

#### Bước 7: Tạo nhiều dữ liệu mẫu
**Kịch bản**: Tạo thêm người hiến và đơn vị máu

1. Đăng ký thêm 2-3 người hiến với nhóm máu khác nhau
2. Thu thập máu từ họ
3. Cập nhật kết quả xét nghiệm
4. **Highlight**: Xem thống kê tổng quan cập nhật real-time

#### Bước 8: Kiểm tra máu có sẵn
**Kịch bản**: Xem máu có sẵn theo nhóm máu

1. Vào tab "Máu có sẵn"
2. **Highlight**: Grid hiển thị số lượng máu theo từng nhóm
3. Giải thích cách hệ thống tự động loại bỏ máu hết hạn/đã sử dụng

### Phần 4: Tương tác với Smart Contract (5 phút)

#### Demo bằng script
```bash
# Chạy script tương tác trực tiếp
npm run interact
```

**Highlight các điểm**:
- Kết nối trực tiếp với blockchain
- Đọc dữ liệu từ smart contract
- Hiển thị gas cost cho mỗi transaction
- Verify transaction trên blockchain explorer (nếu có)

## 🎭 Kịch bản câu chuyện thực tế

### Tình huống: Tai nạn giao thông cần máu cấp cứu

**16:30** - Bệnh viện Bạch Mai tiếp nhận bệnh nhân tai nạn, cần 3 đơn vị máu O-

**16:32** - Kiểm tra hệ thống: chỉ có 1 đơn vị O- tại Bạch Mai

**16:35** - Tìm kiếm trên blockchain: Bệnh viện Việt Đức có 2 đơn vị O- sẵn sàng

**16:37** - Tạo yêu cầu chuyển máu khẩn cấp

**16:45** - Máu được chuyển và ghi nhận trên blockchain

**17:00** - Sử dụng máu cho phẫu thuật, cập nhật trạng thái

**Kết quả**: Toàn bộ quá trình được ghi nhận minh bạch, có thể truy xuất mãi mãi

## 📊 Metrics để highlight

### Hiệu suất
- **Thời gian xử lý**: < 30 giây mỗi transaction
- **Chi phí gas**: Tối ưu với batch operations
- **Khả năng mở rộng**: Hỗ trợ hàng nghìn bệnh viện

### Bảo mật
- **Phân quyền**: 3 levels (Admin, Hospital, Medical Staff)
- **Immutable**: Dữ liệu không thể thay đổi sau khi ghi
- **Transparent**: Mọi transaction đều public

### Tiện ích
- **Real-time**: Cập nhật trạng thái ngay lập tức
- **Cross-hospital**: Chia sẻ dữ liệu giữa bệnh viện
- **Audit trail**: Lịch sử đầy đủ cho kiểm toán

## 🎯 Key Messages

1. **"Mỗi giọt máu đều có câu chuyện riêng trên blockchain"**
2. **"Từ người hiến đến người nhận - minh bạch 100%"**
3. **"Công nghệ blockchain bảo vệ sự tin cậy trong y tế"**
4. **"Không thể gian lận khi mọi thứ đều công khai"**

## 🔧 Troubleshooting

### Nếu contract deploy lỗi:
```bash
# Reset blockchain state
pkill -f hardhat
npm run node
npm run deploy
```

### Nếu frontend không kết nối được:
- Kiểm tra CONTRACT_ADDRESS trong server.js
- Đảm bảo Hardhat node đang chạy
- Restart web server

### Nếu transaction fail:
- Kiểm tra account có đủ ETH
- Verify permissions (roles)
- Check contract state

## 📝 Q&A thường gặp

**Q: Blockchain có chậm không?**
A: Local testnet rất nhanh, mainnet có thể 15s-2 phút

**Q: Chi phí bao nhiêu?**
A: Testnet miễn phí, mainnet khoảng $1-5 per transaction

**Q: Dữ liệu có bị mất không?**
A: Không, blockchain bảo đảm dữ liệu vĩnh viễn

**Q: Có thể hack được không?**
A: Rất khó, cần kiểm soát >51% network

**Q: Quy mô triển khai?**
A: Có thể scale cho cả nước, kết nối với các blockchain khác

---

**🎬 "Demo thành công = Thuyết phục được tầm quan trọng của blockchain trong y tế!"**