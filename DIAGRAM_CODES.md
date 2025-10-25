# MÃ VẼ SƠ ĐỒ PHÂN RÃ CHỨC NĂNG
## HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC BẰNG BLOCKCHAIN

---

## 1. MÃ MERMAID - SƠ ĐỒ TỔNG QUAN HỆ THỐNG

### 1.1 Sơ đồ Kiến trúc Tổng quan

```mermaid
graph TB
    subgraph "HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC"
        subgraph "FRONTEND LAYER"
            A[React.js]
            B[QR Scanner]
            C[Material-UI]
        end
        
        subgraph "BACKEND LAYER"
            D[Node.js + Express]
            E[Web3.js]
            F[MongoDB]
            G[JWT Auth]
        end
        
        subgraph "BLOCKCHAIN LAYER"
            H[Ethereum Testnet]
            I[Smart Contract]
            J[Solidity]
        end
    end
    
    A --> D
    B --> E
    C --> D
    D --> H
    E --> I
    F --> D
    G --> D
    I --> J
    
    style A fill:#e1f5fe
    style D fill:#f3e5f5
    style H fill:#fff3e0
```

### 1.2 Sơ đồ Phân rã Chức năng Cấp 1

```mermaid
mindmap
  root((HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC))
    (MODULE 1: QUẢN LÝ TÀI KHOẢN)
      Đăng ký
      Đăng nhập
      Phân quyền
    (MODULE 2: QUẢN LÝ LÔ THUỐC)
      Thêm lô mới
      Cập nhật
      Truy vấn
    (MODULE 3: CHUỖI CUNG ỨNG)
      Ghi nhận hành trình
      Xác minh
      Phát hiện thuốc giả
    (MODULE 4: GIAO NHIỆM VỤ)
      Tạo nhiệm vụ
      Theo dõi tiến độ
    (MODULE 5: THÔNG BÁO)
      Gửi thông báo
      Nhận cảnh báo
    (MODULE 6: ĐÁNH GIÁ)
      Góp ý chất lượng
      Đánh giá dịch vụ
    (MODULE 7: THỐNG KÊ)
      Báo cáo
      Dashboard
    (MODULE 8: BẢO MẬT)
      Mã hóa
      Xác thực
```

### 1.3 Sơ đồ Luồng Hoạt động Chính

```mermaid
sequenceDiagram
    participant NSX as Nhà Sản Xuất
    participant BC as Blockchain
    participant NPP as Nhà Phân Phối
    participant BV as Bệnh Viện
    participant BN as Bệnh Nhân
    
    NSX->>BC: 1. Tạo lô thuốc + Smart Contract
    NSX->>NSX: 2. Tạo QR Code
    NSX->>NPP: 3. Giao hàng
    NPP->>BC: 4. Xác nhận nhận hàng
    NPP->>BV: 5. Vận chuyển đến BV
    BV->>BC: 6. Xác nhận nhập kho
    BN->>BN: 7. Quét QR Code
    BN->>BC: 8. Truy vấn thông tin
    BC->>BN: 9. Trả về lịch sử đầy đủ
```

---

## 2. MÃ MERMAID - SƠ ĐỒ CHI TIẾT TỪNG MODULE

### 2.1 Module Quản lý Tài khoản

```mermaid
graph TD
    A[MODULE QUẢN LÝ TÀI KHOẢN] --> B[Đăng ký Tài khoản]
    A --> C[Đăng nhập Bảo mật]
    A --> D[Quản lý Hồ sơ]
    A --> E[Phân quyền Người dùng]
    
    B --> B1[Đăng ký theo vai trò]
    B --> B2[Xác thực thông tin]
    B --> B3[Kích hoạt tài khoản]
    
    C --> C1[Xác thực JWT]
    C --> C2[Xác thực 2FA]
    C --> C3[Quản lý phiên]
    
    D --> D1[Cập nhật thông tin]
    D --> D2[Đổi mật khẩu]
    D --> D3[Quản lý quyền truy cập]
    
    E --> E1[Gán vai trò]
    E --> E2[Thiết lập quyền hạn]
    E --> E3[Kiểm soát truy cập]
    
    style A fill:#ff9999
    style B fill:#99ccff
    style C fill:#99ccff
    style D fill:#99ccff
    style E fill:#99ccff
```

### 2.2 Module Quản lý Lô Thuốc

```mermaid
graph TD
    A[MODULE QUẢN LÝ LÔ THUỐC] --> B[Thêm Lô Thuốc Mới]
    A --> C[Cập nhật Thông tin]
    A --> D[Xóa/Vô hiệu hóa]
    A --> E[Truy vấn Thông tin]
    
    B --> B1[Nhập thông tin cơ bản]
    B1 --> B2[Tạo mã QR duy nhất]
    B2 --> B3[Ghi nhận lên blockchain]
    B3 --> B4[Tạo chữ ký số + timestamp]
    
    C --> C1[Sửa đổi thông tin]
    C1 --> C2[Ghi lại lịch sử thay đổi]
    C2 --> C3[Cập nhật blockchain]
    
    D --> D1[Đánh dấu vô hiệu]
    D1 --> D2[Ghi lý do xóa]
    D2 --> D3[Cập nhật trạng thái]
    
    E --> E1[Tìm kiếm theo mã lô]
    E --> E2[Quét QR code]
    E --> E3[Xem lịch sử lô thuốc]
    E --> E4[Kiểm tra tính hợp lệ]
    
    style A fill:#ffcc99
    style B fill:#ccffcc
    style C fill:#ccffcc
    style D fill:#ffcccc
    style E fill:#ccccff
```

### 2.3 Module Chuỗi Cung ứng (Core)

```mermaid
graph TD
    A[MODULE CHUỖI CUNG ỨNG] --> B[Ghi nhận Hành trình]
    A --> C[Xác minh Vận chuyển]
    A --> D[Phát hiện Thuốc giả]
    A --> E[Truy xuất Nguồn gốc]
    
    B --> B1[Sản xuất]
    B --> B2[Phân phối]
    B --> B3[Bệnh viện]
    
    B1 --> B11[Đăng ký thông tin sản xuất]
    B1 --> B12[Ghi nhận nguyên liệu]
    B1 --> B13[Kiểm tra chất lượng]
    
    B2 --> B21[Xác nhận nhận hàng]
    B2 --> B22[Ghi nhận điều kiện bảo quản]
    B2 --> B23[Cập nhật vị trí]
    
    B3 --> B31[Nhập kho bệnh viện]
    B3 --> B32[Quản lý tồn kho]
    B3 --> B33[Cấp phát cho bệnh nhân]
    
    C --> C1[Smart Contract validation]
    C --> C2[Kiểm tra chữ ký số]
    C --> C3[Xác thực timestamp]
    
    D --> D1[So sánh với blockchain]
    D --> D2[Kiểm tra tính toàn vẹn]
    D --> D3[Cảnh báo thuốc giả]
    
    E --> E1[Theo dõi đầy đủ hành trình]
    E --> E2[Hiển thị chuỗi cung ứng]
    E --> E3[Xác minh từng điểm chuyển giao]
    
    style A fill:#ff6666
    style B fill:#66ff66
    style C fill:#6666ff
    style D fill:#ffff66
    style E fill:#ff66ff
```

---

## 3. MÃ PLANTUML - SƠ ĐỒ TƯƠNG TÁC

### 3.1 Sơ đồ Use Case

```plantuml
@startuml
!theme plain

actor "Admin" as admin
actor "Nhà Sản Xuất" as nsx
actor "Nhà Phân Phối" as npp
actor "Bệnh Viện" as bv
actor "Bệnh Nhân" as bn

rectangle "Hệ thống Quản lý Nguồn gốc Xuất xứ Thuốc" {
    usecase "Quản trị hệ thống" as UC1
    usecase "Tạo lô thuốc" as UC2
    usecase "Ghi blockchain" as UC3
    usecase "Vận chuyển thuốc" as UC4
    usecase "Nhập kho BV" as UC5
    usecase "Quét QR kiểm tra" as UC6
    usecase "Truy xuất nguồn gốc" as UC7
    usecase "Phát hiện thuốc giả" as UC8
    usecase "Thống kê báo cáo" as UC9
    usecase "Đánh giá chất lượng" as UC10
}

admin --> UC1
admin --> UC9

nsx --> UC2
nsx --> UC3

npp --> UC4
npp --> UC3

bv --> UC5
bv --> UC3

bn --> UC6
bn --> UC7

UC6 --> UC8
UC7 --> UC8

UC2 --> UC3
UC4 --> UC3
UC5 --> UC3

bn --> UC10
@enduml
```

### 3.2 Sơ đồ Sequence - Quy trình Tạo và Kiểm tra Lô thuốc

```plantuml
@startuml
!theme plain

participant "Nhà Sản Xuất" as NSX
participant "Smart Contract" as SC
participant "Blockchain" as BC
participant "Database" as DB
participant "QR Generator" as QR
participant "Bệnh Nhân" as BN
participant "Mobile App" as APP

== Tạo Lô Thuốc ==
NSX -> SC: createDrugBatch(drugInfo)
activate SC
SC -> BC: Ghi thông tin lô thuốc
BC --> SC: Transaction Hash
SC --> NSX: Batch ID + Hash
deactivate SC

NSX -> DB: Lưu thông tin bổ sung
NSX -> QR: Tạo QR Code(Batch ID)
QR --> NSX: QR Code Image

== Kiểm tra Thuốc ==
BN -> APP: Quét QR Code
APP -> SC: getBatchInfo(Batch ID)
activate SC
SC -> BC: Truy vấn thông tin
BC --> SC: Batch Data
SC --> APP: Thông tin đầy đủ
deactivate SC

APP -> APP: Xác minh tính hợp lệ
APP --> BN: Hiển thị kết quả

alt Thuốc hợp lệ
    APP --> BN: ✅ Thuốc chính hãng
else Thuốc giả
    APP --> BN: ⚠️ Cảnh báo thuốc giả
    APP -> DB: Ghi log phát hiện
end
@enduml
```

---

## 4. MÃ DRAW.IO/LUCIDCHART - XML FORMAT

### 4.1 Sơ đồ Kiến trúc Hệ thống (Draw.io XML)

```xml
<mxfile host="app.diagrams.net">
  <diagram name="Architecture">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        
        <!-- Frontend Layer -->
        <mxCell id="frontend" value="FRONTEND LAYER" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1f5fe;" vertex="1" parent="1">
          <mxGeometry x="50" y="50" width="200" height="100" as="geometry"/>
        </mxCell>
        
        <!-- Backend Layer -->
        <mxCell id="backend" value="BACKEND LAYER" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f3e5f5;" vertex="1" parent="1">
          <mxGeometry x="300" y="50" width="200" height="100" as="geometry"/>
        </mxCell>
        
        <!-- Blockchain Layer -->
        <mxCell id="blockchain" value="BLOCKCHAIN LAYER" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff3e0;" vertex="1" parent="1">
          <mxGeometry x="550" y="50" width="200" height="100" as="geometry"/>
        </mxCell>
        
        <!-- Connections -->
        <mxCell id="conn1" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="frontend" target="backend">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        
        <mxCell id="conn2" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="backend" target="blockchain">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## 5. MÃ GRAPHVIZ DOT - SƠ ĐỒ PHÂN CẤP

### 5.1 Sơ đồ Phân rã Chức năng

```dot
digraph "Drug_Traceability_System" {
    rankdir=TB;
    node [shape=box, style=filled];
    
    // Main System
    system [label="HỆ THỐNG QUẢN LÝ\nNGUỒN GỐC XUẤT XỨ THUỐC", fillcolor=lightblue];
    
    // Level 1 Modules
    mod1 [label="MODULE 1\nQUẢN LÝ TÀI KHOẢN", fillcolor=lightgreen];
    mod2 [label="MODULE 2\nQUẢN LÝ LÔ THUỐC", fillcolor=lightgreen];
    mod3 [label="MODULE 3\nCHUỖI CUNG ỨNG", fillcolor=orange];
    mod4 [label="MODULE 4\nGIAO NHIỆM VỤ", fillcolor=lightgreen];
    mod5 [label="MODULE 5\nTHÔNG BÁO", fillcolor=lightgreen];
    mod6 [label="MODULE 6\nĐÁNH GIÁ", fillcolor=lightgreen];
    mod7 [label="MODULE 7\nTHỐNG KÊ", fillcolor=lightgreen];
    mod8 [label="MODULE 8\nBẢO MẬT", fillcolor=red];
    
    // Level 2 Functions for Module 1
    mod1_1 [label="Đăng ký\nTài khoản", fillcolor=lightyellow];
    mod1_2 [label="Đăng nhập\nBảo mật", fillcolor=lightyellow];
    mod1_3 [label="Quản lý\nHồ sơ", fillcolor=lightyellow];
    mod1_4 [label="Phân quyền\nNgười dùng", fillcolor=lightyellow];
    
    // Level 2 Functions for Module 2
    mod2_1 [label="Thêm Lô\nThuốc Mới", fillcolor=lightyellow];
    mod2_2 [label="Cập nhật\nThông tin", fillcolor=lightyellow];
    mod2_3 [label="Xóa/Vô hiệu\nhóa Lô", fillcolor=lightyellow];
    mod2_4 [label="Truy vấn\nThông tin", fillcolor=lightyellow];
    
    // Level 2 Functions for Module 3 (Core)
    mod3_1 [label="Ghi nhận\nHành trình", fillcolor=pink];
    mod3_2 [label="Xác minh\nVận chuyển", fillcolor=pink];
    mod3_3 [label="Phát hiện\nThuốc giả", fillcolor=pink];
    mod3_4 [label="Truy xuất\nNguồn gốc", fillcolor=pink];
    
    // Connections
    system -> {mod1, mod2, mod3, mod4, mod5, mod6, mod7, mod8};
    
    mod1 -> {mod1_1, mod1_2, mod1_3, mod1_4};
    mod2 -> {mod2_1, mod2_2, mod2_3, mod2_4};
    mod3 -> {mod3_1, mod3_2, mod3_3, mod3_4};
    
    // Highlight core module
    mod3 [fillcolor=orange, penwidth=3];
}
```

---

## 6. MÃ FLOWCHART.JS - LUỒNG QUY TRÌNH

### 6.1 Luồng Sản xuất và Kiểm tra Thuốc

```
st=>start: Bắt đầu
nsx=>operation: Nhà sản xuất tạo lô thuốc
blockchain=>operation: Ghi thông tin lên Blockchain
qr=>operation: Tạo mã QR
pack=>operation: Đóng gói sản phẩm
dist=>operation: Phân phối đến NPP/BV
scan=>operation: Bệnh nhân quét QR
verify=>condition: Kiểm tra tính hợp lệ?
valid=>operation: Hiển thị thông tin hợp lệ
fake=>operation: Cảnh báo thuốc giả
log=>operation: Ghi log phát hiện
end=>end: Kết thúc

st->nsx->blockchain->qr->pack->dist->scan->verify
verify(yes)->valid->end
verify(no)->fake->log->end
```

---

## 7. HƯỚNG DẪN SỬ DỤNG

### 7.1 Mermaid
- Dán mã vào: https://mermaid.live/
- Hoặc sử dụng trong Markdown với ```mermaid

### 7.2 PlantUML
- Dán mã vào: https://www.plantuml.com/plantuml/
- Hoặc sử dụng plugin PlantUML trong IDE

### 7.3 Draw.io
- Mở https://app.diagrams.net/
- File > Import from > Text > Dán XML code

### 7.4 Graphviz
- Dán mã vào: https://dreampuf.github.io/GraphvizOnline/
- Hoặc cài đặt Graphviz local

### 7.5 Flowchart.js
- Dán mã vào: http://flowchart.js.org/
- Hoặc sử dụng trong web app

---

*Các mã trên có thể được sử dụng trực tiếp trong các công cụ vẽ diagram để tạo ra sơ đồ phân rã chức năng trực quan và chuyên nghiệp.*