<div align="center">

# 🏠 SmartHome

**Hệ thống quản lý nhà thông minh — giám sát, điều khiển thiết bị và tự động hóa trong một nền tảng duy nhất.**

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Adafruit IO](https://img.shields.io/badge/Adafruit_IO-MQTT-AE2029?style=flat-square)](https://io.adafruit.com/)
[![MQTT](https://img.shields.io/badge/MQTT-5-660066?style=flat-square&logo=mqtt)](https://mqtt.org/)


</div>

---

## 📖 Giới thiệu

**SmartHome** là hệ thống IoT toàn diện cho phép người dùng giám sát và điều khiển các thiết bị trong nhà theo thời gian thực. Được xây dựng trên nền tảng **Yolo:Bit** (WiFi tích hợp) kết hợp với **Adafruit IO** làm MQTT broker, hệ thống cho phép điều khiển từ xa qua ứng dụng di động mà không cần thiết bị gateway trung gian.

---

## ⚡ Tech Stack

### Backend
| Công nghệ | Vai trò |
|---|---|
| 🟢 **Node.js + Express** | Framework server chính |
| 🔷 **TypeScript** | Ngôn ngữ lập trình |
| 🍃 **MongoDB Atlas** | Cơ sở dữ liệu |
| 🔌 **MQTT (mqtts)** | Giao tiếp realtime với Yolo:Bit qua Adafruit IO |
| 🌐 **Adafruit IO REST API** | Quản lý feeds và groups thiết bị |
| 🔐 **JWT + bcryptjs** | Xác thực và bảo mật |
| 📄 **Swagger UI** | Tài liệu API tự động |

### Frontend
| Công nghệ | Vai trò |
|---|---|
| ⚛️ **React Native** | Framework mobile (iOS & Android) |
| 🔷 **TypeScript** | Ngôn ngữ lập trình |
| 📦 **Axios** | Giao tiếp HTTP với Backend |
| 🔌 **MQTT Client** | Nhận trạng thái thiết bị realtime |

### Hardware
| Thiết bị | Vai trò |
|---|---|
| 🔲 **Yolo:Bit** | Vi điều khiển chính (WiFi tích hợp, kết nối MQTT trực tiếp) |
| 🌡️ **DHT20** | Cảm biến nhiệt độ & độ ẩm (I2C) |
| ☀️ **Cảm biến ánh sáng** | Đo cường độ ánh sáng (ADC) |
| 💡 **LED RGB** | Đèn chiếu sáng đa màu |
| 🌀 **Quạt DC** | Điều khiển tốc độ |
| 🔒 **RC Servo** | Mô phỏng khóa cửa |
| 🖥️ **LCD 16x2** | Hiển thị thông tin môi trường |

---

## 📂 Cấu trúc thư mục

### Backend
```
src/
├── server.ts                # Entry point: khởi động DB, MQTT, HTTP
├── app.ts                   # Express setup, routes, middleware
├── types/
│   └── index.ts             # Toàn bộ TypeScript interfaces & types
├── config/
│   ├── db.ts                # Kết nối MongoDB (Singleton)
│   └── swagger.ts           # Cấu hình Swagger UI
├── adafruit/
│   └── index.ts             # Axios instance Adafruit IO REST API (Facade)
├── services/
│   └── mqttService.ts       # MQTT client (Singleton + Observer)
├── middleware/
│   └── authMiddleware.ts    # JWT verification
├── models/
│   ├── UserSchema.ts
│   ├── RoomSchema.ts
│   ├── DeviceSchema.ts
│   ├── ActionLogSchema.ts
│   └── SystemConfigSchema.ts
├── controllers/
│   ├── authController.ts
│   ├── deviceController.ts  # Facade: sendCommand()
│   ├── roomController.ts
│   └── configController.ts
└── routes/
    ├── auth.ts
    ├── devices.ts
    ├── rooms.ts
    └── config.ts
```

### Frontend

---

## 🔄 Luồng hoạt động

### App điều khiển thiết bị
```
App → POST /api/devices/command
    → deviceController (Facade)
    → mqttService.publish()
    → Adafruit IO (broker)
    → Yolo:Bit subscribe → thực thi
```

### Yolo:Bit gửi sensor data
```
Yolo:Bit đọc cảm biến → publish lên Adafruit IO
    → Backend subscribe nhận data
    → mqttService._onDeviceData() (Observer)
    → lưu MongoDB
```

### Thay đổi cấu hình
```
App → PUT /api/config/temp_alert_threshold
    → configController
    → mqttService.publishSystem()
    → Adafruit IO
    → Yolo:Bit cập nhật ngưỡng ngay lập tức
```

---

## 🚀 Cài đặt & Khởi chạy

### Yêu cầu hệ thống
- **Node.js** >= 20.x
- **npm** >= 9.x
- Tài khoản **MongoDB Atlas**
- Tài khoản **Adafruit IO**

### 🖥️ Server
 
```bash
# 1. Di chuyển vào thư mục server
cd server
 
# 2. Cài đặt dependencies
npm install
 
# 3. Tạo file môi trường
cp .env.example .env
```
 
Điền các biến môi trường vào `.env`:
 
```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smarthome
AIO_USERNAME=your_adafruit_username
AIO_KEY=your_adafruit_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
EXPO_PUSH_TOKEN=ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```
 
```bash
# 4. Sync feeds từ Adafruit IO vào MongoDB (chạy 1 lần đầu)
npm run sync
 
# 5. Khởi chạy development
npm run dev
```
 
Server chạy tại: `http://localhost:3000`
Swagger UI tại: `http://localhost:3000/api-docs`
 
| Script | Mô tả |
|---|---|
| `npm run dev` | Chạy development (ts-node-dev) |
| `npm run build` | Build TypeScript → dist/ |
| `npm run start` | Chạy production |
| `npm run sync` | Sync feeds Adafruit → MongoDB |
 
---

### 📱 Client
 
```bash
# 1. Di chuyển vào thư mục client
cd client
 
# 2. Cài đặt dependencies
npm install
 
# 3. Tạo file môi trường
cp .env.example .env
```
 
Điền các biến môi trường vào `.env`:
 
```env
EXPO_PUBLIC_API_URL=http://<your-local-ip>:3000
EXPO_PUBLIC_AIO_USERNAME=your_adafruit_username
EXPO_PUBLIC_AIO_KEY=your_adafruit_key
```
 
> ⚠️ Dùng địa chỉ IP thực của máy (không dùng `localhost`) để điện thoại kết nối được với server.
 
```bash
# 4. Khởi chạy
npx expo start
```
 
Quét QR code bằng **Expo Go** trên điện thoại để chạy ứng dụng.
 
---

## ✅ Tính năng
 
### 🔐 Xác thực
- Đăng ký, đăng nhập bằng email
- JWT authentication
- Phân quyền Admin / User
 
### 🏠 Quản lý phòng & thiết bị
- Thêm, xóa phòng — tự động tạo/xóa group trên Adafruit IO
- Thêm, sửa, xóa thiết bị — tự động tạo/xóa feed trên Adafruit IO
- Xem danh sách thiết bị theo phòng
 
### 🎛️ Điều khiển
- Bật/tắt thiết bị từ xa qua MQTT realtime
- Điều khiển bằng giọng nói (Speech-to-Text → text command)
- Xem trạng thái hiện tại của thiết bị
 
### 📊 Dữ liệu & Thống kê
- Xem dữ liệu sensor realtime (nhiệt độ, độ ẩm, ánh sáng)
- Lịch sử dữ liệu sensor theo thiết bị
- Lịch sử hành động điều khiển
 
### ⏰ Lịch hẹn giờ
- Đặt lịch bật/tắt thiết bị theo giờ và thứ trong tuần
- Cron job tự động chạy mỗi phút
- Xem, sửa, xóa lịch theo thiết bị
 
### 🔔 Cảnh báo
- Cấu hình ngưỡng cảnh báo theo từng thiết bị
- Tự động cảnh báo khi sensor vượt ngưỡng
- Lưu lịch sử cảnh báo
 
### 👥 Quản lý người dùng
- Thêm người dùng (Admin)
 

---

## 📡 API
 
Sau khi khởi chạy server, truy cập Swagger UI để xem và test toàn bộ API:
 
```
http://localhost:3000/api-docs
```
 
| Nhóm | Base URL | Mô tả |
|---|---|---|
| Auth | `/api/auth` | Đăng ký, đăng nhập, thông tin user |
| Rooms | `/api/rooms` | Quản lý phòng |
| Devices | `/api/devices` | Quản lý thiết bị, gửi lệnh, xem data |
| Data | `/api/data` | Dữ liệu cảm biến |
| Schedules | `/api/schedules` | Lịch hẹn giờ |
| Sensor Alerts | `/api/sensor-alerts` | Cảnh báo vượt ngưỡng |
| Thresholds | `/api/devices/{id}/threshold` | Ngưỡng cảnh báo |
| Users | `/api/users` | Quản lý người dùng |
 
---
 
## 📱 Giao diện ứng dụng
 
> 🚧 Phần này sẽ được bổ sung sau
 
<!-- Thêm screenshot các màn hình chính vào đây -->
<!-- Gợi ý các màn hình cần chụp:
  - Màn hình đăng nhập
  - Danh sách phòng
  - Chi tiết phòng + danh sách thiết bị
  - Điều khiển thiết bị
  - Biểu đồ dữ liệu sensor
  - Màn hình hẹn giờ
  - Thông báo cảnh báo
-->
 
---

## 🏗️ Design Patterns

| Pattern | File áp dụng | Mục đích |
|---|---|---|
| **Singleton** | `mqttService.ts`, `config/db.ts` | 1 kết nối MQTT và DB duy nhất |
| **Observer** | `mqttService.ts` (handlers Map) | Dispatch MQTT message đến đúng handler |
| **Facade** | `deviceController.ts` (sendCommand) | Che giấu MQTT + log sau 1 endpoint |
| **Facade** | `adafruit/index.ts` | Ẩn auth header, base URL khỏi controllers |

---

## 📡 API Documentation

Sau khi khởi chạy backend, truy cập Swagger UI tại:
```
http://localhost:3000/api-docs
```

### Các nhóm API chính
| Nhóm | Base URL | Mô tả |
|---|---|---|
| Auth | `/api/auth` | Đăng ký, đăng nhập, thông tin user |
| Rooms | `/api/rooms` | Quản lý phòng |
| Devices | `/api/devices` | Quản lý thiết bị, gửi lệnh, xem data |
| Config | `/api/config` | Cấu hình ngưỡng cảnh báo, chế độ |

---

## 🤝 Đóng góp

Pull requests luôn được chào đón! Vui lòng mở issue trước khi thực hiện thay đổi lớn.

---

<div align="center">

Made with 💙 by **SmartHome Team**

*BK — Ho Chi Minh City University of Technology*

</div>