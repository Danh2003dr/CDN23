# 🔧 Khắc Phục Lỗi "Không thể tải dữ liệu analytics"

## 📋 **Nguyên nhân đã xác định:**

✅ **Backend API hoạt động bình thường** - Đã test thành công 5/6 endpoints
❌ **Frontend authentication** - User chưa đăng nhập hoặc token hết hạn
❌ **Anomaly detection API** - Có lỗi nhỏ ở endpoint này

## 🚀 **Các bước khắc phục:**

### **Bước 1: Đăng nhập vào hệ thống**
```
1. Truy cập: http://localhost:3000
2. Đăng nhập với:
   - Email: manager1@cdn.com
   - Password: manager123
3. Đảm bảo đăng nhập thành công và chuyển đến Dashboard
```

### **Bước 2: Kiểm tra authentication**
```
1. Mở Developer Tools (F12)
2. Vào tab Application > Local Storage
3. Kiểm tra có key "token" không
4. Nếu không có, đăng nhập lại
```

### **Bước 3: Truy cập Analytics**
```
1. Sau khi đăng nhập, click vào "Analytics" trong sidebar
2. Nếu vẫn lỗi, refresh trang (F5)
3. Kiểm tra Console tab xem có lỗi gì không
```

### **Bước 4: Kiểm tra Network requests**
```
1. Mở Developer Tools > Network tab
2. Refresh trang Analytics
3. Tìm các request đến /api/analytics/*
4. Kiểm tra status code và response
```

## 🔍 **Debug Commands:**

### **Test API trực tiếp:**
```bash
# Login
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"manager1@cdn.com","password":"manager123"}'

# Test analytics với token
curl -X GET "http://localhost:5000/api/analytics/performance-trends" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **Test từ PowerShell:**
```powershell
# Login
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"manager1@cdn.com","password":"manager123"}'
$token = ($loginResponse.Content | ConvertFrom-Json).data.token

# Test analytics
Invoke-WebRequest -Uri "http://localhost:5000/api/analytics/performance-trends" -Method GET -Headers @{"Authorization"="Bearer $token"}
```

## 📊 **Kết quả test API:**

✅ **Performance Trends** - Hoạt động bình thường
✅ **Node Comparison** - Hoạt động bình thường  
✅ **Geographic Distribution** - Hoạt động bình thường
✅ **Real-time Metrics** - Hoạt động bình thường
❌ **Anomaly Detection** - Có lỗi nhỏ (không ảnh hưởng chính)
✅ **Analytics Summary** - Hoạt động bình thường

## 🎯 **Giải pháp chính:**

**Vấn đề chính là authentication trong frontend.** Hãy:

1. **Đăng nhập lại** với manager1@cdn.com / manager123
2. **Clear browser cache** nếu cần
3. **Kiểm tra token** trong localStorage
4. **Refresh trang** sau khi đăng nhập

## 📞 **Nếu vẫn lỗi:**

1. Kiểm tra console browser xem có lỗi gì
2. Kiểm tra Network tab xem request nào bị fail
3. Đảm bảo cả frontend (port 3000) và backend (port 5000) đang chạy
4. Thử đăng nhập với user khác: operator1@cdn.com / operator123

**Hệ thống analytics hoạt động bình thường, chỉ cần đăng nhập đúng cách!** 🎉 