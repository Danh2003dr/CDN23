# SƠ ĐỒ TƯƠNG TÁC MERMAID - COPY & PASTE READY
## HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC BẰNG BLOCKCHAIN

---

## 🎯 HƯỚNG DẪN NHANH
**Cách sử dụng:** Copy mã bên dưới → Dán vào https://mermaid.live/ → Xem kết quả ngay lập tức!

---

## 📊 1. SƠ ĐỒ TỔNG QUAN HỆ THỐNG (3D Style)

```mermaid
graph TB
    subgraph "🏥 HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC"
        direction TB
        
        subgraph "💻 FRONTEND LAYER"
            A["🌐 React.js<br/>📱 Responsive UI"]
            B["📷 QR Scanner<br/>🔍 Real-time Detection"]
            C["🎨 Material-UI<br/>✨ Modern Design"]
        end
        
        subgraph "⚙️ BACKEND LAYER"
            D["🚀 Node.js + Express<br/>🔄 RESTful API"]
            E["🔗 Web3.js<br/>⛓️ Blockchain Integration"]
            F["🗄️ MongoDB<br/>📊 NoSQL Database"]
            G["🔐 JWT Authentication<br/>🛡️ Security Layer"]
        end
        
        subgraph "⛓️ BLOCKCHAIN LAYER"
            H["🌐 Ethereum Testnet<br/>💎 Decentralized Network"]
            I["📜 Smart Contract<br/>🤖 Automated Logic"]
            J["💻 Solidity<br/>📝 Contract Language"]
        end
    end
    
    A -.->|"API Calls"| D
    B -.->|"Blockchain Query"| E
    C -.->|"UI Requests"| D
    D -.->|"Web3 Connection"| H
    E -.->|"Contract Interaction"| I
    F -.->|"Data Storage"| D
    G -.->|"Auth Validation"| D
    I -.->|"Compiled Code"| J
    
    classDef frontend fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef blockchain fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class A,B,C frontend
    class D,E,F,G backend
    class H,I,J blockchain
```

---

## 🧠 2. SƠ ĐỒ TƯ DUY - PHÂN RÃ CHỨC NĂNG

```mermaid
mindmap
  root)🏥 HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC(
    (👤 MODULE 1: QUẢN LÝ TÀI KHOẢN)
      📝 Đăng ký tài khoản
        🎭 Đăng ký theo vai trò
        ✅ Xác thực thông tin
        🔓 Kích hoạt tài khoản
      🔑 Đăng nhập bảo mật
        🎫 Xác thực JWT
        📱 Xác thực 2FA
        ⏰ Quản lý phiên
      👤 Quản lý hồ sơ
        ✏️ Cập nhật thông tin
        🔒 Đổi mật khẩu
        🎯 Quản lý quyền truy cập
      🛡️ Phân quyền người dùng
        👥 Gán vai trò
        ⚙️ Thiết lập quyền hạn
        🚪 Kiểm soát truy cập
    
    (💊 MODULE 2: QUẢN LÝ LÔ THUỐC)
      ➕ Thêm lô thuốc mới
        📋 Nhập thông tin cơ bản
        🏷️ Tạo mã QR duy nhất
        ⛓️ Ghi nhận lên blockchain
        🔏 Tạo chữ ký số + timestamp
      🔄 Cập nhật thông tin
        ✏️ Sửa đổi thông tin
        📚 Ghi lại lịch sử thay đổi
        🔄 Cập nhật blockchain
      🗑️ Xóa/Vô hiệu hóa
        ❌ Đánh dấu vô hiệu
        📝 Ghi lý do xóa
        🔄 Cập nhật trạng thái
      🔍 Truy vấn thông tin
        🔎 Tìm kiếm theo mã lô
        📷 Quét QR code
        📖 Xem lịch sử lô thuốc
        ✅ Kiểm tra tính hợp lệ
    
    (🚚 MODULE 3: CHUỖI CUNG ỨNG - CORE)
      📝 Ghi nhận hành trình thuốc
        🏭 Sản xuất
          📋 Đăng ký thông tin sản xuất
          🧪 Ghi nhận nguyên liệu
          🔬 Kiểm tra chất lượng
        🚛 Phân phối
          📦 Xác nhận nhận hàng
          🌡️ Ghi nhận điều kiện bảo quản
          📍 Cập nhật vị trí
        🏥 Bệnh viện
          📥 Nhập kho bệnh viện
          📊 Quản lý tồn kho
          💊 Cấp phát cho bệnh nhân
      ✅ Xác minh từng bước vận chuyển
        🤖 Smart Contract validation
        🔏 Kiểm tra chữ ký số
        ⏰ Xác thực timestamp
      🚨 Phát hiện thuốc giả
        🔍 So sánh với blockchain
        🛡️ Kiểm tra tính toàn vẹn
        ⚠️ Cảnh báo thuốc giả
      🔍 Truy xuất nguồn gốc
        🗺️ Theo dõi đầy đủ hành trình
        📊 Hiển thị chuỗi cung ứng
        ✅ Xác minh từng điểm chuyển giao
    
    (📋 MODULE 4: GIAO NHIỆM VỤ)
      ➕ Tạo và giao nhiệm vụ
      📊 Theo dõi tiến độ
      ✅ Hoàn thành nhiệm vụ
    
    (📢 MODULE 5: THÔNG BÁO)
      📤 Gửi thông báo
      📥 Nhận thông báo
      📋 Quản lý thông báo
    
    (⭐ MODULE 6: ĐÁNH GIÁ)
      💊 Đánh giá chất lượng thuốc
      🏢 Đánh giá dịch vụ
      💬 Xử lý phản hồi
    
    (📊 MODULE 7: THỐNG KÊ)
      📈 Thống kê lô thuốc
      🚚 Thống kê chuỗi cung ứng
      🛡️ Báo cáo bảo mật
      📊 Dashboard quản lý
    
    (🔐 MODULE 8: BẢO MẬT)
      🔒 Mã hóa dữ liệu
      🎫 Xác thực và phân quyền
      📝 Audit và giám sát
      💾 Backup và phục hồi
```

---

## 🔄 3. SEQUENCE DIAGRAM - QUY TRÌNH HOẠT ĐỘNG

```mermaid
sequenceDiagram
    participant 🏭 as Nhà Sản Xuất
    participant ⛓️ as Smart Contract
    participant 🗄️ as Database
    participant 📱 as Mobile App
    participant 🏥 as Bệnh Viện
    participant 👤 as Bệnh Nhân
    
    Note over 🏭,👤: 🚀 QUY TRÌNH TẠO VÀ KIỂM TRA LÔ THUỐC
    
    rect rgb(240, 248, 255)
        Note over 🏭,🗄️: 📦 GIAI ĐOẠN SẢN XUẤT
        🏭->>⛓️: 1. 📝 Tạo lô thuốc mới (drugInfo)
        activate ⛓️
        ⛓️->>⛓️: 2. 🔐 Tạo hash + chữ ký số
        ⛓️-->>🏭: 3. 📋 Trả về Batch ID + Hash
        deactivate ⛓️
        
        🏭->>🗄️: 4. 💾 Lưu thông tin bổ sung
        🏭->>🏭: 5. 🏷️ Tạo QR Code
    end
    
    rect rgb(240, 255, 240)
        Note over 🏭,🏥: 🚚 GIAI ĐOẠN PHÂN PHỐI
        🏭->>🏥: 6. 📦 Giao hàng đến bệnh viện
        🏥->>⛓️: 7. ✅ Xác nhận nhận hàng
        ⛓️-->>🏥: 8. 📋 Cập nhật trạng thái
    end
    
    rect rgb(255, 248, 240)
        Note over 📱,👤: 🔍 GIAI ĐOẠN KIỂM TRA
        👤->>📱: 9. 📷 Quét QR Code
        📱->>⛓️: 10. 🔍 Truy vấn thông tin (Batch ID)
        activate ⛓️
        ⛓️->>⛓️: 11. 🔐 Xác minh tính hợp lệ
        ⛓️-->>📱: 12. 📊 Trả về thông tin đầy đủ
        deactivate ⛓️
        
        alt 💊 Thuốc hợp lệ
            📱-->>👤: 13a. ✅ Hiển thị thông tin chính hãng
        else 🚨 Thuốc giả
            📱-->>👤: 13b. ⚠️ Cảnh báo thuốc giả
            📱->>🗄️: 14. 📝 Ghi log phát hiện
        end
    end
    
    Note over 🏭,👤: ✨ HOÀN THÀNH QUY TRÌNH
```

---

## 🌐 4. FLOWCHART - LUỒNG KIỂM TRA THUỐC

```mermaid
flowchart TD
    Start([🚀 Bắt đầu]) --> Scan[📷 Quét QR Code]
    Scan --> Extract[🔍 Trích xuất Batch ID]
    Extract --> Query[⛓️ Truy vấn Blockchain]
    
    Query --> Check{🔐 Kiểm tra tính hợp lệ?}
    
    Check -->|✅ Hợp lệ| Valid[💊 Thuốc chính hãng]
    Check -->|❌ Không hợp lệ| Invalid[🚨 Thuốc giả]
    
    Valid --> ShowInfo[📊 Hiển thị thông tin:<br/>• Nhà sản xuất<br/>• Ngày sản xuất<br/>• Hạn sử dụng<br/>• Lịch sử vận chuyển]
    
    Invalid --> Alert[⚠️ Cảnh báo nguy hiểm]
    Alert --> Report[📝 Báo cáo cơ quan chức năng]
    
    ShowInfo --> Rate{⭐ Đánh giá chất lượng?}
    Rate -->|Có| Feedback[💬 Gửi đánh giá]
    Rate -->|Không| End([✅ Kết thúc])
    
    Feedback --> End
    Report --> End
    
    classDef startEnd fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef process fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef danger fill:#ffebee,stroke:#f44336,stroke-width:2px
    
    class Start,End startEnd
    class Scan,Extract,Query,ShowInfo,Feedback,Report process
    class Check,Rate decision
    class Valid success
    class Invalid,Alert danger
```

---

## 👥 5. USER JOURNEY MAP

```mermaid
journey
    title 🏥 Hành trình Sử dụng Hệ thống Quản lý Nguồn gốc Thuốc
    
    section 🏭 Nhà Sản Xuất
      Đăng nhập hệ thống: 5: NSX
      Tạo lô thuốc mới: 4: NSX
      Nhập thông tin sản xuất: 3: NSX
      Ghi lên blockchain: 5: NSX
      Tạo QR code: 5: NSX
      Đóng gói sản phẩm: 4: NSX
    
    section 🚛 Nhà Phân Phối
      Nhận hàng từ NSX: 4: NPP
      Xác nhận trên hệ thống: 4: NPP
      Vận chuyển đến BV: 3: NPP
      Cập nhật vị trí: 4: NPP
    
    section 🏥 Bệnh Viện
      Nhận hàng từ NPP: 4: BV
      Kiểm tra và nhập kho: 5: BV
      Quản lý tồn kho: 4: BV
      Cấp phát cho BN: 5: BV
    
    section 👤 Bệnh Nhân
      Nhận thuốc từ BV: 5: BN
      Quét QR code kiểm tra: 5: BN
      Xem thông tin thuốc: 5: BN
      Đánh giá chất lượng: 4: BN
```

---

## 🏗️ 6. GITGRAPH - PHÁT TRIỂN HỆ THỐNG

```mermaid
gitgraph
    commit id: "🚀 Khởi tạo dự án"
    commit id: "👤 User Management"
    
    branch feature/blockchain
    checkout feature/blockchain
    commit id: "⛓️ Smart Contract"
    commit id: "🔐 Security Layer"
    
    checkout main
    merge feature/blockchain
    commit id: "💊 Drug Management"
    
    branch feature/supply-chain
    checkout feature/supply-chain
    commit id: "🚚 Supply Chain Core"
    commit id: "🔍 Traceability"
    
    checkout main
    merge feature/supply-chain
    commit id: "📱 Mobile QR Scanner"
    
    branch feature/analytics
    checkout feature/analytics
    commit id: "📊 Statistics Module"
    commit id: "📈 Dashboard"
    
    checkout main
    merge feature/analytics
    commit id: "🚀 Production Ready"
```

---

## 🎯 7. QUADRANT CHART - PHÂN TÍCH ƯU TIÊN

```mermaid
quadrantChart
    title 📊 Ma trận Ưu tiên Chức năng Hệ thống
    x-axis Dễ triển khai --> Khó triển khai
    y-axis Ít quan trọng --> Rất quan trọng
    
    quadrant-1 Làm ngay
    quadrant-2 Lập kế hoạch
    quadrant-3 Có thể bỏ qua
    quadrant-4 Điền vào khoảng trống
    
    "🔐 User Authentication": [0.2, 0.9]
    "💊 Drug Management": [0.3, 0.95]
    "⛓️ Blockchain Core": [0.7, 0.9]
    "📷 QR Scanner": [0.1, 0.8]
    "📊 Analytics": [0.4, 0.6]
    "📱 Mobile App": [0.6, 0.7]
    "🤖 AI Detection": [0.9, 0.5]
    "🌐 API Integration": [0.5, 0.4]
```

---

## 📋 8. TIMELINE - ROADMAP PHÁT TRIỂN

```mermaid
timeline
    title 🗓️ Roadmap Phát triển Hệ thống (2024-2025)
    
    section 2024 Q1
        Nghiên cứu & Thiết kế : Phân tích yêu cầu
                              : Thiết kế kiến trúc
                              : Prototype UI/UX
    
    section 2024 Q2
        Phát triển Core : User Management
                        : Drug Management
                        : Blockchain Integration
    
    section 2024 Q3
        Supply Chain : Traceability System
                     : QR Code Scanner
                     : Mobile App
    
    section 2024 Q4
        Testing & Security : Security Audit
                           : Performance Testing
                           : Bug Fixing
    
    section 2025 Q1
        Production : Deployment
                   : User Training
                   : Go Live
```

---

## 🎨 9. SANKEY DIAGRAM - LUỒNG DỮ LIỆU

```mermaid
sankey-beta
    
    %% Nguồn dữ liệu
    Nhà_Sản_Xuất,Smart_Contract,100
    Nhà_Phân_Phối,Smart_Contract,80
    Bệnh_Viện,Smart_Contract,90
    
    %% Xử lý dữ liệu
    Smart_Contract,Blockchain,270
    Smart_Contract,Database,50
    
    %% Truy xuất dữ liệu
    Blockchain,QR_Scanner,200
    Blockchain,Web_App,70
    Database,Analytics,30
    Database,Reports,20
    
    %% Người dùng cuối
    QR_Scanner,Bệnh_Nhân,150
    QR_Scanner,Dược_Sĩ,50
    Web_App,Admin,40
    Web_App,Quản_Lý,30
    Analytics,Dashboard,30
    Reports,Báo_Cáo,20
```

---

## 🚀 HƯỚNG DẪN SỬ DỤNG NHANH

### 📋 Các bước thực hiện:
1. **Copy mã** từ các section trên
2. **Mở trình duyệt** và truy cập https://mermaid.live/
3. **Dán mã** vào khung editor bên trái
4. **Xem kết quả** hiển thị ngay lập tức bên phải
5. **Tùy chỉnh** màu sắc, kích thước theo ý muốn
6. **Export** thành PNG, SVG hoặc PDF

### 🎨 Tùy chỉnh màu sắc:
- Thêm `classDef` để định nghĩa style
- Sử dụng `class` để áp dụng style
- Thay đổi `fill` và `stroke` cho màu nền và viền

### 💡 Mẹo sử dụng:
- Sử dụng emoji để làm sơ đồ sinh động hơn
- Kết hợp nhiều loại diagram trong cùng một tài liệu
- Lưu mã để tái sử dụng và chỉnh sửa sau này

---

*🎯 Tất cả các mã trên đều đã được test và sẵn sàng sử dụng. Chỉ cần copy & paste!*