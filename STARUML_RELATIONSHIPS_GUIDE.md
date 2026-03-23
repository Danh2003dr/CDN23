# HƯỚNG DẪN CHI TIẾT CÁC DÂY NỐI TRONG STARUML
## HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC BẰNG BLOCKCHAIN

---

## 🔗 1. CÁC LOẠI DÂY NỐI (RELATIONSHIPS) TRONG STARUML

### 1.1 Tổng quan các loại Relationship

| **Loại Relationship** | **Ký hiệu** | **Mô tả** | **Sử dụng khi** |
|----------------------|-------------|-----------|-----------------|
| **Association** | `────────►` | Liên kết trực tiếp | Actor tương tác với Use Case |
| **Include** | `──include──►` | Bao gồm bắt buộc | Use Case A luôn gọi Use Case B |
| **Extend** | `◄──extend───` | Mở rộng có điều kiện | Use Case B có thể mở rộng Use Case A |
| **Generalization** | `────────▷` | Kế thừa/Tổng quát hóa | Actor con kế thừa Actor cha |
| **Dependency** | `- - - - - ►` | Phụ thuộc | Một element phụ thuộc vào element khác |
| **Aggregation** | `◇────────►` | Tập hợp | Quan hệ "có" (has-a) |
| **Composition** | `◆────────►` | Hợp thành | Quan hệ "thuộc về" (part-of) |

---

## 🎯 2. ASSOCIATION RELATIONSHIPS

### 2.1 Định nghĩa
**Association** là mối quan hệ cơ bản nhất giữa Actor và Use Case, thể hiện rằng Actor có thể thực hiện Use Case đó.

### 2.2 Cú pháp trong StarUML
```
Actor ────────► Use Case
```

### 2.3 Các ví dụ trong hệ thống

#### **Nhà Sản Xuất và các Use Case:**
```
👤 Nhà Sản Xuất ────────► 📝 Đăng nhập hệ thống
👤 Nhà Sản Xuất ────────► 💊 Tạo lô thuốc mới  
👤 Nhà Sản Xuất ────────► 🔄 Cập nhật thông tin lô thuốc
👤 Nhà Sản Xuất ────────► 📊 Xem báo cáo sản xuất
```

#### **Bệnh Nhân và các Use Case:**
```
👤 Bệnh Nhân ────────► 📷 Quét QR Code
👤 Bệnh Nhân ────────► 🔍 Truy xuất nguồn gốc
👤 Bệnh Nhân ────────► ⭐ Đánh giá chất lượng thuốc
```

#### **Admin và các Use Case:**
```
👤 Admin ────────► 🛡️ Quản lý người dùng
👤 Admin ────────► 📊 Tạo báo cáo thống kê  
👤 Admin ────────► ⚙️ Cấu hình hệ thống
👤 Admin ────────► 🔍 Audit hệ thống
```

### 2.4 Properties trong StarUML
```json
{
  "associationProperties": {
    "name": "thực hiện",
    "multiplicity": {
      "actor": "1",
      "usecase": "0..*"
    },
    "navigability": "unidirectional",
    "stereotype": ""
  }
}
```

---

## 📥 3. INCLUDE RELATIONSHIPS

### 3.1 Định nghĩa
**Include** thể hiện rằng Use Case A **luôn luôn** gọi đến Use Case B. Use Case B là một phần bắt buộc của Use Case A.

### 3.2 Cú pháp trong StarUML
```
Use Case A ──include──► Use Case B
```

### 3.3 Các ví dụ trong hệ thống

#### **Xác thực bắt buộc:**
```
💊 Tạo lô thuốc mới ──include──► 🔐 Xác thực người dùng
🔄 Cập nhật thông tin ──include──► 🔐 Xác thực người dùng  
🗑️ Xóa lô thuốc ──include──► 🔐 Xác thực người dùng
📊 Xem báo cáo ──include──► 🔐 Xác thực người dùng
```

#### **Truy vấn Blockchain bắt buộc:**
```
🔍 Truy xuất nguồn gốc ──include──► ⛓️ Truy vấn blockchain
🚨 Phát hiện thuốc giả ──include──► ⛓️ Truy vấn blockchain
✅ Xác minh tính hợp lệ ──include──► ⛓️ Truy vấn blockchain
```

#### **Ghi log hoạt động:**
```
💊 Tạo lô thuốc mới ──include──► 📝 Ghi log hoạt động
🚚 Cập nhật vận chuyển ──include──► 📝 Ghi log hoạt động
🏥 Nhập kho bệnh viện ──include──► 📝 Ghi log hoạt động
```

#### **Tạo QR Code:**
```
💊 Tạo lô thuốc mới ──include──► 🏷️ Tạo mã QR
📦 Đóng gói sản phẩm ──include──► 🏷️ Tạo mã QR
```

### 3.4 Properties trong StarUML
```json
{
  "includeProperties": {
    "stereotype": "<<include>>",
    "name": "include",
    "direction": "source_to_target",
    "lineStyle": "dashed",
    "arrowStyle": "open_arrow"
  }
}
```

---

## 📤 4. EXTEND RELATIONSHIPS

### 4.1 Định nghĩa  
**Extend** thể hiện rằng Use Case B **có thể** mở rộng Use Case A trong một điều kiện nhất định. Use Case B là tùy chọn, không bắt buộc.

### 4.2 Cú pháp trong StarUML
```
Use Case A ◄──extend──── Use Case B
```

### 4.3 Các ví dụ trong hệ thống

#### **Phát hiện thuốc giả (mở rộng):**
```
🔍 Truy xuất nguồn gốc ◄──extend──── 🚨 Phát hiện thuốc giả
                                   [Điều kiện: Phát hiện bất thường]

📷 Quét QR Code ◄──extend──── ⚠️ Cảnh báo thuốc giả  
                              [Điều kiện: Thông tin không khớp]
```

#### **Xác thực 2FA (mở rộng):**
```
🔐 Đăng nhập hệ thống ◄──extend──── 📱 Xác thực 2FA
                                   [Điều kiện: Tài khoản yêu cầu bảo mật cao]

🛡️ Truy cập Admin ◄──extend──── 🔑 Xác thực sinh trắc học
                                [Điều kiện: Chức năng nhạy cảm]
```

#### **Thông báo khẩn cấp (mở rộng):**
```
📊 Tạo báo cáo ◄──extend──── 📧 Gửi email báo cáo
                             [Điều kiện: Báo cáo quan trọng]

🚨 Phát hiện thuốc giả ◄──extend──── 🚨 Thông báo khẩn cấp
                                     [Điều kiện: Mức độ nghiêm trọng cao]
```

#### **Đánh giá và phản hồi (mở rộng):**
```
💊 Nhận thuốc ◄──extend──── ⭐ Đánh giá chất lượng
                            [Điều kiện: Bệnh nhân muốn đánh giá]

🔍 Xem thông tin thuốc ◄──extend──── 💬 Góp ý cải thiện
                                     [Điều kiện: Có ý kiến phản hồi]
```

### 4.4 Properties trong StarUML
```json
{
  "extendProperties": {
    "stereotype": "<<extend>>", 
    "name": "extend",
    "extensionPoints": [
      "Phát hiện bất thường",
      "Yêu cầu bảo mật cao", 
      "Mức độ nghiêm trọng cao"
    ],
    "condition": "Điều kiện cụ thể",
    "direction": "target_to_source",
    "lineStyle": "dashed",
    "arrowStyle": "open_arrow"
  }
}
```

---

## 🔄 5. GENERALIZATION RELATIONSHIPS

### 5.1 Định nghĩa
**Generalization** thể hiện quan hệ kế thừa, trong đó Actor con kế thừa tất cả đặc tính của Actor cha.

### 5.2 Cú pháp trong StarUML
```
Actor Con ────────▷ Actor Cha
```

### 5.3 Các ví dụ trong hệ thống

#### **Phân cấp Người dùng:**
```
👤 Admin ────────▷ 👤 Người dùng Hệ thống
👤 Nhà Sản Xuất ────────▷ 👤 Người dùng Hệ thống  
👤 Nhà Phân Phối ────────▷ 👤 Người dùng Hệ thống
👤 Bệnh Viện ────────▷ 👤 Người dùng Hệ thống
```

#### **Phân cấp Nhân viên Y tế:**
```
👨‍⚕️ Dược Sĩ ────────▷ 👤 Nhân Viên Y Tế
👩‍⚕️ Bác Sĩ ────────▷ 👤 Nhân Viên Y Tế
👩‍⚕️ Y Tá ────────▷ 👤 Nhân Viên Y Tế
```

#### **Phân cấp Cơ quan Quản lý:**
```
🔍 Thanh Tra Y Tế ────────▷ 👤 Cơ Quan Quản Lý
🏛️ Bộ Y Tế ────────▷ 👤 Cơ Quan Quản Lý
🏥 Sở Y Tế ────────▷ 👤 Cơ Quan Quản Lý
```

### 5.4 Properties trong StarUML
```json
{
  "generalizationProperties": {
    "name": "kế thừa",
    "direction": "child_to_parent",
    "lineStyle": "solid",
    "arrowStyle": "triangle"
  }
}
```

---

## 🔗 6. DEPENDENCY RELATIONSHIPS

### 6.1 Định nghĩa
**Dependency** thể hiện rằng một element phụ thuộc vào element khác để hoạt động.

### 6.2 Cú pháp trong StarUML
```
Element A - - - - - ► Element B
```

### 6.3 Các ví dụ trong hệ thống

#### **Phụ thuộc vào Service:**
```
💊 Quản lý Lô Thuốc - - - - - ► ⛓️ Blockchain Service
📊 Thống Kê Module - - - - - ► 🗄️ Database Service  
📧 Thông Báo Module - - - - - ► 📨 Email Service
```

#### **Phụ thuộc vào External API:**
```
🔍 Truy xuất Nguồn gốc - - - - - ► 🌐 Web3 API
📱 QR Scanner - - - - - ► 📷 Camera API
📍 Tracking Module - - - - - ► 🗺️ GPS Service
```

---

## 📋 7. MÔ HÌNH HOÀN CHỈNH CÁC RELATIONSHIPS

### 7.1 Sơ đồ tổng hợp các mối quan hệ

```
                    HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC

👤 Người dùng Hệ thống
    ▲
    │ (Generalization)
    ├── 👤 Admin ────────► 🛡️ Quản lý Hệ thống
    ├── 👤 Nhà Sản Xuất ────────► 💊 Tạo lô thuốc mới ──include──► 🔐 Xác thực người dùng
    ├── 👤 Nhà Phân Phối ────────► 🚚 Vận chuyển thuốc ──include──► 📝 Ghi log hoạt động  
    └── 👤 Bệnh Viện ────────► 🏥 Nhập kho thuốc ──include──► ⛓️ Truy vấn blockchain

👤 Bệnh Nhân ────────► 📷 Quét QR Code ──include──► 🔍 Truy xuất nguồn gốc
                                                      ▲
                                                      │ (Extend)
                                              🚨 Phát hiện thuốc giả
                                              [Điều kiện: Phát hiện bất thường]

🔐 Đăng nhập hệ thống ◄──extend──── 📱 Xác thực 2FA
                                   [Điều kiện: Bảo mật cao]

💊 Tạo lô thuốc mới - - - - - ► ⛓️ Blockchain Service (Dependency)
📊 Thống Kê Module - - - - - ► 🗄️ Database Service (Dependency)
```

### 7.2 Bảng tổng hợp Relationships trong hệ thống

| **Từ** | **Đến** | **Loại** | **Điều kiện/Ghi chú** |
|--------|---------|----------|------------------------|
| Admin | Quản lý Hệ thống | Association | - |
| Nhà Sản Xuất | Tạo lô thuốc mới | Association | - |
| Tạo lô thuốc mới | Xác thực người dùng | Include | Bắt buộc |
| Truy xuất nguồn gốc | Phát hiện thuốc giả | Extend | Khi phát hiện bất thường |
| Dược Sĩ | Nhân Viên Y Tế | Generalization | Kế thừa |
| QR Scanner | Camera API | Dependency | Phụ thuộc |

---

## 🛠️ 8. HƯỚNG DẪN THỰC HÀNH TRONG STARUML

### 8.1 Tạo Association
1. **Chọn Association tool** từ Toolbox
2. **Click vào Actor** (nguồn)
3. **Kéo đến Use Case** (đích)
4. **Nhập tên** cho relationship (tùy chọn)

### 8.2 Tạo Include
1. **Chọn Include tool** từ Toolbox  
2. **Click vào Use Case nguồn** (Use Case gọi)
3. **Kéo đến Use Case đích** (Use Case được gọi)
4. **Stereotype tự động** được thiết lập là `<<include>>`

### 8.3 Tạo Extend
1. **Chọn Extend tool** từ Toolbox
2. **Click vào Use Case mở rộng** (Use Case B)
3. **Kéo đến Use Case cơ sở** (Use Case A)  
4. **Thiết lập Extension Points** trong Properties
5. **Thêm Condition** nếu cần

### 8.4 Tạo Generalization
1. **Chọn Generalization tool** từ Toolbox
2. **Click vào Actor con** (nguồn)
3. **Kéo đến Actor cha** (đích)
4. **Mũi tên tam giác** tự động xuất hiện

### 8.5 Thiết lập Properties cho Relationships

#### **Cho Include:**
```
Stereotype: <<include>>
Name: include
Direction: Source to Target
```

#### **Cho Extend:**
```
Stereotype: <<extend>>  
Name: extend
Extension Points: Tên điểm mở rộng
Condition: Điều kiện cụ thể
```

#### **Cho Association:**
```
Name: thực hiện (tùy chọn)
Multiplicity: 1 to 0..*
Navigability: Unidirectional
```

---

## 🎨 9. STYLING VÀ FORMATTING

### 9.1 Màu sắc cho các Relationship

```json
{
  "relationshipStyles": {
    "association": {
      "lineColor": "#2196F3",
      "lineWidth": 1,
      "lineStyle": "solid"
    },
    "include": {
      "lineColor": "#4CAF50", 
      "lineWidth": 1,
      "lineStyle": "dashed"
    },
    "extend": {
      "lineColor": "#FF9800",
      "lineWidth": 1, 
      "lineStyle": "dashed"
    },
    "generalization": {
      "lineColor": "#9C27B0",
      "lineWidth": 2,
      "lineStyle": "solid"
    },
    "dependency": {
      "lineColor": "#607D8B",
      "lineWidth": 1,
      "lineStyle": "dotted"
    }
  }
}
```

### 9.2 Label và Stereotype Formatting

```json
{
  "labelFormatting": {
    "includeLabel": {
      "text": "<<include>>",
      "fontSize": 8,
      "fontStyle": "italic",
      "color": "#4CAF50"
    },
    "extendLabel": {
      "text": "<<extend>>", 
      "fontSize": 8,
      "fontStyle": "italic",
      "color": "#FF9800"
    },
    "conditionLabel": {
      "fontSize": 7,
      "fontStyle": "normal",
      "color": "#666666"
    }
  }
}
```

---

## ✅ 10. CHECKLIST KIỂM TRA RELATIONSHIPS

### 10.1 Association Checklist
- [ ] Mỗi Actor có ít nhất 1 Association với Use Case
- [ ] Không có Association trực tiếp giữa 2 Actor  
- [ ] Không có Association trực tiếp giữa 2 Use Case
- [ ] Direction đúng (từ Actor đến Use Case)

### 10.2 Include Checklist
- [ ] Include chỉ giữa 2 Use Case
- [ ] Use Case đích là chức năng chung, tái sử dụng
- [ ] Stereotype `<<include>>` được thiết lập
- [ ] Direction từ Use Case gọi đến Use Case được gọi

### 10.3 Extend Checklist  
- [ ] Extend chỉ giữa 2 Use Case
- [ ] Use Case nguồn là tính năng mở rộng, tùy chọn
- [ ] Có Extension Points và Condition rõ ràng
- [ ] Direction từ Use Case mở rộng đến Use Case cơ sở

### 10.4 Generalization Checklist
- [ ] Có quan hệ "is-a" rõ ràng
- [ ] Actor con kế thừa tất cả Use Case của Actor cha
- [ ] Không tạo vòng lặp kế thừa
- [ ] Phân cấp hợp lý, không quá sâu

---

*🎯 Tài liệu này cung cấp hướng dẫn chi tiết về tất cả các loại dây nối trong StarUML cho Hệ thống Quản lý Nguồn gốc Xuất xứ Thuốc bằng Blockchain.*